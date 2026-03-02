const auth = () => {
  return {
    PERSIST_AUTH_KEY: "TRAVELMATE_APP_PERSISTOR",
    INITIAL_APP_STATE: {
      accessToken: "",
      refreshToken: "",
      expiresIn: undefined,
      user: undefined,
    },
  };
};

export default auth;
