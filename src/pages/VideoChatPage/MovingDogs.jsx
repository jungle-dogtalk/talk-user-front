import React, { useState, useEffect } from 'react';
import dogWalkGif from '../../assets/dog.png';
import dogHouseImage from '../../assets/doghouse.gif'; // doghouse.gif 이미지로 변경

const MovingDogs = ({ sessionData }) => {
    const safeSessionData = Array.isArray(sessionData) ? sessionData : [];
    const dogCount = Math.max(safeSessionData.length, 4); // 최소 4개의 강아지 보장

    const dogHouses = [
        { x: 8, y: 9 }, // 왼쪽 위
        { x: 36, y: 9 }, // 오른쪽 위
        { x: 64, y: 9 }, // 왼쪽 아래
        { x: 92, y: 9 }, // 오른쪽 아래
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
                        className="relative w-20 h-20"
                        onClick={() => handleDogHouseClick(index)}
                    >
                        <div className="absolute top-[-24px] left-0 w-full text-center text-xs bg-gradient-to-r from-[#a16e47] via-[#8b5e3c] to-[#734c31] text-white font-semibold rounded-lg py-1 shadow-md">
                            "
                            {safeSessionData[index]?.nickname ||
                                `User ${index + 1}`}
                            "님
                        </div>
                        <img
                            src={dogHouseImage}
                            alt={`Dog house ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg shadow-md"
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
                <div
                    className="absolute bg-white rounded-lg shadow-lg z-50"
                    style={{
                        left: '50%',
                        top: '30%',
                        transform: 'translate(-50%, -50%)',
                        width: '85%',
                        maxWidth: '380px',
                    }}
                >
                    <header className="bg-gradient-to-r from-[#a16e47] to-[#8b5e3c] text-white p-3 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-center w-full">
                            "{selectedUser.nickname}"님의 질문
                        </h2>
                        <button
                            onClick={closeModal}
                            className="absolute right-4 top-4 text-white hover:text-gray-200 transition-colors"
                        >
                            <svg
                                className="w-6 h-6"
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
                    </header>
                    <div className="p-4 bg-gradient-to-b from-white to-gray-50">
                        <p className="text-xl mb-4 text-gray-700 text-center">
                            {selectedUser.question}
                        </p>
                        <button
                            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-4 rounded-full font-semibold shadow-md hover:from-red-600 hover:to-red-700 transition-all duration-300 ease-in-out transform hover:scale-105"
                            onClick={closeModal}
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MovingDogs;
