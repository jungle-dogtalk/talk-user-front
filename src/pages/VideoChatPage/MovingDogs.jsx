import React, { useState, useEffect } from 'react';
import dogWalkGif from '../../assets/dog.png';
import dogHouseImage from '../../assets/mailbox.png'; // doghouse.gif 이미지로 변경
import targetDogHouseImage from '../../assets/target_mailbox.png'; // doghouse.gif 이미지로 변경

const MovingDogs = ({ sessionData, speechLengths, targetUserIndex }) => {
    const safeSessionData = Array.isArray(sessionData) ? sessionData : [];
    const dogCount = Math.max(safeSessionData.length, 4); // 최소 4개의 강아지 보장

    const dogHouses = [
        { x: 22, y: 15 }, // 왼쪽 위
        { x: 79, y: 15 }, // 오른쪽 위
        { x: 22, y: 41 }, // 왼쪽 아래
        { x: 79, y: 41 }, // 오른쪽 아래
    ];

    // 모달 상태와 선택된 사용자 상태 추가
    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [clickedIndex, setClickedIndex] = useState(null);

    // 강아지 집과 사용자 데이터를 매핑합니다.
    const dogHouseMapping = dogHouses.map((house, index) => ({
        house,
        data: safeSessionData[index] || { nickname: `User ${index + 1}` },
    }));

    // 강아지 집 클릭 핸들러 추가
    const handleDogHouseClick = (index) => {
        setClickedIndex(index);
        setSelectedUser(sessionData[index]);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedUser(null);
        setClickedIndex(null);
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

    const maskMBTI = (mbti) => {
        if (mbti.length !== 4) return mbti;
        return `${mbti[0]}--${mbti[3]}`;
    };

    // const speechLengths = [
    //     { nickname: "토크마스터", percentage: 85 },
    //     { nickname: "수다쟁이", percentage: 72 },
    //     { nickname: "말많은이", percentage: 63 },
    //     { nickname: "조용한이", percentage: 45 }
    //   ];

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
                        className={`relative w-28 h-28 transition-transform duration-300 cursor-pointer group`}
                        onClick={() => handleDogHouseClick(index)}
                        onMouseEnter={(e) =>
                            e.currentTarget.classList.add('scale-110')
                        }
                        onMouseLeave={(e) =>
                            e.currentTarget.classList.remove('scale-110')
                        }
                    >
                        <div
                            className={`absolute top-[-75px] left-1/2 transform -translate-x-1/2 w-40 text-center font-semibold rounded-lg py-2 px-3 shadow-lg ${
                                index === targetUserIndex
                                    ? 'bg-gradient-to-r text-black'
                                    : 'bg-gradient-to-r text-black'
                            } group-hover:from-[#b28256] group-hover:via-[#a26b4a] group-hover:to-[#8b5e3c] transition-colors duration-300 ease-in-out`}
                        >
                            {safeSessionData[index]?.nickname ? (
                                <>
                                    <span className="block text-3xl leading-tight">
                                        {
                                            safeSessionData[
                                                index
                                            ].nickname.split(' ')[0]
                                        }
                                    </span>
                                    <span className="block text-3xl leading-tight">
                                        {safeSessionData[index].nickname
                                            .split(' ')
                                            .slice(1)
                                            .join(' ')}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="block text-3xl leading-tight">
                                        User
                                    </span>
                                    <span className="block text-3xl leading-tight">
                                        {index + 1}
                                    </span>
                                </>
                            )}
                        </div>

                        <img
                            src={
                                index === targetUserIndex
                                    ? targetDogHouseImage
                                    : dogHouseImage
                            }
                            alt={`Dog house ${index + 1}`}
                            className={`w-3/4 h-3/4 object-contain rounded-lg transition-transform duration-300 mt-2 mx-auto`}
                        />
                    </div>
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
                        <h1 className="text-8xl font-extrabold text-blue-800 mb-6 animate-pulse">
                            <span className="relative">
                                MBTI 힌트
                                <span className="absolute inset-0 bg-gradient-to-r from-blue-300 via-sky-200 to-indigo-300 opacity-20 rounded-lg transform scale-105 blur-lg"></span>
                            </span>
                        </h1>
                        <p className="text-8xl text-blue-700 font-medium relative leading-relaxed mx-8">
                            <span className="absolute -left-8 top-0 text-8xl text-[#1e40af] opacity-25">
                                "
                            </span>
                            <span className="relative z-10 text-8xl">
                                {maskMBTI(selectedUser.mbti)}
                            </span>
                            <span className="absolute -right-8 top-0 text-6xl text-[#1e40af] opacity-25">
                                "
                            </span>
                        </p>
                        <p className="text-5xl text-blue-600 mt-8 animate-pulse">
                            5초 후 자동으로 닫힘
                        </p>
                    </div>
                </div>
            )}

            {/* 실시간 수다왕 차트 추가 */}
            <div className="absolute bottom-0 left-0 right-0 top-[46%] bg-gradient-to-b from-amber-100 to-amber-200 rounded-3xl p-3 sm:p-2 shadow-2xl transition-all duration-500 ease-in-out transform hover:scale-102 flex flex-col">
                <h3 className="text-4xl sm:text-4xl font-bold text-amber-900 mb-1 text-center">
                    실시간 수다왕
                </h3>
                <div className="flex-grow flex flex-col justify-between space-y-2 sm:space-y-1">
                    {speechLengths.map((user, index) => (
                        <div
                            key={user.nickname}
                            className="flex items-center space-x-3 bg-white bg-opacity-60 rounded-2xl p-3 sm:p-3 shadow-md transition-all duration-500 ease-in-out hover:shadow-lg hover:bg-opacity-70"
                        >
                            <div className="flex-grow">
                                <div className="flex justify-between items-center mb-1 sm:mb-1">
                                    <div className="flex items-center space-x-3 sm:space-x-3">
                                        <span className="text-xl sm:text-xl font-bold text-amber-900 bg-amber-300 rounded-full w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center shadow-inner">
                                            {index + 1}
                                        </span>
                                        <span className="text-2xl sm:text-4xl font-semibold text-amber-800 truncate max-w-[150px] sm:max-w-[200px]">
                                            {user.nickname}
                                        </span>
                                    </div>
                                    <span className="text-xl sm:text-xl font-medium text-amber-700 bg-amber-200 px-3 py-1 rounded-full transition-all duration-500 ease-in-out shadow-sm">
                                        {Math.round(user.percentage)}
                                    </span>
                                </div>
                                <div className="w-full bg-amber-200 rounded-full h-5 sm:h-4 overflow-hidden shadow-inner">
                                    <div
                                        className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500 ease-in-out transform origin-left"
                                        style={{
                                            width: `${user.percentage}%`,
                                            transform: `scaleX(${
                                                user.percentage / 100
                                            })`,
                                        }}
                                    ></div>
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
