import React, { createContext, useContext, ReactNode } from "react";
import { useNotificationSocket } from "../hooks/useNotificationSocket";

interface NotificationContextType {
  markAsRead: (conversationId: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { markAsRead } = useNotificationSocket();

  return (
    <NotificationContext.Provider value={{ markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};
