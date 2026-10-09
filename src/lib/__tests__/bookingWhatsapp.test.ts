import { describe, expect, it } from "vitest";
import { whatsappBookingMessage, whatsappBookingUrl } from "@/lib/booking/whatsapp";

describe("whatsappBookingMessage", () => {
  it("builds the full message from both steps", () => {
    expect(
      whatsappBookingMessage({
        parent_name: "Adaeze Obi",
        child_name: "Ada Obi",
        child_age: "9",
        child_grade: "Year 4",
        curriculum: "british",
        subject: "mathematics",
        learning_needs: "mainly fractions",
      }),
    ).toBe(
      "Hi Masani, I'm Adaeze. I just filled in your booking form for my child Ada (9, Year 4, British curriculum) and would like help with Mathematics: mainly fractions. Are you free for a quick call today?",
    );
  });

  it("leaves out anything skipped", () => {
    expect(
      whatsappBookingMessage({ parent_name: "Adaeze", child_name: "Ada", subject: "english" }),
    ).toBe(
      "Hi Masani, I'm Adaeze. I just filled in your booking form for my child Ada and would like help with English. Are you free for a quick call today?",
    );
    expect(whatsappBookingMessage({})).toBe(
      "Hi Masani. I just filled in your booking form for my child. Are you free for a quick call today?",
    );
  });

  it("uses the typed curriculum for Other and trims long help text", () => {
    const msg = whatsappBookingMessage({
      curriculum: "other",
      curriculum_other: "IB",
      learning_needs: "x".repeat(400),
    });
    expect(msg).toContain("(IB curriculum)");
    expect(msg).toContain("…");
    expect(msg.length).toBeLessThan(320);
  });

  it("encodes the message into a wa.me link", () => {
    expect(whatsappBookingUrl({ child_name: "Ada" })).toMatch(
      /^https:\/\/wa\.me\/2349017246528\?text=Hi%20Masani/,
    );
  });
});
