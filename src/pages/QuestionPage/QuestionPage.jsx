import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/barking-talk.png';
import { fetchUserProfile } from '../../redux/slices/userSlice';

const QuestionPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const token = useSelector((state) => state.user.token);
    const userMbti = useSelector(
        (state) => state.user.userInfo?.mbti || '알 수 없음'
    );
    const [answer, setAnswer] = useState('');

    // 컴포넌트 마운트 시 사용자 프로필 불러오기
    useEffect(() => {
        if (!token) {
            navigate('/'); // 토큰이 없으면 로그인 페이지로 리디렉션
        } else {
            dispatch(fetchUserProfile());  // 사용자 프로필 불러오기
        }
    }, [dispatch, navigate, token]);

    const handleBack = () => {
        navigate(-1); // 이전 페이지로 이동
    };

    const handleAnswerChange = (e) => {
        setAnswer(e.target.value);
    };

    const handleAnswerSubmit = () => {
        // 답변 제출 로직
        console.log(`Answer Submitted: ${answer}`);

        // 세션 스토리지에 질문과 답변 저장
        sessionStorage.setItem(
            'question',
            `당신의 MBTI(${userMbti})를 기반으로 한 줄 설명해주세요.`
        );
        sessionStorage.setItem('answer', answer);

        // 매칭 페이지로 이동
        navigate('/matching');
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#f7f3e9] to-[#e4d7c7]">
            <header className="w-full bg-gradient-to-r from-[#a16e47] to-[#8b5e3c] p-3 flex items-center justify-between shadow-lg">
                <img
                    src={logo}
                    alt="멍톡 로고"
                    className="w-28 h-16 sm:w-60 sm:h-24"
                />
                <button
                    className="bg-[#f7f3e9] text-[#a16e47] py-3 px-6 sm:py-4 sm:px-8 md:py-5 md:px-10 rounded-full border-2 border-[#a16e47] hover:bg-[#e4d7c7] transition duration-300 text-base sm:text-lg md:text-xl font-bold whitespace-nowrap"
                    onClick={handleBack}
                >
                    뒤로가기
                </button>
            </header>

            <main className="flex flex-1 flex-col items-center justify-start w-full p-4 sm:p-12">
                <div className="w-full max-w-5xl p-8 sm:p-8 rounded-3xl bg-white shadow-2xl space-y-6 mt-12 transform hover:scale-102 transition duration-300">
                    <h2 className="text-4xl sm:text-8xl font-bold mb-8 text-center text-[#a16e47] tracking-wider">
                        도입 질문
                    </h2>
                    <div className="flex flex-col items-center">
                        <div className="bg-gradient-to-r from-[#e4d7c7] to-[#f7f3e9] p-8 rounded-2xl mb-6 w-full text-center shadow-xl">
                            <h3 className="text-base sm:text-5xl font-semibold text-[#5c3d2e] leading-relaxed">
                                나누고 싶은 이야기에 대해서 적어주세요.
                            </h3>
                        </div>
                    </div>
                    <div className="space-y-8">
                        <textarea
                            className="w-full p-6 border-3 border-[#a16e47] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#a16e47] focus:ring-opacity-50 resize-none shadow-inner text-2xl sm:text-5xl transition duration-300 ease-in-out placeholder:text-xl sm:placeholder:text-5xl"
                            placeholder="답변을 입력하세요..."
                            rows="10" // 세로 길이 조정
                            value={answer}
                            onChange={handleAnswerChange}
                        ></textarea>
                        <button
                            className="mt-8 bg-gradient-to-r from-[#a16e47] to-[#8a5d3b] text-[#f7f3e9] py-4 px-8 rounded-full border-2 border-[#a16e47] hover:from-[#e4d7c7] hover:to-[#d3c0a9] hover:text-[#a16e47] transition duration-300 ease-in-out w-full text-xl sm:text-6xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105"
                            onClick={handleAnswerSubmit}
                        >
                            답변 제출
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default QuestionPage;
