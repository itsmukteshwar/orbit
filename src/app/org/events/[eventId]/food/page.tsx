import { redirect } from "next/navigation";

/** Event food = the canon Food Coupons page (kept reachable per P-06). */
export default function EventFoodPage() {
  redirect("/onsite/food-coupons");
}
