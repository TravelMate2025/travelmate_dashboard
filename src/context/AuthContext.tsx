"use client";
import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  SetStateAction,
  Dispatch,
  useContext,
} from "react";
import axios from "axios";
import usePersistAppContext, {
  getInitialStateFromLocalStorage,
} from "@/hooks/context/auth/usePersistAuthContext";

import env from "@/config/env";

import { TAuthContextProps, TAppState } from "@/types";

type UpdateAppStateFunction = Dispatch<SetStateAction<TAppState>>;

const AuthContext = createContext<TAppState>(env.auth.INITIAL_APP_STATE);
const AuthUpdateContext = createContext<UpdateAppStateFunction>(() => {});

// TO FETCH CURRENT AUTH_CONTEXT STATE
export function useAuthContext() {
  return useContext(AuthContext);
}

// TO UPDATE AUTH_CONTEXT STATE
export function useUpdateAuthContext() {
  return useContext(AuthUpdateContext);
}

export function AuthContextWrapper({
  children,
}: TAuthContextProps): React.JSX.Element {
  const [appState, setAppState] = useState<TAppState>(
    getInitialStateFromLocalStorage
  );
  const lastVerifiedTokenRef = useRef<string | undefined>(undefined);

  usePersistAppContext({ appState, setAppState });

  function updateAppState(
    value: TAppState | ((prevState: TAppState) => TAppState)
  ): void {
    setAppState((prevState) => {
      const nextState =
        typeof value === "function" ? value(prevState) : value;
      return { ...prevState, ...nextState };
    });
  }

  useEffect(() => {
    const accessToken = appState?.accessToken;
    const refreshToken = appState?.refreshToken;

    if (!accessToken || lastVerifiedTokenRef.current === accessToken) {
      return;
    }

    let isCancelled = false;

    const verifyAndRefreshIfNeeded = async () => {
      try {
        await axios.post(
          env.api.jwtVerifyToken,
          { token: accessToken },
          { withCredentials: true }
        );
        lastVerifiedTokenRef.current = accessToken;
      } catch {
        if (!refreshToken) {
          if (!isCancelled) {
            updateAppState({
              accessToken: undefined,
              refreshToken: undefined,
              user: undefined,
            });
          }
          return;
        }

        try {
          const refreshResponse = await axios.post(
            env.api.jwtRefreshToken,
            { refresh: refreshToken },
            { withCredentials: true }
          );

          const refreshedAccessToken = refreshResponse?.data?.access;
          const refreshedRefreshToken =
            refreshResponse?.data?.refresh ?? refreshToken;

          if (!refreshedAccessToken) {
            throw new Error("Missing refreshed access token");
          }

          if (!isCancelled) {
            updateAppState((prevState) => ({
              ...prevState,
              accessToken: refreshedAccessToken,
              refreshToken: refreshedRefreshToken,
            }));

            fetch("/api/auth/set-cookies", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                accessToken: refreshedAccessToken,
                refreshToken: refreshedRefreshToken,
              }),
            }).catch(() => null);

            lastVerifiedTokenRef.current = refreshedAccessToken;
          }
        } catch {
          if (!isCancelled) {
            updateAppState({
              accessToken: undefined,
              refreshToken: undefined,
              user: undefined,
            });
          }
        }
      }
    };

    verifyAndRefreshIfNeeded();

    return () => {
      isCancelled = true;
    };
  }, [appState?.accessToken, appState?.refreshToken]);

  return (
    <AuthContext.Provider value={appState}>
      <AuthUpdateContext.Provider value={updateAppState}>
        {children}
      </AuthUpdateContext.Provider>
    </AuthContext.Provider>
  );
}
