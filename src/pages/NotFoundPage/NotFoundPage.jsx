// src/pages/NotFoundPage/NotFoundPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import notFoundImage from '../../assets/barking-talk.png'; // 이미지 경로 수정

function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-4">
            <img src={notFoundImage} alt="404" className="w-60 mb-2" /> {/* mb-4에서 mb-2로 수정 */}
            <h1 className="text-8xl font-bold text-yellow-700 mb-2">404</h1> {/* mb-4에서 mb-2로 수정 */}
            <p className="text-3xl text-yellow-700 mt-4 mb-12"> {/* mb-8에서 mb-12로 수정 */}
                현재 찾을 수 없는 페이지를 요청 하셨습니다.
            </p>
            
            <div className="flex justify-center space-x-8">
                <button
                    onClick={() => navigate('/')}
                    className="bg-yellow-700 text-white text-2xl py-3 px-6 rounded hover:bg-yellow-800 transition duration-300"
                >
                    메인으로
                </button>
                <button
                    onClick={() => navigate(-1)}
                    className="bg-gray-500 text-white text-2xl py-3 px-6 rounded hover:bg-gray-600 transition duration-300"
                >
                    이전 페이지
                </button>
            </div>
        </div>
    );
}

export default NotFoundPage;
