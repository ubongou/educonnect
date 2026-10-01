"use client";

import { trackEvent } from "@/lib/analytics";
import { defaultGlobals } from "@/lib/marketing/defaults";

/**
 * Floating WhatsApp button on every marketing page. Most Masani parents live
 * on WhatsApp, so this is the shortest path from a question to a conversation.
 * Plain link and inline SVG: no third party script, no effect on load time.
 */
export function WhatsAppButton() {
  const text = encodeURIComponent("Hi Masani, I'd like to ask about tutoring for my child.");
  return (
    <a
      href={`https://wa.me/${defaultGlobals.whatsappNumber}?text=${text}`}
      className="wa-float"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Masani on WhatsApp"
      onClick={() => trackEvent("click_whatsapp", { source: "floating_button" })}
    >
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M16.04 3C9.4 3 4 8.36 4 14.97c0 2.11.56 4.17 1.62 5.99L4 29l8.23-2.15a12.1 12.1 0 0 0 3.8.61h.01C22.68 27.46 28 22.1 28 15.49 28 8.88 22.68 3 16.04 3Zm0 22.4h-.01a10 10 0 0 1-5.1-1.4l-.37-.22-4.88 1.27 1.3-4.76-.24-.39a9.87 9.87 0 0 1-1.53-5.33c0-5.47 4.47-9.92 9.97-9.92 5.48 0 9.94 4.62 9.94 10.09 0 5.48-4.46 10.66-9.08 10.66Zm5.46-7.43c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.68-1.63-.93-2.23-.24-.58-.49-.5-.68-.51h-.58c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.27.49 1.7.63.71.23 1.36.2 1.88.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z"
        />
      </svg>
    </a>
  );
}
