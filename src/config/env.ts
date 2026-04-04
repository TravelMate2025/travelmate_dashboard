import auth from "./auth";
import api from "./api";
import links from "./links";

const inProduction: boolean =
  process.env.NEXT_PUBLIC_ENVIRONMENT !== "production" ? false : true;

const env = {
  api: api(),
  auth: auth({ inProduction }),
  links: links({ inProduction }),
};

export default env;
