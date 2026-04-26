import { NextResponse } from "next/server";

const ICAL_URL =
  "https://export.calendar.online/ics/0/4f0d80c50ef849c92054/umbracorp.ics?past_months=3&future_months=36";

const TIME_OFFSET_HOURS = -6;

function unfoldIcs(text) {
  return text.replace(/\r?\n[ \t]/g, "");
}

function clean(value = "") {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .trim();
}

function adjustTime(date) {
  if (!date) return null;

  const adjusted = new Date(date);
  adjusted.setHours(adjusted.getHours() + TIME_OFFSET_HOURS);

  return adjusted.toISOString();
}

function parseDate(value) {
  if (!value) return null;

  if (/^\d{8}$/.test(value)) {
    const year = value.slice(0, 4);
    const month = value.slice(4, 6);
    const day = value.slice(6, 8);
    return new Date(`${year}-${month}-${day}T00:00:00`).toISOString();
  }

  const cleaned = value.replace("Z", "");
  const year = cleaned.slice(0, 4);
  const month = cleaned.slice(4, 6);
  const day = cleaned.slice(6, 8);
  const hour = cleaned.slice(9, 11) || "00";
  const minute = cleaned.slice(11, 13) || "00";
  const second = cleaned.slice(13, 15) || "00";

  const parsed = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
  return adjustTime(parsed);
}

function getValue(block, key) {
  const lines = block.split(/\r?\n/);

  const line = lines.find(
    (l) => l.startsWith(`${key}:`) || l.startsWith(`${key};`)
  );

  if (!line) return "";

  return line.substring(line.indexOf(":") + 1);
}

function parseIcs(text) {
  const fixedText = unfoldIcs(text);
  const blocks = fixedText.split("BEGIN:VEVENT").slice(1);

  return blocks
    .map((block) => ({
      title: clean(getValue(block, "SUMMARY")),
      description: clean(getValue(block, "DESCRIPTION")),
      location: clean(getValue(block, "LOCATION")),
      start: parseDate(getValue(block, "DTSTART")),
      end: parseDate(getValue(block, "DTEND")),
      source: "ical",
    }))
    .filter((event) => event.start)
    .sort((a, b) => new Date(a.start) - new Date(b.start));
}

export async function GET() {
  try {
    const response = await fetch(ICAL_URL, { cache: "no-store" });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch calendar." },
        { status: 500 }
      );
    }

    const text = await response.text();
    const events = parseIcs(text);

    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Calendar error." },
      { status: 500 }
    );
  }
}