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
    const [dogPositions, setDogPositions] = useState(
        dogHouses.map((house) => ({
            x: house.x,
            y: house.y + 20, // 강아지 집 아래에 위치하도록 y 값 조정
        }))
    );
    const [showBubble, setShowBubble] = useState(Array(4).fill(false));

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
                        <div className="absolute top-[-24px] left-0 w-full text-center text-xs bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white font-semibold rounded-lg py-1 shadow-md">
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

            {/* 강아지 렌더링 부분 */}
            {dogPositions.map((pos, index) => (
                <div
                    key={`dog-${index}`}
                    className="absolute"
                    style={{
                        left: `${pos.x -7}%`,
                        top: `${pos.y -10}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    <img
                        src={dogWalkGif}
                        alt={`Dog ${index + 1}`}
                        style={{ width: '50px', height: '50px' }} // 강아지 크기 고정
                        onClick={(event) => handleDogClick(index, event)}
                    />
                </div>
            ))}

            {showModal && selectedUser && (
                <div
                    className="absolute bg-white rounded-lg shadow-lg z-50"
                    style={{
                        left: '50%',
                        top: '43%',
                        transform: 'translate(-50%, -50%)',
                        width: '80%',
                        maxWidth: '300px',
                    }}
                >
                    <header className="bg-[#a16e47] text-white p-2 rounded-t-lg flex justify-between items-center">
                        <h2 className="text-sm text-center w-full">
                            "{selectedUser.nickname}"님의 질문
                        </h2>
                        <button
                            onClick={closeModal}
                            className="absolute right-2 text-white"
                        >
                            X
                        </button>
                    </header>
                    <div className="p-4 text-center">
                        <p className="text-sm">{selectedUser.question}</p>
                        <button
                            className="mt-2 bg-red-500 text-white px-2 py-1 rounded-full mx-auto"
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
