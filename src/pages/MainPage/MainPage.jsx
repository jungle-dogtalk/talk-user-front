import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser, fetchUserProfile  } from '../../redux/slices/userSlice'; // 로그아웃 액션 임포트
import logo from '../../assets/barking-talk.png'; // 로고 이미지 경로
import profileImage from '../../assets/profile.jpg'; // 프로필 이미지 경로
import roomIcon from '../../assets/room-icon.png'; // 방에서 통화하기 아이콘 경로
import groupIcon from '../../assets/room-icon.png'; // 넷이서 통화하기 아이콘 경로
import settingsIcon from '../../assets/settings-icon.jpg'; // 설정 아이콘 경로

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

    return (
        <div className="min-h-screen flex flex-col bg-[#f7f3e9]">
            <header className="w-full bg-[#a16e47] p-2 flex items-center justify-between">
                <img src={logo} alt="명톡 로고" className="w-16 h-16" />
                <div className="flex items-center space-x-4">
                    <span className="text-white">친구목록</span>
                    <span className="text-white">|</span>
                    <a href="/profile" className="text-white">마이 페이지</a>
                    <span className="text-white">|</span>
                    <span className="text-white cursor-pointer" onClick={handleLogout}>
                        로그아웃
                    </span>
                </div>
            </header>
            <div className="flex flex-col items-center py-8 flex-1 w-full">
                <div className="flex flex-col items-center w-full mb-8">
                    <img
                        src={userInfo?.profileImage || profileImage}
                        alt="프로필 사진"
                        className="w-48 h-48 rounded-full mb-4"
                    />
                    <h2 className="text-2xl font-bold mb-4">{userInfo?.name}</h2>
                    <div className="w-1/3 mb-8">
                        <div className="flex items-center mb-4">
                            <div className="w-full bg-red-200 h-6 rounded-full overflow-hidden">
                                <div className="bg-red-600 h-full rounded-full" style={{ width: '74%' }}></div>
                            </div>
                            <span className="ml-2 text-gray-700">74%</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-full bg-blue-200 h-6 rounded-full overflow-hidden">
                                <div className="bg-blue-600 h-full rounded-full" style={{ width: '88%' }}></div>
                            </div>
                            <span className="ml-2 text-gray-700">88%</span>
                        </div>
                    </div>
                </div>
                <div className="flex space-x-8 w-full justify-center">
                    <button className="flex flex-col items-center justify-center bg-green-100 p-8 rounded-2xl shadow-lg hover:bg-green-200 w-72 h-72 mb-2" 
                    onClick={() => navigate('/room')}>
                        <img src={roomIcon} alt="방에서 통화하기" className="w-32 h-32 mb-4" />
                        <span className="text-lg font-semibold">둘이서 통화하기</span>
                    </button>
                    <button className="flex flex-col items-center justify-center bg-pink-100 p-8 rounded-2xl shadow-lg hover:bg-pink-200 w-72 h-72 mb-2"
                    onClick={() => navigate('/choose-avatar')}>
                        <img src={groupIcon} alt="넷이서 통화하기" className="w-32 h-32 mb-4" />
                        <span className="text-lg font-semibold">넷이서 통화하기</span>
                    </button>
                </div>
            </div>
        </div>
    );
    
    
    
    
    
    
    
    
    
    
};

export default MainPage;
