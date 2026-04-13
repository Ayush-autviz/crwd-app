// lib/axios.js
import axios from 'axios';
import { useAuthStore } from '../../store/store';
import { reset } from '../../navigation/navigationRef';

const instance = axios.create({
  timeout: 90000,
  withCredentials: true,
});

// const BaseURL = 'https://crwd.autviz.com';
// const BaseURL = 'http://ec2-65-0-54-143.ap-south-1.compute.amazonaws.com:8200';
const BaseURL = 'https://crwdfund.org/api'
// const BaseURL = 'https://stage-api.crwdfund.org/api'


// 🔹 Request Interceptor
instance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token?.access_token;
  config.baseURL = BaseURL;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 🔹 Response Interceptor
instance.interceptors.response.use(
  (response) => {
    console.log('RESPONSE IN INTERCEPTOR', response);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loops
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;

      console.log('403 Forbidden - Trying to refresh token');

      try {
        const authState = useAuthStore.getState();
        const token = authState.token;
        const refresh_token = token?.refresh_token;
        const username = authState.user?.username;

        console.log('Token state:', token);
        console.log('Refresh token:', refresh_token);
        console.log('Username:', username);

        if (!refresh_token) {
          console.error('No refresh token available');
          useAuthStore.getState().logout();
          reset('SplashScreen');
          return Promise.reject(error);
        }

        if (!username) {
          console.error('No username available');
          useAuthStore.getState().logout();
          reset('SplashScreen');
          return Promise.reject(error);
        }

        const res = await axios.post(`${BaseURL}/auth/cognito/refresh/`, {
          refresh_token,
          username,
        });

        console.log('Refresh token response:', res.data);

        // Save new token - preserve refresh_token if response doesn't include it
        const newToken = {
          access_token: res.data.access_token,
          refresh_token: res.data.refresh_token || refresh_token, // Preserve old refresh_token if not in response
        };
        useAuthStore.getState().setToken(newToken);

        // Update Authorization header and retry the failed request
        originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
        return instance(originalRequest);
      } catch (refreshError) {
        console.log('Refresh token failed:', refreshError);
        // Logout and reset to SplashScreen (onboarding) when refresh token fails
        // This clears the navigation stack so user can't go back
        useAuthStore.getState().logout();
        reset('SplashScreen');
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
