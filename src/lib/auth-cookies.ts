const isProduction = process.env.NODE_ENV === "production";

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProduction,
  path: "/",
};

// Match travelmate_backend SIMPLE_JWT:
// ACCESS_TOKEN_LIFETIME = 1 day
// REFRESH_TOKEN_LIFETIME = 3 days
export const accessTokenCookieOptions = {
  ...baseCookieOptions,
  maxAge: 60 * 60 * 24,
};

export const refreshTokenCookieOptions = {
  ...baseCookieOptions,
  maxAge: 60 * 60 * 24 * 3,
};

export const roleCookieOptions = {
  ...baseCookieOptions,
  maxAge: 60 * 60 * 24 * 3,
};

export const clearedCookieOptions = {
  ...baseCookieOptions,
  maxAge: 0,
};
