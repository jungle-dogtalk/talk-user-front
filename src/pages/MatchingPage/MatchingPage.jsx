import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import './MatchingPage.css';
import waitingDogImage from '../../assets/dog.jpg'; // 강아지 이미지
import waitingHouseImage from '../../assets/doghouse.jpg'; // 강아지 집 이미지
import { io } from 'socket.io-client';
import { apiCall } from '../../utils/apiCall';
import { API_LIST } from '../../utils/apiList';

const MatchingPage = () => {
    const userInfo = useSelector((state) => state.user.userInfo);
    console.log('유저인포 ->  ', userInfo);

    // const socket = io('http://localhost:5000', {
    //     query: { userId: userInfo._id },
    // });

    const socket = io('http://localhost:5000');

    //사용자 데이터를 query 아닌 소켓으로 전송하게 수정했음.
    useEffect(() => {
        socket.emit('userDetails', {
            userId: userInfo._id,
            interests: userInfo.interests,
        });

        socket.on('matched', (data) => {
            console.log('Matched event received:', data);
            if (data.sessionId) {
                location.href = '/videochat?sessionId=' + data.sessionId;
            } else {
                console.error('No sessionId in matched event data');
            }
        });

        getSessionList();

        return () => {
            socket.disconnect();
        };
    }, [userInfo]);

    const handleStopClick = () => {
        alert('중단하기 버튼이 클릭되었습니다.');
    };

    const handleCancelClick = () => {
        alert('취소하기 버튼이 클릭되었습니다.');
    };

    // 백엔드 서버 콘솔로그에서 OpenVidu 가용 세션 확인하기 위한 API 호출
    const getSessionList = async () => {
        await apiCall(API_LIST.GET_SESSION_LIST);
    };

    useEffect(() => {
        getSessionList();
    }, []);

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
                        <p>{userInfo.interests}</p>
                        {/* 관심사 데이터 체크용*/}
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
