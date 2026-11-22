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
import usePersistAppContext from "@/hooks/context/auth/usePersistAuthContext";
import instance from "@/hooks/initializers/useAxiosDefaults";
import { clearAuthSession, syncAuthSession } from "@/lib/auth-session";

import env from "@/config/env";

import { TAuthContextProps, TAppState } from "@/types";

type UpdateAppStateFunction = Dispatch<SetStateAction<TAppState>>;

const AuthContext = createContext<TAppState>(env.auth.INITIAL_APP_STATE);
const AuthUpdateContext = createContext<UpdateAppStateFunction>(() => {});
const EMPTY_AUTH_STATE: TAppState = {
  accessToken: undefined,
  refreshToken: undefined,
  user: undefined,
};

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
    env.auth.INITIAL_APP_STATE
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

  const clearAuthState = () => {
    void clearAuthSession().catch(() => null);
    updateAppState(EMPTY_AUTH_STATE);
  };

  useEffect(() => {
    const accessToken = appState?.accessToken;
    const refreshToken = appState?.refreshToken;

    if (!refreshToken && !accessToken) {
      return;
    }

    if (accessToken && lastVerifiedTokenRef.current === accessToken) {
      return;
    }

    let isCancelled = false;

    const verifyAndRefreshIfNeeded = async () => {
      try {
        if (!accessToken) {
          throw new Error("Missing access token");
        }

        await instance.post(env.api.jwtVerifyToken, { token: accessToken }, { withCredentials: true });
        lastVerifiedTokenRef.current = accessToken;
      } catch {
        if (!refreshToken) {
          if (!isCancelled) {
            clearAuthState();
          }
          return;
        }

        try {
          const refreshResponse = await instance.post(
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
            const nextState = {
              ...appState,
              accessToken: refreshedAccessToken,
              refreshToken: refreshedRefreshToken,
            };

            updateAppState(nextState);
            void syncAuthSession(nextState).catch(() => null);

            lastVerifiedTokenRef.current = refreshedAccessToken;
          }
        } catch {
          if (!isCancelled) {
            clearAuthState();
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
