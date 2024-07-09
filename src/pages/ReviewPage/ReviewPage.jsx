import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import logo from '../../assets/barking-talk.png'; // 로고 이미지 경로
import profile1 from '../../assets/profile.jpg'; // 사용자 1 이미지 경로
import profile2 from '../../assets/profile.jpg'; // 사용자 2 이미지 경로
import profile3 from '../../assets/profile.jpg'; // 사용자 3 이미지 경로
import videoPlaceholder from '../../assets/people.png'; // 동영상 공간을 위한 이미지
import Declaration from '../../assets/declaration.jpg'; // 동영상 공간을 위한 이미지
const ReviewPage = () => {
    const [ratings, setRatings] = useState([0, 0, 0]); // 세 명의 사용자 리뷰를 관리
    const [interestsData, setInterestsData] = useState(null); // 관심사 데이터를 저장
    const [reportingUser, setReportingUser] = useState(null); // 신고할 사용자

    const [reportReason, setReportReason] = useState(''); // 신고 이유
    const [reportDescription, setReportDescription] = useState(''); // 신고 설명
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
        // 신고할 사용자 설정
        setReportingUser(username);
    };

    const closeModal = () => {
        setReportingUser(null);
    };

    const submitReport = () => {
        // 신고 제출 로직
        console.log('신고된 사용자:', reportingUser);
        alert(`${reportingUser}님을 신고했습니다.`);
        setReportingUser(null);
    };

    const username = userInfo?.username || '사용자';

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center">
            <header className="w-full bg-[#a16e47] p-4 flex justify-between items-center">
                <div className="flex items-center">
                    <img src={logo} alt="명톡 로고" className="w-24 h-24 ml-2" /> {/* 수정된 부분 */}
                </div>
            </header>
            <div className="bg-white shadow-md rounded-lg p-8 mt-10 w-full max-w-4xl">
                <h2 className="text-2xl font-bold text-center mb-4">통화 시간이 종료되었습니다.</h2>
                <p className="text-center mb-6">즐거운 통화 시간이 되셨나요? 리뷰를 남겨보세요!</p>
                <div className="space-y-6">
                    {[
                        { name: '시고르자브종', img: profile1, speech: '발화량 42%' },
                        { name: '멍멍', img: profile2, speech: '발화량 37%' },
                        { name: '우하하', img: profile3, speech: '발화량 21%' },
                    ].map((user, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg shadow-md flex items-center space-x-4">
                            <img src={videoPlaceholder} alt="동영상" className="w-16 h-16 rounded-full" />
                            <img src={user.img} alt={user.name} className="w-16 h-16 rounded-full" />
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold">{user.name} <span className="text-sm text-gray-500">{user.speech}</span></h3>
                                <div className="flex space-x-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span
                                            key={star}
                                            className={`cursor-pointer text-2xl ${
                                                ratings[index] >= star ? 'text-yellow-400' : 'text-gray-300'
                                            }`}
                                            onClick={() => handleRatingChange(index, star)}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <button
                                className="bg-red-500 text-white px-4 py-2 rounded-full flex items-center space-x-2"
                                onClick={() => handleReport(user.name)}
                            >
                                <span>신고하기</span>
                                <img src={Declaration} alt="이모티콘" className="w-6 h-6" /> {/* 수정된 부분 */}
                            </button>
                        </div>
                    ))}
                </div>
                {interestsData && interestsData.username === username && (
                    <div className="mt-6 p-4 bg-yellow-100 rounded-lg">
                        <h4 className="font-bold text-lg">'{username}'님의 관심사로 예상됩니다!</h4>
                        <p>{interestsData.interests.join(', ')}</p>
                    </div>
                )}
                <div className="flex justify-center mt-8 space-x-4"> {/* 수정된 부분 */}
                    <button
                        className="bg-gray-300 text-black px-6 py-3 rounded-full"
                        onClick={() => window.location.href = '/main'}
                    >
                        SKIP
                    </button>
                    <button
                        className="bg-green-500 text-white px-6 py-3 rounded-full"
                        onClick={handleSubmitReview}
                    >
                        완료
                    </button>
                </div>
            </div>

            {reportingUser && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                        <header className="bg-[#a16e47] text-white p-4 rounded-t-lg flex justify-between items-center">
                            <img src={logo} alt="명톡 로고" className="w-12 h-12" />
                        </header>
                        <div className="p-6">
                            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
                                <h3 className="text-xl font-bold text-center mb-4">{reportingUser}님을 신고합니다</h3>
                                <p className="text-gray-700 mb-4 text-center">신고 사유를 작성해주세요</p>
                                <div className="space-y-4 w-full">
                                    {['말 없이 대화 종료', '욕설, 부적절한 발언', '성적인 언행', '사기 및 스팸', '기타'].map((reason) => (
                                        <label key={reason} className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                name="reportReason"
                                                value={reason}
                                                checked={reportReason === reason}
                                                onChange={(e) => setReportReason(e.target.value)}
                                                className="form-radio text-red-500"
                                            />
                                            <span className="text-gray-700">{reason}</span>
                                        </label>
                                    ))}
                                    {reportReason === '기타' && (
                                        <textarea
                                            className="w-full p-2 border rounded-md"
                                            placeholder="자세한 사유를 작성해주세요..."
                                            value={reportDescription}
                                            onChange={(e) => setReportDescription(e.target.value)}
                                        />
                                    )}
                                </div>
                                <button
                                    className="bg-red-500 text-white px-4 py-2 rounded-full mt-6"
                                    onClick={submitReport}
                                >
                                    신고하기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewPage;