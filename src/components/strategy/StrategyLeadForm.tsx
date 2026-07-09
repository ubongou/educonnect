"use client";

import {
  startTransition,
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

// Every scalar field is held in React state so a submit / re-render / React 19
// auto-reset can never drop what the visitor typed. (Subjects is its own array
// state below.) This is deliberately fully controlled — do not switch these
// back to uncontrolled defaultValue inputs.
type ScalarField =
  | "child_age_range"
  | "school_level"
  | "parent_name"
  | "tutored_before"
  | "timeline"
  | "country"
  | "parent_phone"
  | "subject_other"
  | "parent_email";

const EMPTY_FORM: Record<ScalarField, string> = {
  child_age_range: "",
  school_level: "",
  parent_name: "",
  tutored_before: "",
  timeline: "",
  country: "",
  parent_phone: "",
  subject_other: "",
  parent_email: "",
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

  const formRef = useRef<HTMLFormElement>(null);

  // Controlled values. State survives every re-render (the component never
  // unmounts between submits), so validation errors re-show what was typed.
  const [form, setForm] = useState<Record<ScalarField, string>>(EMPTY_FORM);
  const setField = (name: ScalarField) => (value: string) =>
    setForm((prev) => ({ ...prev, [name]: value }));

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
        className="contact-form booking-form"
        aria-label="Strategy session request form"
        noValidate
        style={{ display: "block", marginTop: 32 }}
        // We dispatch the action manually instead of via `action={formAction}`.
        // React 19 auto-resets a form submitted through `action=`, and that
        // reset mutates <select>/checkbox/radio DOM out from under React so
        // their controlled values are lost on a validation-error re-render.
        // Snapshotting FormData here and dispatching in a transition avoids the
        // auto-reset entirely, so every field survives a failed submit.
        onSubmit={(e) => {
          e.preventDefault();
          trackEvent("booking_form_submit", { source });
          const fd = new FormData(e.currentTarget);
          startTransition(() => formAction(fd));
        }}
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
          value={form.child_age_range}
          onChange={setField("child_age_range")}
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
          value={form.school_level}
          onChange={setField("school_level")}
          error={errs.school_level}
          required
        />

        <TextField
          label="Full name"
          name="parent_name"
          autoComplete="name"
          value={form.parent_name}
          onChange={setField("parent_name")}
          error={errs.parent_name}
          required
        />

        <RadioGroup
          label="Has your child received tutoring before?"
          name="tutored_before"
          options={tutoredBeforeValues.map(
            (v) => [v, tutoredBeforeLabel[v]] as const,
          )}
          value={form.tutored_before}
          onChange={setField("tutored_before")}
          error={errs.tutored_before}
          required
        />

        <SelectField
          label="How soon are you looking to get academic support for your child?"
          name="timeline"
          placeholder="Select a timeframe"
          options={timelineValues.map((v) => [v, timelineLabel[v]] as const)}
          value={form.timeline}
          onChange={setField("timeline")}
          error={errs.timeline}
          required
        />

        <SelectField
          label="Which country are you currently living in?"
          name="country"
          placeholder="Select your country"
          options={COUNTRIES.map((c) => [c, c] as const)}
          value={form.country}
          onChange={setField("country")}
          error={errs.country}
          required
        />

        <TextField
          label="Phone number"
          name="parent_phone"
          type="tel"
          autoComplete="tel"
          value={form.parent_phone}
          onChange={setField("parent_phone")}
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
            value={form.subject_other}
            onChange={setField("subject_other")}
            error={errs.subject_other}
            required
          />
        )}

        <TextField
          label="Email"
          name="parent_email"
          type="email"
          autoComplete="email"
          value={form.parent_email}
          onChange={setField("parent_email")}
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
// All controlled: value + onChange, so nothing is ever lost on re-render.
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
  value,
  onChange,
  error,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  value: string;
  onChange: (value: string) => void;
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
  value,
  onChange,
  error,
  required,
}: {
  label: string;
  name: string;
  placeholder: string;
  options: ReadonlyArray<readonly [string, string]>;
  value: string;
  onChange: (value: string) => void;
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-required={required ? true : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={errId}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map(([optionValue, text]) => (
          <option key={optionValue} value={optionValue}>
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
  value,
  onChange,
  error,
  required,
}: {
  label: string;
  name: string;
  options: ReadonlyArray<readonly [string, string]>;
  value: string;
  onChange: (value: string) => void;
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
        {options.map(([optionValue, text]) => (
          <label key={optionValue} style={chipStyle}>
            <input
              type="radio"
              name={name}
              value={optionValue}
              checked={value === optionValue}
              onChange={() => onChange(optionValue)}
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
