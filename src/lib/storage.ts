import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "project-files";

// Private bucket (no public policies) — every access goes through the service-role admin
// client after guard() has already authorized the request, same pattern as the rest of the
// app. Files aren't served by a static public URL: preview/download always resolve a
// short-lived signed URL, so the payment gate (CLAUDE.md non-negotiable) is enforced at the
// file layer too, not just by hiding a button in the UI.
export async function uploadProjectFile(path: string, file: File): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
}

// module_versions.file_url / resources.file_url predate Storage and may hold a plain
// https:// URL from before this migration — those pass through unchanged rather than being
// treated as a storage path.
export async function getSignedFileUrl(pathOrUrl: string, expiresInSeconds = 300): Promise<string | null> {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(pathOrUrl, expiresInSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function deleteProjectFile(pathOrUrl: string): Promise<void> {
  if (/^https?:\/\//i.test(pathOrUrl)) return; // legacy external URL — nothing to delete
  const admin = createAdminClient();
  await admin.storage.from(BUCKET).remove([pathOrUrl]);
}
