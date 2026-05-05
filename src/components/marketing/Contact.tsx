"use client";

import { useState, useTransition, type FormEvent } from "react";
import clsx from "clsx";
import { submitContactMessage } from "@/lib/actions/contact";
import type { ContactContent } from "@/lib/marketing/schemas";

type FieldKey = "name" | "email" | "subject" | "message";

const validators: Record<FieldKey, (v: string) => boolean> = {
  name: (v) => v.trim().length >= 2,
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  subject: (v) => v.trim().length >= 2,
  message: (v) => v.trim().length >= 5,
};

type Errors = Partial<Record<FieldKey, boolean>>;

export function Contact({ content }: { content: ContactContent }) {
  const [errors, setErrors] = useState<Errors>({});
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function clearError(field: FieldKey, value: string) {
    if (validators[field](value) && errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    const next: Errors = {};
    let firstInvalid: HTMLInputElement | HTMLTextAreaElement | null = null;

    (["name", "email", "subject", "message"] as FieldKey[]).forEach((k) => {
      const value = String(data.get(k) ?? "");
      if (!validators[k](value)) {
        next[k] = true;
        if (!firstInvalid) {
          firstInvalid = form.querySelector<
            HTMLInputElement | HTMLTextAreaElement
          >(`[name="${k}"]`);
        }
      }
    });

    setErrors(next);
    if (Object.keys(next).length > 0) {
      (firstInvalid as HTMLInputElement | HTMLTextAreaElement | null)?.focus();
      return;
    }

    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      subject: String(data.get("subject") ?? ""),
      message: String(data.get("message") ?? ""),
    };

    startTransition(async () => {
      const result = await submitContactMessage(payload);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      setSuccess(true);
      form.reset();
      window.setTimeout(() => setSuccess(false), 6000);
    });
  }

  return (
    <section className="contact" id="contact" aria-labelledby="contact-heading">
      <div className="container contact-grid">
        <div className="reveal">
          <span className="eyebrow" style={{ marginBottom: 18 }}>
            {content.eyebrow}
          </span>
          <h2 id="contact-heading" style={{ marginTop: 14 }}>
            {content.title}
          </h2>
          <p className="lead">{content.lead}</p>
          <div className="contact-meta">
            <a href={`mailto:${content.email}`}>
              <span className="ico" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </span>
              {content.email}
            </a>
            {content.instagramUrl && (
              <a
                href={content.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="ico" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle
                      cx="17.5"
                      cy="6.5"
                      r="1"
                      fill="currentColor"
                      stroke="none"
                    />
                  </svg>
                </span>
                {content.instagramLabel}
              </a>
            )}
            {content.facebookUrl && (
              <a
                href={content.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="ico" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </span>
                {content.facebookLabel}
              </a>
            )}
            {content.whatsappUrl && (
              <a
                href={content.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="ico" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                </span>
                {content.whatsappLabel || "WhatsApp"}
              </a>
            )}
          </div>
        </div>

        <form
          className="contact-form reveal delay-1"
          aria-label="Contact form"
          noValidate
          onSubmit={onSubmit}
        >
          <div className={clsx("field", errors.name && "error")}>
            <label htmlFor="f-name">Your name</label>
            <input
              type="text"
              id="f-name"
              name="name"
              required
              autoComplete="name"
              aria-required="true"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby="err-name"
              onInput={(e) => clearError("name", e.currentTarget.value)}
            />
            <div className="err" id="err-name" role="alert">
              Please enter your name (at least 2 characters).
            </div>
          </div>
          <div className={clsx("field", errors.email && "error")}>
            <label htmlFor="f-email">Email address</label>
            <input
              type="email"
              id="f-email"
              name="email"
              required
              autoComplete="email"
              aria-required="true"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby="err-email"
              onInput={(e) => clearError("email", e.currentTarget.value)}
            />
            <div className="err" id="err-email" role="alert">
              Please enter a valid email address.
            </div>
          </div>
          <div className={clsx("field", errors.subject && "error")}>
            <label htmlFor="f-subject">Subject</label>
            <input
              type="text"
              id="f-subject"
              name="subject"
              required
              autoComplete="off"
              aria-required="true"
              aria-invalid={errors.subject ? true : undefined}
              aria-describedby="err-subject"
              onInput={(e) => clearError("subject", e.currentTarget.value)}
            />
            <div className="err" id="err-subject" role="alert">
              Please add a subject.
            </div>
          </div>
          <div className={clsx("field", errors.message && "error")}>
            <label htmlFor="f-message">Message</label>
            <textarea
              id="f-message"
              name="message"
              required
              aria-required="true"
              aria-invalid={errors.message ? true : undefined}
              aria-describedby="err-message"
              onInput={(e) => clearError("message", e.currentTarget.value)}
            />
            <div className="err" id="err-message" role="alert">
              Please write a short message (at least 5 characters).
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-coral"
            disabled={pending}
          >
            {pending ? "Sending…" : "Send message"}{" "}
            <span className="arrow" aria-hidden="true">
              →
            </span>
          </button>
          {serverError && (
            <div
              className="form-success show"
              role="alert"
              aria-live="assertive"
              style={{
                background: "#fdecea",
                borderColor: "#f5b7b1",
                color: "#a83a2a",
              }}
            >
              Sorry — we couldn&apos;t send your message. {serverError}
            </div>
          )}
          <div
            className={clsx("form-success", success && "show")}
            role="status"
            aria-live="polite"
          >
            Thanks — your message is on its way. We&apos;ll get back to you
            within 24 hours.
          </div>
        </form>
      </div>
    </section>
  );
}
