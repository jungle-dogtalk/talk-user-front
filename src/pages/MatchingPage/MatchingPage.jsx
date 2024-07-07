import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import './MatchingPage.css';
import waitingDogImage from '../../assets/dog.jpg'; // 강아지 이미지
import waitingHouseImage from '../../assets/doghouse.jpg'; // 강아지 집 이미지
import axios from 'axios';
import { io } from 'socket.io-client';

const MatchingPage = () => {
    const userInfo = useSelector((state) => state.user.userInfo);
    console.log('유저인포 ->  ', userInfo);

    // const socket = io('http://localhost:5000', {
    //     query: { userId: userInfo._id },
    // });

    const socket = io('https://api.barking-talk.org', {
        query: { userId: userInfo._id },
    });

    socket.on('matched', (data) => {
        console.log('Matched! Session ID:', data.sessionId);
        location.href = '/videochat?sessionId=' + data.sessionId;
        // 매칭 성공 시 처리 로직
    });

    const handleStopClick = () => {
        alert('중단하기 버튼이 클릭되었습니다.');
    };

    const handleCancelClick = () => {
        alert('취소하기 버튼이 클릭되었습니다.');
    };

    const handleAddUserToQueue = async () => {
        const result = await axios.post(
            'https://api.barking-talk.org/api/match/add/user',
            { userId: userInfo._id }
        );
        console.log(result);
    };

    return (
        <div className="matching-page">
            <div className="header">
                <h1>멍톡</h1>
            </div>

            <div className="content2">
                <div className="matching-box">
                    <div className="matching-status">
                        <h2>매칭 중...</h2>
                        <p>예상시간: 8분</p>
                    </div>
                    <p className="instruction">
                        화면 아래 집 아이콘을 누르면 통화를 중단할 수 있어요!
                    </p>
                    <div className="images">
                        <img
                            src={waitingDogImage}
                            alt="Waiting Dog"
                            className="waiting-dog"
                        />
                        <div className="house-wrapper">
                            <img
                                src={waitingHouseImage}
                                alt="Waiting House"
                                className="waiting-house"
                            />
                            <button
                                className="stop-button"
                                onClick={handleStopClick}
                            >
                                중단하기
                            </button>
                        </div>
                    </div>
                    <button
                        className="cancel-button"
                        onClick={handleCancelClick}
                    >
                        취소하기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MatchingPage;
