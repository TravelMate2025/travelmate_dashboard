"use client";

import env from "@/config/env";
import { TAppState } from "@/types";

const PERSIST_AUTH_KEY = env?.auth?.PERSIST_AUTH_KEY;
const INITIAL_APP_STATE = env?.auth?.INITIAL_APP_STATE as TAppState;

export const readStoredAuthState = (): TAppState => {
  if (typeof window === "undefined") {
    return INITIAL_APP_STATE;
  }

  try {
    const value = window.localStorage.getItem(PERSIST_AUTH_KEY);
    return value ? JSON.parse(value) : INITIAL_APP_STATE;
  } catch {
    return INITIAL_APP_STATE;
  }
};

export const writeStoredAuthState = (value: TAppState) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PERSIST_AUTH_KEY, JSON.stringify(value));
  } catch {}
};

export const clearStoredAuthState = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(PERSIST_AUTH_KEY);
};

export const syncAuthSession = async (value: TAppState) => {
  writeStoredAuthState(value);

  if (!value.accessToken || !value.refreshToken) {
    return;
  }

  await fetch("/api/auth/set-cookies", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      accessToken: value.accessToken,
      refreshToken: value.refreshToken,
      isAdmin: value.user?.isAdmin,
      isSuperuser: value.user?.isSuperuser,
    }),
  });
};

export const clearAuthSession = async () => {
  clearStoredAuthState();

  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
};
