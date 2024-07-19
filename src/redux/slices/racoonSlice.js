// racoonSlice.js
import { createSlice } from '@reduxjs/toolkit';

const racoonSlice = createSlice({
    name: 'racoon',
    initialState: {
        selectedModel: '/raccoon_head.glb', // 기본 모델
    },
    reducers: {
        setSelectedModel: (state, action) => {
            state.selectedModel = action.payload;
        },
    },
});

export const { setSelectedModel } = racoonSlice.actions;
export default racoonSlice.reducer;
