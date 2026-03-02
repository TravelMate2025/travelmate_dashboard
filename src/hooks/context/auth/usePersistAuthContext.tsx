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
  appState?: any;
  setAppState?: any;
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


export default usePersistAppContext;
