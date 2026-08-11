"use client";
import { useEffect, type Dispatch, type SetStateAction } from "react";
import env from "@/config/env";
import {
  readStoredAuthState,
  writeStoredAuthState,
} from "@/lib/auth-session";
import { TAppState } from "@/types";

const INITIAL_APP_STATE = env?.auth?.INITIAL_APP_STATE;

const usePersistAppContext = ({
  appState,
  setAppState = () => null,
}: {
  appState?: TAppState;
  setAppState?: Dispatch<SetStateAction<TAppState>>;
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
