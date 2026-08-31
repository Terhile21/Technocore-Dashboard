"use client";
import { useMemo, useState } from "react";
import { Copy, Fingerprint, LockKeyhole } from "lucide-react";
import { ContributionForm } from "@/components/contributions/ContributionForm";
import { ContributionList } from "@/components/contributions/ContributionList";
import { proofDetails, proofLine } from "@/components/contributions/ProofCard";
import { ConfirmDialog } from "@/components/ux/ConfirmDialog";
import type { Contribution } from "@/lib/types";
import { copyTextToClipboard } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

export default function ContributionsPage() {
  const identities = useAppStore((state) => state.identities);
  const activeDid = useAppStore((state) => state.activeDid);
  const privateKey = useAppStore((state) => state.unlockedPrivateKey);
  const allContributions = useAppStore((state) => state.contributions);
  const draft = useAppStore((state) => state.contributionDraft);
  const updateDraft = useAppStore((state) => state.updateDraft);
  const addContribution = useAppStore((state) => state.addContribution);
  const addActivity = useAppStore((state) => state.addActivity);
  const setPrimary = useAppStore((state) => state.setPrimaryContribution);
  const archive = useAppStore((state) => state.archiveContribution);
  const deleteLocal = useAppStore((state) => state.deleteContribution);
  const [copied, setCopied] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const identity = useMemo(
    () => identities.find((item) => item.did === activeDid),
    [identities, activeDid]
  );
  const contributions = useMemo(
    () => allContributions.filter((item) => item.did === activeDid),
    [allContributions, activeDid]
  );

  async function copy(value: string) {
    const success = await copyTextToClipboard(value);
    if (success) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  }

  function save(contribution: Contribution, activity: Parameters<typeof addActivity>[0]) {
    addContribution(contribution);
    addActivity(activity);
    updateDraft({ publicUrl: "", description: "", source: "other" });
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Proof ledger</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Contributions</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
          Record public work with a signed Technocore announcement.
        </p>
      </div>
      {!identity ? (
        <Empty text="Create or import a DID before recording public work." />
      ) : !privateKey ? (
        <div className="flex flex-col items-center rounded-2xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <LockKeyhole className="text-amber-300" size={28} />
          <h2 className="mt-4 font-semibold text-zinc-100">Unlock your DID first</h2>
          <p className="mt-2 text-sm text-zinc-500">
            The contribution form stays disabled until a signing key is unlocked.
          </p>
        </div>
      ) : (
        <>
          <ContributionForm
            did={identity.did}
            fingerprint={identity.fingerprint}
            privateKey={privateKey}
            draft={draft}
            onDraft={(value) => updateDraft(value)}
            onSuccess={save}
          />
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Fingerprint size={17} className="text-emerald-400" />
              <h2 className="font-semibold text-zinc-100">Recorded contributions</h2>
            </div>
            <ContributionList
              items={contributions}
              onCopy={(item) => void copy(proofDetails(item))}
              onCopySequence={(item) =>
                void copy(`Signed Technocore record: room ${item.room}, sequence ${item.sequence ?? "pending"}`)
              }
              onPrimary={setPrimary}
              onArchive={(id) => archive(id)}
              onDelete={(id) => setDeleteTargetId(id)}
              onRecordAnother={() => updateDraft({ publicUrl: "", description: "", source: "other" })}
            />
          </div>
        </>
      )}
      {deleteTargetId && (
        <ConfirmDialog
          title="Delete local record"
          message="Delete this local record? The Technocore message will remain."
          confirmLabel="Delete"
          onConfirm={() => {
            deleteLocal(deleteTargetId);
            setDeleteTargetId(null);
          }}
          onClose={() => setDeleteTargetId(null)}
        />
      )}
      {copied && (
        <span className="fixed bottom-5 right-5 inline-flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-zinc-900 px-3 py-2 text-xs text-emerald-300">
          <Copy size={13} />
          Copied
        </span>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center text-sm text-zinc-500">
      {text}
    </div>
  );
}
