import React, { createContext, useContext, useState } from 'react';
import { Toast } from '../components/Toast';

interface ToastContextType {
  showToast: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState('');
  const [show, setShow] = useState(false);
  const [duration, setDuration] = useState(1500);

  const showToast = (msg: string, dur: number = 1500) => {
    setMessage(msg);
    setDuration(dur);
    setShow(true);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        message={message}
        show={show}
        duration={duration}
        onHide={() => setShow(false)}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext); 