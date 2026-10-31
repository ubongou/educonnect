import type { TestimonialsContent } from "@/lib/marketing/schemas";
import { WhatsAppQuotes } from "./WhatsAppQuotes";

export function Testimonials({ content }: { content: TestimonialsContent }) {
  return (
    <section className="testimonials" aria-labelledby="testi-heading">
      <div className="container">
        <div className="section-head">
          <div className="reveal">
            <h2 id="testi-heading" style={{ marginTop: 14 }}>
              {content.title}
            </h2>
          </div>
        </div>

        <WhatsAppQuotes quotes={content.quotes} />
      </div>
    </section>
  );
}
