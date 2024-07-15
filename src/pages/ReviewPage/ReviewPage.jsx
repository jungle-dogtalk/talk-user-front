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

                // 사용자 본인을 제외한 데이터 필터링
                const filteredSessionData = response.data.filter(
                    (user) => user.userId !== userInfo.username
                );
                setSessionData(filteredSessionData); // 필터링한 데이터를 상태에 저장

                // 통화 유저 정보 가져오기
                const usernames = filteredSessionData.map(
                    (user) => user.userId
                );
                const callUserInfoResponse = await apiCall(
                    API_LIST.GET_CALL_USER_INFO,
                    { usernames }
                );

                setCallUserInfo(callUserInfoResponse.data);
                setRatings(new Array(filteredSessionData.length).fill(0)); // 리뷰 초기화

                // 발화량이 가장 많은 사용자 찾기
                const allUsers = [
                    ...callUserInfoResponse.data,
                    {
                        userId: userInfo.username,
                        nickname: userInfo.nickname,
                        utterance: userInfo.utterance,
                    },
                ];
                const topTalker = allUsers.reduce((prev, current) =>
                    prev.utterance > current.utterance ? prev : current
                );
                setTopTalker(topTalker);
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
                    username: user.userId, // userId를 username으로 변경
                    rating: ratings[index],
                })),
            });
            alert('리뷰가 제출되었습니다.');
            // window.location.href = '/main';
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

    // 프로필 이미지 가져오는 함수
    const getProfileImage = (index) => {
        return callUserInfo[index]
            ? callUserInfo[index].profileImage
            : videoPlaceholder;
    };

    // 발화량을 가져오는 함수
    const getUtterance = (index) => {
        return callUserInfo[index]
            ? callUserInfo[index].utterance
            : '발화량 정보 없음';
    };

    const username = userInfo?.username || '사용자';

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center">
            <header className="w-full bg-[#a16e47] p-1 flex justify-between items-center">
                <div className="flex items-center">
                    <img
                        src={logo}
                        alt="명톡 로고"
                        className="w-16 h-16 sm:w-24 sm:h-24 ml-2"
                    />
                </div>
            </header>
            <div className="bg-gray-100 rounded-lg p-4 sm:p-8 mt-4 w-full max-w-md sm:max-w-4xl">
                <h2 className="text-lg sm:text-2xl font-bold text-center mb-4">
                    통화 시간이 종료되었습니다.
                </h2>
                <p className="text-center mb-4 sm:mb-6">
                    즐거운 통화 시간이 되셨나요? 리뷰를 남겨보세요!
                </p>
                {topTalker && (
                    <div className="text-center mb-4 p-2 border border-yellow-400 bg-yellow-50 rounded-lg relative">
                        <h2 className="text-xl sm:text-2xl font-bold text-yellow-600">
                            오늘의 수다왕
                        </h2>
                        <img
                            src={crownIcon}
                            alt="왕관"
                            className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mt-1"
                        />
                        <h3 className="text-lg sm:text-xl font-semibold mt-1">
                            {topTalker.nickname}님
                        </h3>
                        <img
                            src={celebrationEffect}
                            alt="축하 이펙트"
                            className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mt-2"
                        />
                    </div>
                )}

                <div className="space-y-4 sm:space-y-6">
                    {sessionData && sessionData.length > 0 ? (
                        sessionData.map((user, index) => (
                            <div
                                key={index}
                                className="bg-gray-50 p-2 sm:p-4 rounded-lg shadow-md flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4"
                            >
                                <img
                                    src={getProfileImage(index)}
                                    alt="프로필"
                                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full"
                                />
                                <div className="flex-1">
                                    <h3 className="text-base sm:text-xl font-semibold">
                                        {user.nickname}{' '}
                                        <span className="text-sm text-gray-500">
                                            발화량 {getUtterance(index)}
                                        </span>
                                    </h3>
                                    <div className="flex space-x-1 mt-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <span
                                                key={star}
                                                className={`cursor-pointer text-xl sm:text-2xl ${
                                                    ratings[index] >= star
                                                        ? 'text-yellow-400'
                                                        : 'text-gray-300'
                                                }`}
                                                onClick={() =>
                                                    handleRatingChange(
                                                        index,
                                                        star
                                                    )
                                                }
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    className="bg-red-500 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-full flex items-center space-x-2"
                                    onClick={() => handleReport(user.nickname)}
                                >
                                    <span>신고하기</span>
                                    <img
                                        src={Declaration}
                                        alt="이모티콘"
                                        className="w-4 h-4 sm:w-6 sm:h-6"
                                    />
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center">Now Loading..</p>
                    )}
                </div>
                <div className="flex justify-center mt-8 sm:mt-12 space-x-4">
                    <button
                        className="bg-gray-300 text-black px-4 py-2 sm:px-6 sm:py-3 rounded-full"
                        onClick={() => (window.location.href = '/main')}
                    >
                        SKIP
                    </button>
                    <button
                        className="bg-green-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full"
                        onClick={handleSubmitReview}
                    >
                        완료
                    </button>
                </div>
            </div>

            {reportingUser && (
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
            )}
        </div>
    );
};

export default ReviewPage;
