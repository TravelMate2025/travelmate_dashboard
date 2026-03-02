"use client";
import React, {
  useState,
  createContext,
  SetStateAction,
  Dispatch,
  useContext,
} from "react";
import usePersistAppContext from "@/hooks/context/auth/usePersistAuthContext";

import useAxiosDefaults from "@/hooks/initializers/useAxiosDefaults";
import env from "@/config/env";

import { TAuthContextProps, TAppState } from "@/types";

type UpdateAppStateFunction = Dispatch<SetStateAction<TAppState>>;

const AuthContext = createContext<TAppState>(env.auth.INITIAL_APP_STATE);
const AuthUpdateContext = createContext<UpdateAppStateFunction>(() => {});

// Ensure INITIAL_APP_STATE is defined correctly
const INITIAL_APP_STATE = {
  user: null,
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
  const [appState, setAppState] = useState<TAppState>(INITIAL_APP_STATE);

  usePersistAppContext({ appState, setAppState });

  function updateAppState(
    value: TAppState | ((prevState: TAppState) => TAppState)
  ): void {
    setAppState({ ...appState, ...value });
  }

  return (
    <AuthContext.Provider value={appState}>
      <AuthUpdateContext.Provider value={updateAppState}>
        {children}
      </AuthUpdateContext.Provider>
    </AuthContext.Provider>
  );
}
