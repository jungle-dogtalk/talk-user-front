import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../redux/slices/userSlice'; // 로그아웃 액션 임포트
import './ProfilePage.css';

import logo from '../../assets/cat_logo.jpg'; // 로고 이미지 경로
import profileImage from '../../assets/profile.jpg'; // 프로필 이미지 경로

const ProfilePage = () => {
    const userInfo = useSelector((state) => state.user.userInfo);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate('/');
    };

    const handleDeleteAccount = () => {
        // 계정 탈퇴 로직 추가
        // 예: API 호출 후 로컬 스토리지 삭제 및 로그아웃
        dispatch(logoutUser());
        navigate('/');
    };

    return (
        <div className="profile-page">
            <div className="header">
                <img src={logo} alt="명톡 로고" className="logo" />
                <button className="delete-account" onClick={handleDeleteAccount}>
                    탈퇴하기
                </button>
            </div>
            <div className="profile-card">
                <img src={profileImage} alt="프로필 사진" className="profile-picture" />
                <h2>이름: {userInfo?.name}</h2>
                <h3>닉네임: {userInfo?.username}</h3>
                <div className="progress-bars">
                    <div className="progress-bar">
                        <div className="bar red" style={{ width: '74%' }}></div>
                        <span>74%</span>
                    </div>
                    <div className="progress-bar">
                        <div className="bar blue" style={{ width: '80%' }}></div>
                        <span>80%</span>
                    </div>
                </div>
                <div className="interests">
                    {userInfo?.interests.map((interest) => (
                        <button key={interest} className="interest-tag">{interest}</button>
                    ))}
                </div>
                <div className="buttons">
                    <button className="edit-button" onClick={() => navigate('/edit-profile')}>
                        수정하기
                    </button>
                    <button className="back-button" onClick={() => navigate(-1)}>
                        뒤로가기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
