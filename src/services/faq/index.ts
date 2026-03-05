import axios from "axios";
import env from "@/config/env";
import instance from "@/hooks/initializers/useAxiosDefaults";

type TAddFaq = {
  payload: {
    category: number;
    question: string;
    answer: string;
    is_active: boolean;
  };
};

class Service {
  getAllFaq() {
    return instance.get(env.api.faq + "/categories/");
  }

  addFaq({ payload }: TAddFaq) {
    return instance.post(env.api.faq + "/", payload);
  }

  deleteFaq({ id }: { id: number }) {
    return instance.delete(env.api.faq + "/" + id + "/");
  }
}
const FaqService = new Service();
export default FaqService;
