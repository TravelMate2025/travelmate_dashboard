import { ReactNode } from "react";

export type TAppState = {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: string;
  user?: TUser;
};

export type TAuthContextProps = {
  children: ReactNode;
};

export type TUser = {
  user_id: string;
  email?: string;
  name?: string;
  isAdmin: boolean;
  isSuperuser: boolean;
};
