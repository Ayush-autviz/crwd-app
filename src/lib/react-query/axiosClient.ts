// import axios from 'axios';
// import { useAuthStore } from '../../store/store';

// const instance = axios.create({
//   timeout: 90000,
//   withCredentials: true,
// });

// instance.interceptors.request.use((config) => {
//   const token = useAuthStore.getState().token?.access_token;

//   // config.baseURL = 'https://f7ncsbkq-8000.inc1.devtunnels.ms'
//   // config.baseURL = 'https://f7ncsbkq-8000.inc1.devtunnels.ms'
//   config.baseURL = 'https://crwd.autviz.com'


//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   console.log(token, 'token in interceptor');

//   return config;
// });

// export default instance;




// lib/axios.js
import axios from 'axios';
import { useAuthStore } from '../../store/store';

const instance = axios.create({
  timeout: 90000,
  withCredentials: true,
});

const BaseURL = 'https://crwd.autviz.com';

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
        const refresh_token = useAuthStore.getState().token?.refresh_token;
        const username = useAuthStore.getState().user?.username;

        const res = await axios.post(`${BaseURL}/auth/cognito/refresh/`, {
          refresh_token,
          username,
        });

        console.log('Refresh token response:', res.data);

        // Save new token
        useAuthStore.getState().setToken(res.data);

        // Update Authorization header and retry the failed request
        originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
        return instance(originalRequest);
      } catch (refreshError) {
        console.log('Refresh token failed:', refreshError);
        // Logout and navigate to Login screen
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
