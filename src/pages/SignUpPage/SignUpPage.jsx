import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios'; // axios 임포트
import { apiCall } from '../../utils/apiCall'; // apiCall 함수 임포트
import { API_LIST } from '../../utils/apiList'; // API_LIST 임포트
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/barking-talk.png'; // 로고 이미지 경로
import defaultProfileImage from '../../assets/profile.jpg'; // 기본 프로필 이미지 경로
import editIcon from '../../assets/settings-icon.jpg'; // 수정 아이콘 경로

const SignUpPage = () => {
    // 상태 변수들 정의
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [interests, setInterests] = useState([]);
    const [nickname, setNickname] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate(); // 페이지 이동을 위한 네비게이트 함수 가져오기
    const [profileImage, setProfileImage] = useState(defaultProfileImage);
    const [selectedFile, setSelectedFile] = useState(null); // 선택된 파일 상태

    const { token, error } = useSelector((state) => state.user);

    // 이미 로그인되어 있는 경우 메인 페이지로 리디렉션
    useEffect(() => {
        if (token) {
            navigate('/main'); // 이미 로그인되어 있는 경우 홈 페이지로 리디렉션
        }
    }, [token, navigate]);

    // 회원가입 처리 함수
    const handleSignUp = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            // 비밀번호 확인
            alert('비밀번호가 틀려요!');
            return;
        }

        if (!selectedFile) {
            alert('프로필 이미지 업로드 해주세요');
            return;
        }

        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('confirmPassword', confirmPassword);
        formData.append('name', name);
        formData.append('email', email);
        formData.append('nickname', nickname);
        interests.forEach((interest) => formData.append('interests', interest));
        formData.append('profileImage', selectedFile);

        // interests2를 빈 값으로 추가
        formData.append('interests2', JSON.stringify([]));

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/auth/signup`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            if (response.data) {
                alert('회원가입이 성공적으로 성공하셨습니다.');
                navigate('/');
            }
        } catch (error) {
            console.error(
                'Error:',
                error.response ? error.response.data : error.message
            );
            alert(
                'An error occurred during sign up: ' +
                    (error.response
                        ? error.response.data.message
                        : error.message)
            );
        }
    };

    // 관심사 변경 처리 함수
    const handleInterestChange = (interestName) => {
        if (interests.includes(interestName)) {
            setInterests(
                interests.filter((interest) => interest !== interestName)
            );
        } else {
            setInterests([...interests, interestName]);
        }
    };

    // 아이디 중복 체크 함수
    const handleUsernameCheck = async () => {
        try {
            const response = await apiCall(API_LIST.CHECK_USERNAME, {
                username,
            });
            if (response.data) {
                alert(response.message);
            } else {
                alert('ID를 사용하실 수 있습니다.');
            }
        } catch (error) {
            console.error(
                'Error checking username:',
                error.response ? error.response.data : error.message
            );
            alert(
                'An error occurred while checking the username: ' +
                    (error.response
                        ? error.response.data.message
                        : error.message)
            );
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

    return (
        <div className="min-h-screen flex flex-col bg-[#FFFAE8] items-center">
            <header className="w-full bg-[#89644C] p-2 flex items-center justify-between">
                <img
                    src={logo}
                    alt="명톡 로고"
                    className="w-12 h-12 sm:w-16 sm:h-16"
                />
            </header>
            <div className="flex flex-col items-center py-4 sm:py-8 flex-1 w-full px-4 sm:px-0">
                <div className="relative mb-6 sm:mb-8 w-full flex justify-center">
                    <div className="relative ml-4 sm:ml-8 ">
                        <img
                            src={profileImage}
                            alt="프로필 사진"
                            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-2 border-gray-300"
                        />
                        <label
                            htmlFor="file-input"
                            className="absolute bottom-0 right-0 bg-white p-1 sm:p-2 rounded-full cursor-pointer"
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
                </div>
                <form
                    onSubmit={handleSignUp}
                    className="w-full max-w-xl space-y-4 sm:space-y-6"
                >
                    <div className="flex items-center justify-center space-x-2 sm:space-x-4 sm:ml-16">
                        <label
                            htmlFor="username"
                            className="w-28 sm:w-32 text-right text-sm sm:text-base"
                        >
                            아이디
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="아이디를 입력하세요"
                            required
                            className="flex-1 px-2 py-1 sm:px-4 sm:py-2 border rounded-md text-sm sm:text-base"
                        />
                        <button
                            type="button"
                            onClick={handleUsernameCheck}
                            className="bg-gray-200 px-2 py-1 sm:px-4 sm:py-2 rounded-r-md text-xs sm:text-sm whitespace-nowrap"
                        >
                            중복검사
                        </button>
                    </div>
                    <div className="flex items-center justify-center space-x-2 sm:space-x-4 sm:ml-16">
                        <label
                            htmlFor="password"
                            className="w-28 sm:w-32 text-right text-sm sm:text-base"
                        >
                            비밀번호
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호를 입력하세요"
                            required
                            className="flex-1 px-2 py-1 sm:px-4 sm:py-2 border rounded-md text-sm sm:text-base"
                        />
                    </div>
                    <div className="flex items-center justify-center space-x-2 sm:space-x-4 sm:ml-16">
                        <label
                            htmlFor="confirm-password"
                            className="w-28 sm:w-32 text-right text-sm sm:text-base"
                        >
                            비밀번호 확인
                        </label>
                        <input
                            type="password"
                            id="confirm-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="비밀번호를 확인하세요"
                            required
                            className="flex-1 px-2 py-1 sm:px-4 sm:py-2 border rounded-md text-sm sm:text-base"
                        />
                    </div>
                    <div className="flex items-center justify-center space-x-2 sm:space-x-4 sm:ml-16">
                        <label
                            htmlFor="name"
                            className="w-28 sm:w-32 text-right text-sm sm:text-base"
                        >
                            이름
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="이름을 입력하세요"
                            required
                            className="flex-1 px-2 py-1 sm:px-4 sm:py-2 border rounded-md text-sm sm:text-base"
                        />
                    </div>
                    <div className="flex items-center justify-center space-x-2 sm:space-x-4 sm:ml-16">
                        <label
                            htmlFor="nickname"
                            className="w-28 sm:w-32 text-right text-sm sm:text-base"
                        >
                            닉네임
                        </label>
                        <input
                            type="text"
                            id="nickname"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="닉네임을 입력하세요"
                            required
                            className="flex-1 px-2 py-1 sm:px-4 sm:py-2 border rounded-md text-sm sm:text-base"
                        />
                    </div>
                    <div className="flex items-center justify-center space-x-2 sm:space-x-4 sm:ml-16">
                        <label
                            htmlFor="email"
                            className="w-28 sm:w-32 text-right text-sm sm:text-base"
                        >
                            이메일
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="이메일을 입력하세요"
                            required
                            className="flex-1 px-2 py-1 sm:px-4 sm:py-2 border rounded-md text-sm sm:text-base"
                        />
                    </div>
                    <hr className="w-full my-6 sm:my-8 border-gray-400" />
                    <div className="text-center mt-6 sm:mt-8 w-full max-w-4xl mx-auto">
                        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
                            관심사
                        </h2>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-4">
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
                                    className={`p-1 sm:p-2 w-full rounded-xl border cursor-pointer ${
                                        interests.includes(interest.name)
                                            ? 'bg-blue-100'
                                            : 'bg-white'
                                    }`}
                                    onClick={() =>
                                        handleInterestChange(interest.name)
                                    }
                                >
                                    <span className="block text-center text-lg sm:text-2xl">
                                        {interest.icon}
                                    </span>
                                    <span className="block text-center text-xs sm:text-sm">
                                        {interest.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {error && (
                        <p className="text-red-500 text-center text-sm sm:text-base">
                            {error}
                        </p>
                    )}
                    <div className="flex w-full justify-center mt-6 sm:mt-8 space-x-4">
                        <button
                            type="button"
                            className="px-4 py-1 sm:px-6 sm:py-2 bg-[#89644C] text-white rounded-lg text-sm sm:text-base"
                            onClick={() => navigate(-1)}
                        >
                            뒤로가기
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-1 sm:px-6 sm:py-2 bg-[#89644C] text-white rounded-lg text-sm sm:text-base"
                        >
                            회원가입
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignUpPage;
