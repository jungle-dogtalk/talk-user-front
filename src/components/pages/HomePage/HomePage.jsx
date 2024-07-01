import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // useNavaviate 훅을 import 하여 페이지 이동 기능 사용
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../redux/actions/userActions';
import './HomePage.css';
import logo from '../../../assets/logo.png'; // 로고 이미지 경로

const HomePage = () => {
  // 상태 관리를 위한 useState 훅 사용
  const [username, setUsername] = useState(''); // username 상태
  const [password, setPassword] = useState('');
  const dispatch = useDispatch(); // Redux 액션을 디스패치하기 위한 훅
  const navigate = useNavigate(); // 페이지 이동을 위한 훅
  const { error } = useSelector(state => state.user); // Redux 스토어에서 user 상태의 error를 선택

  // 로그인 버튼 클릭 시 호출되는 함수
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
          <button type="submit" className="login-button">로그인</button>
        </form>
        <a href="/signup" className="signup-link">회원가입 하기</a>
        <a href="/forgot-password" className="forgot-link">ID/PW 찾기</a>
      </div>
    </div>
  );
};

export default HomePage;
