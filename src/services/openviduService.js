import axios from 'axios';

// 환경 변수에서 OpenVidu 서버 URL 가져옴
const API_URL = import.meta.env.VITE_BACKEND_URL;


const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const createSession = async () => {
    let retries = 0;
    while (retries < MAX_RETRIES) {
        try {
            console.log('Requesting session creation from backend');
            // 백엔드 서버에 세션 생성 요청을 보냄
            const token = localStorage.getItem('token');
            console.log('Token:', token); // 토큰 확인
            const response = await axios.post(`${API_URL}/api/openvidu/session`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`, // 인증 토큰을 헤더에 포함
                },
            });
            console.log('Received session ID from backend:', response.data.sessionId);
            return response.data.sessionId; // 백엔드에서 반환된 세션 ID 반환
        } catch (error) {
            console.error('Failed to create session:', error);
            retries++;
            if (retries < MAX_RETRIES) {
                console.log(`Retrying create session (${retries}/${MAX_RETRIES})...`);
                await sleep(RETRY_DELAY);
            } else {
                throw error;
            }
        }
    }
};

const createToken = async (sessionId) => {
    let retries = 0;
    while (retries < MAX_RETRIES) {
        try {
            console.log('Requesting token creation from backend for sessionId:', sessionId);

            await sleep(1000); // 세션 생성 후 지연 시간 추가
            // 백엔드 서버에 토큰 생성 요청을 보냄
            const token = localStorage.getItem('token');
            console.log('Token:', token); // 토큰 확인
            const response = await axios.post(`${API_URL}/api/openvidu/token`, { sessionId }, {
                headers: {
                    Authorization: `Bearer ${token}`, // 인증 토큰을 헤더에 포함
                },
            });
            console.log('Received token from backend:', response.data.token);
            return response.data.token; // 백엔드에서 반환된 토큰 반환
        } catch (error) {
            console.error('Failed to create token:', error);
            retries++;
            if (retries < MAX_RETRIES) {
                console.log(`Retrying create token (${retries}/${MAX_RETRIES})...`);
                await sleep(RETRY_DELAY);
            } else {
                throw error;
            }
        }
    }
};

const getSessionList = async () => {
    const response = await axios.get(`${API_URL}/api/openvidu/sessions`);

    return response.data;
}

export { createSession, createToken, getSessionList };