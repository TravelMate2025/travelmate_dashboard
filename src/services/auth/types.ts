import { AxiosResponse } from "axios";

export type AuthResponse = {
  access?: string;
  refresh?: string;
  user_id?: number | string;
  email?: string;
  name?: string;
  is_superuser?: boolean;
  is_admin?: boolean;
  message?: string;
  description?: string;
};

export type TLoginService = {
  payload: {
    email?: string;
    password?: string;
  };
};

export type TResendResetToken = {
  payload: {
    email?: string;
  };
};

export type TResetPassword = {
  payload: {
    email?: string;
  };
};
export type TVerifyOTP = {
  payload: {
    email?: string;
    token?: string;
  };
};
export type TNewPassword = {
  payload?: {
    email?: string;
    token?: string;
    new_password?: string;
    re_new_password?: string;
  };
};

export interface AuthInterface {
  login: ({ payload }: TLoginService) => Promise<AxiosResponse<AuthResponse>>;
  resetPassword: ({
    payload,
  }: TResetPassword) => Promise<AxiosResponse<AuthResponse>>;
  newPassword: ({ payload }: TNewPassword) => Promise<AxiosResponse<AuthResponse>>;
  verifyToken: ({ payload }: TVerifyOTP) => Promise<AxiosResponse<AuthResponse>>;
  resendResetToken: ({
    payload,
  }: TResendResetToken) => Promise<AxiosResponse<AuthResponse>>;
}
