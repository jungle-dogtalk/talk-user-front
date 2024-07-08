import React, { useState, useEffect } from 'react'; // React와 React 훅스 가져오기
import { useNavigate } from 'react-router-dom'; // 리디렉션을 위해 useNavigate 훅 가져오기
import { useDispatch, useSelector } from 'react-redux'; // Redux 훅스 가져오기
import { loginUser } from '../../redux/slices/userSlice'; // 로그인 액션 가져오기
import './LoginPage.css'; // 로그인 페이지 스타일 시트 가져오기
import logo from '../../assets/cat_logo.jpg'; // 로고 이미지 경로

const LoginPage = () => {
    const [username, setUsername] = useState(''); // 사용자 이름 상태 변수와 설정 함수
    const [password, setPassword] = useState(''); // 비밀번호 상태 변수와 설정 함수
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token, error,loading  } = useSelector((state) => state.user); // Redux store의 상태를 읽어오는 데 사용.

    const handleLogin = async (e) => {
        e.preventDefault(); // 폼 제출시 페이지가 새로고침 되는 것 방지
        const resultAction = await dispatch(loginUser({ username, password })); // 비동기 액션을 디스패치하여 로그인 요청 보내기

        // resultAction이 성공적으로 완료되었는지
        if (loginUser.fulfilled.match(resultAction)) {
            navigate('/main'); // 로그인 성공 시 메인 페이지로 이동
        }

    };

    useEffect(() => {
        if (token) {
            navigate('/main'); // 이미 로그인되어 있는 경우 메인 페이지로 리디렉션
        }
    }, [token, navigate]);

    return (
        <div className="home-page">
            <div className="login-box">
                <img src={logo} alt="명톡 로고" className="logo" />
                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <label htmlFor="username">ID</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="아이디를 입력하세요"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">PW</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호를 입력하세요"
                            required
                        />
                    </div>
                    {loading && <p>Loading...</p>}
                    {error && <p className="error">{error}</p>}
                    <button type="submit" className="login-button">
                        로그인
                    </button>
                </form>
                <div className="links">
                    <a href="/signup" className="signup-link">
                        회원가입 하기
                    </a>
                    <a href="/forgot-password" className="forgot-link">
                        ID/PW 찾기
                    </a>
                </div>
            </div>
        </div>
        
    );
};

export default LoginPage;
