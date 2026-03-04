import { useState } from "react";
import { showErrorToast, showSuccessToast } from "@/utils/toasters";
import { useUpdateAuthContext } from "@/context/AuthContext";
import env from "@/config/env";
import axios, { AxiosError } from "axios";
import { AuthInterface } from "@/services/auth/types";
import instance from "@/hooks/initializers/useAxiosDefaults";

const getAuthErrorPayload = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as
      | {
          message?: string;
          Message?: string;
          detail?: string;
          description?: string;
          email?: string | { Message?: string }[];
          token?: string | string[];
        }
      | undefined) ?? {};
  }
  return {};
};

export const useLoginUser = ({ Service }: { Service: AuthInterface }) => {
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const updateAppState = useUpdateAuthContext();

  const onLogin = async ({
    payload,
    successCallback,
  }: {
    payload: { email: string; password: string };
    successCallback?: () => void;
  }) => {
    setLoading(true);
    try {
      const res = await Service.login({ payload });

      const user = {
        user_id: res.data.user_id,
        email: res.data.email,
        name: res.data.name,
        isSuperuser: res.data.is_superuser,
        isAdmin: res.data.is_admin,
      };

      // ✅ Store tokens securely in cookies (server handles httpOnly)
      await fetch("/api/auth/set-cookies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: res.data.access,
          refreshToken: res.data.refresh,
        }),
      });


      updateAppState({
        accessToken: res.data.access,
        refreshToken: res.data.refresh,
        user, // tokens will be read later from cookies
      });

      showSuccessToast({
        message: res.data.message || "🚀 Login success!",
        description: res.data.description || "",
      });

      successCallback?.();
      setRedirecting(true);
    } catch (error: unknown) {
      const payload = getAuthErrorPayload(error);
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const backendMessage =
        payload.message ||
        payload.Message ||
        payload.detail ||
        (error instanceof Error ? error.message : undefined) ||
        "An error occurred!";

      if (status === 400) {
        showErrorToast({
          message: backendMessage || "Invalid credentials!",
        });
      } else {
        showErrorToast({
          message: backendMessage,
          description: payload.description || "",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return { loading, onLogin, redirecting };
};

export function useForgotPassword({ Service }: { Service: AuthInterface }) {
  const [loading, setLoading] = useState(false);

  const onForgotPassword = async ({
    payload,
    successCallback,
    errorCallback,
  }: {
    payload: { email: string };
    successCallback?: (message: string) => void;
    errorCallback?: (props: { message?: string; description?: string }) => void;
  }) => {
    setLoading(true);
    try {
      const res = await Service.resetPassword({ payload });
      showSuccessToast({
        message: res?.data?.message || "Email sent successfully.",
        description: res.data.description || "",
      });
      successCallback?.(res?.data?.message || "Email sent successfully.");
    } catch (error: unknown) {
      const payload = getAuthErrorPayload(error);
      showErrorToast({
        message:
          (Array.isArray(payload.email)
            ? payload.email?.[0]?.Message
            : undefined) || "An error occured",
      });
    } finally {
      setLoading(false);
    }
  };

  return { loading, onForgotPassword };
}

export function useLogout() {
  const updateAppState = useUpdateAuthContext();

  const onLogout = async () => {
    try {
      await instance.post(env.api.usersLogout).catch(() => null);

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      const INITIAL_APP_STATE = {
        accessToken: undefined,
        refreshToken: undefined,
        user: undefined,
      };

      updateAppState(INITIAL_APP_STATE);

      // Redirect to login
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return { onLogout };
}


export function useVerifyOtp({ Service }: { Service: AuthInterface }) {
  const [loading, setLoading] = useState(false);

  const onVerifyToken = async ({
    payload,
    successCallback,
    errorCallback,
  }: {
    payload: { email: string; token: string };
    successCallback?: (message: string) => void;
    errorCallback?: (props: { message?: string; description?: string }) => void;
  }) => {
    setLoading(true);
    try {
      const res = await Service.verifyToken({ payload });
      showSuccessToast({
        message: res?.data?.message || "Token verified Successfully",
        description: res.data.description || "",
      });
      successCallback?.(res?.data?.message || "Token verified successfully");
    } catch (error: unknown) {
      const payload = getAuthErrorPayload(error);
      showErrorToast({
        message: (Array.isArray(payload.token) ? payload.token?.[0] : undefined) || "Invalid credentials!",
      });
    } finally {
      setLoading(false);
    }
  };

  return { loading, onVerifyToken };
}

export function useNewPassword({ Service }: { Service: AuthInterface }) {
  const [loading, setLoading] = useState(false);

  const onNewPassword = async ({
    payload,
    successCallback,
    errorCallback,
  }: {
    payload: {
      email: string;
      otp: string;
      new_password: string;
      re_new_password: string;
    };
    successCallback?: (message: string) => void;
    errorCallback?: (error: { message: string; description?: string }) => void;
  }) => {
    setLoading(true);
    try {
      const response = await Service.newPassword({ payload });
      showSuccessToast({
        message: response.data.message || "🚀 Password Reset successful!",
        description: response.data.description || "",
      });
      successCallback?.(response.data.message);
    } catch (error: unknown) {
      const payload = getAuthErrorPayload(error);
      errorCallback?.({
        message: (typeof payload.email === "string" ? payload.email : undefined) || "An error occurred!",
        description: payload.description || "",
      });
    } finally {
      setLoading(false);
    }
  };

  return { loading, onNewPassword };
}

export function useResendOTP({ Service }: { Service: AuthInterface }) {
  const [loadingReset, setLoading] = useState(false);

  const onResendPassword = async ({
    payload,
    successCallback,
    errorCallback,
  }: {
    payload: { email: string };
    successCallback?: (message: string) => void;
    errorCallback?: (props: { message?: string; description?: string }) => void;
  }) => {
    setLoading(true);
    try {
      const res = await Service.resendResetToken({ payload });
      showSuccessToast({
        message:
          res?.data?.message ||
          "Password reset token has been sent to your email",
      });
      successCallback?.(res?.data?.message || "Token verified successfully");
    } catch (error: unknown) {
      const payload = getAuthErrorPayload(error);
      const errorMessage =
        (typeof payload.token === "string" ? payload.token : undefined) ||
        "An error occurred!";
      const errorDescription = payload.description;

      // Show error toast
      showErrorToast({
        message: errorMessage,
        description: errorDescription,
      });

      errorCallback?.({
        message: errorMessage,
        description: errorDescription,
      });
    } finally {
      setLoading(false);
    }
  };

  return { loadingReset, onResendPassword };
}
