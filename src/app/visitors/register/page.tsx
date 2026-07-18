"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Briefcase, CalendarRange, Lock, Printer, QrCode, Send, User, Utensils } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { OrbitLogo } from "@/components/layout/OrbitLogo";

const INPUT_CLASSES =
  "h-9 w-full rounded-lg border border-slate-200 px-3 text-sm placeholder:text-slate-400 transition focus:border-orbit-300 focus:ring-2 focus:ring-orbit-100 focus:outline-none";

const STATES = ["Delhi", "Gujarat", "Karnataka", "Kerala", "Maharashtra", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal", "Other"];
const CATEGORIES = ["Trade Visitor", "Delegate", "VIP", "Student", "Media"];
const INDUSTRIES = ["IT / Software", "Manufacturing", "Healthcare", "Education", "Government", "Media", "Retail", "Other"];

const NEXT_STEPS = [
  { icon: Send, title: "Instant QR pass", text: "Sent on WhatsApp & email immediately after registration." },
  { icon: Printer, title: "Badge on arrival", text: "Badge prints at any registration desk in under 10 seconds." },
  { icon: Utensils, title: "Food coupons linked", text: "Meal entitlements are attached to the same QR — no paper coupons." },
];

export default function VisitorRegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [category, setCategory] = useState("Trade Visitor");

  const previewName = `${firstName} ${lastName}`.trim() || "Visitor Name";

  return (
    <>
      <PageHeader
        title="Register New Visitor"
        subtitle="Dashboard · Visitors · Register"
        actions={
          <Link
            href="/visitors"
            className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600 shadow-card hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> All Visitors
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Form */}
        <Card className="xl:col-span-2">
          <CardHeader title="Visitor Details" />
          <form className="space-y-6 px-5 pb-5" noValidate>
            {/* Personal */}
            <fieldset>
              <legend className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
                <User className="h-4 w-4 text-orbit-500" /> Personal Details
              </legend>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[13px] font-medium text-slate-600">
                    First Name <span className="text-red-500">*</span>
                  </span>
                  <input className={INPUT_CLASSES} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. Arjun" required />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[13px] font-medium text-slate-600">
                    Last Name <span className="text-red-500">*</span>
                  </span>
                  <input className={INPUT_CLASSES} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="e.g. Kumar" required />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[13px] font-medium text-slate-600">
                    Mobile Number <span className="text-red-500">*</span>
                  </span>
                  <div className="flex">
                    <span className="flex h-9 items-center rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">+91</span>
                    <input className={`${INPUT_CLASSES} rounded-l-none`} type="tel" inputMode="numeric" pattern="[0-9]{10}" placeholder="10-digit mobile" required />
                  </div>
                  <span className="mt-1 block text-[11px] text-slate-400">QR pass will be sent on WhatsApp to this number.</span>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[13px] font-medium text-slate-600">Email</span>
                  <input className={INPUT_CLASSES} type="email" placeholder="name@company.com" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[13px] font-medium text-slate-600">
                    City <span className="text-red-500">*</span>
                  </span>
                  <input className={INPUT_CLASSES} placeholder="e.g. New Delhi" required />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[13px] font-medium text-slate-600">State</span>
                  <select className={INPUT_CLASSES} defaultValue="">
                    <option value="" disabled>Select</option>
                    {STATES.map((state) => <option key={state}>{state}</option>)}
                  </select>
                </label>
              </div>
            </fieldset>

            {/* Professional */}
            <fieldset className="border-t border-slate-100 pt-5">
              <legend className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
                <Briefcase className="h-4 w-4 text-orbit-500" /> Professional Details
              </legend>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="block md:col-span-1">
                  <span className="mb-1 block text-[13px] font-medium text-slate-600">Company / Organisation</span>
                  <input className={INPUT_CLASSES} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Tata Elxsi" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[13px] font-medium text-slate-600">Designation</span>
                  <input className={INPUT_CLASSES} placeholder="e.g. Manager" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[13px] font-medium text-slate-600">Industry</span>
                  <select className={INPUT_CLASSES} defaultValue="">
                    <option value="" disabled>Select</option>
                    {INDUSTRIES.map((industry) => <option key={industry}>{industry}</option>)}
                  </select>
                </label>
              </div>
            </fieldset>

            {/* Event & pass */}
            <fieldset className="border-t border-slate-100 pt-5">
              <legend className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
                <CalendarRange className="h-4 w-4 text-orbit-500" /> Event &amp; Pass
              </legend>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[13px] font-medium text-slate-600">Event</span>
                  <div className="relative">
                    <input className={`${INPUT_CLASSES} pr-9`} value="Green Bharat Expo V.2 2026" readOnly aria-readonly="true" />
                    <Lock className="absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                  <span className="mt-1 block text-[11px] text-slate-400">Event is fixed for this registration link.</span>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[13px] font-medium text-slate-600">
                    Visitor Category <span className="text-red-500">*</span>
                  </span>
                  <select className={INPUT_CLASSES} value={category} onChange={(e) => setCategory(e.target.value)}>
                    {CATEGORIES.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
                <div>
                  <span className="mb-1.5 block text-[13px] font-medium text-slate-600">Days Attending</span>
                  <div className="flex flex-wrap gap-4 pt-1">
                    {["Day 1 · 12 Nov", "Day 2 · 13 Nov", "Day 3 · 14 Nov"].map((day, index) => (
                      <label key={day} className="flex items-center gap-2 text-[13px] text-slate-600">
                        <input type="checkbox" defaultChecked={index < 2} className="h-4 w-4 rounded border-slate-300 accent-orbit-500" />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="mb-1.5 block text-[13px] font-medium text-slate-600">Food Preference</span>
                  <div className="flex flex-wrap gap-4 pt-1">
                    {["Veg", "Non-Veg", "Jain"].map((food, index) => (
                      <label key={food} className="flex items-center gap-2 text-[13px] text-slate-600">
                        <input type="radio" name="food" defaultChecked={index === 0} className="h-4 w-4 accent-orbit-500" />
                        {food}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Consent */}
            <fieldset className="space-y-2 border-t border-slate-100 pt-5">
              <label className="flex items-start gap-2 text-[13px] text-slate-600">
                <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-orbit-500" />
                <span>
                  I consent to my data being processed for event entry, safety and communication as per the{" "}
                  <Link href="#" className="text-orbit-500 hover:underline">Privacy Policy</Link> (DPDP Act 2023).{" "}
                  <span className="text-red-500">*</span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-[13px] text-slate-600">
                <input type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-orbit-500" />
                Send my entry pass and event updates on WhatsApp.
              </label>
            </fieldset>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
              <button type="submit" className="flex h-9 items-center gap-2 rounded-lg bg-orbit-500 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-orbit-600">
                <Send className="h-4 w-4" /> Register &amp; Send Pass
              </button>
              <button type="submit" className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                <Printer className="h-4 w-4" /> Register &amp; Print Badge
              </button>
              <Link href="/visitors" className="ml-auto flex h-9 items-center rounded-lg px-3.5 text-sm font-medium text-slate-500 hover:bg-slate-100">
                Cancel
              </Link>
            </div>
          </form>
        </Card>

        {/* Side column */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Pass Preview" />
            <div className="px-5 pb-5">
              <div className="rounded-xl border border-dashed border-orbit-200 bg-orbit-50/30 p-4 text-center">
                <div className="mb-3 flex items-center justify-center gap-2">
                  <OrbitLogo size={20} />
                  <span className="font-display text-sm font-bold tracking-wide text-orbit-900">
                    ORBIT<span className="text-orbit-500">.</span>
                  </span>
                </div>
                <p className="text-[11px] tracking-wide text-slate-400 uppercase">Green Bharat Expo V.2 2026</p>
                <p className="mt-2 font-display text-lg font-semibold text-orbit-900">{previewName}</p>
                <p className="mb-3 text-[12px] text-slate-400">{company || "Company"}</p>
                <QrCode className="mx-auto h-20 w-20 text-orbit-900" aria-label="QR code placeholder" />
                <p className="mt-2 mb-3 text-[11px] text-slate-400">OV26XXXXX</p>
                <div className="rounded-b-lg bg-orbit-500 py-2 text-[12px] font-semibold tracking-widest text-white uppercase">
                  {category}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="What Happens Next" />
            <ul className="space-y-3.5 px-5 pb-5">
              {NEXT_STEPS.map((step) => (
                <li key={step.title} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orbit-50 text-orbit-500">
                    <step.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-slate-800">{step.title}</p>
                    <p className="text-[12px] text-slate-400">{step.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
