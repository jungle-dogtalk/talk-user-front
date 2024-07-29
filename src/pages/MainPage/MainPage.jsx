import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser, fetchUserProfile } from '../../redux/slices/userSlice';
import logo from '../../assets/barking-talk.png';
import profileImage from '../../assets/profile.jpg';
import '../../styles.css';
import axios from 'axios';

// 메인 페이지 컴포넌트
const MainPage = () => {
    // Redux를 사용하여 사용자 정보와 토큰을 가져옴
    const userInfo = useSelector((state) => state.user.userInfo);
    const token = useSelector((state) => state.user.token);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // 관심사와 마지막 업데이트 시간을 저장할 상태 변수
    const [topInterests, setTopInterests] = useState([]);
    const [lastUpdated, setLastUpdated] = useState('');

    // 토큰이 없으면 홈으로 리디렉션
    useEffect(() => {
        if (!token) {
            navigate('/');
        }
    }, [token, navigate]);

    // 로그아웃 핸들러
    const handleLogout = () => {
        dispatch(logoutUser());
        navigate('/');
    };

    // 컴포넌트가 마운트될 때 사용자 프로필을 가져옴
    useEffect(() => {
        dispatch(fetchUserProfile());
    }, [dispatch]);

     // API에서 상위 관심사를 가져옴
    useEffect(() => {
        const fetchTopInterests = async () => {
            try {
                const response = await axios.get(
                    `${
                        import.meta.env.VITE_API_URL
                    }/api/top-interests/top-interests`
                );
                setTopInterests(response.data.topInterests || []);
                const now = new Date();
                const formattedTime = now.toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                });
                setLastUpdated(formattedTime);
            } catch (error) {
                console.error('Failed to fetch top interests:', error);
                setTopInterests([]);
            }
        };

        fetchTopInterests();
    }, []);

    // 매너 점수와 발화 점수를 계산
    const mannerScore = userInfo?.reviewAverageScore || 0;
    const utteranceScore = userInfo?.utterance || 0;
    const displayMannerScore = mannerScore === 0 ? 50 : mannerScore;
    const displayUtteranceScore = utteranceScore === 0 ? 50 : utteranceScore;

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#f7f3e9] to-[#e4d7c7] text-[#8b5e3c]">
            <header className="w-full bg-gradient-to-r from-[#a16e47] to-[#8b5e3c] p-3 flex items-center justify-between shadow-lg">
                <img
                    src={logo}
                    alt="멍톡 로고"
                    className="w-28 h-16 sm:w-60 sm:h-24"
                />
                <div className="flex flex-row items-center space-x-2 sm:space-x-4">
                    <button
                        className="bg-[#f7f3e9] text-[#a16e47] py-3 px-6 sm:py-4 sm:px-8 md:py-5 md:px-10 rounded-full border-2 border-[#a16e47] hover:bg-[#e4d7c7] transition duration-300 text-base sm:text-lg md:text-xl font-bold whitespace-nowrap"
                        onClick={() => navigate('/profile')}
                    >
                        마이 페이지
                    </button>
                    <button
                        className="bg-[#f7f3e9] text-[#a16e47] py-3 px-6 sm:py-4 sm:px-8 md:py-5 md:px-10 rounded-full border-2 border-[#a16e47] hover:bg-[#e4d7c7] transition duration-300 text-base sm:text-lg md:text-xl font-bold whitespace-nowrap"
                        onClick={handleLogout}
                    >
                        로그아웃
                    </button>
                </div>
            </header>
            <div className="flex flex-grow flex-wrap justify-center items-center space-x-0 sm:space-x-10 p-6 sm:p-10 bg-[#f7f3e9]">
                <div className="w-full sm:w-1/2 lg:w-2/5 p-8 bg-[#fcfaf5] rounded-xl shadow-xl flex flex-col items-center h-[700px] mb-10 sm:mb-0 transition-all duration-300 hover:shadow-2xl border-2 border-[#e4d7c7]">
                    <div className="flex flex-col items-center w-full mb-8 flex-grow justify-center">
                        <img
                            src={userInfo?.profileImage || profileImage}
                            alt="프로필 사진"
                            className="w-48 h-48 sm:w-56 sm:h-56 rounded-full mb-6 border-4 border-[#e4d7c7] shadow-lg"
                        />
                        <h2 className="text-4xl sm:text-6xl font-bold mb-14 text-[#8B4513]">
                            이름: {userInfo?.name}
                        </h2>

                        <div className="w-full mb-10 px-6 text-center">
                            <div className="flex items-center justify-center mb-6">
                                <span className="text-[#8B4513] font-bold text-xl sm:text-4xl mr-2 whitespace-nowrap">
                                    발화지수
                                </span>
                                <div className="w-2/3 bg-red-200 h-10 rounded-full overflow-hidden shadow-inner">
                                    <div
                                        className="bg-red-600 h-full rounded-full transition-all duration-500 ease-out"
                                        style={{
                                            width: `${displayUtteranceScore}%`,
                                        }}
                                    ></div>
                                </div>
                                <span className="ml-4 text-[#8B4513] text-2xl sm:text-4xl font-semibold">
                                    {displayUtteranceScore}%
                                </span>
                            </div>
                            <div className="flex items-center justify-center">
                                <span className="text-[#8B4513] font-bold text-xl sm:text-4xl mr-2 whitespace-nowrap">
                                    매너지수
                                </span>
                                <div className="w-2/3 bg-blue-200 h-10 rounded-full overflow-hidden shadow-inner">
                                    <div
                                        className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
                                        style={{
                                            width: `${displayMannerScore}%`,
                                        }}
                                    ></div>
                                </div>
                                <span className="ml-4 text-[#8B4513] text-2xl sm:text-4xl font-semibold">
                                    {displayMannerScore}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full px-6 mb-6">
                        <button
                            className="bg-pink-100 p-4 sm:p-6 rounded-xl shadow-lg hover:bg-pink-200 hover:shadow-xl transition duration-300 ease-in-out transform hover:scale-105 w-full text-center text-3xl sm:text-4xl font-bold text-[#8B4513]"
                            onClick={() => navigate('/choose-raccoon')}
                        >
                            통화하기
                        </button>
                    </div>
                </div>
                <div className="w-full sm:w-1/2 lg:w-2/5 p-8 bg-[#fcfaf5] rounded-xl shadow-xl flex flex-col items-center justify-between h-[700px] transition-all duration-300 hover:shadow-2xl border-2 border-[#e4d7c7]">
                    <h2 className="text-3xl sm:text-6xl font-bold mb-4 text-center text-[#8B4513]">
                        실시간 HOT 키워드
                        <br />
                        <span className="text-sm sm:text-3xl text-black">
                            ({lastUpdated})
                        </span>
                    </h2>
                    {Array.isArray(topInterests) && topInterests.length > 0 ? (
                        topInterests.map((interest, index) => (
                            <div
                                key={index}
                                className="flex flex-col items-center justify-start p-5 w-full bg-[#f0e6d2] rounded-xl shadow-md mb-5 transition-all duration-300 hover:shadow-lg hover:scale-105"
                            >
                                <h2 className="text-3xl sm:text-4xl font-bold text-center text-[#8B4513]">
                                    {index + 1}. {interest}
                                </h2>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-[#8B4513] text-2xl sm:text-3xl">
                            관심사를 불러오는 중...
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MainPage;
