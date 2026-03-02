import auth from "./auth";
import api from "./api";
import links from "./links";

const inProduction: boolean =
  process.env.NEXT_PUBLIC_ENVIRONMENT === "production";

const env = {
  api: api({ inProduction }),
  auth: auth(),
  links: links(),
};

export default env;
