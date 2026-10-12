import type { Metadata } from "next";
import { PasswordForm, ProfileForm } from "@/components/profile/profile-forms";
import { requireClinicUser } from "@/lib/dal";
import { roleLabels } from "@/lib/labels";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function ProfilePage() {
  const me = await requireClinicUser();
  return (
    <div className="w-full space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi perfil</h1>
        <p className="text-sm text-muted">{me.clinic.name}</p>
      </div>
      <ProfileForm fullName={me.fullName} email={me.email} role={roleLabels[me.role]} />
      <PasswordForm />
    </div>
  );
}
