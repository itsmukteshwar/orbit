import { redirect } from "next/navigation";

/** The ERP has no public landing page yet — send users to the primary dashboard. */
export default function RootPage() {
  redirect("/dashboard/super-admin");
}
