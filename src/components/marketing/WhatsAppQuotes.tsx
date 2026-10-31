import type { TestimonialQuote } from "@/lib/marketing/schemas";

function WhatsAppIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill={color}
        d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 1.8a8.2 8.2 0 1 1-4.2 15.3l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8zm-3 4.4c-.2 0-.5 0-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.2 5 4.4 2.5 1 3 .8 3.5.7.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4l-.5-.3-1.9-.9c-.3-.1-.4-.1-.6.1l-.8 1c-.2.2-.3.2-.6.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.5l-.9-2c-.2-.5-.4-.4-.6-.4z"
      />
    </svg>
  );
}

/**
 * Parent testimonials shown as WhatsApp-style chats (dark mode), which is
 * where they were sent. The bubbles are real text, not screenshots, so they
 * stay sharp and searchable. Cards flow in columns, each only as tall as its
 * message.
 */
export function WhatsAppQuotes({ quotes }: { quotes: TestimonialQuote[] }) {
  return (
    <>
      <div className="wa-grid">
        {quotes.map((q) => (
          <figure key={`${q.author}-${q.body.slice(0, 24)}`} className="wa-card">
            <figcaption className="wa-top">
              <span className="wa-av" aria-hidden="true">
                {q.initial}
              </span>
              <span>
                <span className="wa-who">{q.author}</span>
                <span className="wa-where">{q.where}</span>
              </span>
              <span className="wa-ic">
                <WhatsAppIcon color="#25d366" />
              </span>
            </figcaption>
            <div className="wa-body">
              <blockquote className="wa-bubble">{q.body}</blockquote>
            </div>
          </figure>
        ))}
      </div>
      <p className="wa-foot">
        <WhatsAppIcon color="#1d9e75" />
        Real messages parents sent us on WhatsApp, shared with their permission.
      </p>
    </>
  );
}
