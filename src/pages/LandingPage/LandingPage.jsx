import React from 'react';
import './LandingPage.css';
import logo from '../../assets/barking-talk.png';
import raccoon1 from '/raccoon1.png';
import raccoon2 from '/raccoon2.png';
import raccoon3 from '/raccoon3.png';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f7f3e9] relative overflow-hidden">
            <div className="background-animation">
                <img
                    src={raccoon1}
                    alt="raccoon1"
                    className="raccoon raccoon1"
                />
                <img
                    src={raccoon2}
                    alt="raccoon2"
                    className="raccoon raccoon2"
                />
                <img
                    src={raccoon3}
                    alt="raccoon3"
                    className="raccoon raccoon3"
                />
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg text-center mx-auto z-10">
                <img
                    src={logo}
                    alt="로고"
                    className="w-40 sm:w-86 mb-8 sm:mb-16 mx-auto"
                />
                <h1 className="text-2xl sm:text-3xl font-bold text-[#333] mb-4">
                    스몰톡이 어려우신가요?
                </h1>
                <p className="text-[#666] mb-8">멍톡을 사용해보세요!</p>
                <div className="flex justify-center space-x-4">
                    <button
                        className="bg-[#f7f3e9] text-[#a16e47] py-1 px-3 rounded-full border-2 border-[#a16e47] shadow-md hover:bg-[#e4d7c7] hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-xs"
                        onClick={() => navigate('/login')}
                        style={{ fontSize: '16px' }}
                    >
                        시작하기
                    </button>
                    <button
                        className="bg-[#f7f3e9] text-[#a16e47] py-1 px-3 rounded-full border-2 border-[#a16e47] shadow-md hover:bg-[#e4d7c7] hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-xs"
                        onClick={() => navigate('/signup')}
                        style={{ fontSize: '16px' }}
                    >
                        가입하기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
