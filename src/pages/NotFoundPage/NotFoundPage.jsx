// src/pages/NotFoundPage/NotFoundPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import notFoundImage from '../../assets/barking-talk.png'; // 이미지 경로 수정

function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-4 sm:p-8">
            <img
                src={notFoundImage}
                alt="404"
                className="w-64 sm:w-96 md:w-[30rem] mb-4 sm:mb-8"
            />
            <h1 className="text-8xl sm:text-9xl md:text-[12rem] font-bold text-yellow-700 mb-4 sm:mb-8">
                404
            </h1>
            <p className="text-3xl sm:text-4xl md:text-5xl text-yellow-700 mt-6 mb-16 max-w-3xl sm:max-w-4xl md:max-w-5xl px-4">
                현재 찾을 수 없는 페이지를 요청 하셨습니다.
            </p>

            <div className="flex flex-col sm:flex-row justify-center space-y-6 sm:space-y-0 sm:space-x-12">
                <button
                    onClick={() => navigate('/')}
                    className="bg-yellow-700 text-white text-2xl sm:text-3xl md:text-4xl py-4 px-8 sm:py-5 sm:px-10 md:py-6 md:px-12 rounded-lg hover:bg-yellow-800 transition duration-300"
                >
                    메인으로
                </button>
                <button
                    onClick={() => navigate(-1)}
                    className="bg-gray-500 text-white text-2xl sm:text-3xl md:text-4xl py-4 px-8 sm:py-5 sm:px-10 md:py-6 md:px-12 rounded-lg hover:bg-gray-600 transition duration-300"
                >
                    이전 페이지
                </button>
            </div>
        </div>
    );
}

export default NotFoundPage;
