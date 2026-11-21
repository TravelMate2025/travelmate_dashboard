import axios from "axios";
import env from "@/config/env";
import instance from "@/hooks/initializers/useAxiosDefaults";

type TDeactivatePayload = {
  email: string;
  reason?: string;
  additional_note?: string;
};

class Service {
  getAllUser = (url?: string) => {
    const endpoint = url || env.api.users;
    return instance.get(endpoint);
  };

  getUser({ UserId }: { UserId?: string }) {
    return instance.get(env.api.users + UserId + "/");
  }

  deactivateUser({ userId, data }: { userId?: string | number; data: TDeactivatePayload }) {
    return instance.patch(env.api.users + userId + "/deactivate/", data);
  }

  reactivateUser({ userId, data }: { userId?: string | number; data: TDeactivatePayload }) {
    return instance.patch(env.api.users + userId + "/activate/", data);
  }

  deleteUser({ userId }: { userId?: string }) {
    return instance.delete(env.api.users + userId + "/");
  }

  bulkDeleteUser({ userIds }: { userIds: number[] }) {
    return instance.delete(env.api.users + "bulk-delete/", {
      data: { user_ids: userIds },
    });
  }

  exportCSV() {
    return instance.get(env.api.users + "export/", {
      responseType: "blob",
    });
  }
}

const UserService = new Service();
export default UserService;
