import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser, fetchUserProfile  } from '../../redux/slices/userSlice'; // 로그아웃 액션 임포트
import './MainPage.css';
import logo from '../../assets/barking-talk.png'; // 로고 이미지 경로
import profileImage from '../../assets/profile.jpg'; // 프로필 이미지 경로
import roomIcon from '../../assets/room-icon.png'; // 방에서 통화하기 아이콘 경로
import groupIcon from '../../assets/room-icon.png'; // 넷이서 통화하기 아이콘 경로
import settingsIcon from '../../assets/settings-icon.jpg'; // 설정 아이콘 경로

const MainPage = () => {
    const userInfo = useSelector((state) => state.user.userInfo);

    const token = useSelector((state) => state.user.token);
    const navigate = useNavigate(); // useNavigate 훅 사용
    const dispatch = useDispatch();

    console.log(userInfo);

    useEffect(() => {
        if (!token) {
            navigate('/'); // 로그인 상태가 아닌 경우 로그인 페이지로 리디렉션
        }
    }, [token, navigate]);

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate('/');
    };

    useEffect(() => {
        // Redux를 사용하여 사용자 정보를 가져오는 함수
        dispatch(fetchUserProfile());
    }, [dispatch]);

    return (
        <div className="main-page">
            <div className="header">
                <img src={logo} alt="명톡 로고" className="logo" />
                <div className="header-links">
                    <span>친구목록</span>
                    <span> | </span>
                    <a href="/profile">마이 페이지</a>
                    <span> | </span>
                    <span className="logout-link" onClick={handleLogout}>
                        로그아웃
                    </span>
                </div>
            </div>
            <div className="profile-section">
                <img
                    src={userInfo?.profileImage || profileImage}
                    alt="프로필 사진"
                    className="profile-picture"
                />
                <h2>{userInfo?.name}</h2>
                <div className="progress-bars">
                    <div className="progress-bar">
                        <div className="bar red" style={{ width: '74%' }}></div>
                        <span>74%</span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className="bar blue"
                            style={{ width: '88%' }}
                        ></div>
                        <span>88%</span>
                    </div>
                </div>
            </div>
            <div className="actions">
                <button className="action-button" onClick={() => navigate('/room')}>
                    <img src={roomIcon} alt="방에서 통화하기" />
                    <span>둘이서 통화하기</span>
                </button>
                <button
                    className="action-button"
                    onClick={() => navigate('/videochat')}
                >
                    <img src={groupIcon} alt="넷이서 통화하기" />
                    <span>넷이서 통화하기</span>
                </button>
            </div>
        </div>
    );
};

export default MainPage;
