import axios from "axios";
import env from "@/config/env";
import instance from "@/hooks/initializers/useAxiosDefaults";
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
    return instance.post(env.api.user + "/reset_password/", payload);
  }
  verifyToken({ payload }: TVerifyOTP) {
    return instance.post(env.api.user + "/validate_reset_token/", payload);
  }
  resendResetToken({ payload }: TResendResetToken) {
    return instance.post(env.api.user + "/resend_reset_token/", payload);
  }
  newPassword({ payload }: TNewPassword) {
    return instance.post(env.api.user + "/set_new_password/", payload);
  }
}

const AuthService = new Service();
export default AuthService;
