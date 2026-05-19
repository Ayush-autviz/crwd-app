import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/store';

interface WebSocketMessage {
  type: string;
  data: any;
}

// Automatically match socket host based on environment API URL configuration
const getSocketHost = () => {
  // Can be configured to match stage-api or production depending on target backend
  return 'crwdfund.org/';
};

export function useChatSocket(conversationId: string | null, onMessageReceived: (message: any) => void) {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token } = useAuthStore();

  useEffect(() => {
    if (!conversationId || conversationId.startsWith('new-') || !token?.access_token) {
      return;
    }

    const socketHost = getSocketHost();
    const wsUrl = `wss://${socketHost}ws/chat/${conversationId}/?token=${token.access_token}`;

    const connect = () => {
      console.log(`Connecting to WebSocket: ${wsUrl}`);
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          if (message.type === 'new_message') {
            onMessageReceived(message.data);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      socket.onclose = (event) => {
        console.log('WebSocket disconnected', event?.reason);
        setIsConnected(false);
      };

      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
        socket.close();
      };

      socketRef.current = socket;
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [conversationId, token?.access_token]);

  const sendMessage = (content: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'send_message',
        data: { content }
      }));
    } else {
      console.error('WebSocket is not connected');
    }
  };

  return { isConnected, sendMessage };
}
