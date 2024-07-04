import { combineReducers } from 'redux';
import userReducer from '../slices/userSlice';
// import chatReducer from './chatSlice';

const rootReducer = combineReducers({
    user: userReducer,
});

export default rootReducer;
