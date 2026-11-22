"use client";
import { useEffect } from "react";
import env from "@/config/env";
import {
  readStoredAuthState,
  writeStoredAuthState,
} from "@/lib/auth-session";

const INITIAL_APP_STATE = env?.auth?.INITIAL_APP_STATE;

const usePersistAppContext = ({
  appState,
  setAppState = () => null,
}: {
  appState?: unknown;
  setAppState?: (value: unknown) => void;
}) => {
  useEffect(() => {
    setAppState(readStoredAuthState());
  }, []);

  useEffect(() => {
    if (appState !== INITIAL_APP_STATE) {
      writeStoredAuthState(appState as typeof INITIAL_APP_STATE);
    }
  }, [appState]);

  return null;
};

export const getInitialStateFromLocalStorage = () => {
  return readStoredAuthState();
};

export default usePersistAppContext;
