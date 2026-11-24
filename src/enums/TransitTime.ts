export enum TransitTime {
  DAY_1 = 1,
  DAY_2 = 2,
  DAY_3 = 3,
  DAY_4 = 4,
  DAY_5 = 5,
  DAY_6 = 6,
  DAY_7 = 7,
  DAY_8 = 8,
  DAY_9 = 9,
  DAY_10 = 10,
  DAY_11 = 11,
  DAY_12 = 12,
  DAY_13 = 13,
  DAY_14 = 14,
  DAY_15 = 15,
  DAY_16 = 16,
  DAY_17 = 17,
  DAY_18 = 18,
  DAY_19 = 19,
  DAY_20 = 20,
  DAY_21 = 21,
  DAY_22 = 22,
  DAY_23 = 23,
  DAY_24 = 24,
  DAY_25 = 25,
  DAY_26 = 26,
  DAY_27 = 27,
  DAY_28 = 28,
  DAY_29 = 29,
  DAY_30 = 30,
}

/** API enum keys: `DAY_1` … `DAY_30`. */
export const transitTimeOptions = (
  Object.keys(TransitTime) as Array<keyof typeof TransitTime>
)
  .filter((key) => key.startsWith("DAY_"))
  .map((key) => ({
    value: key,
    label: `Day ${TransitTime[key]}`,
  }));

/** Normalize any API/UI value into `DAY_n` (for selects). */
export const toTransitTimeKey = (value: string | number | undefined | null): string => {
  if (value == null || value === "") return "DAY_20";
  const raw = String(value).trim().toUpperCase();
  const dayMatch = raw.match(/^DAY[_-]?(\d{1,2})$/);
  if (dayMatch) {
    const day = Number(dayMatch[1]);
    return day >= 1 && day <= 30 ? `DAY_${day}` : "DAY_20";
  }
  const day = Number(raw);
  return Number.isInteger(day) && day >= 1 && day <= 30 ? `DAY_${day}` : "DAY_20";
};

/** API payload value: integer `1` … `30`. */
export const toTransitTimeNumber = (value: string | number | undefined | null): number => {
  const key = toTransitTimeKey(value);
  const day = Number(key.replace(/^DAY_/, ""));
  return Number.isInteger(day) && day >= 1 && day <= 30 ? day : 20;
};
