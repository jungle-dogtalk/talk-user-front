import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser, fetchUserProfile } from '../../redux/slices/userSlice'; // 로그아웃 액션 임포트
import logo from '../../assets/barking-talk.png'; // 로고 이미지 경로
import profileImage from '../../assets/profile.jpg'; // 프로필 이미지 경로
import GLTFModel from '../../components/GLTFModel.jsx';
import SpeechBubble from '../../components/SpeechBubble.jsx';
import '../../styles.css';

const MainPage = () => {
    const userInfo = useSelector((state) => state.user.userInfo);
    const token = useSelector((state) => state.user.token);
    const navigate = useNavigate(); // useNavigate 훅 사용
    const dispatch = useDispatch();

    console.log(userInfo);

    useEffect(() => {
        if (!token) {
            navigate('/'); // 로그인 상태가 아닌 경우 로그인 페이지로 리디렉션
        }
    }, [token, navigate]);

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate('/');
    };

    useEffect(() => {
        // Redux를 사용하여 사용자 정보를 가져오는 함수
        dispatch(fetchUserProfile());
    }, [dispatch]);

    // 매너지수와 발화지수 계산
    const mannerScore = userInfo?.reviewAverageScore || 0;
    const utteranceScore = userInfo?.utterance || 0;

    // 매너지수와 발화지수가 0이라면 50으로 설정
    const displayMannerScore = mannerScore === 0 ? 50 : mannerScore;
    const displayUtteranceScore = utteranceScore === 0 ? 50 : utteranceScore;

    return (
        <div className="min-h-screen flex flex-col bg-[#f7f3e9] relative">
            <header className="w-full bg-[#a16e47] p-2 flex items-center justify-between">
                <img
                    src={logo}
                    alt="명톡 로고"
                    className="w-12 h-12 sm:w-16 sm:h-16"
                />
                <div className="flex items-center space-x-2 sm:space-x-4">
                    <button
                        className="bg-[#f7f3e9] text-[#a16e47] py-1 px-3 sm:py-2 sm:px-6 rounded-full border-2 border-[#a16e47] shadow-md hover:bg-[#e4d7c7] hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-xs sm:text-base"
                        onClick={() => navigate('/profile')}
                        style={{ fontSize: '20px' }}
                    >
                        마이 페이지
                    </button>
                    <button
                        className="bg-[#f7f3e9] text-[#a16e47] py-1 px-3 sm:py-2 sm:px-6 rounded-full border-2 border-[#a16e47] shadow-md hover:bg-[#e4d7c7] hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-xs sm:text-base"
                        onClick={handleLogout}
                        style={{ fontSize: '20px' }}
                    >
                        로그아웃
                    </button>
                </div>
            </header>
            <div className="flex flex-col items-start p-4 sm:p-6 w-full">
                <div
                    className="flex flex-col items-center justify-start p-4 sm:p-6 w-full bg-white rounded-lg shadow-lg"
                    style={{ maxWidth: '300px', height: '450px' }}
                >
                    <div className="flex flex-col items-center w-full mb-6 sm:mb-0">
                        <img
                            src={userInfo?.profileImage || profileImage}
                            alt="프로필 사진"
                            className="w-32 h-32 sm:w-30 sm:h-30 rounded-full mb-3 sm:mb-4"
                        />
                        <h2
                            className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4"
                            style={{ fontSize: '23px' }}
                        >
                            이름: {userInfo?.name}
                        </h2>
                        <div className="w-full mb-6 sm:mb-8 px-4 sm:px-0 text-center">
                            <div className="flex items-center justify-center mb-3 sm:mb-4">
                                <span
                                    className="text-gray-700 font-bold text-xs sm:text-sm mr-2"
                                    style={{ fontSize: '17px' }}
                                >
                                    발화지수
                                </span>
                                <div className="w-1/2 bg-red-200 h-4 sm:h-6 rounded-full overflow-hidden">
                                    <div
                                        className="bg-red-600 h-full rounded-full"
                                        style={{
                                            width: `${displayUtteranceScore}%`,
                                        }}
                                    ></div>
                                </div>
                                <span className="ml-2 text-gray-700 text-xs sm:text-sm">
                                    {displayUtteranceScore}%
                                </span>
                            </div>
                            <div className="flex items-center justify-center">
                                <span
                                    className="text-gray-700 font-bold text-xs sm:text-sm mr-2"
                                    style={{ fontSize: '17px' }}
                                >
                                    매너지수
                                </span>
                                <div className="w-1/2 bg-blue-200 h-4 sm:h-6 rounded-full overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-full rounded-full"
                                        style={{
                                            width: `${displayMannerScore}%`,
                                        }}
                                    ></div>
                                </div>
                                <span className="ml-2 text-gray-700 text-xs sm:text-sm">
                                    {displayMannerScore}%
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        className="bg-pink-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-md hover:bg-pink-200 hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105 w-full text-center mt-4"
                        onClick={() => navigate('/choose-raccoon')}
                    >
                        <span
                            className="text-sm sm:text-lg font-bold"
                            style={{ fontSize: '30px' }}
                        >
                            통화하기
                        </span>
                    </button>
                </div>
                <div
                    className="flex flex-col items-center justify-start p-4 sm:p-6 w-full bg-white rounded-lg shadow-lg mt-6"
                    style={{ maxWidth: '300px', height: '450px' }}
                >
                    <h2
                        className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center"
                        style={{ fontSize: '22px' }}
                    >
                        사람들이 가장 관심있어 해요!
                    </h2>
                    <div
                        className="flex flex-col items-center justify-start p-3 sm:p-3 w-full bg-gray-200 rounded-lg shadow-lg mb-4"
                        style={{ maxWidth: '300px', height: '55px' }}
                    >
                        <h2
                            className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center"
                            style={{ fontSize: '20px', marginBottom: '0' }}
                        >
                            1. 여행
                        </h2>
                    </div>
                    <div
                        className="flex flex-col items-center justify-start p-3 sm:p-3 w-full bg-gray-200 rounded-lg shadow-lg mb-4"
                        style={{ maxWidth: '300px', height: '55px' }}
                    >
                        <h2
                            className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center"
                            style={{ fontSize: '20px', marginBottom: '0' }}
                        >
                            2. 맛집
                        </h2>
                    </div>
                    <div
                        className="flex flex-col items-center justify-start p-3 sm:p-3 w-full bg-gray-200 rounded-lg shadow-lg mb-4"
                        style={{ maxWidth: '300px', height: '55px' }}
                    >
                        <h2
                            className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center"
                            style={{ fontSize: '20px', marginBottom: '0' }}
                        >
                            3. 운동
                        </h2>
                    </div>
                    <div
                        className="flex flex-col items-center justify-start p-3 sm:p-3 w-full bg-gray-200 rounded-lg shadow-lg mb-4"
                        style={{ maxWidth: '300px', height: '55px' }}
                    >
                        <h2
                            className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center"
                            style={{ fontSize: '20px', marginBottom: '0' }}
                        >
                            4. 사진
                        </h2>
                    </div>
                    <div
                        className="flex flex-col items-center justify-start p-3 sm:p-3 w-full bg-gray-200 rounded-lg shadow-lg"
                        style={{ maxWidth: '300px', height: '55px' }}
                    >
                        <h2
                            className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center"
                            style={{ fontSize: '20px', marginBottom: '0' }}
                        >
                            5. mbti
                        </h2>
                    </div>
                </div>
            </div>
            <div className="speech-bubble-container">
                <SpeechBubble />
            </div>

            <GLTFModel />
        </div>
    );
};

export default MainPage;
