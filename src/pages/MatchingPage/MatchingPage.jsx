import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import waitingDogImage from '../../assets/dog.png'; // 강아지 이미지
import waitingHouseImage from '../../assets/doghouse.jpg'; // 강아지 집 이미지
import { io } from 'socket.io-client';
import { apiCall } from '../../utils/apiCall';
import { API_LIST } from '../../utils/apiList';
import logo from '../../assets/barking-talk.png';
import PuppyGame from './PuppyGame';
import './MatchingPage.css';

const MatchingPage = () => {
    const navigate = useNavigate();
    const userInfo = useSelector((state) => state.user.userInfo);
    const [queueLength, setQueueLength] = useState(0);
    const socket = io(import.meta.env.VITE_API_URL);

    // 사용자 데이터를 query 아닌 소켓으로 전송하게 수정했음.
    useEffect(() => {
        const storedQuestion = sessionStorage.getItem('question');
        const storedAnswer = sessionStorage.getItem('answer');

        socket.emit('userDetails', {
            userId: userInfo.username,
            userInterests: userInfo.interests,
            aiInterests: userInfo.interests2,
            nickname: userInfo.nickname,
            mbti: userInfo.mbti,
            question: storedQuestion,
            answer: storedAnswer,
        });

        socket.on('matched', (data) => {
            console.log('Matched event received:', data);
            if (data.sessionId) {
                // 질문과 답변을 세션 스토리지에서 삭제
                sessionStorage.removeItem('question');
                sessionStorage.removeItem('answer');
                location.href = '/videochat?sessionId=' + data.sessionId;
            } else {
                console.error('No sessionId in matched event data');
            }
        });

        // queueLengthUpdate 이벤트 수신
        socket.on('queueLengthUpdate', (newQueueLength) => {
            console.log('큐길이 -> ', queueLength);
            setQueueLength(newQueueLength);
        });

        return () => {
            socket.disconnect();
        };
    }, [userInfo, socket]);

    const handleCancelClick = () => {
        navigate(-1);
    };

    const createBouncingText = (text) => {
        return text
            .split('')
            .map((char, index) => <span key={index}>{char}</span>);
    };

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-[#f7f3e9] to-[#e7d4b5] overflow-hidden">
            <header className="w-full bg-gradient-to-r from-[#a16e47] to-[#c18a67] p-1 flex justify-between items-center shadow-lg">
                <img
                    src={logo}
                    alt="멍톡 로고"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300"
                />
                <button
                    onClick={handleCancelClick}
                    className="bg-[#f7f3e9] text-[#8b5e3c] py-2 px-4 sm:py-3 sm:px-8 rounded-full border-2 border-[#a16e47] shadow-md hover:bg-[#d4b894] transition duration-300 ease-in-out transform hover:scale-105 font-bold text-lg sm:text-xl"
                >
                    돌아가기
                </button>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 md:p-6">
                <h2 className="text-6xl sm:text-7xl md:text-7xl font-extrabold text-[#4a3728] animate-pulse mb-8 sm:mb-8 bg-[#e7d4b5] px-10 py-4 sm:px-12 sm:py-4 rounded-full shadow-lg text-center w-full max-w-4xl">
                    매칭중..
                </h2>

                <div className="bg-[#f7f3e9] bg-opacity-90 rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12 w-full max-w-7xl flex flex-col sm:flex-row items-center justify-between space-y-6 sm:space-y-0 sm:space-x-8">
                    <div className="flex flex-col items-center sm:items-start space-y-12 flex-1">
                        <div className="bg-[#e7d4b5] p-6 sm:p-8 rounded-xl shadow-md w-full max-w-5xl mx-auto">
                            <p className="text-3xl sm:text-4xl md:text-5xl text-[#8b5e3c] mb-4 sm:mb-6 text-center">
                                나의 관심사
                            </p>
                            <div className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#4a3728] text-center space-y-2">
                                {userInfo.interests.map((interest, index) => (
                                    <p key={index}>{interest}</p>
                                ))}
                            </div>
                        </div>
                        <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#f7f3e9] animate-bounce bg-[#8b5e3c] px-6 py-3 sm:px-9 sm:py-9 rounded-full shadow-lg">
                            "{queueLength}명" 대기 중
                        </p>
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <div className="absolute -inset-2 bg-gradient-to-r from-[#a16e47] to-[#c18a67] rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                        <div className="relative bg-white rounded-lg p-2">
                            <PuppyGame className="w-full h-64 sm:w-80 sm:h-80" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#a16e47] to-transparent opacity-30"></div>
        </div>
    );
};

export default MatchingPage;
