"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import clsx from "clsx";
import {
  ageRangeValues,
  ageRangeLabel,
  schoolLevelValues,
  schoolLevelLabel,
  tutoredBeforeValues,
  tutoredBeforeLabel,
  timelineValues,
  timelineLabel,
  strategySubjectValues,
  strategySubjectLabel,
  type StrategySubject,
} from "@/lib/strategy/schema";
import { COUNTRIES } from "@/lib/strategy/countries";
import {
  submitStrategyLead,
  type SubmitStrategyLeadState,
} from "@/lib/actions/strategyLead";
import { trackEvent } from "@/lib/analytics";

export type StrategyLeadFormProps = {
  /** Attribution label passed through to Sheets/Zoho (see sourceLabels). */
  source: string;
  /** Called once the submission succeeds (modal reveals the calendar). */
  onSuccess?: () => void;
  heading?: string;
  lead?: string;
  submitLabel?: string;
  /** Short reassurance line rendered above the submit button. */
  reassurance?: ReactNode;
};

export function StrategyLeadForm({
  source,
  onSuccess,
  heading = "Tell us about your child",
  lead = "Two minutes now. Next, you'll pick a time that works for your family.",
  submitLabel = "Book Your FREE Strategy Session",
  reassurance,
}: StrategyLeadFormProps) {
  const [state, formAction, pending] = useActionState<
    SubmitStrategyLeadState,
    FormData
  >(submitStrategyLead, null);

  const errs = state?.status === "error" ? state.fieldErrors : {};
  const values =
    state?.status === "error" ? state.values : ({} as Record<string, string>);

  const formRef = useRef<HTMLFormElement>(null);

  // Subjects multi-select + the conditional "Other" specify box live in React
  // state so they persist across server-action re-renders (the server only
  // echoes scalar values back).
  const [subjects, setSubjects] = useState<StrategySubject[]>([]);
  const toggleSubject = (value: StrategySubject) =>
    setSubjects((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value],
    );

  // Hand control back to the caller once the server confirms.
  const succeeded = state?.status === "success";
  useEffect(() => {
    if (succeeded) onSuccess?.();
  }, [succeeded, onSuccess]);

  // After a failed submit, jump to the first errored field.
  useEffect(() => {
    if (state?.status !== "error") return;
    if (Object.keys(state.fieldErrors).length === 0) return;
    const formEl = formRef.current;
    if (!formEl) return;
    const firstErr = formEl.querySelector<HTMLElement>(".field.error");
    if (!firstErr) return;
    firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
    firstErr
      .querySelector<HTMLElement>("input, textarea, select")
      ?.focus({ preventScroll: true });
  }, [state]);

  return (
    <div className="booking-embed" aria-labelledby="strategy-heading">
      <h1 id="strategy-heading" style={{ marginTop: 14 }}>
        {heading}
      </h1>
      <p className="lead">{lead}</p>

      <form
        ref={formRef}
        action={formAction}
        className="contact-form booking-form"
        aria-label="Strategy session request form"
        noValidate
        style={{ display: "block", marginTop: 32 }}
        onSubmit={() => trackEvent("booking_form_submit", { source })}
      >
        <input type="hidden" name="source" value={source} />
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

        <SelectField
          label="How old is your child (children)?"
          name="child_age_range"
          placeholder="Select an age range"
          options={ageRangeValues.map((v) => [v, ageRangeLabel[v]] as const)}
          defaultValue={values.child_age_range}
          error={errs.child_age_range}
          required
        />

        <SelectField
          label="Which school level is your child currently in?"
          name="school_level"
          placeholder="Select a school level"
          options={schoolLevelValues.map(
            (v) => [v, schoolLevelLabel[v]] as const,
          )}
          defaultValue={values.school_level}
          error={errs.school_level}
          required
        />

        <TextField
          label="Full name"
          name="parent_name"
          autoComplete="name"
          defaultValue={values.parent_name}
          error={errs.parent_name}
          required
        />

        <RadioGroup
          label="Has your child received tutoring before?"
          name="tutored_before"
          options={tutoredBeforeValues.map(
            (v) => [v, tutoredBeforeLabel[v]] as const,
          )}
          defaultValue={values.tutored_before}
          error={errs.tutored_before}
          required
        />

        <SelectField
          label="How soon are you looking to get academic support for your child?"
          name="timeline"
          placeholder="Select a timeframe"
          options={timelineValues.map((v) => [v, timelineLabel[v]] as const)}
          defaultValue={values.timeline}
          error={errs.timeline}
          required
        />

        <SelectField
          label="Which country are you currently living in?"
          name="country"
          placeholder="Select your country"
          options={COUNTRIES.map((c) => [c, c] as const)}
          defaultValue={values.country}
          error={errs.country}
          required
        />

        <TextField
          label="Phone number"
          name="parent_phone"
          type="tel"
          autoComplete="tel"
          defaultValue={values.parent_phone}
          error={errs.parent_phone}
          required
        />

        <CheckboxGroup
          label="Which subjects would your child benefit from additional support in?"
          name="subjects"
          options={strategySubjectValues.map(
            (v) => [v, strategySubjectLabel[v]] as const,
          )}
          selected={subjects}
          onToggle={toggleSubject}
          error={errs.subjects}
          required
        />

        {subjects.includes("other") && (
          <TextField
            label="Please specify the other subject(s)"
            name="subject_other"
            defaultValue={values.subject_other}
            error={errs.subject_other}
            required
          />
        )}

        <TextField
          label="Email"
          name="parent_email"
          type="email"
          autoComplete="email"
          defaultValue={values.parent_email}
          error={errs.parent_email}
          required
        />

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
  );
}

// -----------------------------------------------------------------------------
// Local UI primitives — strategy-form specific, styled with the shared classes.
// -----------------------------------------------------------------------------

const labelStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 15,
  marginBottom: 10,
  color: "#04131C",
  display: "block",
};

function FieldError({ id, error }: { id?: string; error?: string }) {
  if (!error) return null;
  return (
    <div className="err" id={id} role="alert">
      {error}
    </div>
  );
}

function TextField({
  label,
  name,
  type = "text",
  autoComplete,
  defaultValue,
  error,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  defaultValue?: string;
  error?: string;
  required?: boolean;
}) {
  const id = `f-${name}`;
  const errId = error ? `err-${name}` : undefined;
  return (
    <div className={clsx("field", error && "error")} style={{ marginBottom: 24 }}>
      <label htmlFor={id}>
        {label}
        {required && " *"}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue ?? ""}
        aria-required={required ? true : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={errId}
      />
      <FieldError id={errId} error={error} />
    </div>
  );
}

function SelectField({
  label,
  name,
  placeholder,
  options,
  defaultValue,
  error,
  required,
}: {
  label: string;
  name: string;
  placeholder: string;
  options: ReadonlyArray<readonly [string, string]>;
  defaultValue?: string;
  error?: string;
  required?: boolean;
}) {
  const id = `f-${name}`;
  const errId = error ? `err-${name}` : undefined;
  return (
    <div className={clsx("field", error && "error")} style={{ marginBottom: 24 }}>
      <label htmlFor={id}>
        {label}
        {required && " *"}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue ?? ""}
        aria-required={required ? true : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={errId}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
      <FieldError id={errId} error={error} />
    </div>
  );
}

function RadioGroup({
  label,
  name,
  options,
  defaultValue,
  error,
  required,
}: {
  label: string;
  name: string;
  options: ReadonlyArray<readonly [string, string]>;
  defaultValue?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className={clsx("field", error && "error")} style={{ marginBottom: 24 }}>
      <span style={labelStyle}>
        {label}
        {required && " *"}
      </span>
      <div
        role="radiogroup"
        aria-label={label}
        style={{ display: "flex", flexWrap: "wrap", gap: 12 }}
      >
        {options.map(([value, text]) => (
          <label key={value} style={chipStyle}>
            <input
              type="radio"
              name={name}
              value={value}
              defaultChecked={defaultValue === value}
            />
            <span>{text}</span>
          </label>
        ))}
      </div>
      <FieldError error={error} />
    </div>
  );
}

function CheckboxGroup({
  label,
  name,
  options,
  selected,
  onToggle,
  error,
  required,
}: {
  label: string;
  name: string;
  options: ReadonlyArray<readonly [StrategySubject, string]>;
  selected: StrategySubject[];
  onToggle: (value: StrategySubject) => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className={clsx("field", error && "error")} style={{ marginBottom: 24 }}>
      <span style={labelStyle}>
        {label}
        {required && " *"}
      </span>
      <div
        role="group"
        aria-label={label}
        style={{ display: "flex", flexWrap: "wrap", gap: 12 }}
      >
        {options.map(([value, text]) => {
          const checked = selected.includes(value);
          return (
            <label
              key={value}
              style={{
                ...chipStyle,
                borderColor: checked ? "var(--coral, #f4795b)" : "#e8e3d6",
                background: checked ? "rgba(244,121,91,0.08)" : "#fff",
              }}
            >
              <input
                type="checkbox"
                name={name}
                value={value}
                checked={checked}
                onChange={() => onToggle(value)}
              />
              <span>{text}</span>
            </label>
          );
        })}
      </div>
      <FieldError error={error} />
    </div>
  );
}

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  border: "1.5px solid #e8e3d6",
  borderRadius: 999,
  cursor: "pointer",
  background: "#fff",
  fontSize: 14,
};
