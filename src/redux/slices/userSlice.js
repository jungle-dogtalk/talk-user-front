import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiCall } from '../../utils/apiCall';
import { API_LIST } from '../../utils/apiList';
import Cookies from 'js-cookie'; // js-cookie 라이브러리 임포트

//로그인
export const loginUser = createAsyncThunk(
    'user/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await apiCall(API_LIST.USER_LOGIN, credentials);
            const { token, user } = response.data;
            Cookies.set('token', token);
            Cookies.set('user', JSON.stringify(user));
            return { token, user };
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

const userSlice = createSlice({
    name: 'user',
    initialState: {
        token: Cookies.get('token'), // 쿠키에서 가져온 토큰
        userInfo: Cookies.get('user') ? JSON.parse(Cookies.get('user')) : null, // 쿠키에서 가져온 사용자 정보(JSON 문자열을 객체로 파싱)
        loading: false,
        error: null,
    },
    reducers: {
        
        // 사용자 로그아웃 시 쿠키에서 토큰과 사용자 정보 삭제 + 상태 초기화
        logoutUser: (state) => {
            Cookies.remove('token');
            Cookies.remove('user');
            state.token = null;
            state.userInfo = null;
            state.error = null;
        },

        // 로컬 스토리지에서 사용자 정보를 설정하는 액션
        setUserFromLocalStorage: (state, action) => {
            state.token = action.payload.token;
            state.userInfo = action.payload.userInfo;
        },
    },
    //extraReducers를 통해 비동기 액션의 상태 처리
    extraReducers: (builder) => {
        builder
            // loginUser 액션이 실행될 때, 즉 서버에 로그인 요청을 보내는 동안 실행된다.
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            //loginUser 액션이 성공적으로 완료되어 서버에서 응답을 받은 후 실행된다. 
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.token = action.payload.token;
                state.userInfo = action.payload.user;
            })
            // loginUser 액션이 실패하여 에러가 발생했을 때 실행된다. 
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { logoutUser, setUserFromLocalStorage } = userSlice.actions;
export default userSlice.reducer;
