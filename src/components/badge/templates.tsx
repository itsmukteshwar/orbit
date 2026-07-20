"use client";

/**
 * P-37 — Badge template library.
 * 8 fixed templates rendered as React components with CSS mm units so the
 * same markup is exact-size in the P-38 print engine and scalable on screen.
 *
 * A6 templates: 105mm × 148mm (portrait).
 * Thermal-compact: 101.6mm × 76.2mm (4" × 3", landscape).
 */

import { QRCodeSVG } from "qrcode.react";

/* ── Data + config contracts ─────────────────────────────────────────────── */

export interface BadgeData {
  name: string;
  company: string | null;
  city: string;
  designation: string | null;
  categoryName: string;
  /** Resolved hex for the category tint strip. */
  categoryHex: string;
  badgeNo: string;
  qrToken: string;
  eventName: string;
  eventDates: string;
  /** Data-URL uploaded on the templates screen; null hides the strip. */
  sponsorStripUrl: string | null;
}

export interface BadgeFieldConfig {
  name: boolean;
  company: boolean;
  city: boolean;
  photo: boolean;
  qr: boolean;
  categoryStrip: boolean;
}

export const DEFAULT_FIELD_CONFIG: BadgeFieldConfig = {
  name: true,
  company: true,
  city: true,
  photo: false,
  qr: true,
  categoryStrip: true,
};

export const BADGE_FIELD_LABELS: Record<keyof BadgeFieldConfig, string> = {
  name: "Name",
  company: "Company",
  city: "City",
  photo: "Photo",
  qr: "QR Code",
  categoryStrip: "Category strip",
};

export type BadgeTemplateId =
  | "classic"
  | "bold_strip"
  | "photo_left"
  | "minimal"
  | "vip_gold"
  | "staff"
  | "exhibitor"
  | "thermal_compact";

export interface TemplateProps {
  data: BadgeData;
  fields: BadgeFieldConfig;
}

/* A6 portrait in mm */
export const A6 = { w: 105, h: 148 };
/* 4" × 3" thermal landscape in mm */
export const THERMAL = { w: 101.6, h: 76.2 };

export function templateSize(id: BadgeTemplateId): { w: number; h: number } {
  return id === "thermal_compact" ? THERMAL : A6;
}

/* ── Shared bits ─────────────────────────────────────────────────────────── */

const BASE: React.CSSProperties = {
  fontFamily: "var(--font-inter), Inter, sans-serif",
  background: "#ffffff",
  color: "#0b132b",
  overflow: "hidden",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  printColorAdjust: "exact",
  WebkitPrintColorAdjust: "exact",
};

function Qr({ token, sizeMm }: { token: string; sizeMm: number }) {
  return (
    <div style={{ width: `${sizeMm}mm`, height: `${sizeMm}mm`, background: "#fff", padding: "1mm", boxSizing: "border-box" }}>
      <QRCodeSVG value={token} style={{ width: "100%", height: "100%" }} level="M" />
    </div>
  );
}

function PhotoBox({ sizeMm }: { sizeMm: number }) {
  return (
    <div
      style={{
        width: `${sizeMm}mm`,
        height: `${sizeMm * 1.2}mm`,
        background: "#eef2f7",
        border: "0.3mm solid #cbd5e1",
        borderRadius: "1.5mm",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#94a3b8",
        fontSize: "2.6mm",
        fontWeight: 600,
        letterSpacing: "0.2mm",
      }}
    >
      PHOTO
    </div>
  );
}

function SponsorStrip({ url, heightMm }: { url: string | null; heightMm: number }) {
  if (!url) return null;
  return (
    <div style={{ height: `${heightMm}mm`, flexShrink: 0, overflow: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Sponsors" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
}

/* ── 1. Classic ──────────────────────────────────────────────────────────── */

function Classic({ data, fields }: TemplateProps) {
  return (
    <div style={{ ...BASE, width: `${A6.w}mm`, height: `${A6.h}mm` }}>
      <div style={{ padding: "6mm 7mm 3mm", textAlign: "center", borderBottom: "0.3mm solid #e2e8f0" }}>
        <p style={{ margin: 0, fontSize: "3.4mm", fontWeight: 700, color: "#2563eb", letterSpacing: "0.3mm" }}>
          {data.eventName.toUpperCase()}
        </p>
        <p style={{ margin: "0.5mm 0 0", fontSize: "2.4mm", color: "#64748b" }}>{data.eventDates}</p>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4mm 7mm", textAlign: "center" }}>
        {fields.name && (
          <p style={{ margin: 0, fontSize: "7.5mm", fontWeight: 800, lineHeight: 1.15 }}>{data.name}</p>
        )}
        {fields.company && data.company && (
          <p style={{ margin: "1.5mm 0 0", fontSize: "3.6mm", color: "#334155", fontWeight: 600 }}>{data.company}</p>
        )}
        {fields.city && (
          <p style={{ margin: "0.8mm 0 0", fontSize: "2.8mm", color: "#94a3b8" }}>{data.city}</p>
        )}
        {fields.qr && (
          <div style={{ marginTop: "4mm" }}>
            <Qr token={data.qrToken} sizeMm={26} />
          </div>
        )}
        <p style={{ margin: "2mm 0 0", fontSize: "2.6mm", fontFamily: "monospace", color: "#64748b" }}>{data.badgeNo}</p>
      </div>
      <SponsorStrip url={data.sponsorStripUrl} heightMm={12} />
      {fields.categoryStrip && (
        <div style={{ height: "11mm", flexShrink: 0, background: data.categoryHex, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "4.2mm", fontWeight: 800, color: "#fff", letterSpacing: "0.8mm" }}>
            {data.categoryName.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── 2. Bold color strip ─────────────────────────────────────────────────── */

function BoldStrip({ data, fields }: TemplateProps) {
  return (
    <div style={{ ...BASE, width: `${A6.w}mm`, height: `${A6.h}mm` }}>
      {fields.categoryStrip && (
        <div style={{ height: "26mm", flexShrink: 0, background: data.categoryHex, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "6mm", fontWeight: 900, color: "#fff", letterSpacing: "1mm" }}>
            {data.categoryName.toUpperCase()}
          </span>
          <span style={{ fontSize: "2.6mm", color: "rgba(255,255,255,0.85)", marginTop: "1mm" }}>{data.eventName}</span>
        </div>
      )}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5mm 7mm", textAlign: "center" }}>
        {fields.name && <p style={{ margin: 0, fontSize: "8mm", fontWeight: 800, lineHeight: 1.1 }}>{data.name}</p>}
        {fields.company && data.company && (
          <p style={{ margin: "2mm 0 0", fontSize: "3.8mm", color: "#334155", fontWeight: 600 }}>{data.company}</p>
        )}
        {fields.city && <p style={{ margin: "1mm 0 0", fontSize: "2.8mm", color: "#94a3b8" }}>{data.city}</p>}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 7mm 6mm" }}>
        <div style={{ fontSize: "2.6mm", color: "#64748b" }}>
          <p style={{ margin: 0, fontFamily: "monospace", fontWeight: 700 }}>{data.badgeNo}</p>
          <p style={{ margin: "0.5mm 0 0" }}>{data.eventDates}</p>
        </div>
        {fields.qr && <Qr token={data.qrToken} sizeMm={22} />}
      </div>
      <SponsorStrip url={data.sponsorStripUrl} heightMm={12} />
    </div>
  );
}

/* ── 3. Photo left ───────────────────────────────────────────────────────── */

function PhotoLeft({ data, fields }: TemplateProps) {
  return (
    <div style={{ ...BASE, width: `${A6.w}mm`, height: `${A6.h}mm` }}>
      <div style={{ padding: "5mm 7mm 3mm", borderBottom: "0.3mm solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: 0, fontSize: "3.2mm", fontWeight: 700, color: "#2563eb" }}>{data.eventName}</p>
        <p style={{ margin: 0, fontSize: "2.4mm", color: "#94a3b8" }}>{data.eventDates}</p>
      </div>
      <div style={{ flex: 1, display: "flex", gap: "5mm", padding: "6mm 7mm", alignItems: "flex-start" }}>
        {fields.photo && <PhotoBox sizeMm={26} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          {fields.name && <p style={{ margin: 0, fontSize: "6mm", fontWeight: 800, lineHeight: 1.15 }}>{data.name}</p>}
          {data.designation && (
            <p style={{ margin: "1mm 0 0", fontSize: "3mm", color: "#64748b" }}>{data.designation}</p>
          )}
          {fields.company && data.company && (
            <p style={{ margin: "1.5mm 0 0", fontSize: "3.4mm", fontWeight: 600, color: "#334155" }}>{data.company}</p>
          )}
          {fields.city && <p style={{ margin: "0.8mm 0 0", fontSize: "2.8mm", color: "#94a3b8" }}>{data.city}</p>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 7mm 5mm" }}>
        {fields.qr ? <Qr token={data.qrToken} sizeMm={24} /> : <span />}
        <p style={{ margin: 0, fontSize: "2.8mm", fontFamily: "monospace", color: "#64748b" }}>{data.badgeNo}</p>
      </div>
      <SponsorStrip url={data.sponsorStripUrl} heightMm={11} />
      {fields.categoryStrip && (
        <div style={{ height: "10mm", flexShrink: 0, background: data.categoryHex, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "3.8mm", fontWeight: 800, color: "#fff", letterSpacing: "0.6mm" }}>
            {data.categoryName.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── 4. Minimal ──────────────────────────────────────────────────────────── */

function Minimal({ data, fields }: TemplateProps) {
  return (
    <div style={{ ...BASE, width: `${A6.w}mm`, height: `${A6.h}mm`, padding: "10mm 9mm" }}>
      <p style={{ margin: 0, fontSize: "2.8mm", color: "#94a3b8", letterSpacing: "0.5mm" }}>
        {data.eventName.toUpperCase()}
      </p>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {fields.name && (
          <p style={{ margin: 0, fontSize: "8.5mm", fontWeight: 300, lineHeight: 1.1, letterSpacing: "-0.2mm" }}>
            {data.name}
          </p>
        )}
        {fields.company && data.company && (
          <p style={{ margin: "2.5mm 0 0", fontSize: "3.4mm", color: "#475569" }}>{data.company}</p>
        )}
        {fields.city && <p style={{ margin: "1mm 0 0", fontSize: "2.8mm", color: "#94a3b8" }}>{data.city}</p>}
        {fields.categoryStrip && (
          <p style={{ margin: "4mm 0 0", fontSize: "3mm", fontWeight: 700, color: data.categoryHex, letterSpacing: "0.5mm" }}>
            {data.categoryName.toUpperCase()}
          </p>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <p style={{ margin: 0, fontSize: "2.6mm", fontFamily: "monospace", color: "#94a3b8" }}>{data.badgeNo}</p>
        {fields.qr && <Qr token={data.qrToken} sizeMm={20} />}
      </div>
    </div>
  );
}

/* ── 5. VIP gold ─────────────────────────────────────────────────────────── */

function VipGold({ data, fields }: TemplateProps) {
  return (
    <div style={{ ...BASE, width: `${A6.w}mm`, height: `${A6.h}mm`, background: "#171205", color: "#fbf3d8" }}>
      <div style={{ padding: "6mm 8mm 0", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "2.8mm", color: "#caa64b", letterSpacing: "1.2mm" }}>
          {data.eventName.toUpperCase()}
        </p>
        <div style={{ margin: "3mm auto 0", width: "26mm", height: "0.4mm", background: "linear-gradient(90deg, transparent, #caa64b, transparent)" }} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4mm 8mm", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "5mm", fontWeight: 700, color: "#caa64b", letterSpacing: "1.6mm" }}>VIP</p>
        {fields.name && (
          <p style={{ margin: "3mm 0 0", fontSize: "7mm", fontWeight: 700, lineHeight: 1.15 }}>{data.name}</p>
        )}
        {fields.company && data.company && (
          <p style={{ margin: "1.5mm 0 0", fontSize: "3.2mm", color: "#d9c690" }}>{data.company}</p>
        )}
        {fields.city && <p style={{ margin: "0.8mm 0 0", fontSize: "2.6mm", color: "#8a7a4d" }}>{data.city}</p>}
        {fields.qr && (
          <div style={{ marginTop: "4mm", border: "0.5mm solid #caa64b", padding: "1mm", background: "#fff" }}>
            <Qr token={data.qrToken} sizeMm={22} />
          </div>
        )}
        <p style={{ margin: "2mm 0 0", fontSize: "2.6mm", fontFamily: "monospace", color: "#8a7a4d" }}>{data.badgeNo}</p>
      </div>
      <div style={{ height: "8mm", flexShrink: 0, background: "linear-gradient(90deg, #8a6d1f, #caa64b, #8a6d1f)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "2.8mm", fontWeight: 700, color: "#171205", letterSpacing: "1mm" }}>ALL ACCESS</span>
      </div>
    </div>
  );
}

/* ── 6. Staff ────────────────────────────────────────────────────────────── */

function Staff({ data, fields }: TemplateProps) {
  return (
    <div style={{ ...BASE, width: `${A6.w}mm`, height: `${A6.h}mm`, background: "#0b132b", color: "#fff" }}>
      <div style={{ height: "22mm", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "repeating-linear-gradient(45deg, #f59e0b, #f59e0b 8mm, #0b132b 8mm, #0b132b 16mm)" }}>
        <span style={{ background: "#0b132b", padding: "1.5mm 5mm", fontSize: "6mm", fontWeight: 900, letterSpacing: "1.4mm" }}>
          STAFF
        </span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5mm 7mm", textAlign: "center" }}>
        {fields.name && <p style={{ margin: 0, fontSize: "7mm", fontWeight: 800, lineHeight: 1.15 }}>{data.name}</p>}
        {data.designation && (
          <p style={{ margin: "1.5mm 0 0", fontSize: "3.2mm", color: "#f59e0b", fontWeight: 700 }}>{data.designation}</p>
        )}
        {fields.company && data.company && (
          <p style={{ margin: "1mm 0 0", fontSize: "3mm", color: "#94a3b8" }}>{data.company}</p>
        )}
        {fields.qr && (
          <div style={{ marginTop: "4mm" }}>
            <Qr token={data.qrToken} sizeMm={24} />
          </div>
        )}
        <p style={{ margin: "2mm 0 0", fontSize: "2.6mm", fontFamily: "monospace", color: "#64748b" }}>{data.badgeNo}</p>
      </div>
      <div style={{ padding: "0 7mm 4mm", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "2.4mm", color: "#475569" }}>{data.eventName} · {data.eventDates}</p>
      </div>
    </div>
  );
}

/* ── 7. Exhibitor ────────────────────────────────────────────────────────── */

function ExhibitorTpl({ data, fields }: TemplateProps) {
  return (
    <div style={{ ...BASE, width: `${A6.w}mm`, height: `${A6.h}mm` }}>
      <div style={{ height: "18mm", flexShrink: 0, background: "#7c3aed", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "5mm", fontWeight: 900, color: "#fff", letterSpacing: "1mm" }}>EXHIBITOR</span>
        <span style={{ fontSize: "2.4mm", color: "rgba(255,255,255,0.8)" }}>{data.eventName}</span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5mm 7mm", textAlign: "center" }}>
        {fields.company && data.company && (
          <p style={{ margin: 0, fontSize: "5.5mm", fontWeight: 800, color: "#7c3aed", lineHeight: 1.15 }}>{data.company}</p>
        )}
        {fields.name && (
          <p style={{ margin: "2.5mm 0 0", fontSize: "6mm", fontWeight: 700, lineHeight: 1.15 }}>{data.name}</p>
        )}
        {data.designation && (
          <p style={{ margin: "1mm 0 0", fontSize: "3mm", color: "#64748b" }}>{data.designation}</p>
        )}
        {fields.qr && (
          <div style={{ marginTop: "4mm" }}>
            <Qr token={data.qrToken} sizeMm={24} />
          </div>
        )}
        <p style={{ margin: "2mm 0 0", fontSize: "2.6mm", fontFamily: "monospace", color: "#64748b" }}>{data.badgeNo}</p>
      </div>
      <SponsorStrip url={data.sponsorStripUrl} heightMm={11} />
      <div style={{ height: "7mm", flexShrink: 0, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "2.6mm", fontWeight: 700, color: "#7c3aed", letterSpacing: "0.5mm" }}>
          BOOTH ACCESS · EARLY ENTRY
        </span>
      </div>
    </div>
  );
}

/* ── 8. Thermal compact (4" × 3") ────────────────────────────────────────── */

function ThermalCompact({ data, fields }: TemplateProps) {
  return (
    <div style={{ ...BASE, width: `${THERMAL.w}mm`, height: `${THERMAL.h}mm`, flexDirection: "row" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "5mm 2mm 5mm 6mm", minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: "2.6mm", fontWeight: 700, color: "#334155", letterSpacing: "0.3mm" }}>
          {data.eventName.toUpperCase()}
        </p>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {fields.name && (
            <p style={{ margin: 0, fontSize: "6mm", fontWeight: 800, lineHeight: 1.1 }}>{data.name}</p>
          )}
          {fields.company && data.company && (
            <p style={{ margin: "1.2mm 0 0", fontSize: "3.2mm", fontWeight: 600, color: "#334155" }}>{data.company}</p>
          )}
          {fields.city && <p style={{ margin: "0.6mm 0 0", fontSize: "2.6mm", color: "#94a3b8" }}>{data.city}</p>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "2mm" }}>
          {fields.categoryStrip && (
            <span style={{ background: data.categoryHex, color: "#fff", fontSize: "2.6mm", fontWeight: 800, padding: "0.8mm 2.5mm", borderRadius: "1mm", letterSpacing: "0.3mm" }}>
              {data.categoryName.toUpperCase()}
            </span>
          )}
          <span style={{ fontSize: "2.4mm", fontFamily: "monospace", color: "#64748b" }}>{data.badgeNo}</span>
        </div>
      </div>
      {fields.qr && (
        <div style={{ display: "flex", alignItems: "center", padding: "0 5mm" }}>
          <Qr token={data.qrToken} sizeMm={30} />
        </div>
      )}
    </div>
  );
}

/* ── Registry ────────────────────────────────────────────────────────────── */

export interface BadgeTemplateDef {
  id: BadgeTemplateId;
  name: string;
  description: string;
  format: "a6" | "thermal";
  Component: (props: TemplateProps) => React.ReactNode;
}

export const BADGE_TEMPLATES: BadgeTemplateDef[] = [
  { id: "classic", name: "Classic", description: "Centered layout, bottom category strip", format: "a6", Component: Classic },
  { id: "bold_strip", name: "Bold Color Strip", description: "Category color hero band on top", format: "a6", Component: BoldStrip },
  { id: "photo_left", name: "Photo Left", description: "ID-style with photo placeholder", format: "a6", Component: PhotoLeft },
  { id: "minimal", name: "Minimal", description: "Light typography, no decoration", format: "a6", Component: Minimal },
  { id: "vip_gold", name: "VIP Gold", description: "Dark + gold, all-access footer", format: "a6", Component: VipGold },
  { id: "staff", name: "Staff", description: "High-visibility hazard band", format: "a6", Component: Staff },
  { id: "exhibitor", name: "Exhibitor", description: "Company-first, booth access footer", format: "a6", Component: ExhibitorTpl },
  { id: "thermal_compact", name: "Thermal Compact", description: "4\" × 3\" landscape for thermal printers", format: "thermal", Component: ThermalCompact },
];

export const templateById = (id: BadgeTemplateId): BadgeTemplateDef =>
  BADGE_TEMPLATES.find((t) => t.id === id) ?? BADGE_TEMPLATES[0];

/* ── Category color → hex (matches Badge tint palette, print-safe) ───────── */

export const CATEGORY_HEX: Record<string, string> = {
  primary: "#2563eb",
  secondary: "#7c3aed",
  warning: "#d97706",
  info: "#0284c7",
  danger: "#dc2626",
  success: "#059669",
  neutral: "#475569",
};
