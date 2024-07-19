import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './reducers/index.js';
import racoonReducer from './slices/racoonSlice';

const store = configureStore({
    reducer: rootReducer,
    racoon: racoonReducer,
});

export default store;
