import React, { useState, useEffect } from 'react';
import dogWalkGif from '../../assets/dogWalk.gif';

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

    return (
        <div className="flex-1 relative" style={{ height: '300px' }}>
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
                                className="absolute bg-white p-1 rounded-md shadow-md text-[0.65rem]"
                                style={{
                                    bottom: '100%', // 항상 강아지 위에 위치
                                    left: '50%', // 중앙 정렬
                                    transform: 'translateX(-50%)', // 정확한 중앙 정렬을 위해
                                    width: '100px',
                                    maxWidth: '100%',
                                    marginBottom: '-14px', // 강아지와의 간격
                                }}
                            >
                                <p>
                                    {safeSessionData[index]?.aiInterests?.[
                                        randomInterestIndex[index]
                                    ] || '정보 없음'}
                                </p>
                            </div>
                        )}
                        <img
                            src={dogWalkGif}
                            alt={`Dog ${index + 1}`}
                            className="w-14 h-14 cursor-pointer"
                            onClick={(event) => handleDogClick(index, event)}
                        />
                        <div className="absolute bottom-0 left-0 right-0 text-center text-xs bg-white bg-opacity-70 rounded-sm">
                            {safeSessionData[index]?.nickname ||
                                `Dog ${index + 1}`}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MovingDogs;

