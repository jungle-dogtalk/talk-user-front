import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/barking-talk.png';
import { fetchUserProfile } from '../../redux/slices/userSlice';
import { apiCall } from '../../utils/apiCall';
import { API_LIST } from '../../utils/apiList';

const QuestionPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const token = useSelector((state) => state.user.token);
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');

    useEffect(() => {
        if (!token) {
            navigate('/');
        } else {
            dispatch(fetchUserProfile());
            fetchRandomQuestion();
        }
    }, [dispatch, navigate, token]);

    const fetchRandomQuestion = async () => {
        try {
            const response = await apiCall(API_LIST.GET_RANDOM_QUESTION);
            setQuestion(response.text);
        } catch (error) {
            console.error('Failed to fetch question:', error);
        }
    };

    const setRandomQuestion = () => {
        const randomQuestion =
            questionsList[Math.floor(Math.random() * questionsList.length)];
        setQuestion(randomQuestion);
    };

    const handleBack = () => {
        navigate(-1); // 이전 페이지로 이동
    };

    const handleAnswerChange = (e) => {
        setAnswer(e.target.value);
    };

    const handleAnswerSubmit = () => {
        // 답변 제출 로직
        console.log(`Answer Submitted: ${answer}`);
        setAnswer('');
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#f7f3e9]">
            <header className="w-full bg-[#a16e47] p-2 flex items-center justify-between">
                <img
                    src={logo}
                    alt="명톡 로고"
                    className="w-12 h-12 sm:w-16 sm:h-16"
                />
                <button
                    className="bg-[#f7f3e9] text-[#a16e47] py-1 px-3 sm:py-2 sm:px-6 rounded-full border-2 border-[#a16e47] shadow-md hover:bg-[#e4d7c7] hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-xs sm:text-base"
                    onClick={handleBack}
                >
                    뒤로가기
                </button>
            </header>
            <main className="flex flex-1 flex-col items-center justify-start w-full p-4">
                <div className="w-full max-w-3xl p-6 rounded-lg bg-[#f7f3e9] space-y-6 mt-20">
                    <h2 className="text-2xl font-bold mb-4 text-center">
                        도입 질문
                    </h2>
                    <div className="flex flex-col items-center">
                        <div className="bg-[#e4d7c7] p-4 rounded-lg mb-4 w-full text-center">
                            <h3 className="text-lg font-semibold">
                                {question}
                            </h3>
                        </div>
                        <button
                            className="bg-[#a16e47] text-[#f7f3e9] py-2 px-4 rounded-full border-2 border-[#a16e47] hover:bg-[#e4d7c7] hover:text-[#a16e47] transition duration-300 ease-in-out mb-4 text-xs sm:text-base"
                            onClick={fetchRandomQuestion}
                        >
                            질문 새로고침
                        </button>
                    </div>
                    <div>
                        <textarea
                            className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a16e47] focus:border-transparent"
                            placeholder="답변을 입력하세요..."
                            rows="5"
                            value={answer}
                            onChange={handleAnswerChange}
                        ></textarea>
                        <button
                            className="mt-4 bg-[#a16e47] text-[#f7f3e9] py-2 px-4 rounded-full border-2 border-[#a16e47] hover:bg-[#e4d7c7] hover:text-[#a16e47] transition duration-300 ease-in-out w-full text-xs sm:text-base"
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
