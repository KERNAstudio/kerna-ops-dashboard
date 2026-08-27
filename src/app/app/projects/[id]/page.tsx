import { redirect } from "next/navigation";

// §4: "/app/projects/:id/overview|modules|timeline|payments|vault|credentials|settings
// default landing → /overview"
export default async function ProjectRootPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/app/projects/${id}/overview`);
}
