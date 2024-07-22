import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import logo from '../../assets/barking-talk.png'; // 로고 이미지 경로
import videoPlaceholder from '../../assets/people.png'; // 동영상 공간을 위한 이미지
import Declaration from '../../assets/declaration.jpg'; // 동영상 공간을 위한 이미지

import crownIcon from '../../assets/crown.png'; // 왕관 아이콘 이미지
import celebrationEffect from '../../assets/celebration.gif'; // 축하 이펙트 이미지

import { apiCall } from '../../utils/apiCall';
import { API_LIST } from '../../utils/apiList';

const ReviewPage = () => {
    const navigate = useNavigate(); // useNavigate 훅 추가
    const [ratings, setRatings] = useState([0, 0, 0]); // 세 명의 사용자 리뷰를 관리
    const [reportingUser, setReportingUser] = useState(null); // 신고할 사용자

    const [reportReason, setReportReason] = useState(''); // 신고 이유
    const [reportDescription, setReportDescription] = useState(''); // 신고 설명
    const userInfo = useSelector((state) => state.user.userInfo);

    const [sessionId, setSessionId] = useState('');
    const [sessionData, setSessionData] = useState(null); // 세션 데이터를 저장
    const [callUserInfo, setCallUserInfo] = useState([]); // 통화 유저 정보 저장
    const [topTalker, setTopTalker] = useState(null); // 오늘의 수다왕

    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [isFeedbackFetched, setIsFeedbackFetched] = useState(false);

    useEffect(() => {
        const fromVideoChat = sessionStorage.getItem('fromVideoChat');
        if (!fromVideoChat) {
            alert('비디오 채팅을 통해서만 접근 가능합니다.');
            navigate('/main', { replace: true });
            return;
        }

        // 세션 ID 가져오기
        const savedSessionId = sessionStorage.getItem('sessionId');
        if (savedSessionId) {
            setSessionId(savedSessionId);
            fetchSessionData(savedSessionId); // 세션 데이터 가져오기
        }
    }, [navigate, userInfo.username]);

    // 세션 데이터를 가져오는 함수
    const fetchSessionData = async (sessionId) => {
        try {
            const response = await apiCall(API_LIST.GET_SESSION_DATA, {
                sessionId,
            });
            if (response.data && response.data.length > 0) {
                console.log('fetchSessionData - response.data:', response.data);

                // 통화 유저 정보 가져오기
                const usernames = response.data.map((user) => user.userId);
                const callUserInfoResponse = await apiCall(
                    API_LIST.GET_CALL_USER_INFO,
                    { usernames }
                );

                // 사용자 정보 병합 및 필터링 (본인 제외)
                const mergedData = callUserInfoResponse.data
                    .filter((user) => user._id !== userInfo._id)
                    .map((user) => ({
                        ...user,
                        userId: user.username,
                        nickname: user.nickname || user.username,
                        profileImage: user.profileImage || videoPlaceholder,
                        utterance: user.utterance || 0,
                    }));

                /// 발화량이 가장 많은 사용자 찾기 (본인 포함)
                const allUsers = [
                    ...callUserInfoResponse.data,
                    {
                        username: userInfo.username,
                        nickname: userInfo.nickname,
                        utterance: userInfo.utterance || 0,
                        profileImage: userInfo.profileImage || videoPlaceholder,
                    },
                ];
                const topTalker = allUsers.reduce((prev, current) =>
                    (prev.utterance || 0) > (current.utterance || 0)
                        ? prev
                        : current
                );
                setTopTalker(topTalker);

                setSessionData(mergedData);
                setCallUserInfo(mergedData);
                setRatings(new Array(mergedData.length).fill(0));

                console.log('Top Talker:', topTalker);
            } else {
                console.error('No session data found');
            }
        } catch (error) {
            console.error('Error fetching session data:', error);
        }
    };

    // 사용자 리뷰 점수를 변경하는 함수
    const handleRatingChange = (index, rating) => {
        const newRatings = [...ratings];
        newRatings[index] = rating;
        setRatings(newRatings);
    };

    // 리뷰 제출하는 함수
    const handleSubmitReview = async () => {
        try {
            await apiCall(API_LIST.SUBMIT_REVIEW, {
                sessionId,
                reviews: sessionData.map((user, index) => ({
                    userId: user._id, // userId를 username으로 변경
                    rating: ratings[index],
                })),
            });
            alert('리뷰가 제출되었습니다.');

            // sessionStorage에서 feedback을 삭제
            sessionStorage.removeItem('feedback');

            window.location.href = '/main';
        } catch (error) {
            console.error('Error submitting reviews:', error);
            alert('리뷰 제출 중 오류가 발생했습니다.');
        }
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

    const fetchFeedback = async () => {
        const savedFeedback = sessionStorage.getItem('feedback');
        if (savedFeedback) {
            setFeedback(savedFeedback);
            setIsFeedbackFetched(true);
        }
        setIsFeedbackModalOpen(true);
    };

    return (
        <div className="h-screen bg-gray-100 flex flex-col">
            <header className="w-full bg-[#a16e47] p-1 flex items-center">
                <img
                    src={logo}
                    alt="명톡 로고"
                    className="w-16 h-16 sm:w-20 sm:h-20 ml-2"
                />
            </header>
            <div className="flex-1 overflow-auto flex flex-col p-4 sm:p-5">
                {topTalker && (
                    <div className="text-center mb-4 p-3 sm:p-2 border-2 border-yellow-400 bg-yellow-50 rounded-lg flex items-center justify-center">
                        <div>
                            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-yellow-600 mb-2">
                                오늘의 수다왕
                            </h2>
                            <h3 className="text-xl sm:text-3xl lg:text-4xl font-semibold mb-1">
                                '{topTalker.nickname}'님
                            </h3>
                            <p className="text-lg sm:text-2xl lg:text-3xl text-gray-600">
                                발화량: {topTalker.utterance} %
                            </p>
                        </div>
                        <div className="ml-4 sm:ml-6">
                            <img
                                src={crownIcon}
                                alt="왕관"
                                className="w-16 h-16 sm:w-20 sm:h-20"
                            />
                            <img
                                src={celebrationEffect}
                                alt="축하 이펙트"
                                className="w-16 h-16 sm:w-20 sm:h-20 mt-2"
                            />
                        </div>
                    </div>
                )}
    
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 flex-1">
                    {sessionData && sessionData.length > 0 ? (
                        sessionData.map((user, index) => (
                            <div
                                key={index}
                                className="bg-white p-3 sm:p-4 rounded-lg shadow-lg flex items-center space-x-4 sm:space-x-6"
                            >
                                <div className="flex flex-col items-center space-y-2 sm:space-y-3">
                                    <img
                                        src={user.profileImage}
                                        alt="프로필"
                                        className="w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full"
                                    />
                                    <div className="flex space-x-1 sm:space-x-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <span
                                                key={star}
                                                className={`cursor-pointer text-3xl sm:text-4xl ${
                                                    ratings[index] >= star
                                                        ? 'text-yellow-400'
                                                        : 'text-gray-300'
                                                }`}
                                                onClick={() => handleRatingChange(index, star)}
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl sm:text-4xl lg:text-6xl font-semibold mb-2">
                                        {user.nickname}
                                    </h3>
                                    <p className="text-xl sm:text-3xl lg:text-4xl text-gray-500">
                                        발화량 {user.utterance || 0}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-2xl sm:text-3xl col-span-2">Now Loading..</p>
                    )}
                </div>
                <div className="flex justify-center mt-4 sm:mt-6 space-x-4 sm:space-x-6">
                    <button
                        className="bg-gray-300 text-black px-6 py-3 sm:px-8 sm:py-4 rounded-full text-xl sm:text-2xl font-bold"
                        onClick={fetchFeedback}
                    >
                        AI 피드백
                    </button>
                    <button
                        className="bg-green-500 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-full text-xl sm:text-2xl font-bold"
                        onClick={handleSubmitReview}
                    >
                        완료
                    </button>
                </div>
            </div>

            {/* {reportingUser && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-xs sm:max-w-md">
                        <header className="bg-[#a16e47] text-white p-4 rounded-t-lg flex justify-between items-center">
                            <img
                                src={logo}
                                alt="명톡 로고"
                                className="w-8 h-8 sm:w-12 sm:h-12"
                            />
                        </header>
                        <div className="p-6">
                            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md flex flex-col items-center">
                                <h3 className="text-lg sm:text-xl font-bold text-center mb-4">
                                    {reportingUser}님을 신고합니다
                                </h3>
                                <p className="text-gray-700 mb-4 text-center">
                                    신고 사유를 작성해주세요
                                </p>
                                <div className="space-y-2 sm:space-y-4 w-full">
                                    {[
                                        '말 없이 대화 종료',
                                        '욕설, 부적절한 발언',
                                        '성적인 언행',
                                        '사기 및 스팸',
                                        '기타',
                                    ].map((reason) => (
                                        <label
                                            key={reason}
                                            className="flex items-center space-x-2"
                                        >
                                            <input
                                                type="radio"
                                                name="reportReason"
                                                value={reason}
                                                checked={
                                                    reportReason === reason
                                                }
                                                onChange={(e) =>
                                                    setReportReason(
                                                        e.target.value
                                                    )
                                                }
                                                className="form-radio text-red-500"
                                            />
                                            <span className="text-gray-700">
                                                {reason}
                                            </span>
                                        </label>
                                    ))}
                                    {reportReason === '기타' && (
                                        <textarea
                                            className="w-full p-2 border rounded-md"
                                            placeholder="자세한 사유를 작성해주세요..."
                                            value={reportDescription}
                                            onChange={(e) =>
                                                setReportDescription(
                                                    e.target.value
                                                )
                                            }
                                        />
                                    )}
                                </div>
                                <button
                                    className="bg-red-500 text-white px-4 py-2 rounded-full mt-4 sm:mt-6"
                                    onClick={submitReport}
                                >
                                    신고하기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )} */}

            {isFeedbackModalOpen && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                        <h2 className="text-2xl font-bold mb-4">AI 피드백</h2>
                        <div className="space-y-4">
                            {feedback ? (
                                feedback.split('\n').map((line, index) => (
                                    <p key={index} className="text-gray-800">
                                        {line}
                                    </p>
                                ))
                            ) : (
                                <p className="text-gray-800">
                                    피드백을 불러오는 중...
                                </p>
                            )}
                        </div>
                        <button
                            className="mt-6 bg-red-500 text-white px-4 py-2 rounded-full"
                            onClick={() => setIsFeedbackModalOpen(false)}
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}

            
        </div>
    );
};

export default ReviewPage;
