import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios'; // axios 임포트
import { apiCall } from '../../utils/apiCall'; // apiCall 함수 임포트
import { API_LIST } from '../../utils/apiList'; // API_LIST 임포트
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/barking-talk.png'; // 로고 이미지 경로
import defaultProfileImage from '../../assets/profile.png'; // 기본 프로필 이미지 경로
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
    const [mbti, setMbti] = useState('');

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
        formData.append('mbti', mbti);

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
            if (interests.length < 3) {
                setInterests([...interests, interestName]);
            } else {
                alert('최대 3개의 관심사만 선택할 수 있습니다.');
            }
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
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#FFFAE8] to-[#FFE0B2] items-center">
            <header className="w-full bg-gradient-to-r from-[#a16e47] to-[#8b5e3c] p-3 flex items-center justify-between shadow-lg">
                <img
                    src={logo}
                    alt="멍톡 로고"
                    className="w-16 h-16 sm:w-24 sm:h-24"
                />
            </header>
            <div className="flex flex-col items-center py-8 sm:py-12 flex-1 w-full px-4 sm:px-8 max-w-6xl mx-auto">
                <div className="relative mb-8 sm:mb-12 w-full flex justify-center">
                    <div className="relative">
                        <img
                            src={profileImage}
                            alt="Profile"
                            className="w-48 h-48 sm:w-56 sm:h-56 rounded-full shadow-lg"
                        />
                        <label
                            htmlFor="file-input"
                            className="absolute bottom-2 right-2 bg-white p-2 sm:p-3 rounded-full cursor-pointer shadow-md hover:shadow-lg transition-all duration-300"
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
                </div>
                <form
                    onSubmit={handleSignUp}
                    className="w-full max-w-6xl space-y-10 sm:space-y-12"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 w-full ">
                        <div className="flex flex-col space-y-4 sm:col-span-2 items-center">
                            <label
                                htmlFor="username"
                                className="text-2xl sm:text-3xl font-semibold text-[#89644C]"
                            >
                                아이디
                            </label>
                            <div className="flex">
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) =>
                                        setUsername(e.target.value)
                                    }
                                    placeholder="아이디를 입력하세요"
                                    required
                                    className="flex-1 px-4 py-3 border-2 border-[#89644C] rounded-l-lg text-xl sm:text-2xl focus:outline-none focus:ring-2 focus:ring-[#89644C]"
                                />
                                <button
                                    type="button"
                                    onClick={handleUsernameCheck}
                                    className="bg-[#89644C] text-white px-4 py-3 rounded-r-lg text-xl sm:text-2xl hover:bg-[#a16e47] transition-colors duration-300"
                                >
                                    중복검사
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col space-y-4">
                            <label
                                htmlFor="password"
                                className="text-2xl sm:text-3xl font-semibold text-[#89644C]"
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
                                className="px-4 py-3 border-2 border-[#89644C] rounded-lg text-xl sm:text-2xl focus:outline-none focus:ring-2 focus:ring-[#89644C]"
                            />
                        </div>
                        <div className="flex flex-col space-y-4">
                            <label
                                htmlFor="confirm-password"
                                className="text-2xl sm:text-3xl font-semibold text-[#89644C]"
                            >
                                비밀번호 확인
                            </label>
                            <input
                                type="password"
                                id="confirm-password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                placeholder="비밀번호를 확인하세요"
                                required
                                className="px-4 py-3 border-2 border-[#89644C] rounded-lg text-xl sm:text-2xl focus:outline-none focus:ring-2 focus:ring-[#89644C]"
                            />
                        </div>
                        <div className="flex flex-col space-y-4">
                            <label
                                htmlFor="name"
                                className="text-2xl sm:text-3xl font-semibold text-[#89644C]"
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
                                className="px-4 py-3 border-2 border-[#89644C] rounded-lg text-xl sm:text-2xl focus:outline-none focus:ring-2 focus:ring-[#89644C]"
                            />
                        </div>
                        <div className="flex flex-col space-y-4">
                            <label
                                htmlFor="nickname"
                                className="text-2xl sm:text-3xl font-semibold text-[#89644C]"
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
                                className="px-4 py-3 border-2 border-[#89644C] rounded-lg text-xl sm:text-2xl focus:outline-none focus:ring-2 focus:ring-[#89644C]"
                            />
                        </div>
                        <div className="flex flex-col space-y-4">
                            <label
                                htmlFor="email"
                                className="text-2xl sm:text-3xl font-semibold text-[#89644C]"
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
                                className="px-4 py-3 border-2 border-[#89644C] rounded-lg text-xl sm:text-2xl focus:outline-none focus:ring-2 focus:ring-[#89644C]"
                            />
                        </div>
                        <div className="flex flex-col space-y-4">
                            <label
                                htmlFor="mbti"
                                className="text-2xl sm:text-3xl font-semibold text-[#89644C]"
                            >
                                MBTI
                            </label>
                            <input
                                type="text"
                                id="mbti"
                                value={mbti}
                                onChange={(e) => setMbti(e.target.value)}
                                placeholder="MBTI를 입력하세요"
                                className="px-4 py-3 border-2 border-[#89644C] rounded-lg text-xl sm:text-2xl focus:outline-none focus:ring-2 focus:ring-[#89644C]"
                            />
                        </div>
                    </div>

                    <hr className="w-full my-8 sm:my-10 border-[#89644C] opacity-30" />

                    <div className="text-center w-full">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-[#89644C]">
                            관심사
                        </h2>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-6 sm:gap-8">
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
                                    className={`p-3 sm:p-4 w-full rounded-xl border-2 cursor-pointer ${
                                        interests.includes(interest.name)
                                            ? 'bg-blue-100'
                                            : 'bg-white'
                                    }`}
                                    onClick={() =>
                                        handleInterestChange(interest.name)
                                    }
                                >
                                    <span className="block text-center text-3xl sm:text-4xl mb-2">
                                        {interest.icon}
                                    </span>
                                    <span className="block text-center text-sm sm:text-base">
                                        {interest.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-500 text-center text-xl sm:text-2xl">
                            {error}
                        </p>
                    )}

                    <div className="flex w-full justify-center mt-10 sm:mt-12 space-x-8">
                        <button
                            type="button"
                            className="px-10 py-4 bg-[#89644C] text-white rounded-lg text-xl sm:text-2xl hover:bg-[#a16e47] transition-colors duration-300"
                            onClick={() => navigate(-1)}
                        >
                            뒤로가기
                        </button>
                        <button
                            type="submit"
                            className="px-10 py-4 bg-[#89644C] text-white rounded-lg text-xl sm:text-2xl hover:bg-[#a16e47] transition-colors duration-300"
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
