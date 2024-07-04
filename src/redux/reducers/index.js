import { combineReducers } from 'redux';
import userReducer from './userReducer';
import chatReducer from './chatReducer';

// 모든 리듀서를 결합하여 루트 리듀서 생성
const rootReducer = combineReducers({
    user: userReducer, // 사용자 관련 상태 리듀서
    chats: chatReducer,
});

export default rootReducer;
