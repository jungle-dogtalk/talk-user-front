import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../../redux/actions/userActions';
import './LoginPage.css';
import logo from '../../../assets/cat_logo.jpg'; // 로고 이미지 경로

const HomePage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { error } = useSelector((state) => state.user);

    const handleLogin = async (e) => {
        e.preventDefault();
        const success = await dispatch(loginUser({ username, password }));
        if (success) {
            navigate('/main'); // 로그인 성공 시 메인 페이지로 이동
        }
    };

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

export default HomePage;
