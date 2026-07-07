import { StatusBadge } from "@/components/ui/StatusBadge";
import { ReportMessageForm } from "@/components/dashboard/ReportMessageForm";
import { formatDateTime } from "@/lib/format";
import type { Role } from "@/types/domain";
import type { ReportMessageItem } from "@/lib/reports/messages";

const ROLE_LABEL: Record<Role, string> = {
  parent: "Parent",
  teacher: "Teacher",
  admin: "Admin",
};

/**
 * The two-way report thread. Messages are server-rendered (RLS-scoped by the
 * loader); the composer below posts via a client action. `viewerId` aligns the
 * current user's own messages to the right and labels them "You".
 */
export function ReportThread({
  reportId,
  messages,
  viewerId,
}: {
  reportId: string;
  messages: ReportMessageItem[];
  viewerId: string;
}) {
  return (
    <section className="mt-6 rounded-[28px] border border-line bg-white p-6">
      <h3 className="font-heading text-[14px] font-semibold text-navy">
        Messages
      </h3>
      <p className="mt-1 text-[13px] text-g600">
        Questions or feedback about this report — the teacher and parent both
        get notified of new messages.
      </p>

      {messages.length > 0 ? (
        <ul className="mt-5 flex flex-col gap-4">
          {messages.map((m) => {
            const mine = m.author_id === viewerId;
            return (
              <li
                key={m.id}
                className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    mine
                      ? "bg-navy text-white"
                      : "border border-line bg-paper text-navy"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`font-heading text-[12px] font-bold ${
                        mine ? "text-yellow" : "text-navy"
                      }`}
                    >
                      {mine ? "You" : m.author_name?.trim() || "—"}
                    </span>
                    {!mine && (
                      <StatusBadge
                        tone={
                          m.author_role === "teacher"
                            ? "blue"
                            : m.author_role === "admin"
                              ? "amber"
                              : "gray"
                        }
                      >
                        {ROLE_LABEL[m.author_role]}
                      </StatusBadge>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-[14px] leading-[1.6]">
                    {m.body}
                  </p>
                </div>
                <span className="mt-1 px-1 text-[11px] text-g400">
                  {formatDateTime(m.created_at)}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-5 text-[13px] text-g600">No messages yet.</p>
      )}

      <ReportMessageForm reportId={reportId} />
    </section>
  );
}
