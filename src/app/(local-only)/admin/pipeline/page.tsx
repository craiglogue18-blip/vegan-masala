import { redirect } from "next/navigation";

/** Retains old bookmarks while the former standalone pipeline now lives in Recipe Studio. */
export default function LegacyPipelinePage() {
  redirect("/admin/import#recipe-pipeline");
}
