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
    const [mbti, setMbti] = useState(userInfo?.mbti || '');
    const [isModalOpen, setIsModalOpen] = useState(false); // 모달 상태 정의

    // 사용자 프로필 이미지를 설정하는 useEffect
    useEffect(() => {
        if (userInfo && userInfo.profileImage) {
            setProfileImage(userInfo.profileImage);
        }
        if (userInfo && userInfo.interests) {
            setClickedInterests(userInfo.interests);
        }
        if (userInfo && userInfo.mbti) {
            setMbti(userInfo.mbti);
        }
    }, [userInfo]);

    // MBTI 입력 핸들러 추가
    const handleMbtiChange = (e) => {
        setMbti(e.target.value);
    };

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

    // 모달 열기/닫기 핸들러
    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    // 관심사 클릭 핸들러
    const handleInterestClick = (interest) => {
        if (clickedInterests.includes(interest)) {
            setClickedInterests((prevState) =>
                prevState.filter((i) => i !== interest)
            ); // 관심사 해제
        } else {
            if (clickedInterests.length < 3) {
                setClickedInterests((prevState) => [...prevState, interest]); // 관심사 추가
            } else {
                alert('최대 3개의 관심사만 선택할 수 있습니다.');
            }
        }
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
        formData.append('mbti', mbti);

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
            <header className="w-full bg-gradient-to-r from-[#a16e47] to-[#8a5d3b] p-2 sm:p-3 flex items-center justify-between shadow-md">
                <img
                    src={logo}
                    alt="멍톡 로고"
                    className="w-16 h-16 sm:w-20 sm:h-20" // 로고 크기 증가
                />
                <button
                    className="bg-[#f7f3e9] text-[#a16e47] py-4 px-8 sm:py-5 sm:px-10 rounded-full border-2 border-[#a16e47] shadow-md hover:bg-[#e4d7c7] hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105 font-semibold text-xl sm:text-2xl"
                    onClick={openModal}
                >
                    탈퇴하기
                </button>
            </header>
            <div className="flex flex-col items-center py-6 sm:py-10 flex-1 w-full max-w-7xl px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row items-center justify-center w-full mb-12 space-x-0 sm:space-x-24">
                    <div className="relative mb-8 sm:mb-0">
                        <img
                            src={profileImage}
                            alt="프로필 사진"
                            className="w-64 h-64 sm:w-80 sm:h-80 rounded-full border-4 border-[#a16e47] shadow-lg object-cover"
                        />
                        <label
                            htmlFor="file-input"
                            className="absolute bottom-2 right-2 bg-white p-3 rounded-full cursor-pointer shadow-md hover:shadow-lg transition duration-300"
                        >
                            <img
                                src={editIcon}
                                alt="수정 아이콘"
                                className="w-8 h-8 sm:w-10 sm:h-10"
                            />
                        </label>
                        <input
                            type="file"
                            id="file-input"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>
                    <div className="flex flex-col items-center sm:items-start">
                        <h2 className="text-5xl sm:text-6xl font-bold mb-4 sm:mb-6 text-[#a16e47]">
                            이름: {userInfo?.name}
                        </h2>
                        <h3 className="text-5xl sm:text-6xl font-bold mb-4 sm:mb-6 text-[#a16e47]">
                            닉네임: {userInfo?.nickname}
                        </h3>
                        <div className="flex items-center mb-6">
                            <h3 className="text-5xl sm:text-6xl font-bold mr-4 text-[#a16e47]">
                                MBTI:
                            </h3>
                            <input
                                type="text"
                                id="mbti"
                                value={mbti}
                                onChange={handleMbtiChange}
                                className="appearance-none border-none rounded-xl py-3 px-4 text-[#a16e47] leading-tight focus:outline-none text-3xl sm:text-6xl font-bold placeholder:text-3xl placeholder:text-[#a16e47] bg-transparent"
                                maxLength="4"
                                placeholder="입력하세요"
                                style={{
                                    width: '180px',
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="w-full">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-full sm:w-5/6 mx-auto mb-4">
                            <span className="block text-left mb-2 text-2xl sm:text-4xl font-semibold text-[#a16e47]">
                                발화지수
                            </span>
                            <div className="w-full h-8 sm:h-12 bg-gray-200 rounded-full shadow-inner overflow-hidden">
                                {' '}
                                {/* 프로그레스 바 높이 증가 */}
                                <div
                                    className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full shadow transition-all duration-500 ease-out"
                                    style={{
                                        width: `${displayUtteranceScore}%`,
                                    }}
                                ></div>
                            </div>
                            <span className="block text-right text-xl sm:text-3xl mt-2 font-bold text-[#a16e47]">
                                {displayUtteranceScore}%
                            </span>
                        </div>
                        <div className="w-full sm:w-5/6 mx-auto mb-4">
                            <span className="block text-left mb-2 text-2xl sm:text-4xl font-semibold text-[#a16e47]">
                                매너지수
                            </span>
                            <div className="w-full h-8 sm:h-12 bg-gray-200 rounded-full shadow-inner overflow-hidden">
                                {' '}
                                {/* 프로그레스 바 높이 증가 */}
                                <div
                                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow transition-all duration-500 ease-out"
                                    style={{ width: `${displayMannerScore}%` }}
                                ></div>
                            </div>
                            <span className="block text-right text-xl sm:text-3xl mt-2 font-bold text-[#a16e47]">
                                {displayMannerScore}%
                            </span>
                        </div>
                    </div>

                    <hr className="w-full my-6 sm:my-8 border-[#a16e47] opacity-30" />
                    <div className="text-center mt-6 sm:mt-8">
                        <h2 className="text-3xl sm:text-5xl font-bold mb-6 sm:mb-8 text-[#a16e47]">
                            - 내가 고른 관심사 -
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-7">
                            {' '}
                            {/* 그리드 열 수 변경 */}
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
                                    className={`p-3 sm:p-4 w-full rounded-xl border-2 cursor-pointer flex items-center justify-center ${
                                        clickedInterests.includes(interest.name)
                                            ? 'bg-blue-100'
                                            : 'bg-white'
                                    }`} // 패딩 및 테두리 두께 증가
                                    onClick={() =>
                                        handleInterestClick(interest.name)
                                    }
                                >
                                    <span className="text-3xl sm:text-5xl mr-2">
                                        {' '}
                                        {/* 아이콘 크기 증가 */}
                                        {interest.icon}
                                    </span>
                                    <span className="text-base sm:text-4xl font-medium">
                                        {' '}
                                        {/* 폰트 크기 및 두께 증가 */}
                                        {interest.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <hr className="w-full my-6 sm:my-8 border-[#a16e47] opacity-30" />
                        <h2 className="text-3xl sm:text-5xl font-bold mb-6 sm:mb-8 text-[#a16e47]">
                            - AI가 예측하는 관심사 -
                        </h2>
                        <div className="flex justify-center">
                            <div className="flex flex-nowrap justify-center gap-10 sm:gap-12 overflow-x-auto">
                                {userInfo?.interests2?.map(
                                    (interest, index) => (
                                        <div
                                            key={index}
                                            className="flex p-4 sm:p-6 rounded-xl border-2 items-center justify-center bg-white"
                                            style={{ width: '200px' }}
                                        >
                                            <span className="text-2xl sm:text-4xl font-medium">
                                                {interest}
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center mt-8 sm:mt-10 space-x-4 sm:space-x-6">
                        <button
                            type="button"
                            className="bg-[#f7f3e9] text-[#a16e47] py-4 px-8 sm:py-5 sm:px-10 rounded-full border-2 border-[#a16e47] shadow-md hover:bg-[#e4d7c7] hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105 font-semibold text-xl sm:text-2xl"
                            onClick={() => navigate(-1)}
                        >
                            뒤로가기
                        </button>
                        <button
                            type="submit"
                            className="bg-[#a16e47] text-white py-4 px-8 sm:py-5 sm:px-10 rounded-full border-2 border-[#a16e47] shadow-md hover:bg-[#8a5d3b] hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105 font-semibold text-xl sm:text-2xl"
                            onClick={handleProfileUpdate}
                        >
                            수정하기
                        </button>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gradient-to-br from-[#FFF0D6] to-[#FFFAE8] p-8 sm:p-10 rounded-2xl shadow-2xl max-w-3xl w-full text-center transform transition-transform duration-500 scale-105 hover:scale-110">
                        <h2 className="text-4xl sm:text-5xl font-extrabold mb-6 sm:mb-8 text-[#a16e47]">
                            정말로 탈퇴하시겠습니까?
                        </h2>
                        <p className="mb-6 sm:mb-8 text-2xl sm:text-3xl text-[#a16e47]">
                            <span className="font-semibold text-[#a16e47]">
                                탈퇴를 하시면 모든 정보가 삭제됩니다.
                            </span>
                        </p>
                        <div className="flex justify-center space-x-8 sm:space-x-12 mt-8 sm:mt-10">
                            <button
                                className="bg-[#a16e47] text-white py-4 sm:py-5 px-12 sm:px-16 rounded-full border-2 border-[#a16e47] shadow-lg hover:bg-[#8a5d3b] hover:shadow-2xl transition duration-300 ease-in-out transform hover:scale-110 font-semibold text-2xl sm:text-3xl"
                                onClick={handleDeleteAccount}
                            >
                                예
                            </button>
                            <button
                                className="bg-[#f7f3e9] text-[#a16e47] py-4 sm:py-5 px-12 sm:px-16 rounded-full border-2 border-[#a16e47] shadow-lg hover:bg-[#e4d7c7] hover:shadow-2xl transition duration-300 ease-in-out transform hover:scale-110 font-semibold text-2xl sm:text-3xl"
                                onClick={closeModal}
                            >
                                아니요
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
