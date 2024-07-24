import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser, fetchUserProfile } from '../../redux/slices/userSlice';
import logo from '../../assets/barking-talk.png';
import profileImage from '../../assets/profile.jpg';
import '../../styles.css';
import axios from 'axios';
import { API_LIST } from '../../utils/apiList.js';

const MainPage = () => {
    const userInfo = useSelector((state) => state.user.userInfo);
    const token = useSelector((state) => state.user.token);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [topInterests, setTopInterests] = useState([]);
    const [lastUpdated, setLastUpdated] = useState('');

    useEffect(() => {
        if (!token) {
            navigate('/');
        }
    }, [token, navigate]);

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate('/');
    };

    useEffect(() => {
        dispatch(fetchUserProfile());
    }, [dispatch]);

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
                    className="w-16 h-16 sm:w-24 sm:h-24"
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
            <div className="flex flex-col lg:flex-row justify-between items-stretch flex-grow p-6">
                <div className="w-full lg:w-3/5 flex flex-col items-center justify-between lg:pr-6">
                    <div className="flex flex-col items-center w-full">
                        <img
                            src={userInfo?.profileImage || profileImage}
                            alt="프로필 사진"
                            className="w-48 h-48 sm:w-48 sm:h-48 rounded-full mb-6 border-4 border-[#a16e47]"
                        />
                        <h2 className="text-5xl sm:text-6xl font-bold mb-4 text-center">
                            {userInfo?.name}
                        </h2>
                        <div className="w-full mt-16 mb-4 space-y-20">
                            <div>
                                <span className="text-3xl sm:text-5xl font-bold mb-3 block">
                                    발화지수
                                </span>
                                <div className="w-full bg-red-200 h-12 sm:h-14 rounded-full overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full flex items-center justify-end pr-4"
                                        style={{
                                            width: `${displayUtteranceScore}%`,
                                        }}
                                    >
                                        <span className="text-white font-bold text-2xl sm:text-3xl">
                                            {displayUtteranceScore}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <span className="text-3xl sm:text-5xl font-bold mb-3 block">
                                    매너지수
                                </span>
                                <div className="w-full bg-blue-200 h-12 sm:h-14 rounded-full overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full flex items-center justify-end pr-4"
                                        style={{
                                            width: `${displayMannerScore}%`,
                                        }}
                                    >
                                        <span className="text-white font-bold text-2xl sm:text-3xl">
                                            {displayMannerScore}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button
                        className="bg-gradient-to-r from-[#7cb772] to-[#5c9f52] py-5 px-8 rounded-xl transition duration-300 hover:opacity-90 w-full text-center text-4xl sm:text-5xl font-bold text-white mt-4 -my-4 "
                        onClick={() => navigate('/choose-raccoon')}
                    >
                        통화하기
                    </button>
                </div>
                <div className="w-full lg:w-2/5 flex flex-col items-center justify-between lg:pl-6 mt-8 lg:mt-0">
                    <h2 className="text-4xl sm:text-5xl lg:text-5xl font-bold mb-8 text-center">
                        {/* {lastUpdated} 기준  */}
                        <br />
                        실시간 HOT 키워드
                        <br />
                        <span className="text-2xl sm:text-3xl lg:text-3xl font-normal">
                            ({lastUpdated})
                        </span>
                    </h2>
                    {Array.isArray(topInterests) && topInterests.length > 0 ? (
                        <div className="w-full space-y-10 flex-grow overflow-y-auto">
                            {topInterests.map((interest, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-center p-3 bg-[#f0e0d0] bg-opacity-50 rounded-lg"
                                >
                                    <span className="text-5xl sm:text-6xl font-bold text-[#a16e47] mr-6">
                                        {index + 1}.
                                    </span>
                                    <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-center">
                                        {interest}
                                    </h3>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 text-3xl sm:text-4xl">
                            관심사를 불러오는 중...
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MainPage;
