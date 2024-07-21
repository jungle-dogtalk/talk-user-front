// HTTP methods
const POST = 'POST';
const GET = 'GET';
const DELETE = 'DELETE';
const PATCH = 'PATCH';

// 백엔드 서버 API 목록
const API_LIST = {
    TEST_MULTIPLE_DATA: {
        method: GET,
        path: `/test/multiple-data`,
        desc: '테스트용 복수 데이터 요청',
    },
    TEST_SINGLE_DATA: {
        method: GET,
        path: `/test/single-data`,
        desc: '테스트용 단일 데이터 요청',
    },
    TEST_GREETING: {
        method: GET,
        path: `/test/greeting`,
        desc: '테스트용 이름 기반의 환영 인사',
    },
    USER_LOGIN: {
        method: POST,
        path: '/api/auth/login',
        desc: '사용자 로그인',
    },
    USER_SIGNUP: {
        method: POST,
        path: '/api/auth/signup',
        desc: '사용자 회원가입',
    },
    GET_SESSION_LIST: {
        method: GET,
        path: '/api/openvidu/sessions',
        desc: 'OpenVidu 현재 가용한 세션 조회',
    },
    RECEIVE_TRANSCRIPT: {
        method: POST,
        path: `/api/audio/receive-transcript`,
        desc: '사용자 텍스트 전송',
    },
    RECOMMEND_TOPICS: {
        method: POST,
        path: `/api/audio/recommend-topics`,
        desc: '주제 추천 요청',
    },
    CHECK_USERNAME: {
        method: POST,
        path: '/api/auth/check-username',
        desc: '회원가입 유저네임 중복 검사',
    },
    USER_DELETE: {
        method: DELETE,
        path: '/api/auth/account-deletion',
        desc: '유저 계정 탈퇴',
    },
    END_CALL: {
        method: POST,
        path: `/api/audio/end-call`,
        desc: '통화 종료 및 관심사 도출 및 대화 피드백 요청',
    },
    GET_TOKEN: {
        method: 'POST',
        path: `/api/openvidu/token`,
        desc: 'OpenVidu 토큰 발급',
    },
    GET_SESSION_DATA: {
        method: GET,
        path: `/api/user/session-data`,
        desc: '세션 데이터 조회',
    },
    GET_SESSION_TIMER: {
        method: GET,
        path: `/api/openvidu/session/timer`,
        desc: '세션 남은시간 조회',
    },
    GET_CALL_USER_INFO: {
        method: POST,
        path: `/api/user/call-user-info`,
        desc: '통화 유저 정보 조회',
    },
    SUBMIT_REVIEW: {
        method: POST,
        path: '/api/review/submit',
        desc: '리뷰 제출',
    },
    GET_RANDOM_QUESTION: {
        method: GET,
        path: '/api/questions/random',
        desc: 'Get a random question',
    },
    GET_TOP_INTERESTS: {
        method: GET,
        path: '/api/top-interests/top-interests',
        desc: '사람들이 가장 관심있어하는 순으로 5개 가져오기',
    },
};

// OPEN API 목록
const OPEN_API_LIST = {
    GET_POKEMON_PICTURE: (id) => ({
        method: GET,
        path: `https://pokeapi.co/api/v2/pokemon/${id}`,
        desc: '랜덤 포켓몬 사진 조회',
    }),
};

export { API_LIST, OPEN_API_LIST };
