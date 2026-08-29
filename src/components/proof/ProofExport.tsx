import { Copy, Download } from "lucide-react";
import type { ProofPack } from "@/lib/proof";
import { downloadTextFile } from "@/lib/proof";
import { formatMarkdownProof, formatShareProof, formatShortProof } from "@/lib/proof";
import { copyTextToClipboard } from "@/lib/utils";
export function ProofExport({ pack, onCopied }: { pack: ProofPack; onCopied: () => void }) {
  const copy = async (text: string) => {
    const success = await copyTextToClipboard(text);
    if (success) onCopied();
  };

  return (
    <section className="flex flex-wrap gap-2">
      <button onClick={() => void copy(formatShortProof(pack))} className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300"><Copy size={14} />Copy short</button>
      <button onClick={() => void copy(formatShareProof(pack))} className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300"><Copy size={14} />Copy share text</button>
      <button onClick={() => void copy(formatMarkdownProof(pack))} className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300"><Copy size={14} />Copy markdown</button>
      <button onClick={() => downloadTextFile(`technocore-proof-${pack.fingerprint}-short.txt`, formatShortProof(pack))} className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300"><Download size={14} />Download .txt</button>
      <button onClick={() => downloadTextFile(`technocore-proof-${pack.fingerprint}.md`, formatMarkdownProof(pack))} className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300"><Download size={14} />Download .md</button>
    </section>
  );
}
