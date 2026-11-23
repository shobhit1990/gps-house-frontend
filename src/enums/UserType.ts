export enum UserType {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  USER = "USER",
  CLIENT = "CLIENT",
  TRANSPORTER = "TRANSPORTER",
  TECHNICIAN = "TECHNICIAN",
}

export const userTypeLabel = (type: string) =>
  type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

export const userTypeOptions = Object.values(UserType).map((value) => ({
  value,
  label: userTypeLabel(value),
}));
