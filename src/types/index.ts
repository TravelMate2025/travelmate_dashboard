
export interface User {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface AdminInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Message {
  id: string;
  clientMessageId?: number;
  message: string;
  content?: string;
  sender_id: string;
  sender_info?: User | AdminInfo;
  attachment_url?: string;
  attachment_type?: "image" | "video" | "audio" | "file" | "other";
  created_at: string;
  uploading?: boolean;
}

export interface Chat {
  id: string;
  status: "OPEN" | "CLOSED" | "RESOLVED";
  created_at: string;
  user_info: User;
  assigned_admin_info: AdminInfo | null;
  claimed_by_info: AdminInfo | null;
  messages: Message[];
}

export interface MainChatComponentsProps {
  sessionId: string;
  accessToken: string;
}

export interface SessionProps {
  chat: Chat | null;
  loadingChat: boolean;
  currentUser: string;
  accessToken: string;
}

export interface MyRolesData {
  current_permission_group_slugs?: string[];
}

export interface ChatMessage extends Message {
  type?: "session_info" | "error";
}
