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

  claimChat({
    id,
    payload,
  }: {
    id: string | number;
    payload?: { title?: string };
  }) {
    return instance.post(env.api.chat + id + "/claim/", payload || {});
  }

  closeChat({
    id,
    payload,
  }: {
    id: string | number;
    payload?: { title?: string };
  }) {
    return instance.post(env.api.chat + id + "/close/", payload || {});
  }


  deleteChatSession({ id }: { id: string | number }) {
    return instance.delete(env.api.chat + id + "/delete_session/");
  }

  updateChat({
    id,
    payload,
  }: {
    id: string | number;
    payload: { title?: string };
  }) {
    return instance.put(env.api.chat + id + "/", payload);
  }

  exportChatPdf({ id }: { id: string | number }) {
    return instance.get(env.api.chat + id + "/export_pdf/", {
      responseType: "blob",
    });
  }

  markChatAsRead({
    id,
    payload,
  }: {
    id: string | number;
    payload?: { title?: string };
  }) {
    return instance.post(env.api.chat + id + "/mark_as_read/", payload || {});
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
