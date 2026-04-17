import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { IntersectionFade } from "@/components/ui/IntersectionFade";

export default function Home() {
  return (
    <>
      <Nav mode="marketing" />
      <main className="bg-yellow bg-dot-navy py-20">
        <Container>
          <IntersectionFade>
            <Eyebrow>UI Primitives Preview</Eyebrow>
            <h1 className="font-heading text-5xl font-extrabold text-navy">
              Theme system check
            </h1>
            <p className="mt-4 max-w-lg text-g600">
              Nav, Footer, Button, Container, Eyebrow, SectionHeader, Card, IntersectionFade all
              wired up. Form primitives (FormField, ChipGroup, BatteryBars) ready for use in the
              intake and report forms.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="#demo" size="lg">Primary CTA</Button>
              <Button href="#demo" size="lg" variant="outline">Outline CTA</Button>
            </div>
          </IntersectionFade>
        </Container>
      </main>
      <section className="bg-navy bg-dot-blue py-20">
        <Container>
          <SectionHeader
            eyebrow="Why EduConnect"
            title="Card variants"
            subtitle="Three card looks for different sections of the app."
            light
          />
          <div className="grid gap-5 md:grid-cols-3">
            <Card variant="dark-yellow-border">
              <h3 className="font-heading text-yellow text-base font-extrabold">Exceptional Teachers</h3>
              <p className="mt-4 text-white/70 text-sm leading-relaxed">
                Yellow-border dark card — used for the &ldquo;why&rdquo; grid on the marketing home.
              </p>
            </Card>
            <Card variant="light">
              <h3 className="font-heading text-navy text-base font-extrabold">Light card</h3>
              <p className="mt-4 text-g600 text-sm leading-relaxed">
                Used for testimonials and dashboard cards on parent/admin views.
              </p>
            </Card>
            <Card variant="dark">
              <h3 className="font-heading text-white text-base font-extrabold">Dark card</h3>
              <p className="mt-4 text-white/70 text-sm leading-relaxed">
                Used for the About / Founders section.
              </p>
            </Card>
          </div>
        </Container>
      </section>
      <Footer mode="marketing" />
    </>
  );
}
