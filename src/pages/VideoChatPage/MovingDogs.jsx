import React, { useState, useEffect } from 'react';
import dogWalkGif from '../../assets/dogWalk.gif';
import dogHouseImage from '../../assets/doghouse.gif'; // doghouse.gif 이미지로 변경

const MovingDogs = ({ sessionData }) => {
    const safeSessionData = Array.isArray(sessionData) ? sessionData : [];
    const dogCount = Math.max(safeSessionData.length, 4); // 최소 4개의 강아지 보장

    const [dogPositions, setDogPositions] = useState(
        Array(4).fill({ x: 50, y: 50 })
    );
    const [dogDestinations, setDogDestinations] = useState(Array(4).fill(null));
    const [movingDogs, setMovingDogs] = useState(Array(4).fill(true));
    const [showBubble, setShowBubble] = useState(Array(4).fill(false));
    const [bubbleTimers, setBubbleTimers] = useState(Array(4).fill(null));
    const [bubblePosition, setBubblePosition] = useState({ top: 0, left: 0 });

    const [randomInterestIndex, setRandomInterestIndex] = useState(
        Array(4).fill(0)
    );

    // 모달 상태와 선택된 사용자 상태 추가
    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const dogHouses = [
        { x: 20, y: 8 }, // 왼쪽 위
        { x: 80, y: 8 }, // 오른쪽 위
        { x: 20, y: 80 }, // 왼쪽 아래
        { x: 80, y: 80 }, // 오른쪽 아래
    ];

    // 강아지 집과 사용자 데이터를 매핑합니다.
    const dogHouseMapping = dogHouses.map((house, index) => ({
        house,
        data: safeSessionData[index] || { nickname: `User ${index + 1}` },
    }));

    const getRandomPosition = () => ({
        x: Math.random() * 90,
        y: Math.random() * 90,
    });

    const distance = (p1, p2) =>
        Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);

    useEffect(() => {
        const interval = setInterval(() => {
            setDogPositions((prevPositions) => {
                if (!Array.isArray(prevPositions)) return prevPositions;
                return prevPositions.map((pos, index) => {
                    if (!Array.isArray(movingDogs) || !movingDogs[index])
                        return pos;
                    let dest = Array.isArray(dogDestinations)
                        ? dogDestinations[index]
                        : null;
                    if (!dest || distance(pos, dest) < 1) {
                        dest = getRandomPosition();
                        setDogDestinations((prev) => {
                            if (!Array.isArray(prev)) return prev;
                            return prev.map((d, i) => (i === index ? dest : d));
                        });
                    }
                    const dx = dest.x - pos.x;
                    const dy = dest.y - pos.y;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    const speed = 0.35;
                    return {
                        x: pos.x + (dx / length) * speed,
                        y: pos.y + (dy / length) * speed,
                    };
                });
            });
        }, 50);
        return () => clearInterval(interval);
    }, [movingDogs, dogDestinations]);

    const handleDogClick = (index, event) => {
        if (!sessionData[index]) return;

        const { nickname, aiInterests } = sessionData[index];

        const randomIndex = Math.floor(Math.random() * 5); // 0에서 4 사이의 랜덤 인덱스 생성
        setRandomInterestIndex((prev) =>
            prev.map((v, i) => (i === index ? randomIndex : v))
        );

        if (bubbleTimers[index]) {
            clearTimeout(bubbleTimers[index]);
        }
        setShowBubble((prev) => {
            if (!Array.isArray(prev)) return prev;
            return prev.map((v, i) => (i === index ? true : v));
        });
        setMovingDogs((prev) => {
            if (!Array.isArray(prev)) return prev;
            return prev.map((v, i) => (i === index ? false : v));
        });

        const newTimer = setTimeout(() => {
            setShowBubble((prev) => {
                if (!Array.isArray(prev)) return prev;
                return prev.map((v, i) => (i === index ? false : v));
            });
            setMovingDogs((prev) => {
                if (!Array.isArray(prev)) return prev;
                return prev.map((v, i) => (i === index ? true : v));
            });
        }, 10000);

        setBubbleTimers((prev) => {
            if (!Array.isArray(prev)) return prev;
            return prev.map((timer, i) => (i === index ? newTimer : timer));
        });

        if (event && event.target) {
            const rect = event.target.getBoundingClientRect();
            setBubblePosition({
                top: rect.top - 40,
                left: rect.right + 10,
            });
        }
    };

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
            {dogHouseMapping.map(({ house, data }, index) => (
                <div
                    key={`house-${index}`}
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
                            "{data.nickname}"님
                        </div>
                        <img
                            src={dogHouseImage}
                            alt={`Dog house ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg shadow-md"
                        />
                    </div>
                </div>
            ))}
            {dogPositions.map((pos, index) => (
                <div
                    key={index}
                    className="absolute"
                    style={{
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                        transition: 'all 0.05s linear',
                    }}
                >
                    <div className="relative">
                        {showBubble[index] && (
                            <div
                                className="absolute bg-white p-1 rounded-lg shadow-lg text-[0.75rem] flex items-center justify-center"
                                style={{
                                    bottom: '100%', // 항상 강아지 위에 위치
                                    left: '50%', // 중앙 정렬
                                    transform: 'translateX(-50%)', // 정확한 중앙 정렬을 위해
                                    width: '120px',
                                    maxWidth: '100%',
                                    marginBottom: '-20px', // 강아지와의 간격
                                    padding: '10px',
                                    background:
                                        'linear-gradient(135deg, #72edf2 10%, #5151e5 100%)',
                                    color: 'white',
                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                                }}
                            >
                                <svg
                                    className="absolute text-white h-3 w-3 transform -translate-x-1/2"
                                    style={{ bottom: '-6px', left: '50%' }}
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                >
                                    <path d="M12 24l-12-12h24z" />
                                </svg>
                                <p className="m-0 text-center">
                                    {safeSessionData[index]?.aiInterests?.[
                                        randomInterestIndex[index]
                                    ] || '정보 없음'}
                                </p>
                            </div>
                        )}

                        <img
                            src={dogWalkGif}
                            alt={`Dog ${index + 1}`}
                            className="w-20 h-20 cursor-pointer"
                            onClick={(event) => handleDogClick(index, event)}
                        />
                        <div className="absolute bottom-0 left-0 right-0 text-center text-xs bg-white bg-opacity-70 rounded-sm">
                            {safeSessionData[index]?.nickname ||
                                `Dog ${index + 1}`}
                        </div>
                    </div>
                </div>
            ))}
            {showModal && selectedUser && (
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-lg shadow-lg w-full max-w-xs z-50">
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
                        <p>{selectedUser.question}</p>
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
