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

type TUpdateFaq = {
  id: number;
  payload: {
    category?: number;
    question?: string;
    answer?: string;
    is_active?: boolean;
  };
};

type TAddFaqCategory = {
  payload: {
    name: "FLIGHTS" | "STAYS" | "CAR_RENTALS" | "ACCOUNT";
    description?: string;
    icon?: string;
    order?: number;
  };
};

type TUpdateFaqCategory = {
  id: number;
  payload: Partial<TAddFaqCategory["payload"]>;
};

class Service {
  getAllFaq() {
    return instance.get(env.api.faqCategories);
  }

  addFaq({ payload }: TAddFaq) {
    return instance.post(env.api.faq + "/", payload);
  }

  updateFaq({ id, payload }: TUpdateFaq) {
    return instance.put(env.api.faq + "/" + id + "/", payload);
  }

  patchFaq({ id, payload }: TUpdateFaq) {
    return instance.patch(env.api.faq + "/" + id + "/", payload);
  }

  addFaqCategory({ payload }: TAddFaqCategory) {
    return instance.post(env.api.faqCategories, payload);
  }

  updateFaqCategory({ id, payload }: TUpdateFaqCategory) {
    return instance.patch(env.api.faqCategories + id + "/", payload);
  }

  deleteFaqCategory({ id }: { id: number }) {
    return instance.delete(env.api.faqCategories + id + "/");
  }

  deleteFaq({ id }: { id: number }) {
    return instance.delete(env.api.faq + "/" + id + "/");
  }
}
const FaqService = new Service();
export default FaqService;
