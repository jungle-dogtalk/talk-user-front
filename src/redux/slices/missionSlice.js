import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isMissionActive: false,
};

const missionSlice = createSlice({
    name: 'mission',
    initialState,
    reducers: {
        //퀴즈 미션 시작
        startMission: (state) => {
            state.isMissionActive = true;
        },
        //퀴즈 Stop
        stopMission: (state) => {
            state.isMissionActive = false;
        },
    },
});

export const { startMission, stopMission } = missionSlice.actions;
export default missionSlice.reducer;
