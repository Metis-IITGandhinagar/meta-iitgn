import { redirect } from "next/navigation";

// /wiki has no page of its own; send readers to the category index.
export default function WikiIndex() {
  redirect("/wiki/categories");
}
