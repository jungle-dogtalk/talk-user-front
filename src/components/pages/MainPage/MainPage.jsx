import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';
import logo from '../../../assets/cat_logo.jpg'; // 로고 이미지 경로
import profileImage from '../../../assets/profile.jpg'; // 프로필 이미지 경로
import roomIcon from '../../../assets/room-icon.png'; // 방에서 통화하기 아이콘 경로
import groupIcon from '../../../assets/room-icon.png'; // 넷이서 통화하기 아이콘 경로
import settingsIcon from '../../../assets/settings-icon.jpg'; // 설정 아이콘 경로

const MainPage = () => {
  const userInfo = useSelector((state) => state.user.userInfo);
  const navigate = useNavigate(); // useNavigate 훅 사용

  return (
    <div className="main-page">
      <div className="header">
        <img src={logo} alt="명톡 로고" className="logo" />
        <div className="user-info">
          <span>{userInfo?.username}</span>
          <span>
            설정 | 로그아웃
            <img
              src={settingsIcon}
              alt="설정 아이콘"
              className="settings-icon"
              onClick={() => navigate('/profile')} // 설정 아이콘 클릭 시 프로필 페이지로 이동
            />
            <span className="mypage-link" onClick={() => navigate('/profile')}>
              마이페이지
            </span>
          </span>
        </div>
      </div>
      <div className="profile-section">
        <img src={profileImage} alt="프로필 사진" className="profile-picture" />
        <h2>{userInfo?.name}</h2>
        <div className="progress-bars">
          <div className="progress-bar">
            <div className="bar red" style={{ width: '74%' }}></div>
            <span>74%</span>
          </div>
          <div className="progress-bar">
            <div className="bar blue" style={{ width: '88%' }}></div>
            <span>88%</span>
          </div>
        </div>
      </div>
      <div className="actions">
        <button className="action-button">
          <img src={roomIcon} alt="방에서 통화하기" />
          <span>둘이서 통화하기</span>
        </button>
        <button className="action-button" onClick={() => navigate('/videochat')}>
          <img src={groupIcon} alt="넷이서 통화하기" />
          <span>넷이서 통화하기</span>
        </button>
      </div>
    </div>
  );
};

export default MainPage;
