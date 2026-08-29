type DerNode = { tag: number; value: Uint8Array; children?: DerNode[] };

const ED25519_OID = "2b6570";
const PBES2_OID = "2a864886f70d01050d";
const PBKDF2_OID = "2a864886f70d01050c";
const AES256_CBC_OID = "60864801650304012a";

function readNode(bytes: Uint8Array, offset = 0): { node: DerNode; next: number } {
  const tag = bytes[offset];
  let length = bytes[offset + 1];
  let cursor = offset + 2;
  if (length & 0x80) {
    const count = length & 0x7f;
    length = 0;
    for (let index = 0; index < count; index += 1) length = (length << 8) | bytes[cursor++];
  }
  const value = bytes.slice(cursor, cursor + length);
  const node: DerNode = { tag, value };
  if (tag === 0x30 || tag === 0x31) {
    const children: DerNode[] = [];
    let childOffset = 0;
    while (childOffset < value.length) {
      const child = readNode(value, childOffset);
      children.push(child.node);
      childOffset = child.next;
    }
    node.children = children;
  }
  return { node, next: cursor + length };
}

function hex(bytes: Uint8Array): string { return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
function oid(node: DerNode | undefined): string { return node?.tag === 0x06 ? hex(node.value) : ""; }
function integer(bytes: Uint8Array): number { return bytes.reduce((value, byte) => value * 256 + byte, 0); }
function octets(node: DerNode | undefined): Uint8Array { if (!node) throw new Error("Invalid PEM structure."); return node.tag === 0x04 ? node.value : readNode(node.value).node.value; }
function privateKeySeed(node: DerNode | undefined): Uint8Array {
  const value = octets(node);
  return value.length === 32 ? value : octets(readNode(value).node);
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value.replace(/\s/g, ""));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function pemBody(value: string): { label: string; bytes: Uint8Array } {
  const match = value.match(/-----BEGIN ([^-]+)-----([\s\S]*?)-----END \1-----/);
  if (!match) throw new Error("Unsupported identity format. Expected an Ed25519 PKCS#8 PEM file.");
  return { label: match[1], bytes: decodeBase64(match[2]) };
}

async function decryptEncryptedPkcs8(bytes: Uint8Array, passphrase: string): Promise<Uint8Array> {
  const outer = readNode(bytes).node.children ?? [];
  const algorithm = outer[0]?.children ?? [];
  const pbes2 = algorithm[1]?.children ?? [];
  const kdf = pbes2[0]?.children ?? [];
  const encryption = pbes2[1]?.children ?? [];
  if (oid(algorithm[0]) !== PBES2_OID || oid(kdf[0]) !== PBKDF2_OID || oid(encryption[0]) !== AES256_CBC_OID) throw new Error("Unsupported encrypted PEM. Export it as PKCS#8 using PBKDF2 and AES-256-CBC.");
  const parameters = kdf[1]?.children ?? [];
  const salt = octets(parameters[0]);
  const iterations = integer(parameters[1]?.value ?? new Uint8Array());
  const iv = octets(encryption[1]);
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt as unknown as BufferSource, iterations, hash: "SHA-256" }, material, { name: "AES-CBC", length: 256 }, false, ["decrypt"]);
  try { return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-CBC", iv: iv as unknown as BufferSource }, key, outer[1].value as unknown as BufferSource)); }
  catch { throw new Error("Incorrect PEM passphrase or damaged identity file."); }
}

export async function importEd25519Pem(value: string, passphrase: string): Promise<Uint8Array> {
  const { label, bytes } = pemBody(value);
  const pkcs8 = label === "ENCRYPTED PRIVATE KEY" ? await decryptEncryptedPkcs8(bytes, passphrase) : bytes;
  if (label !== "PRIVATE KEY" && label !== "ENCRYPTED PRIVATE KEY") throw new Error("Unsupported PEM. Expected an Ed25519 PKCS#8 private key.");
  const root = readNode(pkcs8).node.children ?? [];
  if (oid(root[1]?.children?.[0]) !== ED25519_OID) throw new Error("Unsupported PEM. The private key must use Ed25519.");
  const seed = privateKeySeed(root[2]);
  if (seed.length !== 32) throw new Error("Invalid Ed25519 private key in PEM file.");
  return seed;
}

export function looksLikePem(value: string): boolean { return value.trimStart().startsWith("-----BEGIN "); }