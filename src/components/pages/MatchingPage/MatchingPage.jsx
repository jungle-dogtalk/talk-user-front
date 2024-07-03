import React from 'react';
import './MatchingPage.css';
import waitingDogImage from '../../../assets/dog.jpg'; // 강아지 이미지
import waitingHouseImage from '../../../assets/doghouse.jpg'; // 강아지 집 이미지

const MatchingPage = () => {
  const handleStopClick = () => {
    alert('중단하기 버튼이 클릭되었습니다.');
  };

  const handleCancelClick = () => {
    alert('취소하기 버튼이 클릭되었습니다.');
  };

  return (
    <div className="matching-page">
      <div className="header">
        <h1>명톡</h1>
      </div>
      <div className="content2">
        <div className="matching-box">
          <div className="matching-status">
            <h2>매칭 중...</h2>
            <p>예상시간: 8분</p>
          </div>
          <p className="instruction">화면 아래 집 아이콘을 누르면 통화를 중단할 수 있어요!</p>
          <div className="images">
            <img src={waitingDogImage} alt="Waiting Dog" className="waiting-dog" />
            <div className="house-wrapper">
              <img src={waitingHouseImage} alt="Waiting House" className="waiting-house" />
              <button className="stop-button" onClick={handleStopClick}>중단하기</button>
            </div>
          </div>
          <button className="cancel-button" onClick={handleCancelClick}>취소하기</button>
        </div>
      </div>
    </div>
  );
};

export default MatchingPage;
