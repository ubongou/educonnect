import { describe, expect, it } from "vitest";
import {
  ageOn,
  birthdayInYear,
  dateOfBirthError,
  daysUntilBirthday,
  displayAge,
  nextBirthday,
  officeToday,
  reminderDue,
  turningAge,
  upcomingBirthdays,
} from "@/lib/birthdays";

describe("nextBirthday / daysUntilBirthday", () => {
  it("is today when the birthday is today", () => {
    expect(nextBirthday("2016-10-06", "2026-10-06")).toBe("2026-10-06");
    expect(daysUntilBirthday("2016-10-06", "2026-10-06")).toBe(0);
  });

  it("rolls to next year once this year's has passed", () => {
    expect(nextBirthday("2016-10-05", "2026-10-06")).toBe("2027-10-05");
    expect(daysUntilBirthday("2016-10-05", "2026-10-06")).toBe(364);
  });

  it("counts across a month end and a year end", () => {
    expect(daysUntilBirthday("2015-11-02", "2026-10-30")).toBe(3);
    expect(daysUntilBirthday("2015-01-03", "2026-12-28")).toBe(6);
    expect(daysUntilBirthday("2015-01-01", "2026-12-31")).toBe(1);
  });
});

describe("29 February birthdays", () => {
  it("are marked on 28 February in non-leap years", () => {
    expect(birthdayInYear("2016-02-29", 2027)).toBe("2027-02-28");
    expect(birthdayInYear("2016-02-29", 2028)).toBe("2028-02-29");
  });

  it("get the day-before reminder on 27 February in a non-leap year", () => {
    expect(daysUntilBirthday("2016-02-29", "2027-02-27")).toBe(1);
  });

  it("age correctly", () => {
    expect(ageOn("2016-02-29", "2027-02-27")).toBe(10);
    expect(ageOn("2016-02-29", "2027-02-28")).toBe(11);
  });
});

describe("ages", () => {
  it("computes completed years", () => {
    expect(ageOn("2016-10-07", "2026-10-06")).toBe(9);
    expect(ageOn("2016-10-06", "2026-10-06")).toBe(10);
  });

  it("knows the age a child is turning", () => {
    expect(turningAge("2016-10-07", "2026-10-06")).toBe(10);
    expect(turningAge("2016-10-05", "2026-10-06")).toBe(11);
  });

  it("prefers the date of birth over the stored age", () => {
    expect(displayAge({ age: 7, date_of_birth: "2016-10-06" }, "2026-10-06")).toBe(10);
    expect(displayAge({ age: 7, date_of_birth: null }, "2026-10-06")).toBe(7);
  });
});

describe("dateOfBirthError", () => {
  const today = "2026-10-06";
  it("accepts a valid child's birthday", () => {
    expect(dateOfBirthError("2016-03-12", today)).toBeNull();
  });
  it("rejects impossible, future and out-of-range dates", () => {
    expect(dateOfBirthError("2016-02-30", today)).toMatch(/valid/);
    expect(dateOfBirthError("not a date", today)).toMatch(/valid/);
    expect(dateOfBirthError("2027-01-01", today)).toMatch(/future/);
    expect(dateOfBirthError("2025-01-01", today)).toMatch(/between/);
    expect(dateOfBirthError("1990-01-01", today)).toMatch(/between/);
  });
});

describe("reminderDue", () => {
  it("sends the week-before reminder 2–7 days out", () => {
    expect(reminderDue(8)).toBeNull();
    expect(reminderDue(7)).toBe("week_before");
    expect(reminderDue(2)).toBe("week_before");
  });
  it("sends the day-before reminder the day before, or on the day if missed", () => {
    expect(reminderDue(1)).toBe("day_before");
    expect(reminderDue(0)).toBe("day_before");
  });
});

describe("officeToday", () => {
  it("uses the Lagos calendar day", () => {
    // 23:30 UTC is already 00:30 the next day in Lagos (UTC+1).
    expect(officeToday(new Date("2026-10-05T23:30:00Z"))).toBe("2026-10-06");
    expect(officeToday(new Date("2026-10-05T22:30:00Z"))).toBe("2026-10-05");
  });
});

describe("upcomingBirthdays", () => {
  it("lists the next week's birthdays soonest first and skips unknowns", () => {
    const list = upcomingBirthdays(
      [
        { id: "a", full_name: "Ada Obi", preferred_name: null, date_of_birth: "2015-10-09" },
        { id: "b", full_name: "Edan Okon", preferred_name: "Edan", date_of_birth: "2016-10-06" },
        { id: "c", full_name: "No Date", preferred_name: null, date_of_birth: null },
        { id: "d", full_name: "Later", preferred_name: null, date_of_birth: "2015-10-20" },
      ],
      "2026-10-06",
    );
    expect(list.map((b) => [b.name, b.daysUntil, b.turning])).toEqual([
      ["Edan", 0, 10],
      ["Ada Obi", 3, 11],
    ]);
  });
});
