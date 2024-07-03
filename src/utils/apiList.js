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
    ASK_AI_INTER: {
        method: POST,
        path: `/ask-ai/interest`,
        desc: 'OpenAI를 통해 주제 추천받기',
    },
    ASK_AI_TITLE: {
        method: POST,
        path: `/ask-ai/title`,
        desc: 'OpenAI를 통해 관심사 특정하기',
    },
    SEND_TEXT: {
        method: POST,
        path: `/send-text`,
        desc: '음성인식된 텍스트 서버에 전송',
    },
    UPLOAD_AUDIO: {
        method: POST,
        path: `/upload-audio`,
        desc: '오디오 파일 업로드 및 STT 처리',
    },
};

// open api 엔드포인트 목록
const OPEN_API_LIST = {
    GET_POKEMON_PICTURE: (id) => ({
        method: GET,
        path: `https://pokeapi.co/api/v2/pokemon/${id}`,
        desc: '랜덤 포켓몬 사진 조회',
    }),
};

export { API_LIST, OPEN_API_LIST };
