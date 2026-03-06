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

class Service implements AuthInterface {
  async login({ payload }: TLoginService) {
    return axios.post("/api/auth/login", payload);
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
