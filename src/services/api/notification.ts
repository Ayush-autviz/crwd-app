import axiosClient from "../../lib/react-query/axiosClient";

// Notifications API endpoints
export const getNotifications = async () => {
    const response = await axiosClient.get('/notifications/');
    return response.data;
};

export const markNotificationAsRead = async (id: string | number) => {
    const response = await axiosClient.put(`/notifications/${id}/read/`);
    return response.data;
};

export const patchNotificationAsRead = async (id: string | number) => {
    const response = await axiosClient.patch(`/notifications/${id}/read/`);
    return response.data;
};

export const markAllNotificationsAsRead = async () => {
    const response = await axiosClient.post('/notifications/mark-all-read/');
    return response.data;
};

export const registerNotificationToken = async (data: { token: string; device_type?: string }) => {
    const response = await axiosClient.post('/notifications/register-token/', data);
    return response.data;
};

export const unregisterNotificationToken = async () => {
    const response = await axiosClient.delete('/notifications/unregister-token/');
    return response.data;
};

export const getUnreadCount = async () => {
    const response = await axiosClient.get('/notifications/unread-count/')
    return response.data;
};

