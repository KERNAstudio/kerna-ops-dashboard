import { redirect } from "next/navigation";
import { guard } from "@/lib/auth/guard";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const actor = await guard();
  if (actor.type !== "staff") redirect("/app/dashboard");

  return <ProfileForm name={actor.name} email={actor.email} roles={actor.roles} />;
}
