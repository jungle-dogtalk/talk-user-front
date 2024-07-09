import React, { useState, useEffect  } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios'; // axios 임포트
import { apiCall } from '../../utils/apiCall'; // apiCall 함수 임포트
import { API_LIST } from '../../utils/apiList'; // API_LIST 임포트
import { useNavigate } from 'react-router-dom';
import './SignUpPage.css';
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
        interests.forEach(interest => formData.append('interests', interest));
        formData.append('profileImage', selectedFile);

        try {
            const response = await axios.post('http://localhost:5000/api/auth/signup', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data) {
                alert('회원가입이 성공적으로 성공하셨습니다.')
                navigate('/');
            }
        } catch (error) {
            console.error('Error:', error.response ? error.response.data : error.message);
            alert('An error occurred during sign up: ' + (error.response ? error.response.data.message : error.message));
        }
    };

    // 관심사 변경 처리 함수
    const handleInterestChange = (e) => {
        const { value, checked } = e.target;
        if (checked) {
            setInterests([...interests, value]);
        } else {
            setInterests(interests.filter((interest) => interest !== value));
        }
    };

    // 아이디 중복 체크 함수
    const handleUsernameCheck = async () => {
        try {
            const response = await apiCall(API_LIST.CHECK_USERNAME, { username });
            if (response.data) {
                alert(response.message);
            } else {
                alert('ID를 사용하실 수 있습니다.');
            }
        } catch (error) {
            console.error('Error checking username:', error.response ? error.response.data : error.message);
            alert('An error occurred while checking the username: ' + (error.response ? error.response.data.message : error.message));
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
        <div className="signup-page">
            <div className="signup-container">
                <img src={logo} alt="명톡 로고" className="logo" />
                <div className="profile-picture-container">
                    <img src={profileImage} alt="프로필 사진" className="profile-picture" />
                    <label htmlFor="file-input" className="file-input-label">
                        <img src={editIcon} alt="수정 아이콘" className="additional-image" />
                    </label>
                    <input type="file" id="file-input" className="file-input" onChange={handleFileChange} />
                </div>
                <form onSubmit={handleSignUp} className="signup-form">
                    <div className="input-group">
                        <label htmlFor="username">아이디</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="아이디를 입력하세요"
                            required
                        />
                        <button type="button" onClick={handleUsernameCheck}>중복검사</button>
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">비밀번호</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호를 입력하세요"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="confirm-password">비밀번호 확인</label>
                        <input
                            type="password"
                            id="confirm-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="비밀번호를 확인하세요"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="name">이름</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="이름을 입력하세요"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="nickname">닉네임</label>
                        <input
                            type="text"
                            id="nickname"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="닉네임을 입력하세요"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="email">이메일</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="이메일을 입력하세요"
                            required
                        />
                    </div>
                    <div className="interests-container">
                        <label>관심사</label>
                        <div className="interests">
                            {['독서', '영화 감상', '게임', '여행', '요리', '드라이브', 'KPOP', '메이크업', '인테리어', '그림', '애완동물', '부동산', '맛집 투어', '헬스', '산책', '수영', '사진 찍기', '주식'].map((interest) => (
                                <label key={interest} className="interest-label">
                                    <input
                                        type="checkbox"
                                        name="interest"
                                        value={interest}
                                        onChange={handleInterestChange}
                                    />
                                    {interest}
                                </label>
                            ))}
                        </div>
                    </div>
                    {error && <p className="error">{error}</p>}
                    <div className="buttons">
                        <button type="button" className="back-button" onClick={() => navigate(-1)}>
                            뒤로가기
                        </button>
                        <button type="submit" className="signup-button">
                            회원가입
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignUpPage;
