import { NextResponse } from "next/server";
import { runBirthdayReminders } from "@/lib/birthdayReminders";

/**
 * Daily birthday reminders, triggered by Vercel Cron (see vercel.json) every
 * morning at 06:00 UTC — 07:00 in Lagos.
 *
 * Deliberately open, with no secret: the job only ever sends reminders that
 * are due today, and each one at most once (see runBirthdayReminders), so a
 * stray request can't spam anyone or reveal anything — the response carries
 * counts only, no names or dates.
 */
export async function GET() {
  try {
    const { today, outcomes } = await runBirthdayReminders();
    return NextResponse.json({
      ok: true,
      today,
      sent: outcomes.filter((o) => o.sent).length,
      failed: outcomes.filter((o) => !o.sent).length,
    });
  } catch (err) {
    console.error("[birthday reminders] run failed", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
