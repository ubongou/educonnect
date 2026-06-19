import type { TestimonialsContent } from "@/lib/marketing/schemas";

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

        <div className="testi-grid">
          {content.quotes.map((q, i) => (
            <article
              key={i}
              className={`testi reveal${i > 0 ? ` delay-${i}` : ""}`}
            >
              <div className="quote-mark" aria-hidden="true">
                &ldquo;
              </div>
              <blockquote>{q.body}</blockquote>
              <div className="by">
                <div className="av" aria-hidden="true">
                  {q.initial}
                </div>
                <div>
                  <div className="who">{q.author}</div>
                  <div className="where">{q.where}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
