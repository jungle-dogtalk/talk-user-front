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
            console.log(queueLength);
            setQueueLength(newQueueLength);
        });

        getSessionList();

        return () => {
            socket.disconnect();
        };
    }, [userInfo, socket]);

    const handleCancelClick = () => {
        navigate(-1);
    };

    // 백엔드 서버 콘솔로그에서 OpenVidu 가용 세션 확인하기 위한 API 호출
    const getSessionList = async () => {
        await apiCall(API_LIST.GET_SESSION_LIST);
    };

    useEffect(() => {
        getSessionList();
    }, []);

    const createBouncingText = (text) => {
        return text
            .split('')
            .map((char, index) => <span key={index}>{char}</span>);
    };

    return (
        <div className="h-screen flex flex-col bg-[#FFFAE8] overflow-hidden">
            <header className="w-full bg-[#a16e47] p-2 flex justify-between items-center">
                <img src={logo} alt="로고" className="w-16 h-16" />
            </header>
            <div className="flex flex-col items-center justify-center flex-1 w-full px-4 sm:px-8">
                <div className="bg-[#FFFAE8] rounded-lg p-8 w-full max-w-5xl flex flex-col items-center">
                    <div className="text-center mb-8 mt-6">
                        {' '}
                        <h2
                            className="text-3xl sm:text-5xl font-bold bouncing-text"
                            style={{ fontSize: '70px' }}
                        >
                            {createBouncingText('매칭 중 . . .')}
                        </h2>
                        <p
                            className="text-gray-700 mt-4 text-lg sm:text-2xl" // mt-4로 조정
                            style={{ fontSize: '40px' }}
                        >
                            나의 관심사 : {userInfo.interests.join(', ')}
                        </p>
                        <p
                            className="text-gray-700 mt-4 text-lg sm:text-2xl"
                            style={{ fontSize: '35px' }}
                        >
                            {queueLength}명 대기 중
                        </p>
                    </div>
                    <PuppyGame className="w-48 h-48 sm:w-64 sm:h-64" />
                    {/* <p className="mt-4" style={{ fontSize: '25px' }}>
                        {' '}
                        상: 👍 하: 👎 좌: 🖐️ 우: ✊
                    </p> */}
                    <div className="flex justify-center mt-4">
                        {' '}
                        {/* mt-4로 조정 */}
                        <button
                            className="bg-[#f7f3e9] text-[#a16e47] py-1 px-3 sm:py-2 sm:px-6 rounded-full border-2 border-[#a16e47] shadow-md hover:bg-[#e4d7c7] hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105 font-semibold text-sm sm:text-lg"
                            onClick={handleCancelClick}
                            style={{ fontSize: '30px' }}
                        >
                            돌아가기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchingPage;
