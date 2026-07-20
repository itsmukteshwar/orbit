"use client";

/**
 * P-29 demo — /styleguide/forms
 * Renders 3 sample FormSchemas through the real FormRenderer, including
 * edge cases: conditionals, GSTIN, file constraints, radio/checkbox.
 */

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { FormRenderer } from "@/components/form/FormRenderer";
import { toastSuccess } from "@/components/kit/toast";
import type { FormSchema } from "@/lib/formSchema";

const SIMPLE: FormSchema = {
  id: "demo_simple",
  name: "Simple Visitor",
  version: 1,
  consentText: "I agree to receive event updates on WhatsApp and accept the privacy policy.",
  fields: [
    { key: "first_name", label: "First Name", type: "text", required: true, placeholder: "Asha" },
    { key: "last_name", label: "Last Name", type: "text", required: true, placeholder: "Patel" },
    { key: "mobile", label: "Mobile Number", type: "phone", required: true },
    { key: "email", label: "Email", type: "email", required: false, help: "Pass will also be emailed here" },
  ],
};

const CONDITIONAL: FormSchema = {
  id: "demo_conditional",
  name: "Delegate with Conditionals",
  version: 1,
  consentText: "I consent to my data being shared with event sponsors.",
  fields: [
    { key: "full_name", label: "Full Name", type: "text", required: true },
    { key: "mobile", label: "Mobile", type: "phone", required: true },
    {
      key: "attendee_type",
      label: "Attendee Type",
      type: "radio",
      required: true,
      options: ["Individual", "Company"],
    },
    {
      key: "company_name",
      label: "Company Name",
      type: "text",
      required: true,
      condition: { showIf: "attendee_type", equals: "Company" },
    },
    {
      key: "gstin",
      label: "GSTIN (for invoice)",
      type: "text",
      required: false,
      gstin: true,
      help: "Optional — checksum validated",
      condition: { showIf: "attendee_type", equals: "Company" },
    },
    {
      key: "meal_pref",
      label: "Meal Preference",
      type: "select",
      required: true,
      options: ["Veg", "Non-veg", "Jain"],
    },
  ],
};

const KITCHEN_SINK: FormSchema = {
  id: "demo_kitchen",
  name: "All 8 Field Types",
  version: 1,
  consentText: "I have read and accept the terms & conditions and privacy policy of the organiser.",
  fields: [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "email", label: "Email", type: "email", required: true },
    { key: "phone", label: "Phone", type: "phone", required: true },
    { key: "city", label: "City", type: "select", required: true, options: ["Mumbai", "Delhi", "Bengaluru", "Chennai"] },
    { key: "gender", label: "Gender", type: "radio", required: false, options: ["Male", "Female", "Other"] },
    { key: "newsletter", label: "Newsletter", type: "checkbox", required: false, placeholder: "Send me the monthly digest" },
    { key: "dob", label: "Date of Birth", type: "date", required: false },
    {
      key: "id_proof",
      label: "ID Proof",
      type: "file",
      required: true,
      help: "Aadhaar / PAN / Passport",
      file: { maxSizeMb: 2, accept: ["image/jpeg", "image/png", ".pdf"] },
    },
  ],
};

const SCHEMAS = [SIMPLE, CONDITIONAL, KITCHEN_SINK];

export default function FormsDemoPage() {
  const [lastSubmit, setLastSubmit] = useState<string | null>(null);

  return (
    <>
      <PageHeader
        title="FormRenderer Demo"
        breadcrumbs={[{ label: "Styleguide", href: "/styleguide" }, { label: "Forms" }]}
        subtitle="3 sample schemas rendered by the production FormRenderer — the builder preview uses this exact component"
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {SCHEMAS.map((schema) => (
          <Card key={schema.id} className="self-start">
            <CardHeader title={schema.name} subtitle={`${schema.fields.length} fields · v${schema.version}`} />
            <div className="px-5 pb-5">
              <FormRenderer
                schema={schema}
                submitLabel="Register"
                onSubmit={(values) => {
                  setLastSubmit(JSON.stringify(values, (k, v) => (v instanceof File ? `File(${v.name})` : v), 2));
                  toastSuccess(`${schema.name} submitted — payload logged below`);
                }}
              />
            </div>
          </Card>
        ))}
      </div>

      {lastSubmit && (
        <Card className="p-5">
          <p className="mb-2 text-[13px] font-semibold text-slate-700">Last submitted payload</p>
          <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-[12px] leading-relaxed text-emerald-300">
            {lastSubmit}
          </pre>
        </Card>
      )}
    </>
  );
}
