import { combineReducers } from 'redux';
import userReducer from '../slices/userSlice';
import missionReducer from '../slices/missionSlice';
import racoonReducer from '../slices/racoonSlice';
// import chatReducer from './chatSlice';

const rootReducer = combineReducers({
    user: userReducer,
    mission: missionReducer,
    racoon: racoonReducer,
});

export default rootReducer;
