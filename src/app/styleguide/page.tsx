"use client";

/**
 * /styleguide — the living design system (P-01).
 * Top half: the EXISTING canon components and tokens, untouched.
 * Bottom half: the new BUILD-TO-TOKEN primitives + kit composites, rendered
 * side-by-side with canon recipes — they must be indistinguishable.
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  Briefcase, CalendarPlus, CheckCircle2, ClipboardList, Download, Eye, IndianRupee,
  Inbox, Pencil, Radio as RadioIcon, ScanLine, Trash2, User, Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AreaChart } from "@/components/charts/AreaChart";
import { DonutChart } from "@/components/charts/DonutChart";
import {
  Button, TextInput, Textarea, SelectInput, PhoneInput, Checkbox, Radio, ChoiceGroup,
  SearchInput, FormField, Modal, Drawer, Dropdown, Tabs, Skeleton, SkeletonStat,
  DataTable, FilterBar, EmptyState, ConfirmDialog, FormSection, FormActions, StatusBadge,
  SettingsTabs, Stepper, CopyField, KbdHint, toastSuccess, toastError, toastUndo,
} from "@/components/kit";
import { registrationService } from "@/services/registration";
import { eventService } from "@/services/event";
import { queryKeys } from "@/lib/queries";
import type { Registration, RegistrationStatus } from "@/types/domain";

/* ── Local helpers ────────────────────────────────────────────────────── */

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-visible">
      <CardHeader title={title} subtitle={subtitle} />
      <div className="space-y-4 px-5 pb-5">{children}</div>
    </Card>
  );
}

function Swatch({ name, cls, hex }: { name: string; cls: string; hex: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`h-9 w-9 shrink-0 rounded-lg border border-slate-100 ${cls}`} />
      <span className="leading-tight">
        <span className="block text-[13px] font-medium text-slate-700">{name}</span>
        <span className="block text-[11px] text-slate-400 uppercase">{hex}</span>
      </span>
    </div>
  );
}

const BADGE_VARIANTS: BadgeVariant[] = ["primary", "success", "warning", "danger", "info", "secondary", "neutral"];

/* ── Page ─────────────────────────────────────────────────────────────── */

export default function StyleguidePage() {
  return (
    <>
      <PageHeader
        title="Styleguide"
        subtitle="The Orbit design system — canon components (top) and kit composites (bottom). If you can tell old from new, it's a bug."
        actions={
          <span className="flex items-center gap-1.5 text-[12px] text-slate-400">
            Palette <KbdHint keys={["⌘", "K"]} />
          </span>
        }
      />

      <TokensSection />
      <ExistingComponentsSection />
      <PrimitivesSection />
      <OverlaysSection />
      <NavigationKitSection />
      <FeedbackSection />
      <DataTableSection />
    </>
  );
}

/* ── 1 · Tokens ───────────────────────────────────────────────────────── */

function TokensSection() {
  return (
    <Section title="Design Tokens" subtitle="Everything from globals.css — the only permitted values (THEME-GUIDE)">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <Swatch name="orbit-50" cls="bg-orbit-50" hex="#E6F0FF" />
        <Swatch name="orbit-200" cls="bg-orbit-200" hex="#B3D1FF" />
        <Swatch name="orbit-300" cls="bg-orbit-300" hex="#60A5FA" />
        <Swatch name="orbit-500 · primary" cls="bg-orbit-500" hex="#2563EB" />
        <Swatch name="orbit-900 · navy" cls="bg-orbit-900" hex="#0B132B" />
        <Swatch name="success" cls="bg-emerald-500" hex="#10B981" />
        <Swatch name="warning" cls="bg-amber-400" hex="#FBBF24" />
        <Swatch name="danger" cls="bg-red-500" hex="#EF4444" />
        <Swatch name="info" cls="bg-sky-500" hex="#0EA5E9" />
        <Swatch name="surface" cls="bg-surface" hex="#F4F6F8" />
      </div>

      <div className="grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-2">
        <div className="space-y-1">
          <p className="font-display text-xl font-semibold text-orbit-900">Display / Poppins semibold — page titles</p>
          <p className="font-display font-semibold text-orbit-900">Card title / Poppins semibold</p>
          <p className="text-sm text-slate-700">Body / Inter 14px — default UI text</p>
          <p className="text-[13px] text-slate-500">Small / 13px — nav, labels, table toolbars</p>
          <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">Overline / 11px uppercase</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span className="rounded-xl bg-white p-4 text-[12px] text-slate-500 shadow-card">shadow-card</span>
          <span className="rounded-xl bg-white p-4 text-[12px] text-slate-500 shadow-card-hover">shadow-card-hover</span>
          <span className="rounded-lg border border-slate-200 p-4 text-[12px] text-slate-500">rounded-lg 8px</span>
          <span className="rounded-xl border border-slate-200 p-4 text-[12px] text-slate-500">rounded-xl 12px</span>
        </div>
      </div>
    </Section>
  );
}

/* ── 2 · Existing components ──────────────────────────────────────────── */

function ExistingComponentsSection() {
  return (
    <>
      <Section title="StatCard — canon" subtitle="All 6 accents + StatTile extensions (loading, delta)">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Registrations" value="14,208" icon={ClipboardList} accent="primary" trend={{ text: "+412", positive: true }} hint="Today" />
          <StatCard label="Checked-in" value="8,914" icon={ScanLine} accent="success" hint="6 gates open" />
          <StatCard label="Revenue" value="₹4.86L" icon={IndianRupee} accent="info" delta={{ value: 86400, suffix: " paise" }} hint="delta prop demo" />
          <StatCard label="No-shows" value="2,162" icon={Users} accent="danger" trend={{ text: "15.2%", positive: false }} hint="of registered" />
          <StatCard label="Loading state" value="—" icon={Users} accent="warning" loading />
          <SkeletonStat />
        </div>
      </Section>

      <Section title="Badges & Progress — canon" subtitle="7 tint variants · dot option · 4 progress tones">
        <div className="flex flex-wrap items-center gap-2">
          {BADGE_VARIANTS.map((v) => (
            <Badge key={v} variant={v}>{v}</Badge>
          ))}
          <Badge variant="success" dot>Live</Badge>
          <Badge variant="warning" dot>Queued</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <ProgressBar value={72} label="Primary 72%" />
          <ProgressBar value={45} label="Success 45%" tone="success" />
          <ProgressBar value={88} label="Warning 88%" tone="warning" />
          <ProgressBar value={95} label="Danger 95%" tone="danger" />
        </div>
      </Section>

      <Section title="Charts — canon wrappers" subtitle="Orbit chart colours · fontFamily inherit · dashed grid">
        <div className="grid gap-4 xl:grid-cols-2">
          <AreaChart
            categories={["Mon", "Tue", "Wed", "Thu", "Fri"]}
            series={[
              { name: "Entries", data: [820, 1240, 1580, 1390, 1720] },
              { name: "Exits", data: [340, 680, 920, 1130, 1510] },
            ]}
            colors={["#2563EB", "#94A3B8"]}
            height={220}
            format={{ indian: true, suffix: " visitors" }}
          />
          <DonutChart
            labels={["Veg", "Non-Veg", "Jain"]}
            series={[9312, 3894, 1002]}
            colors={["#22C55E", "#F59E0B", "#2563EB"]}
            totalLabel="Visitors"
            totalValue="14,208"
            format={{ indian: true, suffix: " visitors" }}
          />
        </div>
      </Section>
    </>
  );
}

/* ── 3 · Primitives side-by-side ──────────────────────────────────────── */

const CANON_INPUT =
  "h-9 w-full rounded-lg border border-slate-200 px-3 text-sm placeholder:text-slate-400 transition focus:border-orbit-300 focus:ring-2 focus:ring-orbit-100 focus:outline-none";

function PrimitivesSection() {
  return (
    <>
      <Section
        title="Inputs — canon recipe vs kit primitives"
        subtitle="Left column: raw classes copied from /visitors/register. Right column: kit components. They must be identical."
      >
        <div className="grid gap-x-6 gap-y-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[13px] font-medium text-slate-600">
              Canon raw input <span className="text-red-500">*</span>
            </span>
            <input className={CANON_INPUT} placeholder="e.g. Arjun" />
            <span className="mt-1 block text-[11px] text-slate-400">Classes copied verbatim from the register page.</span>
          </label>

          <FormField label="Kit TextInput" required hint="Rendered by the kit component.">
            <TextInput placeholder="e.g. Arjun" />
          </FormField>

          <label className="block">
            <span className="mb-1 block text-[13px] font-medium text-slate-600">Canon raw select</span>
            <select className={CANON_INPUT} defaultValue="">
              <option value="" disabled>Select</option>
              <option>Trade Visitor</option>
              <option>Delegate</option>
            </select>
          </label>

          <FormField label="Kit SelectInput">
            <SelectInput placeholder="Select" defaultValue="" options={["Trade Visitor", "Delegate"]} />
          </FormField>

          <FormField label="Kit PhoneInput" hint="QR pass will be sent on WhatsApp to this number.">
            <PhoneInput placeholder="10-digit mobile" />
          </FormField>

          <FormField label="Kit Textarea">
            <Textarea placeholder="Notes…" rows={2} />
          </FormField>

          <FormField label="Error state" error="This field is required.">
            <TextInput placeholder="e.g. Kumar" error />
          </FormField>

          <FormField label="Kit SearchInput (md)">
            <SearchInput size="md" placeholder="Search name, ID, badge, phone" />
          </FormField>
        </div>

        <div className="grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-2">
          <ChoiceGroup label="Days Attending (kit Checkbox)">
            <Checkbox label="Day 1 · 17 Jul" defaultChecked />
            <Checkbox label="Day 2 · 18 Jul" defaultChecked />
            <Checkbox label="Day 3 · 19 Jul" />
          </ChoiceGroup>
          <ChoiceGroup label="Food Preference (kit Radio)">
            <Radio name="sg-food" label="Veg" defaultChecked />
            <Radio name="sg-food" label="Non-Veg" />
            <Radio name="sg-food" label="Jain" />
          </ChoiceGroup>
        </div>
      </Section>

      <Section title="Buttons — kit" subtitle="The four canon recipes as components">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" icon={CalendarPlus}>Primary</Button>
          <Button variant="secondary" icon={Download}>Secondary</Button>
          <Button variant="ghost">Ghost / Cancel</Button>
          <Button variant="danger" icon={Trash2}>Danger</Button>
          <Button variant="secondary" icon={Eye} iconOnly aria-label="View" />
          <Button variant="primary" disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="FormSection + FormActions — kit" subtitle="The /visitors/register fieldset pattern componentised">
        <form className="space-y-6" noValidate>
          <FormSection icon={User} title="Personal Details" divider={false}>
            <FormField label="First Name" required>
              <TextInput placeholder="e.g. Arjun" />
            </FormField>
            <FormField label="Last Name" required>
              <TextInput placeholder="e.g. Kumar" />
            </FormField>
          </FormSection>
          <FormSection icon={Briefcase} title="Professional Details" columns={3}>
            <FormField label="Company">
              <TextInput placeholder="e.g. Tata Elxsi" />
            </FormField>
            <FormField label="Designation">
              <TextInput placeholder="e.g. Manager" />
            </FormField>
            <FormField label="Industry">
              <SelectInput placeholder="Select" defaultValue="" options={["IT / Software", "Manufacturing"]} />
            </FormField>
          </FormSection>
          <FormActions>
            <Button variant="primary">Save &amp; Continue</Button>
            <Button variant="secondary">Save Draft</Button>
            <Button variant="ghost" className="ml-auto">Cancel</Button>
          </FormActions>
        </form>
      </Section>
    </>
  );
}

/* ── 4 · Overlays ─────────────────────────────────────────────────────── */

function OverlaysSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <Section title="Overlays — kit" subtitle="Modal · Drawer (sheet) · typed ConfirmDialog · Dropdown">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => setModalOpen(true)}>Open Modal</Button>
        <Button variant="secondary" onClick={() => setDrawerOpen(true)}>Open Drawer</Button>
        <Button variant="danger" onClick={() => setConfirmOpen(true)}>Delete Registration…</Button>
        <Dropdown
          trigger={() => <Button variant="secondary">Dropdown Menu</Button>}
          items={[
            { label: "View details", icon: Eye, onSelect: () => toastSuccess("Viewed") },
            { label: "Edit record", icon: Pencil, onSelect: () => toastSuccess("Edit opened") },
            "separator",
            { label: "Delete", icon: Trash2, danger: true, onSelect: () => setConfirmOpen(true) },
          ]}
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Send WhatsApp Blast"
        subtitle="Template must be pre-approved by the BSP"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => { setModalOpen(false); toastSuccess("Blast queued", "1,204 recipients"); }}>
              Queue Send
            </Button>
          </>
        }
      >
        <FormField label="Template">
          <SelectInput defaultValue="" placeholder="Select" options={["Registration Confirmed + QR Pass", "Day Reminder"]} />
        </FormField>
      </Modal>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Arjun Kumar"
        subtitle="OV2600001 · Trade Visitor"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDrawerOpen(false)}>Close</Button>
            <Button variant="primary">Print Badge</Button>
          </>
        }
      >
        <div className="space-y-3 text-[13px]">
          <p className="flex justify-between"><span className="text-slate-400">Phone</span><span className="font-medium text-slate-700">96368 22798</span></p>
          <p className="flex justify-between"><span className="text-slate-400">Company</span><span className="font-medium text-slate-700">Tata Elxsi</span></p>
          <p className="flex justify-between"><span className="text-slate-400">Status</span><StatusBadge status="approved" /></p>
          <CopyField label="QR Token" value="qr_01JX8H2M4K9PQW3R" masked />
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          toastUndo("Registration deleted", () => toastSuccess("Restored"), "OV2600007 · Akash Gowda");
        }}
        title="Delete registration"
        description={<>This permanently removes <strong>Akash Gowda</strong> (OV2600007) and revokes their pass.</>}
        confirmText="Akash Gowda"
        actionLabel="Delete registration"
      />
    </Section>
  );
}

/* ── 5 · Navigation kit ───────────────────────────────────────────────── */

function NavigationKitSection() {
  const [tab, setTab] = useState("overview");
  const [settingsTab, setSettingsTab] = useState("profile");

  return (
    <Section title="Tabs · SettingsTabs · Stepper — kit" subtitle="Vyzor structures reskinned with Orbit tokens">
      <Tabs
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "registrations", label: "Registrations", badge: <Badge variant="primary">400</Badge> },
          { id: "food", label: "Food" },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div className="rounded-xl border border-slate-100 p-4">
        <SettingsTabs
          tabs={[
            { id: "profile", label: "Profile", icon: User },
            { id: "team", label: "Team", icon: Users },
            { id: "danger", label: "Danger Zone", icon: Trash2 },
          ]}
          value={settingsTab}
          onChange={setSettingsTab}
        >
          <p className="text-[13px] text-slate-500">
            Active pane: <span className="font-semibold text-slate-700">{settingsTab}</span>
          </p>
        </SettingsTabs>
      </div>

      <Stepper
        steps={[
          { id: "upload", label: "Upload CSV", description: "Visitors file" },
          { id: "map", label: "Map Columns" },
          { id: "review", label: "Review", description: "12 warnings" },
          { id: "import", label: "Import" },
        ]}
        current={2}
      />
    </Section>
  );
}

/* ── 6 · Feedback ─────────────────────────────────────────────────────── */

function FeedbackSection() {
  return (
    <>
      <Section title="Toasts & status — kit" subtitle="sonner reskinned · StatusBadge domain matrix">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => toastSuccess("Registration approved", "Pass sent on WhatsApp")}>Success toast</Button>
          <Button variant="secondary" onClick={() => toastError("Save failed", { description: "Mock error toggle tripped", onRetry: () => toastSuccess("Retried OK") })}>Error + retry</Button>
          <Button variant="secondary" onClick={() => toastUndo("Visitor archived", () => toastSuccess("Restored"))}>Undo toast</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          {(["pending", "approved", "rejected", "revoked", "live", "draft", "delivered", "failed", "offline", "duplicate"] as const).map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
      </Section>

      <Section title="Empty & loading states — kit" subtitle="EmptyState (Vyzor structure) · skeletons only, never spinners">
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-xl border border-dashed border-slate-200">
            <EmptyState
              icon={Inbox}
              title="No pending approvals"
              description="New registrations that need review will appear here."
              action={<Button variant="primary" icon={CheckCircle2}>Review settings</Button>}
            />
          </div>
          <div className="space-y-3 rounded-xl border border-dashed border-slate-200 p-5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-64" />
            <Skeleton className="h-24 w-full bg-slate-50" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

/* ── 7 · DataTable over 400 mock registrations ────────────────────────── */

const PAGE_SIZE = 15;

function DataTableSection() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [drawerReg, setDrawerReg] = useState<Registration | null>(null);

  const params = useMemo(
    () => ({
      cursor: String((page - 1) * PAGE_SIZE),
      limit: PAGE_SIZE,
      q: q || undefined,
      filters: status ? { status: status as RegistrationStatus } : undefined,
    }),
    [page, q, status],
  );

  const { data, isPending } = useQuery({
    queryKey: queryKeys.registrations.list(params),
    queryFn: () => registrationService.list(params),
    placeholderData: (prev) => prev,
  });

  const { data: categories } = useQuery({
    queryKey: queryKeys.events.list({ limit: 1 }),
    queryFn: async () => {
      const events = await eventService.list({ limit: 1 });
      return eventService.categories(events.items[0].id);
    },
  });
  const categoryName = useMemo(
    () => new Map((categories ?? []).map((c) => [c.id, c.name])),
    [categories],
  );

  const columns = useMemo<ColumnDef<Registration, unknown>[]>(
    () => [
      {
        id: "name",
        header: "Visitor",
        enableSorting: true,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orbit-50 text-[11px] font-semibold text-orbit-600">
                {r.firstName[0]}
                {r.lastName[0]}
              </span>
              <div>
                <p className="font-medium text-slate-800">{r.firstName} {r.lastName}</p>
                <p className="text-[11px] text-slate-400">{r.phone}</p>
              </div>
            </div>
          );
        },
      },
      {
        id: "company",
        header: "Company",
        cell: ({ row }) => <span className="text-slate-600">{row.original.company ?? "—"}</span>,
      },
      {
        id: "city",
        header: "City",
        cell: ({ row }) => <span className="text-slate-600">{row.original.city}</span>,
      },
      {
        id: "category",
        header: "Category",
        cell: ({ row }) => (
          <Badge variant="primary">{categoryName.get(row.original.categoryId) ?? "…"}</Badge>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: () => <span className="block text-right">Action</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1.5">
            <button
              aria-label="View"
              onClick={(e) => {
                e.stopPropagation();
                setDrawerReg(row.original);
              }}
              className="rounded-lg bg-orbit-50 p-1.5 text-orbit-500 hover:bg-orbit-100"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button aria-label="Edit" className="rounded-lg bg-sky-50 p-1.5 text-sky-500 hover:bg-sky-100">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [categoryName],
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="DataTable — 400 mock registrations"
        subtitle="TanStack engine in the /visitors skin · server-mode pagination via mock service (300ms latency) · try window.__mockErrors = true"
      />

      <FilterBar
        summary={
          data ? (
            <>
              Showing <span className="font-semibold text-slate-800">{data.total.toLocaleString("en-IN")}</span> registrations
            </>
          ) : (
            "Loading…"
          )
        }
        selects={[
          {
            id: "status",
            label: "All Status",
            options: ["pending", "approved", "rejected", "revoked"],
            value: status,
            onChange: (v) => {
              setStatus(v);
              setPage(1);
            },
          },
        ]}
        search={{
          value: q,
          onChange: (v) => {
            setQ(v);
            setPage(1);
          },
          placeholder: "Search name, phone, company",
        }}
        chips={
          status
            ? [{ id: "status", label: `Status: ${status}`, onRemove: () => setStatus("") }]
            : undefined
        }
        onClearAll={status || q ? () => { setStatus(""); setQ(""); setPage(1); } : undefined}
      />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isPending}
        total={data?.total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        sorting={sorting}
        onSortingChange={setSorting}
        getRowId={(r) => r.id}
        enableSelection
        bulkActions={(ids, clear) => (
          <>
            <Button
              variant="secondary"
              className="h-7 px-2.5 text-[12px]"
              onClick={() => {
                toastSuccess(`${ids.length} registrations approved`);
                clear();
              }}
            >
              Approve
            </Button>
            <Button variant="ghost" className="h-7 px-2.5 text-[12px]" onClick={clear}>
              Clear
            </Button>
          </>
        )}
        onRowClick={(r) => setDrawerReg(r)}
        emptyState={
          <EmptyState icon={RadioIcon} title="No matches" description="Try clearing filters or a different search term." />
        }
      />

      <Drawer
        open={!!drawerReg}
        onClose={() => setDrawerReg(null)}
        title={drawerReg ? `${drawerReg.firstName} ${drawerReg.lastName}` : ""}
        subtitle={drawerReg ? `${drawerReg.id} · ${categoryName.get(drawerReg.categoryId) ?? ""}` : undefined}
        footer={<Button variant="ghost" onClick={() => setDrawerReg(null)}>Close</Button>}
      >
        {drawerReg && (
          <div className="space-y-3 text-[13px]">
            <p className="flex justify-between"><span className="text-slate-400">Phone</span><span className="font-medium text-slate-700">{drawerReg.phone}</span></p>
            <p className="flex justify-between"><span className="text-slate-400">Email</span><span className="font-medium text-slate-700">{drawerReg.email ?? "—"}</span></p>
            <p className="flex justify-between"><span className="text-slate-400">Company</span><span className="font-medium text-slate-700">{drawerReg.company ?? "—"}</span></p>
            <p className="flex justify-between"><span className="text-slate-400">City</span><span className="font-medium text-slate-700">{drawerReg.city}, {drawerReg.state}</span></p>
            <p className="flex justify-between"><span className="text-slate-400">Status</span><StatusBadge status={drawerReg.status} /></p>
            <CopyField label="Registration ID" value={drawerReg.id} />
          </div>
        )}
      </Drawer>
    </Card>
  );
}
