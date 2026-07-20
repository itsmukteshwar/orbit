"use client";

/**
 * P-32 — Form Versions (/org/events/[eventId]/registrations/forms/versions)
 * Version list · publish flow (immutability ConfirmDialog) · view-only mode
 * for published versions · clone-to-draft · category binding selector.
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Copy,
  Eye,
  FilePen,
  GitBranch,
  Lock,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/kit/Button";
import { Modal } from "@/components/kit/Modal";
import { toastSuccess } from "@/components/kit/toast";
import { FormRenderer } from "@/components/form/FormRenderer";
import { useBuilderStore } from "@/lib/builderStore";
import { db } from "@/services/mock/db";
import { cn } from "@/lib/utils";
import type { FormSchema } from "@/lib/formSchema";

/* ── Published version storage (mock, localStorage) ──────────────────────── */

interface PublishedVersion {
  schema: FormSchema;
  publishedAt: string;
  responses: number;
  /** Category ids bound to this version. */
  categoryIds: string[];
}

function versionsKey(eventId: string) {
  return `orbit_form_versions_${eventId}`;
}

function loadVersions(eventId: string): PublishedVersion[] {
  try {
    const raw = localStorage.getItem(versionsKey(eventId));
    if (raw) return JSON.parse(raw) as PublishedVersion[];
  } catch { /* corrupt */ }
  // Seed: v1 published with 340 responses
  const seed: PublishedVersion[] = [
    {
      schema: {
        id: "seed_v1",
        name: "Visitor Registration",
        version: 1,
        consentText: "I agree to the event terms & conditions.",
        fields: [
          { key: "first_name", label: "First Name", type: "text", required: true },
          { key: "last_name", label: "Last Name", type: "text", required: true },
          { key: "mobile", label: "Mobile Number", type: "phone", required: true },
          { key: "email", label: "Email", type: "email", required: false },
          { key: "company", label: "Company", type: "text", required: false },
        ],
      },
      publishedAt: "2026-05-02T10:00:00.000Z",
      responses: 340,
      categoryIds: [],
    },
    {
      schema: {
        id: "seed_v2",
        name: "Visitor Registration",
        version: 2,
        consentText: "I agree to the event terms & conditions and privacy policy.",
        fields: [
          { key: "first_name", label: "First Name", type: "text", required: true },
          { key: "last_name", label: "Last Name", type: "text", required: true },
          { key: "mobile", label: "Mobile Number", type: "phone", required: true },
          { key: "email", label: "Email", type: "email", required: true },
          { key: "company", label: "Company", type: "text", required: false },
          { key: "city", label: "City", type: "select", required: true, options: ["Mumbai", "Delhi", "Bengaluru", "Other"] },
        ],
      },
      publishedAt: "2026-06-14T09:30:00.000Z",
      responses: 60,
      categoryIds: [],
    },
  ];
  return seed;
}

function saveVersions(eventId: string, versions: PublishedVersion[]) {
  localStorage.setItem(versionsKey(eventId), JSON.stringify(versions));
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function VersionsPage() {
  return (
    <Suspense>
      <VersionsInner />
    </Suspense>
  );
}

function VersionsInner() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const router = useRouter();
  const searchParams = useSearchParams();

  const builderSchema = useBuilderStore((s) => s.schema);
  const loadDraft = useBuilderStore((s) => s.loadDraft);

  const [versions, setVersions] = useState<PublishedVersion[]>([]);
  const [publishOpen, setPublishOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<PublishedVersion | null>(null);
  const [publishing, setPublishing] = useState(false);

  const categories = useMemo(() => db.categories.filter((c) => c.eventId === eventId), [eventId]);

  useEffect(() => {
    loadDraft(eventId);
    setVersions(loadVersions(eventId));
    // Deep-link: ?publish=1 opens the publish dialog immediately
    if (searchParams.get("publish") === "1") setPublishOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const nextVersion = (versions[versions.length - 1]?.schema.version ?? 0) + 1;

  const handlePublish = useCallback(async () => {
    setPublishing(true);
    await new Promise((r) => setTimeout(r, 500));
    const published: PublishedVersion = {
      schema: { ...builderSchema, version: nextVersion },
      publishedAt: new Date().toISOString(),
      responses: 0,
      categoryIds: categories.map((c) => c.id),
    };
    const next = [...versions, published];
    setVersions(next);
    saveVersions(eventId, next);
    setPublishing(false);
    setPublishOpen(false);
    toastSuccess(`v${nextVersion} published — new registrations use it from now`);
  }, [builderSchema, nextVersion, versions, eventId, categories]);

  function cloneToDraft(v: PublishedVersion) {
    const store = useBuilderStore.getState();
    store.reset(eventId);
    useBuilderStore.setState({
      schema: {
        ...v.schema,
        id: `draft_${Date.now()}`,
        version: nextVersion,
        // Regenerated draft — keys become editable again
      },
      dirty: true,
    });
    store.persistDraft(eventId);
    toastSuccess(`v${v.schema.version} cloned to draft v${nextVersion}`);
    router.push(`/org/events/${eventId}/registrations/forms`);
  }

  function bindCategory(vIndex: number, categoryId: string, bound: boolean) {
    setVersions((prev) => {
      const next = prev.map((v, i) =>
        i === vIndex
          ? {
              ...v,
              categoryIds: bound
                ? [...v.categoryIds, categoryId]
                : v.categoryIds.filter((id) => id !== categoryId),
            }
          : v,
      );
      saveVersions(eventId, next);
      return next;
    });
  }

  return (
    <>
      <PageHeader
        title="Form Versions"
        breadcrumbs={[
          { label: "Events", href: "/org/events" },
          { label: "Form Builder", href: `/org/events/${eventId}/registrations/forms` },
          { label: "Versions" },
        ]}
        subtitle="Published versions are immutable — clone to make changes"
        actions={
          <Button variant="primary" icon={Upload} onClick={() => setPublishOpen(true)}>
            Publish Draft as v{nextVersion}
          </Button>
        }
      />

      <div className="space-y-3">
        {/* Current draft */}
        <Card className="flex items-center gap-4 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orbit-50">
            <FilePen className="h-4.5 w-4.5 text-orbit-500" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-semibold text-slate-800">
              {builderSchema.name}
              <Badge variant="secondary">v{nextVersion} draft</Badge>
            </p>
            <p className="text-[12px] text-slate-400">
              {builderSchema.fields.length} fields · editable
            </p>
          </div>
          <Button variant="secondary" onClick={() => router.push(`/org/events/${eventId}/registrations/forms`)}>
            Open in Builder
          </Button>
        </Card>

        {/* Published versions, newest first */}
        {[...versions].reverse().map((v) => {
          const realIndex = versions.indexOf(v);
          return (
            <Card key={v.schema.version} className="p-5">
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                  <GitBranch className="h-4.5 w-4.5 text-emerald-600" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold text-slate-800">
                    {v.schema.name}
                    <Badge variant="success">v{v.schema.version} published</Badge>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Lock className="h-3 w-3" /> immutable
                    </span>
                  </p>
                  <p className="text-[12px] text-slate-400">
                    {v.responses.toLocaleString("en-IN")} responses ·{" "}
                    {v.schema.fields.length} fields · published{" "}
                    {new Date(v.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button variant="ghost" icon={Eye} onClick={() => setViewTarget(v)}>
                    View
                  </Button>
                  <Button variant="secondary" icon={Copy} onClick={() => cloneToDraft(v)}>
                    Clone to Draft
                  </Button>
                </div>
              </div>

              {/* Category binding */}
              {categories.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Categories using this version
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((c) => {
                      const bound = v.categoryIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => bindCategory(realIndex, c.id, !bound)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
                            bound
                              ? "border-orbit-200 bg-orbit-50 text-orbit-600"
                              : "border-slate-200 bg-white text-slate-400 hover:border-slate-300",
                          )}
                        >
                          {bound && <CheckCircle2 className="h-3 w-3" />}
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Publish confirm */}
      <Modal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        title={`Publish v${nextVersion}?`}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPublishOpen(false)}>Cancel</Button>
            <Button variant="primary" icon={Upload} disabled={publishing} onClick={() => void handlePublish()}>
              {publishing ? "Publishing…" : `Publish v${nextVersion}`}
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-[13px] text-slate-600">
          <p>
            <strong>{builderSchema.name}</strong> ({builderSchema.fields.length} fields) will become
            version {nextVersion}.
          </p>
          <ul className="space-y-1.5 rounded-lg bg-slate-50 p-3 text-[12px]">
            <li className="flex gap-2"><Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              Published versions are <strong>immutable</strong> — fields and keys lock permanently.</li>
            <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
              New registrations will use v{nextVersion} from the moment you publish.</li>
            <li className="flex gap-2"><GitBranch className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              Existing responses keep rendering with their original version.</li>
          </ul>
        </div>
      </Modal>

      {/* View-only modal for a published version */}
      <Modal
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title={viewTarget ? `${viewTarget.schema.name} — v${viewTarget.schema.version}` : ""}
        size="lg"
      >
        {viewTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-[12px] text-slate-500">
              <Lock className="h-3.5 w-3.5" />
              Published — clone to edit. Fields below are read-only.
            </div>
            <div className="pointer-events-none opacity-60 grayscale-[30%]">
              <FormRenderer
                schema={viewTarget.schema}
                disabled
                onSubmit={() => undefined}
                submitLabel="Register (disabled)"
              />
            </div>
            <div className="flex justify-end border-t border-slate-100 pt-3">
              <Button variant="secondary" icon={Copy} onClick={() => { cloneToDraft(viewTarget); setViewTarget(null); }}>
                Clone to Draft
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
