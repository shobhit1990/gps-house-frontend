export interface RefreshTokenResponse {
  message?: string;
  /** The backend sends the access token as `token`; `accessToken` is kept as a fallback. */
  token?: string;
  accessToken?: string;
  refreshToken: string;
}
