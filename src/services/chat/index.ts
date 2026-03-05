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
  getChatAdmins(url?: string) {
    return instance.get(url || env.api.chatAdmins);
  }

  getAllChats(url?: string) {
    const endpoint = url || env.api.chat;
    return instance.get(endpoint);
  }

  getChat({ id }: { id: string }) {
    return instance.get(env.api.chat + id + "/");
  }

  getChatMessages({ id }: { id: number }) {
    return instance.get(env.api.chat + "/" + id);
  }

  sendChatMessage(payload: FormData) {
    return instance.post(env.api.chatMessages, payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  downloadChatAttachment({ id }: { id: string | number }) {
    return instance.get(`${env.api.chatMessages}${id}/download_attachment/`, {
      responseType: "blob",
    });
  }

  claimChat({ id }: { id: string | number }) {
    return instance.post(env.api.chat + id + "/claim/");
  }

  closeChat({ id }: { id: number }) {
    return instance.post(env.api.chat  + id + "/close/");
  }

  deleteFaq({ id }: { id: number }) {
    return instance.delete(env.api.faq + "/" + id);
  }

  uploadAttachment(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return instance.post(env.api.upload, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }
}

const ChatService = new Service();
export default ChatService;
