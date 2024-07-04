import axios from 'axios';
import {
    LOGIN_SUCCESS,
    LOGIN_FAIL,
    SIGNUP_SUCCESS,
    SIGNUP_FAIL,
    LOGOUT,
} from '../../constants/userConstants';
import { apiCall } from '../../utils/apiCall';
import { API_LIST } from '../../utils/apiList';

// 로그인 액션 생성 함수
export const loginUser = (credentials) => async (dispatch) => {
    try {
        // const response = await axios.post('http://localhost:5000/api/auth/login', credentials);
        const response = await apiCall(API_LIST.USER_LOGIN, credentials);

        const { token, user } = response.data;

        // 로컬 스토리지에 토큰 저장
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // 로그인 성공 액션 디스패치
        dispatch({
            type: LOGIN_SUCCESS,
            payload: { token, user }, // 상태 업데이트에 필요한 데이터
        });

        return true; // 성공 반환
    } catch (error) {
        // 로그인 실패 액션 디스패치
        dispatch({
            type: LOGIN_FAIL,
            payload: error.response.data.message,
        });

        return false; // 실패 반환
    }
};

export const setUserFromLocalStorage = (user, token) => (dispatch) => {
    dispatch({
        type: LOGIN_SUCCESS,
        payload: { user, token },
    });
};

export const logoutUser = () => (dispatch) => {
    localStorage.removeItem('token');

    dispatch({
        type: LOGOUT,
    });
};

// 회원가입 액션 생성 함수
export const signUpUser = (userData) => async (dispatch) => {
    try {
        // const response = await axios.post('http://localhost:5000/api/auth/signup', userData);
        const response = await apiCall(API_LIST.USER_SIGNUP, userData);

        const { token, user } = response.data;

        // 로컬 스토리지에 토큰 저장
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        dispatch({
            type: SIGNUP_SUCCESS,
            payload: { token, user }, // 상태 업데이트에 필요한 데이터
        });

        return true;
    } catch (error) {
        console.error('Signup error:', error); // 에러 로그 추가
        dispatch({
            type: SIGNUP_FAIL,
            payload: error.response.data.message,
        });

        return false;
    }
};
