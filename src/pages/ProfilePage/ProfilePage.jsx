import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import axios for file upload
import { logoutUser } from '../../redux/slices/userSlice'; // 로그아웃 액션 임포트
import Cookies from 'js-cookie'; // 쿠키 라이브러리 임포트

import logo from '../../assets/barking-talk.png'; // 로고 이미지 경로
import defaultProfileImage from '../../assets/profile.jpg'; // 기본 프로필 이미지 경로
import editIcon from '../../assets/settings-icon.jpg'; // 수정 아이콘 경로
import '../../styles.css'; // styles.css 파일을 포함

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
            const response = await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/auth/account-deletion`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`, // 토큰을 요청 헤더에 추가
                    },
                }
            );

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
            prevState.includes(interest)
                ? prevState.filter((i) => i !== interest)
                : [...prevState, interest]
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
            const response = await axios.patch(
                `${import.meta.env.VITE_API_URL}/api/user/profile`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`, // 토큰을 요청 헤더에 추가
                        'Content-Type': 'multipart/form-data', // FormData 전송을 위해 Content-Type 설정
                    },
                }
            );

            if (response.status === 200) {
                alert('프로필 업데이트가 잘 되었습니다.');
                navigate('/main'); // 홈으로 리다이렉트
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('프로필 업데이트 중 오류가 발생했습니다.');
        }
    };

    // 매너지수와 발화지수 계산
    const mannerScore = userInfo?.reviewAverageScore || 0;
    const utteranceScore = userInfo?.utterance || 0;

    // 매너지수와 발화지수가 0이라면 50으로 설정
    const displayMannerScore = mannerScore === 0 ? 50 : mannerScore;
    const displayUtteranceScore = utteranceScore === 0 ? 50 : utteranceScore;

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#FFFAE8] to-[#FFF0D6] items-center">
            <header className="w-full bg-gradient-to-r from-[#a16e47] to-[#8a5d3b] p-1 sm:p-1 flex items-center justify-between shadow-sm">
                <img
                    src={logo}
                    alt="멍톡 로고"
                    className="w-12 h-12 sm:w-16 sm:h-16"
                />
                <button
                    className="bg-[#f7f3e9] text-[#a16e47] py-1 px-3 sm:py-2 sm:px-6 rounded-full border-2 border-[#a16e47] shadow-sm hover:bg-[#e4d7c7] hover:shadow-md transition duration-300 ease-in-out transform hover:scale-105 font-semibold text-sm sm:text-lg"
                    onClick={handleDeleteAccount}
                >
                    탈퇴하기
                </button>
            </header>
            <div className="flex flex-col items-center py-4 sm:py-8 flex-1 w-full px-4 sm:px-0">
                <div className="relative mb-4 sm:mb-8">
                    <img
                        src={profileImage}
                        alt="프로필 사진"
                        className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-[#a16e47] shadow-md object-cover"
                    />
                    <label
                        htmlFor="file-input"
                        className="absolute bottom-0 right-0 bg-white p-1 sm:p-2 rounded-full cursor-pointer shadow-sm hover:shadow-md transition duration-300"
                    >
                        <img
                            src={editIcon}
                            alt="수정 아이콘"
                            className="w-4 h-4 sm:w-6 sm:h-6"
                        />
                    </label>
                    <input
                        type="file"
                        id="file-input"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 text-[#a16e47]">
                    이름: {userInfo?.name}
                </h2>
                <h3 className="text-xl sm:text-2xl font-bold mb-4 text-[#a16e47]">
                    닉네임: {userInfo?.username}
                </h3>
                <div className="w-full max-w-3xl">
                    <div className="flex flex-col items-center mb-4">
                        <div className="w-4/6 mx-auto mb-2">
                            <span className="block text-left mb-1 text-base sm:text-lg font-semibold text-[#a16e47]">
                                발화지수
                            </span>
                            <div className="w-full h-5 sm:h-7 bg-gray-200 rounded-full shadow-inner overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full shadow transition-all duration-500 ease-out"
                                    style={{
                                        width: `${displayUtteranceScore}%`,
                                    }}
                                ></div>
                            </div>
                            <span className="block text-right text-sm sm:text-base mt-1 font-bold text-[#a16e47]">
                                {displayUtteranceScore}%
                            </span>
                        </div>
                        <div className="w-4/6 mx-auto mb-2">
                            <span className="block text-left mb-1 text-base sm:text-lg font-semibold text-[#a16e47]">
                                매너지수
                            </span>
                            <div className="w-full h-5 sm:h-7 bg-gray-200 rounded-full shadow-inner overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow transition-all duration-500 ease-out"
                                    style={{ width: `${displayMannerScore}%` }}
                                ></div>
                            </div>
                            <span className="block text-right text-sm sm:text-base mt-1 font-bold text-[#a16e47]">
                                {displayMannerScore}%
                            </span>
                        </div>
                    </div>
                    <hr className="w-full my-3 sm:my-4 border-[#a16e47] opacity-30" />
                    <div className="text-center mt-3 sm:mt-4">
                        <h2
                            className="text-xl sm:text-2xl font-bold mt-6 sm:mt-8 mb-3 sm:mb-4 text-[#a16e47]"
                            style={{ fontSize: '30px' }}
                        >
                            - 내가 고른 관심사 -
                        </h2>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4">
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
                                    className={`p-1 sm:p-2 w-full sm:w-28 rounded-xl border cursor-pointer flex items-center justify-center ${
                                        clickedInterests.includes(interest.name)
                                            ? 'bg-blue-100'
                                            : 'bg-white'
                                    }`}
                                    onClick={() =>
                                        handleInterestClick(interest.name)
                                    }
                                >
                                    <span className="text-xl sm:text-2xl mr-1">
                                        {interest.icon}
                                    </span>
                                    <span
                                        className="text-xs sm:text-sm leading-tight"
                                        style={{ fontSize: '14px' }}
                                    >
                                        {interest.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <hr className="w-full my-3 sm:my-4 border-[#a16e47] opacity-30" />
                        <h2
                            className="text-lg sm:text-xl font-bold mt-6 sm:mt-8 mb-3 sm:mb-4 text-[#a16e47]"
                            style={{ fontSize: '30px' }}
                        >
                            - AI가 예측하는 관심사 -
                        </h2>
                        <div className="flex justify-center">
                            <div className="inline-grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4 justify-center">
                                {userInfo?.interests2?.map(
                                    (interest, index) => (
                                        <div
                                            key={index}
                                            className="p-1 sm:p-2 w-24 sm:w-28 rounded-xl border flex items-center justify-center bg-white m-1 sm:m-2"
                                        >
                                            <span
                                                className="block text-center text-xs sm:text-sm"
                                                style={{ fontSize: '18px' }}
                                            >
                                                {interest}
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center mt-6 sm:mt-8 space-x-3 sm:space-x-4">
                        <button
                            type="button"
                            className="bg-[#f7f3e9] text-[#a16e47] py-1 px-3 sm:py-2 sm:px-6 rounded-full border-2 border-[#a16e47] shadow-sm hover:bg-[#e4d7c7] hover:shadow-md transition duration-300 ease-in-out transform hover:scale-105 font-semibold text-sm sm:text-lg"
                            onClick={() => navigate(-1)}
                        >
                            뒤로가기
                        </button>
                        <button
                            type="submit"
                            className="bg-[#a16e47] text-white py-1 px-3 sm:py-2 sm:px-6 rounded-full border-2 border-[#a16e47] shadow-sm hover:bg-[#8a5d3b] hover:shadow-md transition duration-300 ease-in-out transform hover:scale-105 font-semibold text-sm sm:text-lg"
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
