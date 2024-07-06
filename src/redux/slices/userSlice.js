import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiCall } from '../../utils/apiCall';
import { API_LIST } from '../../utils/apiList';

//TODO)
// 사용자의 모든 정보를 localStorage에 저장하지 말 것
// 필요한 정보만 서버에서 보내도록 수정 필요
// 회원가입할 떄는 리덕스로 상태관리할 필요가 없으니 삭제 필요.

//로그인
export const loginUser = createAsyncThunk(
    'user/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await apiCall(API_LIST.USER_LOGIN, credentials);
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            return { token, user };
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

const userSlice = createSlice({
    name: 'user',
    initialState: {
        token: null,
        userInfo: JSON.parse(localStorage.getItem('user')),
        loading: false,
        error: null,
    },
    reducers: {
        logoutUser: (state) => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            state.token = null;
            state.userInfo = null;
            state.error = null;
        },
        setUserFromLocalStorage: (state, action) => {
            state.token = action.payload.token;
            state.userInfo = action.payload.userInfo;
        },
    },
    //extraReducers를 통해 비동기 액션의 상태 처리
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            //성공시
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.token = action.payload.token;
                state.userInfo = action.payload.user;
            })
            //비동기 요청 실패시
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { logoutUser, setUserFromLocalStorage } = userSlice.actions;
export default userSlice.reducer;
