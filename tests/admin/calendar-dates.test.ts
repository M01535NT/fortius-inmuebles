import { expect, test } from "vitest";
import * as dates from "@/lib/admin/calendar-dates";

test("Monday to Sunday includes the previous month and the next year", () => {
  expect(dates.calendarWeekDays("2026-12-31")).toEqual([
    "2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03",
  ]);
});

test("a Sunday belongs to the week ending that day", () => {
  expect(dates.calendarWeekDays("2027-01-03")).toEqual([
    "2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03",
  ]);
});

test("date navigation crosses leap days without the device clock", () => {
  expect(dates.shiftCalendarDate("2028-02-28", 1)).toBe("2028-02-29");
  expect(dates.shiftCalendarDate("2028-02-29", 1)).toBe("2028-03-01");
  expect(dates.shiftCalendarDate("2027-01-01", -7)).toBe("2026-12-25");
});

test("URL dates reject normalized impossible days and accept valid leap days", () => {
  expect(dates.isCalendarDate("2027-02-29")).toBe(false);
  expect(dates.isCalendarDate("2026-02-31")).toBe(false);
  expect(dates.isCalendarDate("2028-02-29")).toBe(true);
  expect(dates.isCalendarDate("0000-01-01")).toBe(false);
});
