import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import waitingDogImage from '../../assets/dog.png'; // 강아지 이미지
import waitingHouseImage from '../../assets/doghouse.jpg'; // 강아지 집 이미지
import { io } from 'socket.io-client';
import { apiCall } from '../../utils/apiCall';
import { API_LIST } from '../../utils/apiList';
import logo from '../../assets/barking-talk.png';

const MatchingPage = () => {
    const navigate = useNavigate();
    const userInfo = useSelector((state) => state.user.userInfo);
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

        getSessionList();

        return () => {
            socket.disconnect();
        };
    }, [userInfo, socket]);

    const handleCancelClick = () => {
        navigate('/main');
    };

    // 백엔드 서버 콘솔로그에서 OpenVidu 가용 세션 확인하기 위한 API 호출
    const getSessionList = async () => {
        await apiCall(API_LIST.GET_SESSION_LIST);
    };

    useEffect(() => {
        getSessionList();
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-[#FFFAE8]">
            <header className="w-full bg-[#a16e47] p-2 flex justify-between items-center">
                <img src={logo} alt="멍톡 로고" className="w-16 h-16" />
            </header>
            <div className="flex flex-col items-center justify-center flex-1 w-full px-4 sm:px-8">
                <div className="bg-[#FFFAE8] rounded-lg p-8 w-full max-w-5xl flex flex-col items-center">
                    <div className="text-center">
                        <h2
                            className="text-3xl sm:text-5xl font-bold"
                            style={{ fontSize: '50px' }}
                        >
                            매칭 중 ...
                        </h2>
                        <p
                            className="text-gray-700 mt-6 text-lg sm:text-2xl"
                            style={{ fontSize: '30px' }}
                        >
                            나의 관심사 : {userInfo.interests.join(', ')}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-8 sm:space-y-0 sm:space-x-16 mt-12">
                        <img
                            src={waitingDogImage}
                            alt="Waiting Dog"
                            className="w-48 h-48 sm:w-64 sm:h-64"
                        />
                        <div className="relative">
                            <img
                                src={waitingHouseImage}
                                alt="Waiting House"
                                className="w-48 h-48 sm:w-64 sm:h-64"
                            />
                        </div>
                    </div>
                    <div className="flex justify-center mt-16">
                        <button
                            className="bg-[#f7f3e9] text-[#a16e47] py-1 px-3 sm:py-2 sm:px-6 rounded-full border-2 border-[#a16e47] shadow-md hover:bg-[#e4d7c7] hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105 font-semibold text-sm sm:text-lg"
                            onClick={handleCancelClick}
                            style={{ fontSize: '25px' }}
                        >
                            취소하기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchingPage;
