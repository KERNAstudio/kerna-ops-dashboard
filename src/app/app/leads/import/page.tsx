import { guard } from "@/lib/auth/guard";
import { ImportForm } from "./ImportForm";

export default async function ImportLeadsPage() {
  await guard({ permission: "LEADS_EDIT", allowClient: false });
  return <ImportForm />;
}
