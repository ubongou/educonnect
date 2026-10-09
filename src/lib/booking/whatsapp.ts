import { BOOKING_WHATSAPP_URL } from "./cal";
import { curriculumLabel, describeSubjects, type Curriculum } from "./schema";

/** The /book answers the WhatsApp message is built from. All optional. */
export type WhatsAppDraft = {
  parent_name?: string;
  child_name?: string;
  child_age?: string;
  child_grade?: string;
  curriculum?: string;
  curriculum_other?: string;
  /** Ticked subjects; "other" is replaced by subject_other. */
  subjects?: readonly string[];
  subject_other?: string;
  learning_needs?: string;
};

const HELP_MAX = 160;

const firstName = (s?: string) => s?.trim().split(/\s+/)[0] || undefined;

/**
 * The "Talk to us now" message. Written to start a conversation straight
 * away: who they are, who it's for, what they need, and a direct ask for a
 * quick call today. Anything the parent skipped is left out.
 */
export function whatsappBookingMessage(d: WhatsAppDraft): string {
  const parent = firstName(d.parent_name);
  const child = firstName(d.child_name);

  const curriculum =
    d.curriculum === "other"
      ? d.curriculum_other?.trim()
      : d.curriculum && d.curriculum in curriculumLabel
        ? curriculumLabel[d.curriculum as Curriculum]
        : undefined;
  const about = [
    d.child_age?.trim(),
    d.child_grade?.trim(),
    curriculum && `${curriculum} curriculum`,
  ].filter(Boolean);

  const subject = describeSubjects(d.subjects ?? [], d.subject_other) || undefined;
  let help = d.learning_needs?.trim().replace(/\s+/g, " ");
  if (help && help.length > HELP_MAX) help = `${help.slice(0, HELP_MAX - 1).trimEnd()}…`;

  let who = child ? `my child ${child}` : "my child";
  if (about.length) who += ` (${about.join(", ")})`;

  let need = "";
  if (subject && help) need = ` and would like help with ${subject}: ${help}`;
  else if (subject) need = ` and would like help with ${subject}`;
  else if (help) need = ` and would like help with: ${help}`;
  if (need && !/[.!?…]$/.test(need)) need += ".";
  else if (!need) need = ".";

  const intro = parent ? `Hi Masani, I'm ${parent}.` : "Hi Masani.";
  return `${intro} I just filled in your booking form for ${who}${need} Are you free for a quick call today?`;
}

export function whatsappBookingUrl(d: WhatsAppDraft): string {
  return `${BOOKING_WHATSAPP_URL}?text=${encodeURIComponent(whatsappBookingMessage(d))}`;
}
