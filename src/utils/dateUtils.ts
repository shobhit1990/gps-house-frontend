/**
 * Date utility functions
 */

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const IST_TIMEZONE = "Asia/Kolkata";

const getValidDate = (dateTimeStamp?: Date | string | number): Date => {
  const currentDate = dateTimeStamp ? new Date(dateTimeStamp) : new Date();
  if (Number.isNaN(currentDate.getTime())) {
    throw new Error("Invalid Date");
  }
  return currentDate;
};

export const getDisplayDateFormat = (dateTimeStamp: Date | string | number): string => {
  const currentDate = getValidDate(dateTimeStamp);
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).formatToParts(currentDate);
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  const monthRaw = parts.find((part) => part.type === "month")?.value ?? "Jan";
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = MONTH_NAMES.find((m) => m.toLowerCase() === monthRaw.slice(0, 3).toLowerCase()) ?? monthRaw;
  return `${day} ${month} ${year}`;
};

export const getDisplayTimeFormat = (dateTimeStamp: Date | string | number): string => {
  const currentDate = getValidDate(dateTimeStamp);
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(currentDate);
  const hours = parts.find((part) => part.type === "hour")?.value ?? "12";
  const minutes = parts.find((part) => part.type === "minute")?.value ?? "00";
  const ampm = (parts.find((part) => part.type === "dayPeriod")?.value ?? "AM").toUpperCase();
  return `${hours}:${minutes} ${ampm}`;
};

export const getDisplayDateTimeFormat = (dateTimeStamp: Date | string | number): string => {
  const currentDate = getValidDate(dateTimeStamp);
  return `${getDisplayDateFormat(currentDate)} ${getDisplayTimeFormat(currentDate)}`;
};

let isDateDisplayFormatPatched = false;

export const applyGlobalDateDisplayFormat = (): void => {
  if (isDateDisplayFormatPatched) return;

  Date.prototype.toLocaleDateString = function toLocaleDateStringPatched(): string {
    return getDisplayDateFormat(this);
  };

  Date.prototype.toLocaleTimeString = function toLocaleTimeStringPatched(): string {
    return getDisplayTimeFormat(this);
  };

  Date.prototype.toLocaleString = function toLocaleStringPatched(): string {
    return getDisplayDateTimeFormat(this);
  };

  isDateDisplayFormatPatched = true;
};