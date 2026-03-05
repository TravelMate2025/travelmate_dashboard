import axios from "axios";
import env from "@/config/env";
import instance from "@/hooks/initializers/useAxiosDefaults";

class Service {
  getServices() {
    return instance.get(env.api.cms);
  }
  updateService({ id, payload }: { id: string; payload: Record<string, unknown> }) {
    return instance.patch(env.api.cms + id + "/", payload);
  }
}

const CMSService = new Service();
export default CMSService;
