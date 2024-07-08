import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import axios for file upload
import { logoutUser } from '../../redux/slices/userSlice'; // 로그아웃 액션 임포트
import './ProfilePage.css';
import Cookies from 'js-cookie'; // 쿠키 라이브러리 임포트

import logo from '../../assets/barking-talk.png'; // 로고 이미지 경로
import defaultProfileImage from '../../assets/profile.jpg'; // 기본 프로필 이미지 경로
import editIcon from '../../assets/settings-icon.jpg'; // 수정 아이콘 경로

const interestsList = [
    '독서', '영화 감상', '게임', '여행', '요리', '드라이브', 'KPOP', '메이크업', '인테리어', '그림', '애완동물', '부동산', '맛집 투어', '헬스', '산책', '수영', '사진 찍기', '주식'
];

const ProfilePage = () => {
    const userInfo = useSelector((state) => state.user.userInfo);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [profileImage, setProfileImage] = useState(defaultProfileImage);
    const [clickedInterests, setClickedInterests] = useState([]); // 클릭된 관심사 상태
    const [selectedFile, setSelectedFile] = useState(null); // 선택된 파일 상태


    // 사용자 프로필 이미지를 설정하는 useEffect
    useEffect(() => {
        if (userInfo && userInfo.profileImage) {
            setProfileImage(userInfo.profileImage);
        }
    }, [userInfo]);


    const handleDeleteAccount = async () => {
        try {
            const token = Cookies.get('token'); // 쿠키에서 토큰을 가져옴
            const response = await axios.delete('http://localhost:5000/api/auth/account-deletion', {
                headers: {
                    Authorization: `Bearer ${token}`, // 토큰 추가
                },
            });
            
            if (response.status === 200) {
                dispatch(logoutUser());
                navigate('/');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('계정 삭제 중 오류가 발생했습니다.');
        }
    };

    const handleInterestClick = (interest) => {
        setClickedInterests((prevState) =>
            prevState.includes(interest) ? prevState.filter((i) => i !== interest) : [...prevState, interest]
        );
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result);
            };
            reader.readAsDataURL(file);
            setSelectedFile(file);
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile) return;
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await axios.post('your_upload_endpoint', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log(response.data);
            // 업로드 후 추가 처리 로직
        } catch (error) {
            console.error('Error uploading file:', error);
        }
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
            <div className="profile-details">
                    <div className="profile-picture-container">
                        <img src={profileImage} alt="프로필 사진" className="profile-picture" />
                        <label htmlFor="file-input" className="file-input-label">
                            <img src={editIcon} alt="수정 아이콘" className="additional-image" />
                        </label>
                        <input type="file" id="file-input" className="file-input" onChange={handleFileChange} />
                    </div>
                    <h2>이름: {userInfo?.name}</h2>
                    <h3>닉네임: {userInfo?.username}</h3>
                </div>
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
                    <div className="interests-header"></div>
                    <div className="interests-content">
                        {interestsList.map((interest, index) => (
                            <button
                                key={index}
                                className={`interest-tag ${clickedInterests.includes(interest) ? 'clicked' : ''}`}
                                onClick={() => handleInterestClick(interest)}
                            >
                                {interest}
                            </button>
                        ))}
                    </div>
                    <div className="interests-footer"></div>
                </div>
                <div className="buttons">
                    <button className="back-button" onClick={() => navigate(-1)}>
                        뒤로가기
                    </button>
                    <button className="edit-button" onClick={() => navigate('/edit-profile')}>
                        수정하기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
