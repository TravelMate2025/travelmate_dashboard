"use client";
const storage = typeof window !== "undefined" ? window.localStorage : null;

interface SaveToLocalStorageProps {
  key: string;
  value: unknown;
}

export const saveToLocalStorage = ({
  key,
  value,
}: SaveToLocalStorageProps): void => {
  try {
    const jsonValue = JSON.stringify(value);
    storage?.setItem(key, jsonValue);
  } catch (e) {}
};

interface GetFromLocalStorageProps {
  key: string;
  cb?: (value: unknown) => void;
}

export const getFromLocalStorage = ({
  key,
  cb = () => null,
}: GetFromLocalStorageProps): void => {
  try {
    const value = storage?.getItem(key);
    if (value) {
      if (typeof cb === "function") cb(JSON.parse(value));
    }
  } catch (e) {}
};

interface DeleteFromLocalStorageProps {
  key: string;
}

export const deleteFromLocalStorage = ({
  key,
}: DeleteFromLocalStorageProps): void => {
  try {
    storage?.removeItem(key);
  } catch (e) {}
};
