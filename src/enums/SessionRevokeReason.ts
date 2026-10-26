/** Why the current session was voided. */
export enum SessionRevokeReason {
  PASSWORD_CHANGED = "password_changed",
  NEW_LOGIN = "new_login",
  ACCOUNT_INACTIVE = "account_inactive",
  DEVICE_RESET = "device_reset",
  SESSION_EXPIRED = "session_expired",
}
