import type { LoginResponse } from "@/interfaces";
import type { User } from "@/store/slices/authSlice";

/** Map backend login `data` into the auth user shape the UI expects. */
export function userFromLoginResponse(
  response: LoginResponse,
  fallbackUsername: string,
): User {
  const roleCode = response.roleCode || response.userType || undefined;
  const roleName = response.roleName || response.userType || response.roleCode || undefined;

  return {
    id: response.externalId ?? response.userId ?? "",
    username: response.userName || response.username || fallbackUsername,
    name: response.name,
    role: roleName,
    roleName,
    roleCode,
    userType: response.userType,
  };
}
