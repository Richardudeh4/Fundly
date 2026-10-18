/**
 * Request.tsx
 *
 * Typed HTTP client wired to the Fundly Mobile-Backend API.
 *
 * Every endpoint the backend exposes is available as a named method on the
 * exported `api` object so call-sites get full TypeScript autocomplete and
 * never have to hard-code paths or figure out the response shape.
 *
 * Token management
 * ─────────────────
 * • Tokens are stored in expo-secure-store (already installed).
 * • Protected requests automatically attach `Authorization: Bearer <accessToken>`.
 * • On TOKEN_EXPIRED the client silently refreshes and retries once.
 * • On any 401 that cannot be recovered, both tokens are cleared and the
 *   global UNAUTHORIZED_EVENT flag is set so the root layout can redirect.
 *
 * Error shape
 * ────────────
 * All errors thrown by this client follow ApiError so call-sites can
 * discriminate by `error.code` (matches the backend's error codes exactly).
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import ENV from '@/constants/env';

// ─────────────────────────────────────────────
// Storage keys
// ─────────────────────────────────────────────
const KEYS = {
  ACCESS_TOKEN: 'auth.accessToken',
  REFRESH_TOKEN: 'auth.refreshToken',
} as const;

// ─────────────────────────────────────────────
// Token helpers (exported so the auth store
// and screens can call them directly)
// ─────────────────────────────────────────────
export const TokenStorage = {
  getAccessToken: () => SecureStore.getItemAsync(KEYS.ACCESS_TOKEN),
  getRefreshToken: () => SecureStore.getItemAsync(KEYS.REFRESH_TOKEN),

  saveTokens: async (accessToken: string, refreshToken: string) => {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken),
      SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  clearTokens: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
    ]);
  },
};

// ─────────────────────────────────────────────
// Error type
// ─────────────────────────────────────────────

/** Error codes the backend can return (from auth.controller + errorHandler). */
export type BackendErrorCode =
  | 'ACCOUNT_EXISTS'
  | 'OTP_INVALID'
  | 'OTP_TOO_MANY_ATTEMPTS'
  | 'INVALID_CREDENTIALS'
  | 'PHONE_NOT_VERIFIED'
  | 'INVALID_REFRESH_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'UNAUTHORIZED'
  | 'USER_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'
  // Client-side codes
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'PARSE_ERROR'
  | 'HTTP_ERROR';

export class ApiError extends Error {
  constructor(
    public readonly code: BackendErrorCode | string,
    message: string,
    public readonly status?: number,
    /** Raw response body from the server, if any. */
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─────────────────────────────────────────────
// Request / response types (mirrors backend schemas exactly)
// ─────────────────────────────────────────────

export type IdentityStatus = 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'FAILED';

// POST /v1/auth/signup
export interface SignupRequest {
  phone: string;
  email?: string;
  password: string;
}
export interface SignupResponse {
  message: string;
}

// POST /v1/auth/otp/send
export interface OtpSendRequest {
  phone: string;
}
export interface OtpSendResponse {
  message: string;
}

// POST /v1/auth/otp/verify
export interface OtpVerifyRequest {
  phone: string;
  code: string; // exactly 6 digits
}
export interface OtpVerifyResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
}

// POST /v1/auth/login
export interface LoginRequest {
  phone: string;
  password: string;
}
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phone: string;
    email: string | null;
    identityStatus: IdentityStatus;
  };
}

// POST /v1/auth/refresh
export interface RefreshRequest {
  refreshToken: string;
}
export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

// POST /v1/auth/logout
export interface LogoutRequest {
  refreshToken: string;
}
export interface LogoutResponse {
  message: string;
}

// GET /v1/me
export interface MeResponse {
  id: string;
  phone: string;
  email: string | null;
  phoneVerified: boolean;
  identityStatus: IdentityStatus;
  createdAt: string;
}

// ─────────────────────────────────────────────
// Core HTTP client
// ─────────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Signal a 401 that could not be recovered.
 * Root layout watches `globalThis.UNAUTHORIZED_EVENT` and redirects to auth.
 */
function notifyUnauthorized() {
  if (typeof globalThis !== 'undefined') {
    (globalThis as Record<string, unknown>).UNAUTHORIZED_EVENT = Date.now();
  }
}

/** Parse the backend error envelope `{ error: { code, message, details } }` */
function parseBackendError(body: unknown, status: number): ApiError {
  if (
    body !== null &&
    typeof body === 'object' &&
    'error' in body &&
    typeof (body as Record<string, unknown>).error === 'object'
  ) {
    const err = (body as { error: Record<string, unknown> }).error;
    return new ApiError(
      (err.code as string) ?? 'HTTP_ERROR',
      (err.message as string) ?? 'Something went wrong',
      status,
      (err.details as Record<string, unknown>) ?? {},
    );
  }
  return new ApiError('HTTP_ERROR', 'Request failed', status);
}

interface RequestOptions {
  /** When true the request attaches the stored access token and handles
   *  transparent refresh on TOKEN_EXPIRED. */
  authenticated?: boolean;
  /** Milliseconds before the request is aborted. Defaults to 30 s. */
  timeout?: number;
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: object,
  options: RequestOptions = {},
): Promise<T> {
  const { authenticated = false, timeout = DEFAULT_TIMEOUT_MS } = options;

  const execute = async (accessToken?: string | null): Promise<T> => {
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), timeout);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-platform': Platform.OS,
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    let response: Response;
    try {
      response = await fetch(`${ENV.BASE_URL}${path}`, {
        method,
        headers,
        body: method !== 'GET' && body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timerId);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ApiError('TIMEOUT', 'Request timed out. Please try again.');
      }
      throw new ApiError('NETWORK_ERROR', 'Network unavailable. Check your connection.');
    } finally {
      clearTimeout(timerId);
    }

    // Parse body regardless of status so we can read error details
    let data: unknown;
    const contentType = response.headers.get('content-type') ?? '';
    try {
      data = contentType.includes('application/json')
        ? await response.json()
        : await response.text();
    } catch {
      throw new ApiError('PARSE_ERROR', 'Invalid response from server.', response.status);
    }

    if (!response.ok) {
      throw parseBackendError(data, response.status);
    }

    return data as T;
  };

  if (!authenticated) {
    return execute();
  }

  // ── Authenticated flow ──────────────────────────────────────────────────
  const accessToken = await TokenStorage.getAccessToken();

  try {
    return await execute(accessToken);
  } catch (err) {
    if (!(err instanceof ApiError)) throw err;

    // TOKEN_EXPIRED or UNAUTHORIZED → try a silent refresh once
    if (err.code === 'TOKEN_EXPIRED' || (err.status === 401 && err.code === 'UNAUTHORIZED')) {
      const refreshToken = await TokenStorage.getRefreshToken();
      if (!refreshToken) {
        await TokenStorage.clearTokens();
        notifyUnauthorized();
        throw err;
      }

      let refreshed: RefreshResponse;
      try {
        refreshed = await request<RefreshResponse>(
          'POST',
          '/auth/refresh',
          { refreshToken },
          { authenticated: false },
        );
      } catch {
        // Refresh failed → force logout
        await TokenStorage.clearTokens();
        notifyUnauthorized();
        throw new ApiError('UNAUTHORIZED', 'Session expired. Please log in again.', 401);
      }

      // Persist rotated tokens
      await TokenStorage.saveTokens(refreshed.accessToken, refreshed.refreshToken);

      // Retry the original request with the new access token
      return execute(refreshed.accessToken);
    }

    throw err;
  }
}

// ─────────────────────────────────────────────
// Named API methods
// ─────────────────────────────────────────────

/**
 * `api` is the single entry point for all network calls in the app.
 *
 * @example
 * // Sign in
 * const { accessToken, refreshToken, user } = await api.auth.login({
 *   phone: '+2348012345678',
 *   password: 'Secret123',
 * });
 *
 * // Get current user (protected)
 * const me = await api.me();
 */
export const api = {
  auth: {
    /**
     * Create a new account.
     * On success the backend sends an OTP to the phone — proceed to `otp.verify`.
     */
    signup: (body: SignupRequest) =>
      request<SignupResponse>('POST', '/auth/signup', body),

    /**
     * (Re)send an OTP to a registered phone number.
     * Safe to call without knowing if the number exists — the response is
     * identical either way to prevent enumeration.
     */
    sendOtp: (body: OtpSendRequest) =>
      request<OtpSendResponse>('POST', '/auth/otp/send', body),

    /**
     * Verify the 6-digit OTP.
     * Returns tokens — save them with `TokenStorage.saveTokens`.
     */
    verifyOtp: (body: OtpVerifyRequest) =>
      request<OtpVerifyResponse>('POST', '/auth/otp/verify', body),

    /**
     * Sign in with phone + password.
     * Returns tokens + user profile — save tokens with `TokenStorage.saveTokens`.
     * Throws `PHONE_NOT_VERIFIED` (403) if the account exists but OTP was never completed.
     */
    login: (body: LoginRequest) =>
      request<LoginResponse>('POST', '/auth/login', body),

    /**
     * Rotate the refresh token.
     * Called automatically by the request client on TOKEN_EXPIRED — you rarely
     * need to call this directly.
     */
    refresh: (body: RefreshRequest) =>
      request<RefreshResponse>('POST', '/auth/refresh', body),

    /**
     * Revoke the refresh token (sign out server-side).
     * Always succeeds regardless of whether the token was already revoked.
     */
    logout: (body: LogoutRequest) =>
      request<LogoutResponse>('POST', '/auth/logout', body),
  },

  /**
   * Fetch the authenticated user's profile.
   * Protected — requires a valid access token.
   * The client handles transparent refresh automatically.
   */
  me: () => request<MeResponse>('GET', '/me', undefined, { authenticated: true }),
};

// ─────────────────────────────────────────────
// Re-export the raw `request` function for any
// future endpoints that aren't in `api` yet.
// ─────────────────────────────────────────────
export { request };
