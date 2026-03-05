import axios from "axios";
import env from "@/config/env";
import instance from "@/hooks/initializers/useAxiosDefaults";

class Service {
  getRoles() {
    return instance.get(env.api.superadminRoles);
  }
  getMyRole() {
    return instance.get(env.api.myRoles);
  }
}

const RolesService = new Service();
export default RolesService;
