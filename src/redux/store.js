import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import rootReducer from './reducers/index.js';

const initialState = {};

const middleware = [thunk]; // 미들웨어 설정

// Redux 스토어 생성
const store = createStore(
    rootReducer,
    initialState,
    composeWithDevTools(applyMiddleware(...middleware)), // Redux DevTools와 미들웨어 적용
);

export default store;
