import React, { useState } from 'react';
import './ReportPage.css';
import logo from '../../../assets/cat_logo.jpg'; // 로고 이미지 경로

const ReportPage = () => {
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');

  const handleSubmitReport = (e) => {
    e.preventDefault();
    if (!selectedReason) {
      alert('신고 사유를 선택하세요.');
      return;
    }

    // 신고 제출 로직
    console.log('신고 사유:', selectedReason);
    console.log('상세 내용:', details);

    // 서버에 신고 데이터를 전송하는 로직을 추가하세요.
    alert('신고가 제출되었습니다.');
  };

  return (
    <div className="report-page">
      <div className="header">
        <img src={logo} alt="명톡 로고" className="logo" />
      </div>
      <div className="report-container">
        <h2>시그로자보중 님을 신고합니다.</h2>
        <form onSubmit={handleSubmitReport}>
          <p>- 신고 사유를 작성해주세요 -</p>
          <label>
            <input
              type="radio"
              value="말 없이 대화 종료"
              checked={selectedReason === '말 없이 대화 종료'}
              onChange={(e) => setSelectedReason(e.target.value)}
            />
            말 없이 대화 종료
          </label>
          <label>
            <input
              type="radio"
              value="욕설, 부적절한 발언"
              checked={selectedReason === '욕설, 부적절한 발언'}
              onChange={(e) => setSelectedReason(e.target.value)}
            />
            욕설, 부적절한 발언
          </label>
          <label>
            <input
              type="radio"
              value="성적인 언행"
              checked={selectedReason === '성적인 언행'}
              onChange={(e) => setSelectedReason(e.target.value)}
            />
            성적인 언행
          </label>
          <label>
            <input
              type="radio"
              value="사기 및 스팸"
              checked={selectedReason === '사기 및 스팸'}
              onChange={(e) => setSelectedReason(e.target.value)}
            />
            사기 및 스팸
          </label>
          <label>
            <input
              type="radio"
              value="기타"
              checked={selectedReason === '기타'}
              onChange={(e) => setSelectedReason(e.target.value)}
            />
            기타
          </label>
          <textarea
            placeholder="자세한 사유를 작성해주세요."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
          <button type="submit" className="submit-button">신고하기</button>
        </form>
      </div>
    </div>
  );
};

export default ReportPage;
