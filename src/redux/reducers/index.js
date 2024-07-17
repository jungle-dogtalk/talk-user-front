import { combineReducers } from 'redux';
import userReducer from '../slices/userSlice';
import missionReducer from '../slices/missionSlice';
// import chatReducer from './chatSlice';

const rootReducer = combineReducers({
    user: userReducer,
    mission: missionReducer,
});

export default rootReducer;
