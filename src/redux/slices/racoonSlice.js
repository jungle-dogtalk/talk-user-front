import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    selectedModel: '/raccoon_head.glb',
    models: ['/raccoon_head.glb', '/monkey.glb', '/panda.glb', '/cat.glb'],
};

const racoonSlice = createSlice({
    name: 'racoon',
    initialState,
    reducers: {
        setSelectedModel: (state, action) => {
            state.selectedModel = action.payload;
        },
    },
});

export const { setSelectedModel } = racoonSlice.actions;
export default racoonSlice.reducer;
