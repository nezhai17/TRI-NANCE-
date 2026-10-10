import { getCurrentUser } from '@/lib/auth';
import { SettingsView } from '@/components/settings/SettingsView';

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-6">
      <SettingsView user={user} />
    </div>
  );
}
