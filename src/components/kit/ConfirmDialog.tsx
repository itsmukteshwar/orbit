"use client";

/**
 * ConfirmDialog — typed-confirmation destructive dialog (PROJECT-CONTEXT §5:
 * every destructive action requires typing the record name). Built on Modal.
 */

import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Modal } from "@/components/kit/Modal";
import { Button } from "@/components/kit/Button";
import { TextInput } from "@/components/kit/inputs";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  /** The exact string the user must type (record name / "DELETE"). */
  confirmText: string;
  /** Danger button label, e.g. "Revoke pass". */
  actionLabel: string;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  actionLabel,
  loading,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  const matches = typed === confirmText;

  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={
        <span className="flex items-center gap-2">
          <TriangleAlert className="h-4 w-4 text-red-500" />
          {title}
        </span>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" disabled={!matches || loading} onClick={() => void onConfirm()}>
            {loading ? "Working…" : actionLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-[13px] text-slate-600">{description}</p>
        <div className="rounded-lg bg-red-50/70 p-3 text-[12px] text-red-600">
          This action cannot be undone.
        </div>
        <label className="block">
          <span className="mb-1 block text-[13px] font-medium text-slate-600">
            Type <span className="font-semibold text-slate-800">{confirmText}</span> to confirm
          </span>
          <TextInput
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={confirmText}
            autoFocus
            error={typed.length > 0 && !matches}
          />
        </label>
      </div>
    </Modal>
  );
}
