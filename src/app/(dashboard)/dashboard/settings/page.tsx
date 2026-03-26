import { redirect } from "next/navigation";
import { getSettingsData } from "@/lib/actions/settings-actions";
import { SettingsClient } from "@/components/settings/settings-client";

export default async function SettingsPage() {
  const user = await getSettingsData();
  if (!user) redirect("/login");

  return <SettingsClient user={user} />;
}
