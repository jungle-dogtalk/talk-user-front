import React, { useState, useEffect } from 'react';
import dogWalkGif from '../../assets/dog.png';
import dogHouseImage from '../../assets/mailbox.png'; // doghouse.gif 이미지로 변경

const MovingDogs = ({ sessionData, speechLengths }) => {
    const safeSessionData = Array.isArray(sessionData) ? sessionData : [];
    const dogCount = Math.max(safeSessionData.length, 4); // 최소 4개의 강아지 보장

    const dogHouses = [
        { x: 23, y: 15 }, // 왼쪽 위
        { x: 78, y: 15 }, // 오른쪽 위
        { x: 23, y: 42 }, // 왼쪽 아래
        { x: 78, y: 42 }, // 오른쪽 아래
    ];

    // 모달 상태와 선택된 사용자 상태 추가
    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // 강아지 집과 사용자 데이터를 매핑합니다.
    const dogHouseMapping = dogHouses.map((house, index) => ({
        house,
        data: safeSessionData[index] || { nickname: `User ${index + 1}` },
    }));

    // 강아지 집 클릭 핸들러 추가
    const handleDogHouseClick = (index) => {
        setSelectedUser(sessionData[index]);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedUser(null);
    };

    // 모달이 열렸을 때 5초 후에 자동으로 닫히도록 설정
    useEffect(() => {
        if (showModal) {
            const timer = setTimeout(() => {
                closeModal();
            }, 5000); // 5초 후에 모달 닫기

            return () => clearTimeout(timer); // 컴포넌트 언마운트 시 타이머 정리
        }
    }, [showModal]);

    // const [users, setUsers] = useState([
    //     { name: 'user1', score: 80, image: 'user1.jpg' },
    //     { name: 'user2', score: 65, image: 'user2.jpg' },
    //     { name: 'user3', score: 50, image: 'user3.jpg' },
    //     { name: 'user4', score: 35, image: 'user4.jpg' },
    // ]);

    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         setUsers((prevUsers) => {
    //             const newUsers = [...prevUsers];
    //             newUsers.forEach((user) => {
    //                 user.score = Math.floor(Math.random() * 100);
    //             });
    //             return newUsers.sort((a, b) => b.score - a.score);
    //         });
    //     }, 60000); // 1분마다 업데이트

    //     return () => clearInterval(interval);
    // }, []);

    return (
        <div className="flex-1 relative" style={{ height: '300px' }}>
            {dogHouses.map((house, index) => (
                <div
                    key={index}
                    className="absolute"
                    style={{
                        left: `${house.x}%`,
                        top: `${house.y}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    <div
                        className="relative w-32 h-32"
                        onClick={() => handleDogHouseClick(index)}
                    >
                        <div className="absolute top-[-40px] left-0 w-full text-center text-3xl bg-gradient-to-r from-[#a16e47] via-[#8b5e3c] to-[#734c31] text-white font-semibold rounded-lg py-1 ">
                            {safeSessionData[index]?.nickname ||
                                `User ${index + 1}`}
                        </div>
                        <img
                            src={dogHouseImage}
                            alt={`Dog house ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg "
                        />
                    </div>
                    <div
                        className="absolute"
                        style={{
                            left: '50%',
                            top: '100%',
                            transform: 'translate(-50%, 10%)',
                        }}
                    ></div>
                </div>
            ))}

            {showModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-gradient-to-r from-blue-100 via-sky-50 to-indigo-100 bg-opacity-95 p-10 rounded-3xl shadow-2xl w-11/12 max-w-3xl text-center transform transition-all duration-300 scale-105 hover:scale-110 flex flex-col items-center justify-center overflow-hidden border-3 border-blue-300 backdrop-filter backdrop-blur-sm relative">
                        <button
                            onClick={closeModal}
                            className="absolute top-6 right-6 text-blue-700 hover:text-red-500 transition-colors duration-300 z-10"
                        >
                            <svg
                                className="w-9 h-9"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                ></path>
                            </svg>
                        </button>
                        <h1 className="text-7xl font-extrabold text-blue-800 mb-6 animate-pulse">
                            <span className="relative">
                                질문
                                <span className="absolute inset-0 bg-gradient-to-r from-blue-300 via-sky-200 to-indigo-300 opacity-20 rounded-lg transform scale-105 blur-lg"></span>
                            </span>
                        </h1>
                        <p className="text-5xl text-blue-700 font-medium relative leading-relaxed mx-8">
                            <span className="absolute -left-8 top-0 text-8xl text-[#1e40af] opacity-25">
                                "
                            </span>
                            <span className="relative z-10">
                                {selectedUser.question}
                            </span>
                            <span className="absolute -right-8 top-0 text-7xl text-[#1e40af] opacity-25">
                                "
                            </span>
                        </p>
                        <p className="text-xl text-blue-600 mt-8 animate-pulse">
                            5초 후 자동으로 닫힘
                        </p>
                    </div>
                </div>
            )}

            {/* 실시간 수다왕 차트 추가 */}
            <div className="absolute bottom-0 left-0 right-0 top-[53%] bg-gradient-to-b from-amber-100 to-amber-200 rounded-3xl p-3 shadow-2xl transition-all duration-500 ease-in-out transform hover:scale-105 flex flex-col">
                <h3 className="text-2xl font-bold text-amber-800 mb-2 text-center">
                    실시간 토크왕
                </h3>
                <div className="flex-grow flex flex-col justify-between space-y-1">
                    {speechLengths.slice(0, 4).map((user, index) => (
                        <div
                            key={user.username}
                            className="transition-all duration-500 ease-in-out flex items-center space-x-2 bg-amber-300 bg-opacity-20 rounded-xl p-2 animate-fade-in-down"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex-grow">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-2xl font-semibold text-amber-800">
                                        {index + 1}등{' '}
                                        <span className="text-2xl">
                                            {user.username}
                                        </span>
                                    </span>
                                    <span className="text-2xl font-medium text-amber-700">
                                        {Math.round(user.percentage)}점
                                    </span>
                                </div>
                                <div className="w-full bg-amber-200 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 h-full rounded-full transition-all duration-500 ease-in-out relative"
                                        style={{ width: `${user.percentage}%` }}
                                    >
                                        <div className="absolute top-0 left-0 w-full h-full bg-white opacity-30 animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MovingDogs;
