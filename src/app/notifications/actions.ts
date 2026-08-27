"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationFormState = { error: string | null };

export async function markNotificationRead(_prev: NotificationFormState, formData: FormData): Promise<NotificationFormState> {
  const actor = await guard();
  if (actor.type !== "staff") redirect("/403");

  const notificationId = String(formData.get("notification_id") ?? "");
  const admin = createAdminClient();
  await admin.from("notifications").update({ read: true }).eq("id", notificationId).eq("user_id", actor.id);

  revalidatePath("/", "layout");
  return { error: null };
}

export async function markAllNotificationsRead(_prev: NotificationFormState, _formData: FormData): Promise<NotificationFormState> {
  const actor = await guard();
  if (actor.type !== "staff") redirect("/403");

  const admin = createAdminClient();
  await admin.from("notifications").update({ read: true }).eq("user_id", actor.id).eq("read", false);

  revalidatePath("/", "layout");
  return { error: null };
}
