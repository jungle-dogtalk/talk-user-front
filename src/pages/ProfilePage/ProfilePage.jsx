import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import axios for file upload
import { logoutUser } from '../../redux/slices/userSlice'; // 로그아웃 액션 임포트
import Cookies from 'js-cookie'; // 쿠키 라이브러리 임포트

import logo from '../../assets/barking-talk.png'; // 로고 이미지 경로
import defaultProfileImage from '../../assets/profile.jpg'; // 기본 프로필 이미지 경로
import editIcon from '../../assets/settings-icon.jpg'; // 수정 아이콘 경로

// 관심사 목록을 배열로 정의
const interestsList = [
    '독서', '영화 감상', '게임', '여행', '요리', '드라이브', 'KPOP', '메이크업', '인테리어', '그림', '애완동물', '부동산', '맛집 투어', '헬스', '산책', '수영', '사진 찍기', '주식'
];

const ProfilePage = () => {

    // Redux 상태와 훅 초기화
    const userInfo = useSelector((state) => state.user.userInfo);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // 로컬 상태 정의
    const [profileImage, setProfileImage] = useState(defaultProfileImage);
    const [clickedInterests, setClickedInterests] = useState([]); // 클릭된 관심사 상태
    const [selectedFile, setSelectedFile] = useState(null); // 선택된 파일 상태


    // 사용자 프로필 이미지를 설정하는 useEffect
    useEffect(() => {
        if (userInfo && userInfo.profileImage) {
            setProfileImage(userInfo.profileImage);
        }
        if (userInfo && userInfo.interests) {
            setClickedInterests(userInfo.interests);
        }
    }, [userInfo]);


    // 계정 삭제 핸들러
    const handleDeleteAccount = async () => {
        try {
            const token = Cookies.get('token'); // 쿠키에서 토큰을 가져옴
            const response = await axios.delete('http://localhost:5000/api/auth/account-deletion', {
                headers: {
                    Authorization: `Bearer ${token}`, // 토큰을 요청 헤더에 추가
                },
            });
            
            if (response.status === 200) {
                alert('계정 삭제가 잘 되었습니다. ');
                dispatch(logoutUser()); // 로그아웃 액션 디스패치
                navigate('/'); // 홈으로 리다이렉트
            }
        } catch (error) {
            console.error('Error deleting account:', error); // 오류 로그 출력
            alert('계정 삭제 중 오류가 발생했습니다.');
        }
    };

    // 관심사 클릭 핸들러
    const handleInterestClick = (interest) => {
        setClickedInterests((prevState) =>
            prevState.includes(interest) ? prevState.filter((i) => i !== interest) : [...prevState, interest]
        ); // 관심사 선택/해제 토글
    };

    // 파일 선택 핸들러
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result); // 파일 읽기가 완료되면 프로필 이미지 설정
            };
            reader.readAsDataURL(file);
            setSelectedFile(file); // 선택된 파일 상태 업데이트
        }
    };

    // 프로필 업데이트 핸들러
    const handleProfileUpdate = async () => {
        const formData = new FormData();
    if (selectedFile) {
        formData.append('profileImage', selectedFile); // 선택된 파일이 있으면 FormData에 추가
    }
    formData.append('interests', JSON.stringify(clickedInterests)); // 관심사 목록을 JSON 문자열로 변환하여 추가

        try {
            const token = Cookies.get('token'); // 쿠키에서 토큰을 가져옴
            const response = await axios.patch('http://localhost:5000/api/user/profile', formData, {
                headers: {
                    Authorization: `Bearer ${token}`, // 토큰을 요청 헤더에 추가
                    'Content-Type': 'multipart/form-data', // FormData 전송을 위해 Content-Type 설정
                },
            });

            if (response.status === 200) {
                alert('프로필 업데이가 잘 되었습니다.');
                navigate('/main'); // 홈으로 리다이렉트
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('프로필 업데이트 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#FFFAE8] items-center">
            <header className="w-full bg-[#89644C] p-4 flex items-center justify-between">
                <img src={logo} alt="명톡 로고" className="w-16 h-16" />
                <button className="text-white" onClick={handleDeleteAccount}>탈퇴하기</button>
            </header>
            <div className="flex flex-col items-center py-8 flex-1 w-full">
                <div className="relative mb-8">
                    <img
                        src={profileImage}
                        alt="프로필 사진"
                        className="w-56 h-56 rounded-full border-2 border-gray-300"
                    />
                    <label htmlFor="file-input" className="absolute bottom-0 right-0 bg-white p-2 rounded-full cursor-pointer">
                        <img src={editIcon} alt="수정 아이콘" className="w-6 h-6" />
                    </label>
                    <input
                        type="file"
                        id="file-input"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>
                <h2 className="text-2xl font-bold mb-2">이름: {userInfo?.name}</h2>
                <h3 className="text-xl mb-4">닉네임: {userInfo?.username}</h3>
                <div className="w-full max-w-3xl">
                    <div className="flex flex-col items-center mb-8">
                    <div className="w-full mx-auto mb-4">
                        <span className="block text-left mb-1">대화지수</span>
                        <div className="w-full h-4 bg-gray-200 rounded-full shadow-inner">
                            <div className="h-4 bg-red-500 rounded-full shadow" style={{ width: '74%' }}></div>
                        </div>
                        <span className="block text-right text-sm mt-1">74%</span>
                        </div>
                        <div className="w-full mx-auto">
                            <span className="block text-left mb-1">매너지수</span>
                            <div className="w-full h-4 bg-gray-200 rounded-full shadow-inner">
                                <div className="h-4 bg-blue-500 rounded-full shadow" style={{ width: '80%' }}></div>
                            </div>
                            <span className="block text-right text-sm mt-1">80%</span>
                        </div>
                    </div>
                    <hr className="w-full my-8 border-gray-400" />
                    <div className="text-center mt-8">
                        <h2 className="text-xl font-bold mb-4">관심사</h2>
                        <div className="grid grid-cols-6 gap-4">
                            {[
                                { name: '독서', icon: '📚' },
                                { name: '영화 감상', icon: '🎬' },
                                { name: '게임', icon: '🎮' },
                                { name: '여행', icon: '✈️' },
                                { name: '요리', icon: '🍳' },
                                { name: '드라이브', icon: '🚗' },
                                { name: 'KPOP', icon: '💃' },
                                { name: '메이크업', icon: '💄' },
                                { name: '인테리어', icon: '🪑' },
                                { name: '그림', icon: '🎨' },
                                { name: '애완동물', icon: '🐶' },
                                { name: '부동산', icon: '🏡' },
                                { name: '맛집 투어', icon: '🍔' },
                                { name: '헬스', icon: '💪🏻' },
                                { name: '산책', icon: '🌳' },
                                { name: '수영', icon: '🏊' },
                                { name: '사진 찍기', icon: '📸' },
                                { name: '주식', icon: '📈' },
                            ].map((interest) => (
                                <div
                                    key={interest.name}
                                    className={`p-2 w-28 rounded-xl border cursor-pointer ${clickedInterests.includes(interest.name) ? 'bg-blue-100' : 'bg-white'}`}
                                    onClick={() => handleInterestClick(interest.name)}
                                >
                                    <span className="block text-center text-2xl">{interest.icon}</span>
                                    <span className="block text-center text-sm">{interest.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-center mt-8">
                        <button
                            type="button"
                            className="px-6 py-2 bg-[#89644C] text-white rounded-lg mr-4"
                            onClick={() => navigate(-1)}
                        >
                            뒤로가기
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-[#89644C] text-white rounded-lg"
                            onClick={handleProfileUpdate}
                        >
                            수정하기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
    
    
    
};

export default ProfilePage;
