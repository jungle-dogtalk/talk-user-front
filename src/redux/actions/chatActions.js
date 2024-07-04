import axios from 'axios';

const api = axios.create({
    // baseURL: 'http://localhost:5000/api', // 백엔드 서버의 URL에 맞게 수정
    baseURL: 'https://api.barking-talk.org/api', // 백엔드 서버의 URL에 맞게 수정
});

export const fetchChats = async () => {
    const response = await api.get('/chats');
    return response.data;
};

export const createChat = async (chatData) => {
    const response = await api.post('/chats', chatData);
    return response.data;
};
