"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import clsx from "clsx";
import {
  curriculumLabel,
  curriculumValues,
  performanceLabel,
  performanceValues,
  subjectLabel,
  subjectValues,
} from "@/lib/booking/schema";
import {
  submitBookingRequest,
  type SubmitBookingRequestState,
} from "@/lib/actions/booking";
import { trackEvent } from "@/lib/analytics";

export type BookingFormProps = {
  /** Attribution label passed through to the admin email (see sourceLabels). */
  source: string;
  /**
   * Post-submit behaviour. "redirect" (default) navigates to /book/thanks.
   * "inline" keeps the visitor on-page and fires `onSuccess` instead — the
   * DB insert + email are identical either way.
   */
  afterSubmit?: "redirect" | "inline";
  /** Called once the submission succeeds in "inline" mode. */
  onSuccess?: () => void;
  eyebrow?: string;
  heading?: string;
  lead?: string;
  submitLabel?: string;
  /** Short reassurance line rendered above the submit button. */
  reassurance?: ReactNode;
  /** Drop the outer <section class="contact"> chrome (e.g. inside a modal). */
  bare?: boolean;
};

export function BookingForm({
  source,
  afterSubmit = "redirect",
  onSuccess,
  eyebrow = "Book a free consultation",
  heading = "Tell us about your child",
  lead = "This takes less than 2 minutes. We'll reach out within 24 hours to confirm your session.",
  submitLabel = "Book free trial",
  reassurance,
  bare = false,
}: BookingFormProps) {
  const [state, formAction, pending] = useActionState<
    SubmitBookingRequestState,
    FormData
  >(submitBookingRequest, null);

  const errs = state?.status === "error" ? state.fieldErrors : {};
  const values =
    state?.status === "error"
      ? state.values
      : ({} as Record<string, string>);

  const formRef = useRef<HTMLFormElement>(null);

  // Inline mode: hand control back to the caller once the server confirms.
  const succeeded = state?.status === "success";
  useEffect(() => {
    if (succeeded) onSuccess?.();
  }, [succeeded, onSuccess]);

  // After a failed submit, jump to the first errored field so the user can
  // see what to fix. We re-scroll on every error state change (each action
  // call produces a fresh state object, so the dep comparison holds).
  useEffect(() => {
    if (state?.status !== "error") return;
    if (Object.keys(state.fieldErrors).length === 0) return;
    const formEl = formRef.current;
    if (!formEl) return;
    const firstErr = formEl.querySelector<HTMLElement>(".field.error");
    if (!firstErr) return;
    firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable = firstErr.querySelector<HTMLElement>(
      "input, textarea, select",
    );
    focusable?.focus({ preventScroll: true });
  }, [state]);

  const Wrapper = bare ? "div" : "section";

  return (
    <Wrapper
      className={bare ? "booking-embed" : "contact"}
      aria-labelledby="booking-heading"
    >
      <div className={bare ? undefined : "container"}>
        <span className="eyebrow" style={{ marginBottom: 18 }}>
          {eyebrow}
        </span>
        <h1 id="booking-heading" style={{ marginTop: 14 }}>
          {heading}
        </h1>
        <p className="lead">{lead}</p>

        <form
          ref={formRef}
          action={formAction}
          className="contact-form booking-form"
          aria-label="Booking request form"
          noValidate
          style={{ display: "block", marginTop: 32 }}
          onSubmit={() => trackEvent("booking_form_submit", { source })}
        >
          <input type="hidden" name="source" value={source} />
          <input type="hidden" name="after_submit" value={afterSubmit} />
          <input
            type="text"
            name="_hp"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "-10000px",
              width: 1,
              height: 1,
              opacity: 0,
            }}
          />

          <FormSection legend="Child's information">
            <Field
              label="Full name"
              name="child_name"
              defaultValue={values.child_name}
              error={errs.child_name}
              autoComplete="off"
              required
            />
            <Field
              label="Age"
              name="child_age"
              type="number"
              min={3}
              max={19}
              defaultValue={values.child_age}
              error={errs.child_age}
              required
            />
            <Field
              label="Class / grade level"
              name="child_grade"
              hint="e.g. Year 4, JSS2, Grade 6"
              defaultValue={values.child_grade}
              error={errs.child_grade}
              required
            />
          </FormSection>

          <FormSection legend="School curriculum" required>
            <RadioGroup
              name="curriculum"
              options={curriculumValues.map(
                (v) => [v, curriculumLabel[v]] as const,
              )}
              defaultValue={values.curriculum}
              error={errs.curriculum}
            />
            <Field
              label="If Other, please specify"
              name="curriculum_other"
              defaultValue={values.curriculum_other}
              error={errs.curriculum_other}
            />
          </FormSection>

          <FormSection legend="Subject for trial session" required>
            <p
              className="hint"
              style={{ fontSize: 13, color: "#6b7680", marginBottom: 8 }}
            >
              Which subject would you like your child to try?
            </p>
            <RadioGroup
              name="subject"
              options={subjectValues.map(
                (v) => [v, subjectLabel[v]] as const,
              )}
              defaultValue={values.subject}
              error={errs.subject}
            />
          </FormSection>

          <FormSection legend="Learning needs">
            <Field
              label="What would you like us to help your child with?"
              name="learning_needs"
              hint="e.g. improve reading, struggling with fractions, exam prep, confidence in speaking English."
              as="textarea"
              defaultValue={values.learning_needs}
              error={errs.learning_needs}
              required
            />
          </FormSection>

          <FormSection legend="Current performance" required>
            <p
              className="hint"
              style={{ fontSize: 13, color: "#6b7680", marginBottom: 8 }}
            >
              How is your child currently performing in this subject?
            </p>
            <RadioGroup
              name="current_performance"
              options={performanceValues.map(
                (v) => [v, performanceLabel[v]] as const,
              )}
              defaultValue={values.current_performance}
              error={errs.current_performance}
            />
          </FormSection>

          <FormSection legend="Areas of concern">
            <Field
              label="Anything specific you're worried about? (optional)"
              name="concerns"
              as="textarea"
              defaultValue={values.concerns}
              error={errs.concerns}
            />
          </FormSection>

          <FormSection legend="Parent / guardian information">
            <Field
              label="Full name"
              name="parent_name"
              autoComplete="name"
              defaultValue={values.parent_name}
              error={errs.parent_name}
              required
            />
            <Field
              label="Phone number (WhatsApp preferred)"
              name="parent_phone"
              type="tel"
              autoComplete="tel"
              hint="Include country code, e.g. +44 801 234 5678"
              defaultValue={values.parent_phone}
              error={errs.parent_phone}
              required
            />
            <Field
              label="Email address"
              name="parent_email"
              type="email"
              autoComplete="email"
              defaultValue={values.parent_email}
              error={errs.parent_email}
              required
            />
          </FormSection>

          {state?.status === "error" && state.formError && (
            <div
              role="alert"
              style={{
                background: "#fdecea",
                border: "1px solid #f5b7b1",
                color: "#a83a2a",
                padding: 12,
                borderRadius: 8,
                marginTop: 16,
              }}
            >
              {state.formError}
            </div>
          )}

          {reassurance && (
            <p
              className="booking-reassurance"
              style={{
                fontSize: 13,
                color: "#6b7680",
                marginTop: 20,
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                lineHeight: 1.5,
              }}
            >
              {reassurance}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-coral"
            disabled={pending}
            style={{ marginTop: reassurance ? 12 : 24 }}
          >
            {pending ? "Submitting…" : submitLabel}
          </button>
        </form>
      </div>
    </Wrapper>
  );
}

// -----------------------------------------------------------------------------
// Local UI primitives — kept in this file because they're booking-specific.
// -----------------------------------------------------------------------------

function FormSection({
  legend,
  required,
  children,
}: {
  legend: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <fieldset
      style={{
        border: "none",
        padding: 0,
        margin: "0 0 28px",
      }}
    >
      <legend
        style={{
          fontWeight: 700,
          fontSize: 15,
          marginBottom: 12,
          color: "#04131C",
        }}
      >
        {legend}
        {required && " *"}
      </legend>
      {children}
    </fieldset>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  as?: "input" | "textarea";
  hint?: string;
  required?: boolean;
  defaultValue?: string;
  error?: string;
  min?: number;
  max?: number;
  autoComplete?: string;
};

function Field(p: FieldProps) {
  const id = `f-${p.name}`;
  const errId = p.error ? `err-${p.name}` : undefined;
  const hintId = p.hint && !p.error ? `hint-${p.name}` : undefined;
  const describedBy = errId ?? hintId;

  return (
    <div className={clsx("field", p.error && "error")}>
      <label htmlFor={id}>
        {p.label}
        {p.required && " *"}
      </label>
      {p.as === "textarea" ? (
        <textarea
          id={id}
          name={p.name}
          defaultValue={p.defaultValue ?? ""}
          required={p.required}
          aria-required={p.required ? true : undefined}
          aria-invalid={p.error ? true : undefined}
          aria-describedby={describedBy}
        />
      ) : (
        <input
          id={id}
          name={p.name}
          type={p.type ?? "text"}
          defaultValue={p.defaultValue ?? ""}
          required={p.required}
          autoComplete={p.autoComplete}
          min={p.min}
          max={p.max}
          aria-required={p.required ? true : undefined}
          aria-invalid={p.error ? true : undefined}
          aria-describedby={describedBy}
        />
      )}
      {hintId && (
        <div
          id={hintId}
          className="hint"
          style={{ fontSize: 12, color: "#6b7680", marginTop: 4 }}
        >
          {p.hint}
        </div>
      )}
      {errId && (
        <div className="err" id={errId} role="alert">
          {p.error}
        </div>
      )}
    </div>
  );
}

function RadioGroup({
  name,
  options,
  defaultValue,
  error,
}: {
  name: string;
  options: ReadonlyArray<readonly [string, string]>;
  defaultValue?: string;
  error?: string;
}) {
  return (
    <div className={clsx("field", error && "error")}>
      <div
        role="radiogroup"
        aria-label={name}
        style={{ display: "flex", flexWrap: "wrap", gap: 12 }}
      >
        {options.map(([value, label]) => (
          <label
            key={value}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              border: "1.5px solid #e8e3d6",
              borderRadius: 999,
              cursor: "pointer",
              background: "#fff",
              fontSize: 14,
            }}
          >
            <input
              type="radio"
              name={name}
              value={value}
              defaultChecked={defaultValue === value}
              required
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
      {error && (
        <div className="err" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
