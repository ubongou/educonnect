import { BrandLogo } from "@/components/ui/BrandLogo";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-yellow bg-[url('/hero-doodles.svg')] bg-repeat [background-size:480px_480px] px-6 text-navy">
      <BrandLogo mode="on-yellow" size="lg" />
      <h1 className="font-heading text-[clamp(40px,8vw,88px)] font-extrabold leading-none">
        Coming soon
      </h1>
    </main>
  );
}
