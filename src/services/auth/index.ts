import axios from "axios";
import env from "@/config/env";
import {
  AuthInterface,
  TLoginService,
  TNewPassword,
  TResendResetToken,
  TResetPassword,
  TVerifyOTP,
} from "./types";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const joinUrl = (base: string, path: string) => {
  const normalizedBase = trimTrailingSlash(base || "");
  const normalizedPath = path.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
};

class Service implements AuthInterface {
  async login({ payload }: TLoginService) {
    const email = payload?.email ?? "";
    const password = payload?.password ?? "";

    const endpointCandidates = [
      env.api.loginSuperuser,
      env.api.authToken,
      joinUrl(env.api.auth, "jwt/login-superuser/"),
      joinUrl(env.api.superadmin, "login-superuser/"),
      joinUrl(env.api.auth, "jwt/create/"),
    ];

    const payloadCandidates = [
      { email, password },
      { username: email, password },
    ];

    let lastError: unknown;

    for (const endpoint of endpointCandidates) {
      for (const candidatePayload of payloadCandidates) {
        try {
          return await axios.post(endpoint, candidatePayload);
        } catch (error: unknown) {
          lastError = error;
          const status = axios.isAxiosError(error) ? error.response?.status : undefined;

          if (status === 400 || status === 401 || status === 403) {
            throw error;
          }
        }
      }
    }

    throw lastError;
  }
  resetPassword({ payload }: TResetPassword) {
    return axios.post(env.api.user + "/reset_password/", payload);
  }
  verifyToken({ payload }: TVerifyOTP) {
    return axios.post(env.api.user + "/validate_reset_token/", payload);
  }
  resendResetToken({ payload }: TResendResetToken) {
    return axios.post(env.api.user + "/resend_reset_token/", payload);
  }
  newPassword({ payload }: TNewPassword) {
    return axios.post(env.api.user + "/set_new_password/", payload);
  }
}

const AuthService = new Service();
export default AuthService;
