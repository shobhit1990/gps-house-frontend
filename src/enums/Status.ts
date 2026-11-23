export enum Status {
  ACTIVE = "active",
  INACTIVE = "inactive",
  PENDING = "pending",
}

export enum StatusFilter {
  ALL = "all",
  ACTIVE = Status.ACTIVE,
  INACTIVE = Status.INACTIVE,
}

export const statusLabel = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1);

export const statusFilters: { id: StatusFilter; label: string }[] = Object.values(StatusFilter).map((id) => ({
  id,
  label: id === StatusFilter.ALL ? "All Status" : statusLabel(id),
}));
