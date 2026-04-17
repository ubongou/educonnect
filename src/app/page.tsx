export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-yellow bg-dot-navy">
      <h1 className="font-heading text-6xl font-extrabold text-navy">EduConnect</h1>
      <div className="flex flex-wrap gap-3 justify-center px-6">
        <span className="rounded-pill border-2 border-navy bg-coral px-6 py-3 font-heading font-bold text-white">
          Coral
        </span>
        <span className="rounded-pill border-2 border-navy bg-blue px-6 py-3 font-heading font-bold text-navy">
          Blue
        </span>
        <span className="rounded-pill border-2 border-navy bg-white px-6 py-3 font-heading font-bold text-navy">
          Outline
        </span>
        <span className="rounded-pill border-2 border-navy bg-cyan px-6 py-3 font-heading font-bold text-navy">
          Cyan
        </span>
      </div>
      <p className="font-sans text-g600 max-w-md text-center">
        Theme tokens wired up: navy, blue, yellow, coral, cyan; Nunito heading + Nunito Sans body;
        pill radius; dot pattern.
      </p>
    </main>
  );
}
