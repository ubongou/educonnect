import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getProfile } from "@/lib/auth";
import { PasswordForm } from "./PasswordForm";
import { ProfileForm } from "./ProfileForm";

export default async function SettingsPage() {
  // Layout already enforces requireParent; getProfile returns the current row.
  const profile = await getProfile();
  if (!profile) return null;

  return (
    <Container>
      <header className="mb-10">
        <Eyebrow>Account</Eyebrow>
        <h1 className="mt-2 font-heading text-[32px] font-extrabold text-navy">Settings</h1>
        <p className="mt-2 text-[14px] text-g600">
          Update your profile or change your password.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border-[1.5px] border-navy/10 bg-white p-6 md:p-8">
          <h2 className="mb-6 font-heading text-[18px] font-extrabold text-navy">
            Profile
          </h2>
          <ProfileForm
            defaultFullName={profile.full_name ?? ""}
            defaultPhone={profile.phone ?? ""}
            email={profile.email ?? ""}
          />
        </section>

        <section className="rounded-lg border-[1.5px] border-navy/10 bg-white p-6 md:p-8">
          <h2 className="mb-6 font-heading text-[18px] font-extrabold text-navy">
            Password
          </h2>
          <PasswordForm />
        </section>
      </div>
    </Container>
  );
}
