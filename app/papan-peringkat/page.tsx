import { redirect } from "next/navigation";

// Moved inside the protected dashboard scope — keep this route alive as a redirect
// so any old links/bookmarks still land somewhere sensible.
export default function PapanPeringkatRedirect() {
  redirect("/dashboard/papan-peringkat");
}
