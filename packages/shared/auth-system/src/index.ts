export type {
  AuthState,
  AuthErrorCode,
  AuthAction,
  OTPPayload,
  PasswordPolicyResult
} from "./auth-types";
export { AUTH_ERROR_CODES, AUTH_ACTIONS, OTP_RULES } from "./auth-constants";
export { mapAuthErrorToUserMessage, normalizeAuthError } from "./error-policy";
export { AUTH_MSG, type AuthMessageCode } from "./messages";
export {
  authUserExistsInSupabase,
  authUserExistsInSupabaseFromProcessEnv,
  type SupabaseAuthEnv
} from "./supabase-admin";
export { normalizeAuthEmail, isValidAuthEmailFormat, isEmailFormatValid } from "./email";
export {
  MIN_SIGNUP_PASSWORD_LENGTH,
  meetsSignupPasswordPolicy,
  evaluateSignupPassword,
  normalizeOtpDigits,
  normalizeEmailOtpDigits,
  isOtpValidFormat,
  isSupabaseEmailNotConfirmedError
} from "./policy";
export { mapSessionResponseToIdentity, type AccountIdentity } from "./session-identity";
export { sessionGateFromHttpResponse, type SessionGateSnapshot } from "./session-gate";
export {
  type AuthStatus,
  type UiIdentity,
  type ResolvedAuthFromGate,
  type ResolveAuthFromGateOptions,
  accountIdentityToUi,
  uiIdentityIsValid,
  resolveAuthFromGate
} from "./state-machine";
export { isVerifiedAccount } from "./verification-policy";
