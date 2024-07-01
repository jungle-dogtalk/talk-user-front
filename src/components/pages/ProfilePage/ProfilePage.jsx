import React, { useState, useEffect } from 'react';
import './ProfilePage.css';
import profilePicture from '../../../assets/profile.jpg'; // 프로필 사진 경로
import logo from '../../../assets/cat_logo.jpg'; // 로고 이미지 경로

const ProfilePage = () => {
  const [user, setUser] = useState({
    name: '김사용자',
    nickname: '커피타우린',
    interest1: 74,
    interest2: 80,
    interests: ['게임', '음악', '여행', '독서']
  });

  const handleUpdateProfile = () => {
    // 프로필 업데이트 로직
  };

  return (
    <div className="profile-page">
      <div className="header">
        <img src={logo} alt="명톡 로고" className="logo" />
      </div>
      <div className="profile-container">
        <img src={profilePicture} alt={user.name} className="profile-picture" />
        <h2>{user.name}</h2>
        <p>닉네임: {user.nickname}</p>
        <div className="progress-bars">
          <div className="progress-bar">
            <span>{user.interest1}%</span>
            <div className="bar" style={{ width: `${user.interest1}%` }}></div>
          </div>
          <div className="progress-bar">
            <span>{user.interest2}%</span>
            <div className="bar" style={{ width: `${user.interest2}%` }}></div>
          </div>
        </div>
        <div className="interests">
          {user.interests.map((interest, index) => (
            <span key={index} className="interest">{interest}</span>
          ))}
        </div>
        <button className="update-button" onClick={handleUpdateProfile}>수정하기</button>
      </div>
    </div>
  );
};

export default ProfilePage;
