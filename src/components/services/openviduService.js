import axios from 'axios';

// 환경 변수에서 OpenVidu 서버 URL 가져옴
const API_URL = import.meta.env.VITE_OPENVIDU_URL;

const createSession = async () => {
    try {
        // OpenVidu 서버에 세션 생성 요청을 보냄
        const response = await axios.post(
            `${API_URL}/openvidu/api/sessions`,
            {},
            {
                auth: {
                    username: 'OPENVIDUAPP', // 인증에 사용되는 사용자 이름
                    password: import.meta.env.VITE_OPENVIDU_SECRET, // 인증에 사용되는 비밀번호
                },
            },
        );
        return response.data.id; // 생성된 세션에 ID 반환
    } catch (error) {
        console.error('Failed to create session:', error);
        throw error;
    }
};

// 주어진 세션 ID에 대해 토큰을 생성하는 비동기 함수
const createToken = async (sessionId) => {
    try {
        // OpenVidu 서버에 토큰 생성 요청을 보냄
        const response = await axios.post(
            `${API_URL}/openvidu/api/sessions/${sessionId}/connection`,
            {},
            {
                auth: {
                    username: 'OPENVIDUAPP',
                    password: import.meta.env.VITE_OPENVIDU_SECRET,
                },
            },
        );
        return response.data.token;
    } catch (error) {
        console.error('Failed to create token:', error);
        throw error;
    }
};

export { createSession, createToken }; // 두 함수를 모듈로 내보내어 다른 파일에서 임포트하여 사용할 수 있도록 한다.
