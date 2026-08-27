"use server";

import { guard } from "@/lib/auth/guard";
import { getSignedFileUrl } from "@/lib/storage";

export type PreviewUrlState = { error: string | null; url?: string };

// Preview is never payment-gated (CLAUDE.md: "preview still allowed") — any actor already
// authorized to see this project can resolve a short-lived signed URL for it. Vault
// *download* has its own separate, gated action (see vault/actions.ts).
export async function getPreviewUrl(_prev: PreviewUrlState, formData: FormData): Promise<PreviewUrlState> {
  const projectId = String(formData.get("project_id") ?? "");
  await guard({ projectId });

  const filePath = String(formData.get("file_path") ?? "");
  if (!filePath) return { error: "No file to preview." };

  const url = await getSignedFileUrl(filePath);
  if (!url) return { error: "Could not load this file." };

  return { error: null, url };
}
