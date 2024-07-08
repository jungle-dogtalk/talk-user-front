import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import './ReviewPage.css';
import logo from '../../assets/cat_logo.jpg'; // 로고 이미지 경로
import profile1 from '../../assets/profile.jpg'; // 사용자 1 이미지 경로
import profile2 from '../../assets/profile.jpg'; // 사용자 2 이미지 경로
import profile3 from '../../assets/profile.jpg'; // 사용자 3 이미지 경로

const ReviewPage = () => {
    const [ratings, setRatings] = useState([0, 0, 0]); // 세 명의 사용자 리뷰를 관리
    const [interestsData, setInterestsData] = useState(null); // 관심사 데이터를 저장

    const userInfo = useSelector((state) => state.user.userInfo);

    useEffect(() => {
        // localStorage에서 관심사 데이터를 가져옴
        const storedInterestsData = localStorage.getItem('interestsData');
        if (storedInterestsData) {
            setInterestsData(JSON.parse(storedInterestsData));
        }
    }, []);

    const handleRatingChange = (index, rating) => {
        const newRatings = [...ratings];
        newRatings[index] = rating;
        setRatings(newRatings);
    };

    const handleSubmitReview = () => {
        // 리뷰 제출 로직
        console.log('제출된 리뷰:', ratings);
        alert('리뷰가 제출되었습니다.');
        // 로컬 스토리지에서 관심사 데이터를 지움 -> 나중에 DB 연동하면 지울 것
        localStorage.removeItem('interestsData');
        window.location.href = '/main';
    };

    const handleReport = (username) => {
        // 신고 제출 로직
        console.log('신고된 사용자:', username);
        alert(`${username}님을 신고했습니다.`);
    };

    const username = userInfo?.username || '사용자';

    return (
        <div className="review-page">
            <div className="header">
                <img src={logo} alt="명톡 로고" className="logo" />
            </div>
            <div className="review-container">
                <h2>통화 시간이 종료되었습니다.</h2>
                <p>즐거운 통화 시간이 되셨나요? 리뷰를 남겨보세요!</p>
                <br />
                <div className="reviews">
                    {[
                        { name: '시고르자브종', img: profile1 },
                        { name: '멍멍', img: profile2 },
                        { name: '우하하', img: profile3 },
                    ].map((user, index) => (
                        <div key={index} className="review-item">
                            <img
                                src={user.img}
                                alt={user.name}
                                className="review-picture"
                            />
                            <div className="review-details">
                                <h3>{user.name}</h3>
                                <div className="stars">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span
                                            key={star}
                                            className={`star ${
                                                ratings[index] >= star
                                                    ? 'selected'
                                                    : ''
                                            }`}
                                            onClick={() =>
                                                handleRatingChange(index, star)
                                            }
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                                <button
                                    className="report-button"
                                    onClick={() => handleReport(user.name)}
                                >
                                    신고하기
                                </button>
                            </div>
                        </div>
                    ))}
                    <br />
                    {interestsData && interestsData.username === username && (
                        <div className="interests">
                            <h4>'{username}'님의 관심사로 예상됩니다!</h4>
                            <p>{interestsData.interests.join(', ')}</p>
                        </div>
                    )}
                </div>
                <button className="submit-button" onClick={handleSubmitReview}>
                    완료
                </button>
            </div>
        </div>
    );
};

export default ReviewPage;
