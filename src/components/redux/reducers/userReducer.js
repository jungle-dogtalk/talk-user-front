import { LOGIN_SUCCESS, LOGIN_FAIL, SIGNUP_SUCCESS, SIGNUP_FAIL, LOGOUT } from '../../constants/userConstants';

const initialState = {
  token: localStorage.getItem('token'), // 초기 상태에서 토큰을 로컬 스토리지에서 가져옴
  userInfo: null, // 사용자 정보 초기값
  loading: false, // 로딩 상태 초기값
  error: null,
};

// 사용자 액션을 처리하는 리듀서 함수
const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_SUCCESS:
    case SIGNUP_SUCCESS:
      return { ...state, userInfo: action.payload.user, token: action.payload.token, loading: false };
    case LOGIN_FAIL:
    case SIGNUP_FAIL:
      return { ...state, error: action.payload, loading: false };
    case LOGOUT:
      return { ...state, userInfo: null, token: null };  
    default:
      return state; // 기본 상태 반환
  }
};

export default userReducer;
