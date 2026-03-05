"use client";
import { useEffect } from "react";
import env from "@/config/env";

import { saveToLocalStorage, getFromLocalStorage } from "@/utils/localStorage/AsyncStorage";

const PERSIST_AUTH_KEY = env?.auth?.PERSIST_AUTH_KEY;
const INITIAL_APP_STATE = env?.auth?.INITIAL_APP_STATE;

const usePersistAppContext = ({
  appState,
  setAppState = () => null,
}: {
  appState?: unknown;
  setAppState?: (value: unknown) => void;
}) => {
  useEffect(() => {
    getFromLocalStorage({ cb: setAppState, key: PERSIST_AUTH_KEY });
  }, []);

  useEffect(() => {
    if (appState !== INITIAL_APP_STATE) {
      saveToLocalStorage({
        key: PERSIST_AUTH_KEY,
        value: appState,
      });
    }
  }, [appState]);

  return null;
};

export const getInitialStateFromLocalStorage = () => {
  const storage = typeof window !== "undefined" ? window.localStorage : null;

  const value = storage?.getItem(PERSIST_AUTH_KEY);
  return value ? JSON.parse(value) : INITIAL_APP_STATE;
};

export default usePersistAppContext;
