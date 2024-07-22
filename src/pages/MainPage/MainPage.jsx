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
        <div className="min-h-screen flex flex-col bg-[#f7f3e9] relative overflow-hidden text-xl">
            <header className="w-full bg-[#a16e47] p-4 flex items-center justify-between">
                <img src={logo} alt="명톡 로고" className="w-20 h-20" />
                <div className="flex items-center space-x-4">
                    <button
                        className="bg-[#f7f3e9] text-[#a16e47] py-3 px-7 rounded-full border-2 border-[#a16e47] shadow-md hover:bg-[#e4d7c7] hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-lg"
                        onClick={() => navigate('/profile')}
                    >
                        마이 페이지
                    </button>
                    <button
                        className="bg-[#f7f3e9] text-[#a16e47] py-3 px-7 rounded-full border-2 border-[#a16e47] shadow-md hover:bg-[#e4d7c7] hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-lg"
                        onClick={handleLogout}
                    >
                        로그아웃
                    </button>
                </div>
            </header>
            <div className="flex flex-grow flex-wrap justify-center items-center space-x-8 p-4">
                <div className="w-full sm:w-1/2 lg:w-1/3 p-6 bg-white rounded-lg shadow-lg flex flex-col items-center h-[600px] mb-8 sm:mb-0">
                    <div className="flex flex-col items-center w-full mb-6 flex-grow justify-center">
                        <img
                            src={userInfo?.profileImage || profileImage}
                            alt="프로필 사진"
                            className="w-40 h-40 rounded-full mb-4"
                        />
                        <h2 className="text-4xl font-bold mb-4">
                            이름: {userInfo?.name}
                        </h2>
                        <div className="w-full mb-8 px-4 text-center">
                            <div className="flex items-center justify-center mb-4">
                                <span className="text-gray-700 font-bold text-2xl mr-2">
                                    발화지수
                                </span>
                                <div className="w-2/3 bg-red-200 h-8 rounded-full overflow-hidden">
                                    <div
                                        className="bg-red-600 h-full rounded-full"
                                        style={{
                                            width: `${displayUtteranceScore}%`,
                                        }}
                                    ></div>
                                </div>
                                <span className="ml-2 text-gray-700 text-lg">
                                    {displayUtteranceScore}%
                                </span>
                            </div>
                            <div className="flex items-center justify-center">
                                <span className="text-gray-700 font-bold text-2xl mr-2">
                                    매너지수
                                </span>
                                <div className="w-2/3 bg-blue-200 h-8 rounded-full overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-full rounded-full"
                                        style={{
                                            width: `${displayMannerScore}%`,
                                        }}
                                    ></div>
                                </div>
                                <span className="ml-2 text-gray-700 text-lg">
                                    {displayMannerScore}%
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        className="bg-pink-100 p-5 rounded-xl shadow-md hover:bg-pink-200 hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105 w-full text-center text-5xl font-bold"
                        onClick={() => navigate('/choose-raccoon')}
                    >
                        통화하기
                    </button>
                </div>
                <div className="w-full sm:w-1/2 lg:w-1/3 p-6 bg-white rounded-lg shadow-lg flex flex-col items-center justify-between h-[600px]">
                    <h2 className="text-3xl font-bold mb-3 text-center">
                        {lastUpdated} 기준
                        <br />
                        사람들이 가장 관심있어 해요!
                    </h2>
                    {Array.isArray(topInterests) && topInterests.length > 0 ? (
                        topInterests.map((interest, index) => (
                            <div
                                key={index}
                                className="flex flex-col items-center justify-start p-3 w-full bg-gray-200 rounded-lg shadow-lg mb-3"
                            >
                                <h2 className="text-4xl font-bold mb-4 text-center">
                                    {index + 1}. {interest}
                                </h2>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500">
                            관심사를 불러오는 중...
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MainPage;
