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
  bookingRequestSchema,
  curriculumLabel,
  curriculumValues,
  pricingPlanFromSource,
  subjectLabel,
  subjectValues,
  type Subject,
} from "@/lib/booking/schema";
import {
  submitBookingRequest,
  type SubmitBookingRequestState,
} from "@/lib/actions/booking";
import { trackEvent } from "@/lib/analytics";
import { whatsappBookingUrl } from "@/lib/booking/whatsapp";
import { ConsultationCalendar } from "./ConsultationCalendar";

// The /book flow:
//   1. About your child   2. Your details, then one of two buttons:
//      "Talk to us now"  opens WhatsApp with a message built from the form
//      "Book a time"     shows the Cal.com calendar on this page
// Steps 1 and 2 are one <form>; step 1's fields are only hidden while on
// step 2, so a single server action saves the lead (and emails the team)
// whichever button is pressed.

const STEP_LABELS = ["Your child", "Your details", "Talk or book"] as const;

const ALL_FIELDS = [
  "child_name",
  "child_age",
  "child_grade",
  "curriculum",
  "curriculum_other",
  "subject",
  "learning_needs",
  "parent_name",
  "parent_phone",
  "parent_email",
] as const;

const CHILD_FIELDS = [
  "child_name",
  "child_age",
  "child_grade",
  "curriculum",
  "curriculum_other",
  "subject",
  "learning_needs",
] as const;

type Step = 1 | 2 | 3;
type FormStep = 1 | 2;
type Channel = "whatsapp" | "calendar";
type Errors = Record<string, string>;

export type BookingFormProps = {
  /** Attribution label passed through to the admin email (see sourceLabels). */
  source: string;
  /** Pre-selected subject, e.g. when arriving from the maths page. */
  subject?: Subject;
};

export function BookingForm({ source, subject }: BookingFormProps) {
  const [state, formAction, pending] = useActionState<
    SubmitBookingRequestState,
    FormData
  >(submitBookingRequest, null);

  const formRef = useRef<HTMLFormElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<FormStep>(1);
  const [clientErrs, setClientErrs] = useState<Errors>({});
  // Server errors stay visible until the parent next presses Continue.
  const [dismissedState, setDismissedState] =
    useState<SubmitBookingRequestState>(null);
  const [focusErrorTick, setFocusErrorTick] = useState(0);
  const [lead, setLead] = useState<{ name?: string; email?: string }>({});
  const [channel, setChannel] = useState<Channel>("calendar");
  const [whatsappHref, setWhatsappHref] = useState<string | undefined>();

  const serverErrs =
    state?.status === "error" && state !== dismissedState
      ? state.fieldErrors
      : {};
  // Fields edited since their error was shown: hide that error.
  const [editedFields, setEditedFields] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const errs: Errors = Object.fromEntries(
    Object.entries({ ...serverErrs, ...clientErrs }).filter(
      ([k]) => !editedFields.has(k),
    ),
  );
  const values =
    state?.status === "error" ? state.values : ({} as Record<string, string>);

  const [curriculum, setCurriculum] = useState<string | undefined>(undefined);
  const plan = pricingPlanFromSource(source);

  // A new server result: on error, return to the step holding the first bad
  // field (adjusting state during render, not in an effect).
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    setEditedFields(new Set());
    if (state?.status === "error") {
      setCurriculum(state.values.curriculum || undefined);
      const keys = Object.keys(state.fieldErrors);
      if (keys.length > 0) {
        setStep(
          keys.some((k) => (CHILD_FIELDS as readonly string[]).includes(k))
            ? 1
            : 2,
        );
        setFocusErrorTick((t) => t + 1);
      }
    }
  }

  // Success: the WhatsApp screen or the calendar replaces the form.
  const succeeded = state?.status === "success";
  const showWhatsApp = succeeded && channel === "whatsapp";
  const shownStep: Step = succeeded ? 3 : step;
  useEffect(() => {
    if (succeeded) {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [succeeded]);

  // Jump to the first errored field so the parent can see what to fix.
  useEffect(() => {
    if (focusErrorTick === 0) return;
    const firstErr = formRef.current?.querySelector<HTMLElement>(
      ".booking-step:not([hidden]) .field.error",
    );
    if (!firstErr) return;
    firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
    firstErr
      .querySelector<HTMLElement>("input, textarea, select")
      ?.focus({ preventScroll: true });
  }, [focusErrorTick]);

  /**
   * Validates the given fields with the real schema and shows any errors.
   * Returns the form's values when they pass, or null.
   */
  function validate(fields: readonly string[]): Record<string, string> | null {
    const form = formRef.current;
    if (!form) return null;
    const data = Object.fromEntries(new FormData(form)) as Record<
      string,
      string
    >;
    const result = bookingRequestSchema.safeParse({
      ...data,
      current_performance: undefined,
    });
    const found: Errors = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (fields.includes(key) && !found[key]) found[key] = issue.message;
      }
    }
    // The schema's "specify the curriculum" refine only runs once every field
    // parses, so check it here too.
    if (data.curriculum === "other" && !data.curriculum_other?.trim()) {
      found.curriculum_other = "Specify the curriculum";
    }
    setDismissedState(state);
    setClientErrs(found);
    setEditedFields(new Set());
    if (Object.keys(found).length > 0) {
      if (
        Object.keys(found).some((k) =>
          (CHILD_FIELDS as readonly string[]).includes(k),
        )
      ) {
        setStep(1);
      }
      setFocusErrorTick((t) => t + 1);
      return null;
    }
    return data;
  }

  function continueToDetails() {
    if (!validate(CHILD_FIELDS)) return;
    setStep(2);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="booking" aria-labelledby="booking-heading">
      <div className="container booking-layout">
        <div className="booking-container" ref={topRef}>
          <span className="eyebrow">Free consultation</span>
          {showWhatsApp ? (
            <>
              <h1 id="booking-heading" className="booking-title">
                Your message is ready in WhatsApp
              </h1>
              <p className="lead booking-lead">
                Press <strong>send</strong> in WhatsApp and we&apos;ll get back
                to you as soon as we can to set up a quick call.
              </p>
            </>
          ) : shownStep === 3 ? (
            <>
              <h1 id="booking-heading" className="booking-title">
                Last step: pick a time for your call
              </h1>
              <p className="lead booking-lead">
                You are <strong>not booked yet</strong>. Choose a slot below.
                Times show in your own timezone.
              </p>
            </>
          ) : (
            <>
              <h1 id="booking-heading" className="booking-title">
                Book your free consultation
              </h1>
              <p className="lead booking-lead">
                A 15 minute call with one of our education experts about your
                child. Two quick steps, then talk to us on WhatsApp or pick a
                time.
              </p>
            </>
          )}

          {plan && shownStep !== 3 && (
            <p className="booking-plan-note">
              You&apos;re looking at the <strong>{plan} session plan</strong>.
              We&apos;ll talk it through on the call. There&apos;s nothing to
              pay today.
            </p>
          )}

          <StepIndicator step={shownStep} />

          {showWhatsApp ? (
            <div className="booking-wa-ready">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn booking-wa-btn"
              >
                Open WhatsApp again
              </a>
              <p className="booking-wa-alt">
                Rather pick a time yourself?{" "}
                <button
                  type="button"
                  className="booking-link"
                  onClick={() => setChannel("calendar")}
                >
                  Book a time on the calendar
                </button>
              </p>
            </div>
          ) : shownStep === 3 ? (
            <ConsultationCalendar
              source={source}
              name={lead.name}
              email={lead.email}
              whatsappHref={whatsappHref}
            />
          ) : (
            <form
              ref={formRef}
              action={formAction}
              className="contact-form booking-form"
              aria-label="Free consultation booking form"
              noValidate
              onChange={(e) => {
                const name = (e.target as unknown as { name?: string }).name;
                if (name && errs[name] && !editedFields.has(name)) {
                  setEditedFields((prev) => new Set(prev).add(name));
                }
              }}
              onSubmit={(e) => {
                const submitter = (e.nativeEvent as SubmitEvent)
                  .submitter as HTMLButtonElement | null;
                const chosen: Channel =
                  submitter?.value === "whatsapp" ? "whatsapp" : "calendar";
                // Check everything first, so WhatsApp only opens for a
                // request we can actually save.
                const data = validate(ALL_FIELDS);
                if (!data) {
                  e.preventDefault();
                  return;
                }
                const href = whatsappBookingUrl(data);
                setChannel(chosen);
                setWhatsappHref(href);
                setLead({
                  name: data.parent_name?.trim() || undefined,
                  email: data.parent_email?.trim() || undefined,
                });
                trackEvent("booking_form_submit", { source });
                if (chosen === "whatsapp") {
                  trackEvent("click_whatsapp", { source: `book-${source}` });
                  // Opened inside the click so it isn't blocked as a pop-up.
                  // The lead is saved by the form action in the background.
                  window.open(href, "_blank", "noopener");
                }
              }}
            >
              <input type="hidden" name="source" value={source} />
              <input type="hidden" name="after_submit" value="inline" />
              <input
                type="text"
                name="_hp"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="booking-hp"
              />

              <p className="booking-required-note">
                All fields are required unless marked optional.
              </p>

              <div className="booking-step" hidden={step !== 1}>
                <h2 className="booking-step-title">About your child</h2>
                <Field
                  label="Child's full name"
                  name="child_name"
                  defaultValue={values.child_name}
                  error={errs.child_name}
                  autoComplete="off"
                />
                <div className="booking-row">
                  <Field
                    label="Age"
                    name="child_age"
                    type="number"
                    inputMode="numeric"
                    min={3}
                    max={19}
                    defaultValue={values.child_age}
                    error={errs.child_age}
                  />
                  <Field
                    label="Class / grade"
                    name="child_grade"
                    hint="e.g. Year 4, JSS2, Grade 6"
                    defaultValue={values.child_grade}
                    error={errs.child_grade}
                  />
                </div>

                <ChoiceGroup
                  legend="School curriculum"
                  name="curriculum"
                  options={curriculumValues.map(
                    (v) => [v, curriculumLabel[v]] as const,
                  )}
                  defaultValue={values.curriculum}
                  error={errs.curriculum}
                  onChange={setCurriculum}
                />
                {curriculum === "other" && (
                  <Field
                    label="Which curriculum?"
                    name="curriculum_other"
                    defaultValue={values.curriculum_other}
                    error={errs.curriculum_other}
                  />
                )}

                <ChoiceGroup
                  legend="Subject to start with"
                  name="subject"
                  options={subjectValues.map(
                    (v) => [v, subjectLabel[v]] as const,
                  )}
                  defaultValue={values.subject || subject}
                  error={errs.subject}
                />

                <Field
                  label="What would you like help with?"
                  optional
                  name="learning_needs"
                  as="textarea"
                  hint="e.g. struggling with fractions, exam prep, confidence in reading"
                  defaultValue={values.learning_needs}
                  error={errs.learning_needs}
                />

                <button
                  type="button"
                  className="btn btn-coral booking-next"
                  onClick={continueToDetails}
                >
                  Continue
                </button>
              </div>

              <div className="booking-step" hidden={step !== 2}>
                <h2 className="booking-step-title">Your details</h2>
                <Field
                  label="Your full name"
                  name="parent_name"
                  autoComplete="name"
                  defaultValue={values.parent_name}
                  error={errs.parent_name}
                />
                <Field
                  label="Phone number (WhatsApp preferred)"
                  name="parent_phone"
                  type="tel"
                  autoComplete="tel"
                  hint="Include your country code, e.g. +44 7911 123456"
                  defaultValue={values.parent_phone}
                  error={errs.parent_phone}
                />
                <Field
                  label="Email address"
                  name="parent_email"
                  type="email"
                  autoComplete="email"
                  defaultValue={values.parent_email}
                  error={errs.parent_email}
                />

                {state?.status === "error" && state.formError && (
                  <div className="booking-form-error" role="alert">
                    {state.formError}
                  </div>
                )}

                <p className="booking-choose">
                  How would you like to set up your call?
                </p>
                <div className="booking-actions">
                  <button
                    type="submit"
                    name="channel"
                    value="whatsapp"
                    className="btn booking-wa-btn"
                    disabled={pending}
                  >
                    Talk to us now
                    <span className="booking-btn-sub">on WhatsApp</span>
                  </button>
                  <button
                    type="submit"
                    name="channel"
                    value="calendar"
                    className="btn btn-coral"
                    disabled={pending}
                  >
                    Book a time
                    <span className="booking-btn-sub">on our calendar</span>
                  </button>
                </div>
                {pending && (
                  <p className="booking-saving" role="status">
                    Saving your details…
                  </p>
                )}
                <button
                  type="button"
                  className="booking-back"
                  onClick={() => setStep(1)}
                >
                  ← Back
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Local UI primitives — kept in this file because they're booking-specific.
// -----------------------------------------------------------------------------

function StepIndicator({ step }: { step: Step }) {
  return (
    <ol className="booking-steps" aria-label="Booking progress">
      {STEP_LABELS.map((label, i) => {
        const n = (i + 1) as Step;
        return (
          <li
            key={label}
            className={clsx(n === step && "is-current", n < step && "is-done")}
            aria-current={n === step ? "step" : undefined}
          >
            <span className="booking-steps-num" aria-hidden="true">
              {n < step ? "✓" : n}
            </span>
            <span className="booking-steps-label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  as?: "input" | "textarea";
  hint?: string;
  optional?: boolean;
  defaultValue?: string;
  error?: string;
  min?: number;
  max?: number;
  autoComplete?: string;
  inputMode?: "numeric" | "text";
};

function Field(p: FieldProps) {
  const id = `f-${p.name}`;
  const errId = p.error ? `err-${p.name}` : undefined;
  const hintId = p.hint && !p.error ? `hint-${p.name}` : undefined;
  const describedBy = errId ?? hintId;
  const common = {
    id,
    name: p.name,
    defaultValue: p.defaultValue ?? "",
    "aria-required": p.optional ? undefined : true,
    "aria-invalid": p.error ? true : undefined,
    "aria-describedby": describedBy,
  };

  return (
    <div className={clsx("field", p.error && "error")}>
      <label htmlFor={id}>
        {p.label}
        {p.optional && <span className="booking-optional"> (optional)</span>}
      </label>
      {p.as === "textarea" ? (
        <textarea {...common} className="booking-textarea" />
      ) : (
        <input
          {...common}
          type={p.type ?? "text"}
          autoComplete={p.autoComplete}
          inputMode={p.inputMode}
          min={p.min}
          max={p.max}
        />
      )}
      {hintId && (
        <div id={hintId} className="booking-hint">
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

function ChoiceGroup({
  legend,
  name,
  options,
  defaultValue,
  error,
  onChange,
}: {
  legend: ReactNode;
  name: string;
  options: ReadonlyArray<readonly [string, string]>;
  defaultValue?: string;
  error?: string;
  onChange?: (value: string) => void;
}) {
  const errId = error ? `err-${name}` : undefined;
  return (
    <fieldset
      className={clsx("field booking-choices", error && "error")}
      aria-invalid={error ? true : undefined}
      aria-describedby={errId}
    >
      <legend>{legend}</legend>
      <div className="booking-choice-list">
        {options.map(([value, label]) => (
          <label key={value} className="booking-choice">
            <input
              type="radio"
              name={name}
              value={value}
              defaultChecked={defaultValue === value}
              onChange={(e) => onChange?.(e.target.value)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
      {errId && (
        <div className="err" id={errId} role="alert">
          {error}
        </div>
      )}
    </fieldset>
  );
}
