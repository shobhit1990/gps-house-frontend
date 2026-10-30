import { logout } from "@/store/slices/authSlice";
import { disconnectSocket } from "@/lib/socket";
import type { AppDispatch } from "@/store/store";
import { SessionRevokeReason } from "@/enums/SessionRevokeReason";

export const AUTH_LOGOUT_REASON_KEY = "rrsj_auth_logout_reason";

let logoutStarted = false;

/** Clears local session and sends the browser to login. */
export function forceLogout(
  dispatch: AppDispatch,
  options?: { reason?: string; redirect?: boolean },
): void {
  if (logoutStarted) {
    return;
  }
  logoutStarted = true;

  if (options?.reason) {
    try {
      sessionStorage.setItem(AUTH_LOGOUT_REASON_KEY, options.reason);
    } catch {
      /* ignore private-mode / SSR */
    }
  }

  dispatch(logout());
  disconnectSocket();

  if (options?.redirect === false || typeof window === "undefined") {
    return;
  }

  const isOnLogin = window.location.pathname.toLowerCase().includes("login");
  if (!isOnLogin) {
    window.location.replace("/login");
  }
}

/** Reads and clears the logout reason saved before a forced redirect. */
export function consumeForcedLogoutReason(): string | null {
  try {
    const reason = sessionStorage.getItem(AUTH_LOGOUT_REASON_KEY);
    if (reason) {
      sessionStorage.removeItem(AUTH_LOGOUT_REASON_KEY);
    }
    return reason;
  } catch {
    return null;
  }
}

export function getForcedLogoutTitle(reason: string | null): string {
  if (reason === SessionRevokeReason.PASSWORD_CHANGED) {
    return "Password changed";
  }
  if (reason === SessionRevokeReason.NEW_LOGIN) {
    return "Signed in on another device";
  }
  if (reason === SessionRevokeReason.ACCOUNT_INACTIVE) {
    return "Account deactivated";
  }
  if (reason === SessionRevokeReason.DEVICE_RESET) {
    return "Device reset";
  }
  return "Session ended";
}

export function getForcedLogoutMessage(reason: string | null): string | null {
  if (reason === SessionRevokeReason.PASSWORD_CHANGED) {
    return "Your password was changed. Click OK to log out, then login with your new password.";
  }
  if (reason === SessionRevokeReason.NEW_LOGIN) {
    return "This account was signed in on another device or browser. Click OK to log out from this screen.";
  }
  if (reason === SessionRevokeReason.ACCOUNT_INACTIVE) {
    return "Your account has been marked inactive. Click OK to log out. Please contact an administrator.";
  }
  if (reason === SessionRevokeReason.DEVICE_RESET) {
    return "Your registered device was reset. Click OK to log out, then login again from the new device.";
  }
  if (reason === SessionRevokeReason.SESSION_EXPIRED) {
    return "Your session is no longer valid. Click OK to log out and login again.";
  }
  return null;
}
