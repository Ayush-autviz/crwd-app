export interface Conversation {
  id: string;
  participantId?: string;
  user: {
    name: string;
    avatar: string;
    color?: string;
  };
  lastMessage: string;
  timestamp: string;
  unread?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: 'me' | 'other';
  text: string;
  timestamp: string;
  date?: string;
  type?: 'text' | 'card' | 'image' | 'video';
  mediaUrl?: string;
  cardData?: {
    type?: string;
    id?: string | number;
    title: string;
    description: string;
    image: string;
    icon: string;
    avatar?: string;
    likesCount?: number;
    commentsCount?: number;
    color?: string;
    sortName?: string;
    username?: string;
  };
  isRead?: boolean;
}
