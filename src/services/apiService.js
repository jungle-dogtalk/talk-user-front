import axios from 'axios';

const apiService = axios.create({
    baseURL: 'https://api.barking-talk.org/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

apiService.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

export default apiService;
