"use client";

/**
 * P-38 — Badge print engine.
 * Renders exact-mm badges into a body-level portal; @media print CSS hides the
 * app and sets one of two @page presets (A6 sheet / 4"×3" thermal). QR comes
 * from qrcode.react with the pass token. Printing N badges yields N pages via
 * page-break-after. PrintPreviewModal wraps printer-type select + test page +
 * the browser print dialog.
 */

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Printer, FlaskConical } from "lucide-react";
import { Modal } from "@/components/kit/Modal";
import { Button } from "@/components/kit/Button";
import { SelectInput } from "@/components/kit/inputs";
import {
  A6,
  THERMAL,
  templateById,
  templateSize,
  DEFAULT_FIELD_CONFIG,
  type BadgeData,
  type BadgeFieldConfig,
  type BadgeTemplateId,
} from "@/components/badge/templates";

export type PrinterFormat = "a6" | "thermal";

export interface BadgePrintItem {
  data: BadgeData;
  templateId: BadgeTemplateId;
  fields: BadgeFieldConfig;
}

/* ── Print portal ────────────────────────────────────────────────────────── */

/**
 * Body-level portal holding the print-ready badge pages. Hidden on screen;
 * during print it is the ONLY visible element. One .badge-page per badge.
 */
export function BadgePrintPortal({ items, format }: { items: BadgePrintItem[]; format: PrinterFormat }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const page = format === "thermal" ? THERMAL : A6;

  return createPortal(
    <div id="badge-print-root" aria-hidden>
      {/* Two @page presets — margin 0 so mm layouts land edge-to-edge at 300dpi. */}
      <style>{`
        @media screen {
          #badge-print-root { display: none; }
        }
        @media print {
          @page { size: ${page.w}mm ${page.h}mm; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          body > *:not(#badge-print-root) { display: none !important; }
          #badge-print-root { display: block !important; }
          #badge-print-root .badge-page {
            width: ${page.w}mm;
            height: ${page.h}mm;
            overflow: hidden;
            page-break-after: always;
            break-after: page;
          }
          #badge-print-root .badge-page:last-child { page-break-after: auto; break-after: auto; }
          #badge-print-root * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>
      {items.map((item, i) => {
        // Thermal printers always get the thermal-compact layout.
        const effectiveId: BadgeTemplateId = format === "thermal" ? "thermal_compact" : item.templateId;
        const tpl = templateById(effectiveId);
        return (
          <div className="badge-page" key={`${item.data.badgeNo}-${i}`}>
            <tpl.Component data={item.data} fields={item.fields} />
          </div>
        );
      })}
    </div>,
    document.body,
  );
}

/* ── Scaled on-screen badge preview ──────────────────────────────────────── */

export function BadgeScaled({
  item,
  format,
  targetWidthPx = 220,
}: {
  item: BadgePrintItem;
  format: PrinterFormat;
  targetWidthPx?: number;
}) {
  const effectiveId: BadgeTemplateId = format === "thermal" ? "thermal_compact" : item.templateId;
  const tpl = templateById(effectiveId);
  const size = templateSize(effectiveId);
  // 1mm ≈ 3.7795px at 96dpi
  const pxW = size.w * 3.7795;
  const pxH = size.h * 3.7795;
  const scale = targetWidthPx / pxW;

  return (
    <div
      className="overflow-hidden rounded-lg shadow-card ring-1 ring-slate-200"
      style={{ width: pxW * scale, height: pxH * scale }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: pxW, height: pxH }}>
        <tpl.Component data={item.data} fields={item.fields} />
      </div>
    </div>
  );
}

/* ── Test page data ──────────────────────────────────────────────────────── */

export const TEST_BADGE: BadgeData = {
  name: "Test Print",
  company: "Orbit Event ERP",
  city: "Calibration Page",
  designation: "Alignment Check",
  categoryName: "Test",
  categoryHex: "#2563eb",
  badgeNo: "TEST-0000",
  qrToken: "orbit-test-print-token",
  eventName: "Printer Calibration",
  eventDates: "Check edges are not clipped",
  sponsorStripUrl: null,
};

/* ── Print preview modal ─────────────────────────────────────────────────── */

export function PrintPreviewModal({
  open,
  onClose,
  items,
  onPrinted,
  title = "Print Badges",
}: {
  open: boolean;
  onClose: () => void;
  items: BadgePrintItem[];
  /** Called after the browser print dialog closes (used to mark jobs printed). */
  onPrinted?: () => void;
  title?: string;
}) {
  const [format, setFormat] = useState<PrinterFormat>("a6");
  const [printItems, setPrintItems] = useState<BadgePrintItem[] | null>(null);

  /* Fire the browser dialog once the portal content is committed. */
  useEffect(() => {
    if (!printItems) return;
    const isTest = printItems.length === 1 && printItems[0].data.badgeNo === "TEST-0000";
    const t = setTimeout(() => {
      window.print();
      setPrintItems(null);
      if (!isTest) onPrinted?.();
    }, 120);
    return () => clearTimeout(t);
  }, [printItems, onPrinted]);

  const preview = useMemo(() => items.slice(0, 8), [items]);
  const pageLabel = format === "thermal" ? '4" × 3" thermal' : "A6 sheet (105 × 148 mm)";

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={title}
        subtitle={`${items.length} badge${items.length === 1 ? "" : "s"} → ${items.length} page${items.length === 1 ? "" : "s"}`}
        size="xl"
        footer={
          <div className="flex w-full items-center justify-between">
            <Button
              variant="ghost"
              icon={FlaskConical}
              onClick={() =>
                setPrintItems([{ data: TEST_BADGE, templateId: "classic", fields: DEFAULT_FIELD_CONFIG }])
              }
            >
              Print Test Page
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button
                variant="primary"
                icon={Printer}
                disabled={items.length === 0}
                onClick={() => setPrintItems(items)}
              >
                Print {items.length}
              </Button>
            </div>
          </div>
        }
      >
        <div className="mb-4 flex items-center gap-3">
          <label className="text-[13px] text-slate-600" htmlFor="printer-format">Printer type</label>
          <SelectInput
            id="printer-format"
            value={format}
            onChange={(e) => setFormat(e.target.value as PrinterFormat)}
            className="w-56"
            options={[
              { value: "a6", label: "A6 badge sheet — 105 × 148 mm" },
              { value: "thermal", label: 'Thermal — 4" × 3" landscape' },
            ]}
          />
          <span className="text-[11px] text-slate-400">@page {pageLabel} · margin 0</span>
        </div>

        {/* Scaled preview grid (first 8) */}
        <div className="flex flex-wrap gap-3 rounded-xl bg-slate-50 p-4">
          {preview.length === 0 ? (
            <p className="w-full py-8 text-center text-[13px] text-slate-400">Nothing selected to print.</p>
          ) : (
            preview.map((item, i) => (
              <BadgeScaled key={i} item={item} format={format} targetWidthPx={format === "thermal" ? 200 : 150} />
            ))
          )}
          {items.length > preview.length && (
            <div className="flex items-center px-3 text-[12px] text-slate-400">
              +{items.length - preview.length} more
            </div>
          )}
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
          In the browser dialog set margins to <strong>None</strong> and scale to <strong>100%</strong>.
          Printing to PDF yields exact-size pages ({pageLabel}) — crisp at 300 dpi.
        </p>
      </Modal>

      {printItems && <BadgePrintPortal items={printItems} format={format} />}
    </>
  );
}
