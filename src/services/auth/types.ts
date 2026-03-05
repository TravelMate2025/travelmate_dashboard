import { AxiosResponse } from "axios";

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
  login: ({ payload }: TLoginService) => Promise<AxiosResponse<unknown, unknown>>;
  resetPassword: ({
    payload,
  }: TResetPassword) => Promise<AxiosResponse<unknown, unknown>>;
  newPassword: ({ payload }: TNewPassword) => Promise<AxiosResponse<unknown, unknown>>;
  verifyToken: ({ payload }: TVerifyOTP) => Promise<AxiosResponse<unknown, unknown>>;
  resendResetToken: ({
    payload,
  }: TResendResetToken) => Promise<AxiosResponse<unknown, unknown>>;
}
