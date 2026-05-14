import axiosInstance from '../../lib/react-query/axiosClient';

export interface Participant {
  id: number;
  full_name: string;
  profile_picture: string;
  username: string;
  color: string;
}

export interface ConversationResponse {
  id: number;
  participants: Participant[];
  last_message: {
    id: number;
    sender: Participant;
    content: string;
    created_at: string;
    entity_type?: string | null;
  };
  unread_count: number;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface MessageResponse {
  id: number;
  sender: Participant;
  content: string;
  entity_type: string | null;
  entity_id: number | null;
  entity_data: any | null;
  is_read: boolean;
  created_at: string;
}

export const getConversations = async (): Promise<PaginatedResponse<ConversationResponse>> => {
  const response = await axiosInstance.get('/chat/conversations/');
  return response.data;
};

export const searchConversations = async (query: string): Promise<PaginatedResponse<ConversationResponse>> => {
  const response = await axiosInstance.get(`/chat/conversations/search/?q=${query}`);
  return response.data;
};

export const getMessages = async (conversationId: string, page: number = 1): Promise<PaginatedResponse<MessageResponse>> => {
  const response = await axiosInstance.get(`/chat/conversations/${conversationId}/messages/?page=${page}`);
  return response.data;
};

export const sendChatMessage = async (formData: FormData) => {
  const response = await axiosInstance.post('/chat/messages/send/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getOrCreateConversation = async (userId: string): Promise<ConversationResponse> => {
  const response = await axiosInstance.post(`/chat/conversations/${userId}`);
  return response.data;
};
