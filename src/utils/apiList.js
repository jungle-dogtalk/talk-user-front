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
        desc: '테스트용 복수 데이터 요청'
    },
    TEST_SINGLE_DATA: {
        method: GET,
        path: `/test/single-data`,
        desc: '테스트용 단일 데이터 요청'
    },
    TEST_GREETING: {
        method: GET,
        path: `/test/greeting`,
        desc: '테스트용 이름 기반의 환영 인사'
    }
}

// OPEN API 목록
const OPEN_API_LIST = {
    GET_POKEMON_PICTURE: (id) => ({
        method: GET,
        path: `https://pokeapi.co/api/v2/pokemon/${id}`,
        desc: '랜덤 포켓몬 사진 조회'
    }),
}

export {API_LIST, OPEN_API_LIST};
