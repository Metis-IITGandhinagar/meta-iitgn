import { redirect } from "next/navigation";

// Contributions are listed on the profile page.
export default function ContributionsPage() {
  redirect("/user/profile");
}
