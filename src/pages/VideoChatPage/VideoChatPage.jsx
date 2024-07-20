import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { OpenVidu } from 'openvidu-browser';
import OpenViduVideo from './OpenViduVideo';
import { apiCall, apiCallWithFileData } from '../../utils/apiCall';
import { API_LIST } from '../../utils/apiList';
import settingsIcon from '../../assets/settings-icon.jpg'; // 설정 아이콘
import { getToken, getTokenForTest } from '../../services/openviduService';
import SettingMenu from './SettingMenu';
import io from 'socket.io-client';
import RaccoonHand from '../../components/common/RaccoonHand';
import MovingDogs from './MovingDogs';
import forestBackground from '../../assets/forest-background.jpg'; // 배경 이미지 추가
import logo from '../../assets/barking-talk.png'; // 로고 이미지 경로

const VideoChatPage = () => {
    const FRAME_RATE = 30;
    const location = useLocation();
    const sessionId = new URLSearchParams(location.search).get('sessionId');
    const recognitionRef = useRef(null);
    const socket = useRef(null);

    const [session, setSession] = useState(undefined);
    const [subscribers, setSubscribers] = useState([]);
    const [publisher, setPublisher] = useState(undefined);
    const [showSettings, setShowSettings] = useState(false); // 설정 창 상태 관리
    const [isMirrored, setIsMirrored] = useState(false); // 좌우 반전 상태 관리
    const [sttResults, setSttResults] = useState([]); // STT 결과 저장
    const [recommendedTopics, setRecommendedTopics] = useState([]); // 주제 추천 결과 저장
    const [interests, setInterests] = useState([]); // 관심사 결과 저장
    const [isLeaving, setIsLeaving] = useState(false); // 중단 중복 호출 방지
    const [sessionData, setSessionData] = useState(null);
    const [OV, setOV] = useState(null); // OpenVidu 객체 상태 추가
    const [quizTime, setQuizTime] = useState(0); // 퀴즈 타이머 상태
    const [quizMode, setQuizMode] = useState(false); // 퀴즈 모드 상태 추가
    const [quizChallenger, setQuizChallenger] = useState(''); // 퀴즈 도전자
    const [quizResult, setQuizResult] = useState(''); // 퀴즈미션 결과 (성공/실패)
    const [quizResultTrigger, setQuizResultTrigger] = useState(0);
    const [isChallengeCompleted, setIsChallengeCompleted] = useState(false); // 미션 종료 여부
    const [isChallengeCompletedTrigger, setIsChallengeCompletedTrigger] =
        useState(0);
    const quizAnswerRef = useRef('');

    const [showInitialModal, setShowInitialModal] = useState(true);
    const [showQuizSuccess, setShowQuizSuccess] = useState(false);
    const [showQuizFailure, setShowQuizFailure] = useState(false);

    const [showRecommendedTopics, setShowRecommendedTopics] = useState(false);
    const [showQuizResult, setShowQuizResult] = useState(false);

    const quizModeRef = useRef(quizMode);
    const targetUserIndexRef = useRef(0);
    const inactivityTimeoutRef = useRef(null); // Inactivity timer ref
    const ttsStreamRef = useRef(null); // TTS 스트림 참조

    const handleQuizInProgress = (data) => {
        console.log('자식컴포넌트로부터 넘겨받은 데이터 -> ', data);
        setSession((currentSession) => {
            if (currentSession) {
                currentSession.signal({
                    data: JSON.stringify({
                        userId: userInfo.username,
                        message: `${userInfo.username} 유저가 미션을 시작합니다.`,
                    }),
                    to: [],
                    type: 'quizStart',
                });
            } else {
                console.error('퀴즈 미션수행 에러');
            }
            return currentSession;
        });
    };
    const finishQuizMission = () => {
        console.log('세션정보 -> ', session);
        session
            .signal({
                data: JSON.stringify({
                    userId: userInfo.username,
                    message: `${userInfo.username} 유저가 미션을 종료합니다.`,
                    result: false,
                }),
                to: [],
                type: 'quizEnd',
            })
            .then(() => {
                console.log('시그널 성공적으로 전송');
            })
            .catch((error) => {
                console.error('시그널 도중 에러 발생 -> ', error);
            });
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowInitialModal(false);
        }, 5000); // 5초 후 모달 닫기

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (quizChallenger && quizChallenger === userInfo.username) {
            checkAnswer();
        }
    }, [quizChallenger]);

    const userInfo = useSelector((state) => state.user.userInfo); // redux에서 유저 정보 가져오기

    // userInfo가 null인 경우 처리
    if (!userInfo) {
        return <div>Loading...</div>;
    }

    const [remainingTime, setRemainingTime] = useState(300); // 디폴트 타이머 5분

    useEffect(() => {
        let timer;

        const fetchTimer = async () => {
            const result = await apiCall(API_LIST.GET_SESSION_TIMER, {
                sessionId,
            });
            if (result.status) {
                const leftTime = result.data.remainingTime;
                setRemainingTime(leftTime);

                // fetchTimer 완료 후 setInterval 시작
                timer = setInterval(() => {
                    setRemainingTime((prevTime) => {
                        if (prevTime <= 0) {
                            clearInterval(timer);
                            return 0;
                        }
                        return prevTime - 1;
                    });
                }, 1000);
            }
        };

        fetchTimer();

        return () => {
            if (timer) {
                clearInterval(timer);
            }
        };
    }, []);

    useEffect(() => {
        const fetchSessionData = async () => {
            try {
                const response = await apiCall(API_LIST.GET_SESSION_DATA, {
                    sessionId,
                });
                setSessionData(response.data); // 상태에 저장
            } catch (error) {
                console.error('Error fetching session data:', error);
            }
        };

        fetchSessionData();
    }, []); // sessionId 의존성 제거

    // socket 연결 처리
    useEffect(() => {
        socket.current = io(import.meta.env.VITE_API_URL);

        socket.current.on('connect', () => {
            console.log('WebSocket connection opened');
        });

        socket.current.on('disconnect', () => {
            console.log('WebSocket connection closed');
        });

        // 주제 추천 결과 이벤트 수신
        // 결과 데이터 수신 받아와 변수에 저장 후 상태 업데이트
        socket.current.on('topicRecommendations', (data) => {
            console.log('Received topic recommendations:', data);
            setRecommendedTopics((prevTopics) => [...prevTopics, data.trim()]);

            // 5초후에 모달 닫기
            setTimeout(() => {
                setRecommendedTopics([]);
            }, 5000);
        });

        socket.current.on('endOfStream', () => {
            console.log('Streaming ended');
        });

        // 주기적으로 발화량 계산 요청 보내기
        const interval = setInterval(() => {
            console.log('발화량 계산 요청 보내기');
            socket.current.emit('requestSpeechLengths', { sessionId });
        }, 60000); // 1분 (60000 밀리초) 단위로 실행

        // 발화량 순위 데이터 수신
        socket.current.on('speechLengths', (data) => {
            console.log('발화량 순위 데이터 수신:', data);

            data.forEach((user) => {
                console.log(
                    `Username: ${user.username}, Percentage: ${user.percentage}%`
                );
            });
        });

        return () => {
            if (socket.current) {
                socket.current.emit('leaveSession', sessionId);
                socket.current.disconnect();
            }
            clearInterval(interval);
        };
    }, [location, sessionId]);

    // TODO: 세션 떠날 때 Redis session방에서 해당 유저 없애도록 요청하기
    // 세션 떠남
    const leaveSession = useCallback(async () => {
        if (isLeaving) {
            // 중복 중단 막기
            return;
        }
        setIsLeaving(true);

        // openVidu 세션에서 연결 해제
        if (session) {
            session.disconnect();
        }

        // 음성인식 종료
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (error) {
                console.error('음성인식 종료 오류:', error);
            }
            recognitionRef.current.onend = null;
            recognitionRef.current = null;
        }

        // 사용자 카메라 & 마이크 비활성화
        if (publisher) {
            const mediaStream = publisher.stream.getMediaStream();
            if (mediaStream && mediaStream.getTracks) {
                // 모든 미디어 트랙 중지
                mediaStream.getTracks().forEach((track) => track.stop());
            }
        }

        const username = userInfo.username;

        console.log('중단하기 요청 전송:', { username, sessionId });

        try {
            // 기존 leaveSession 로직
            const response = await apiCall(API_LIST.END_CALL, {
                username,
                sessionId,
            });
            console.log('API 응답:', response);

            // 소켓 연결을 끊고 세션을 정리
            if (socket.current) {
                socket.current.emit('leaveSession', sessionId);
                socket.current.disconnect();
            }

            setSession(undefined);
            setSubscribers([]);
            setPublisher(undefined);
            setOV(null);

            // 세션 ID를 sessionStorage에 저장
            sessionStorage.setItem('sessionId', sessionId);
            sessionStorage.setItem('fromVideoChat', 'true'); // 플래그 설정

            window.location.href = '/review';
        } catch (error) {
            console.error('Error ending call:', error);
        } finally {
            setIsLeaving(false);
        }
    }, [session, publisher, userInfo.username, location.search, isLeaving]);

    const startStreaming = (session, OV, mediaStream, pitchValue) => {
        setTimeout(() => {
            // 비디오 엘리먼트 생성 및 설정
            const video = document.createElement('video');
            video.srcObject = mediaStream;
            video.autoplay = true;
            video.playsInline = true;

            // 너구리 캔버스 가져오기
            const avatarCanvas = document
                .getElementById('avatar_canvas')
                .querySelector('div')
                .querySelector('canvas');

            // 합성 캔버스 생성
            const compositeCanvas = document.createElement('canvas');

            // 16:9 비율
            compositeCanvas.width = 1280; // 너비(16)
            compositeCanvas.height = 720; // 높이(9)

            const ctx = compositeCanvas.getContext('2d');

            // 렌더링 함수
            const render = () => {
                // 비디오 그리기
                ctx.drawImage(
                    video,
                    0,
                    0,
                    compositeCanvas.width,
                    compositeCanvas.height
                );

                // 너구리 캔버스 그리기
                ctx.drawImage(
                    avatarCanvas,
                    0,
                    0,
                    compositeCanvas.width,
                    compositeCanvas.height
                );

                requestAnimationFrame(render);
            };

            // 비디오 로드 완료 후 렌더링 시작
            video.onloadedmetadata = () => {
                video.play();
                render();
            };

            if (!pitchValue) {
                pitchValue = 1.0;
            }

            var filterOptions = {
                type: 'GStreamerFilter',
                options: {
                    command:
                        // 'audioecho delay=50000000 intensity=0.6 feedback=0.4', // 음성 echo 설정
                        `pitch pitch=${pitchValue}`,
                },
            };

            // 합성 캔버스의 스트림 가져오기
            const compositeStream = compositeCanvas.captureStream(FRAME_RATE);

            // OpenVidu publisher 초기화 및 게시
            const publisher = OV.initPublisher(undefined, {
                audioSource: mediaStream.getAudioTracks()[0],
                videoSource: compositeStream.getVideoTracks()[0],
                frameRate: FRAME_RATE, // 프레임 레이트 낮추기
                filter: filterOptions,
                videoCodec: 'VP8', // VP8 코덱
            });

            setPublisher(publisher);
            session.publish(publisher);

            // 음성 인식 시작
            startSpeechRecognition(
                publisher.stream.getMediaStream(),
                userInfo.username
            );
            startInactivityTimer();

            socket.current.emit('joinSession', sessionId);
        }, 1000);
    };

    const updatePublisherWithNewPitch = (pitchValue) => {
        if (publisher && session) {
            // 기존 퍼블리셔 스트림 중지 및 새로운 피치 값으로 새롭게 퍼블리시
            if (publisher.stream) {
                session
                    .unpublish(publisher)
                    .then(() => {
                        startStreaming(
                            session,
                            OV,
                            publisher.stream.getMediaStream(),
                            pitchValue
                        );
                    })
                    .catch((error) => {
                        console.error('Error unpublishing:', error);
                    });
            } else {
                startStreaming(
                    session,
                    OV,
                    publisher.stream.getMediaStream(),
                    pitchValue
                );
            }
        }
    };

    // 세션 참여
    const joinSession = useCallback(
        async (sid) => {
            const OV = new OpenVidu();
            setOV(OV); // OV 객체 상태로 설정
            const session = OV.initSession();
            setSession(session);

            session.on('streamCreated', (event) => {
                let subscriber = session.subscribe(event.stream, undefined);
                setSubscribers((prevSubscribers) => [
                    ...prevSubscribers,
                    subscriber,
                ]);
            });

            // 퀴즈 미션 시작
            session.on('signal:quizStart', (event) => {
                const data = JSON.parse(event.data);
                console.log('quizStart 시그널 전달받음, 내용은? -> ', data);
                // recognition.start();
                setQuizChallenger((prevQuizChallenger) => {
                    if (prevQuizChallenger === '') {
                        return data.userId;
                    }
                    return prevQuizChallenger;
                });
            });

            // 퀴즈 미션 종료
            session.on('signal:quizEnd', (event) => {
                const data = JSON.parse(event.data);
                console.log('quizEnd 시그널 전달받음, 내용은? -> ', data);

                setIsChallengeCompleted(true);
                setIsChallengeCompletedTrigger((prev) => prev + 1);
                setQuizChallenger(''); // 퀴즈 도전자 초기화

                if (data.result === true) {
                    setShowQuizSuccess(true);
                } else {
                    setShowQuizFailure(true);
                }

                setTimeout(() => {
                    setQuizResult('');
                    setShowQuizSuccess(false);
                    setShowQuizFailure(false);
                }, 10000);

                if (data.userId === userInfo.username) {
                    if (data.result) {
                        // 미션성공
                        setQuizResult('success');
                        setQuizResultTrigger((prev) => prev + 1);
                    } else {
                        // 미션실패
                        setQuizResult('failure');
                        setQuizResultTrigger((prev) => prev + 1);
                    }
                }
            });

            // 세션 연결 종료 시 (타이머 초과에 의한 종료)
            session.on('sessionDisconnected', (event) => {
                console.log('Session disconnected:', event);
                leaveSession();
            });

            session.on('streamDestroyed', (event) => {
                setSubscribers((prevSubscribers) =>
                    prevSubscribers.filter(
                        (sub) => sub !== event.stream.streamManager
                    )
                );
            });

            // 발화 시작 감지
            session.on('publisherStartSpeaking', (event) => {
                console.log(
                    'User ' + event.connection.connectionId + ' start speaking'
                );
                resetInactivityTimer(); // Reset inactivity timer on speech detected
            });

            // 발화 종료 감지
            session.on('publisherStopSpeaking', (event) => {
                console.log(
                    'User ' + event.connection.connectionId + ' stop speaking'
                );
                startInactivityTimer(); // Start inactivity timer on speech stop detected
            });

            const allowedSessionIdList = [
                'sessionA',
                'sessionB',
                'sessionC',
                'sessionD',
                'sessionE',
                'sessionF',
                'sessionG',
                'sessionH',
            ];
            if (!allowedSessionIdList.includes(sessionId)) {
                getToken(sid, userInfo).then((token) => {
                    session
                        .connect(token)
                        .then(() => {
                            OV.getUserMedia({
                                audioSource: false,
                                videoSource: undefined,
                                // resolution: '1280x720',
                                resolution: '640x480',
                                frameRate: FRAME_RATE,
                            }).then((mediaStream) => {
                                startStreaming(session, OV, mediaStream);
                            });
                        })
                        .catch((error) => {
                            console.log(
                                'There was an error connecting to the session:',
                                error.code,
                                error.message
                            );
                        });
                });
            } else {
                getTokenForTest(sid, userInfo).then((token) => {
                    session
                        .connect(token)
                        .then(() => {
                            OV.getUserMedia({
                                audioSource: false,
                                videoSource: undefined,
                                // resolution: '1280x720',
                                resolution: '640x480',
                                frameRate: FRAME_RATE,
                            }).then((mediaStream) => {
                                startStreaming(session, OV, mediaStream);
                            });
                        })
                        .catch((error) => {
                            console.log(
                                'There was an error connecting to the session:',
                                error.code,
                                error.message
                            );
                        });
                });
            }
        },
        [userInfo.username]
    );

    // 설정 창 표시/숨기기 토글 함수
    const toggleSettings = () => {
        setShowSettings(!showSettings);
    };

    // 비디오 좌우반전 처리 (SettingMenu 자식 컴포넌트 핸들러)
    const handleMirrorChange = (mirrorState) => {
        setIsMirrored(mirrorState);
    };

    useEffect(() => {
        window.addEventListener('beforeunload', leaveSession);
        return () => {
            window.removeEventListener('beforeunload', leaveSession);
        };
    }, [leaveSession]);

    useEffect(() => {
        // URL에서 sessionId 파라미터를 가져옵니다.
        joinSession(sessionId);
    }, [location, joinSession]);

    // 텍스트 데이터를 서버로 전송하는 함수
    const sendTranscription = (username, transcript) => {
        console.log('transcript: ', transcript);
        const sessionId = new URLSearchParams(location.search).get('sessionId');
        if (!transcript || transcript == '') {
            // 인식된 게 없으면 전송 x
            console.log('Transcript is empty or null:', transcript);
            return;
        }
        console.log('서버로 전송: ', { username, transcript, sessionId });
        apiCall(API_LIST.RECEIVE_TRANSCRIPT, {
            username,
            transcript,
            sessionId,
        })
            .then((data) => {
                console.log('Transcript received:', data);
            })
            .catch((error) => {
                console.error('Error sending transcript:', error);
            });
    };

    // 주제 추천 요청 이벤트 발생
    const requestTopicRecommendations = () => {
        console.log(`${sessionId}에서 주제추천 요청`);
        socket.current.emit('requestTopicRecommendations', { sessionId });
    };

    // 음성인식 시작
    const startSpeechRecognition = (stream, username) => {
        // 브라우저 지원 확인
        if (!('webkitSpeechRecognition' in window)) {
            console.error('speech recognition을 지원하지 않는 브라우저');
            return;
        }

        //SpeechRecognition 객체 생성 및 옵션 설정
        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = true; // 연속적인 음성인식
        recognition.interimResults = false; // 중간 결과 처리

        recognition.onstart = () => {
            console.log('Speech recognition started');
        };

        recognition.onresult = (event) => {
            console.log('in onresult');
            // 음성인식 결과가 도출될 때마다 인식된 음성 처리(stt)
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    const transcript = event.results[i][0].transcript;
                    console.log('Mozilla result:', {
                        username,
                        transcript,
                    });
                    sendTranscription(username, transcript);
                    setSttResults((prevResults) => [
                        ...prevResults,
                        transcript,
                    ]);

                    // 퀴즈 모드일 때만 quizAnswer 검사
                    if (quizModeRef.current) {
                        if (
                            containsPattern(transcript, quizAnswerRef.current)
                        ) {
                            console.log('정답입니다!');
                            setQuizMode(false); // 퀴즈 모드 해제
                            quizModeRef.current = false; // ref 상태 업데이트
                            setQuizTime(0); // 타이머 초기화

                            setSession((currentSession) => {
                                if (currentSession) {
                                    currentSession.signal({
                                        data: JSON.stringify({
                                            userId: userInfo.username,
                                            message: `${userInfo.username} 유저 미션 종료`,
                                            result: true,
                                        }),
                                        to: [],
                                        type: 'quizEnd',
                                    });
                                } else {
                                    console.error('퀴즈 미션수행 에러');
                                }
                                return currentSession;
                            });
                        }
                    }
                }
            }
        };

        recognition.onend = () => {
            console.log('Speech recognition ended');
            if (recognitionRef.current) {
                recognition.start();
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error !== 'no-speech') {
                try {
                    recognition.stop(); // 현재 인식을 멈추고 재시작
                    recognition.start();
                } catch (error) {
                    console.error(
                        'Error starting speech recognition again:',
                        error
                    );
                }
            }
        };

        try {
            // 음성인식 시작
            recognition.start();
            recognitionRef.current = recognition;
        } catch (error) {
            console.error('Error starting speech recognition:', error);
        }
    };

    function containsPattern(text, pattern) {
        // 디버깅을 위한 로그
        console.log(`text: '${text}', pattern: '${pattern}'`);

        // text와 pattern의 모든 공백 제거
        text = text.replace(/\s+/g, '');
        pattern = pattern.replace(/\s+/g, '');

        // 공백 전처리 후 빈 문자열 처리
        if (pattern.length === 0) return true;
        if (text.length === 0) return false;

        console.log(`trim-text: '${text}', trim-pattern: '${pattern}'`);

        // 패턴이 텍스트에 포함되어 있는지 확인
        const result = text.includes(pattern);

        console.log(result ? '성공' : '실패');
        return result;
    }

    // 퀴즈 음성인식 결과를 체크하는 함수
    const checkAnswer = () => {
        setQuizMode(true); // 퀴즈 모드 활성화
        quizModeRef.current = true; // ref 상태 업데이트
        console.log('Quiz 모드: ', quizModeRef.current);

        setQuizTime(10);

        const intervalId = setInterval(() => {
            setQuizTime((prevTime) => {
                if (prevTime <= 0) {
                    clearInterval(intervalId);
                    if (quizModeRef.current) {
                        console.log('오답입니다!');
                        finishQuizMission();
                        setQuizMode(false);
                        quizModeRef.current = false;
                    }
                    return 0;
                }
                console.log(`남은 시간: ${prevTime - 1}초`);
                return prevTime - 1;
            });
        }, 1000);
    };

    const [useTestTopics, setUseTestTopics] = useState(false);

    // const QuizResultModal = ({ success, answer, onClose }) => {
    //     return (
    //         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    //             <div className="bg-white bg-opacity-95 w-3/4 p-5 rounded-xl shadow-lg transform hover:scale-102 transition-transform duration-300 max-w-lg">
    //                 <h1
    //                     className={`text-2xl font-bold mb-3 text-center border-b-2 pb-2 ${
    //                         success
    //                             ? 'text-green-600 border-green-400'
    //                             : 'text-blue-600 border-blue-400'
    //                     }`}
    //                 >
    //                     {success ? '미션 성공 !!' : '미션 실패 ..'}
    //                 </h1>
    //                 {success && (
    //                     <h2 className="text-[#2c4021] text-xl font-semibold text-center mt-3">
    //                         정답: "{answer}"
    //                     </h2>
    //                 )}
    //                 <button
    //                     onClick={onClose}
    //                     className="mt-4 bg-[#7cb772] text-white px-4 py-2 rounded-full hover:bg-[#5c9f52] transition-colors duration-300"
    //                 >
    //                     닫기
    //                 </button>
    //             </div>
    //         </div>
    //     );
    // };
    // const RecommendedTopicsModal = ({ topics, onClose }) => {
    //     return (
    //         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    //             <div className="bg-white bg-opacity-95 w-3/4 p-5 rounded-xl shadow-lg transform hover:scale-102 transition-transform duration-300 max-w-lg">
    //                 <h3 className="text-2xl font-semibold mb-3 text-center border-b-2 border-[#7cb772] pb-2">
    //                     추천 주제
    //                 </h3>
    //                 <ul className="list-disc list-inside">
    //                     {topics.map((topic, index) => (
    //                         <li
    //                             key={index}
    //                             className="text-xl text-gray-700 mb-2"
    //                         >
    //                             {topic}
    //                         </li>
    //                     ))}
    //                 </ul>
    //                 <button
    //                     onClick={onClose}
    //                     className="mt-4 bg-[#7cb772] text-white px-4 py-2 rounded-full hover:bg-[#5c9f52] transition-colors duration-300"
    //                 >
    //                     닫기
    //                 </button>
    //             </div>
    //         </div>
    //     );
    // };

    const InitialQuestionModal = () => {
        if (!sessionData || sessionData.length < 4) return null;

        const currentUserIndex = sessionData.findIndex(
            (user) => user.userId === userInfo.username
        );
        targetUserIndexRef.current = (currentUserIndex + 1) % 4;

        const answer = sessionData[targetUserIndexRef.current].answer;
        quizAnswerRef.current = answer;
        console.log('answer는? -> ', quizAnswerRef.current);

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gradient-to-br from-yellow-100 to-orange-100 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center transform transition-transform scale-105 hover:scale-110">
                    <h2 className="text-3xl font-extrabold mb-4 text-orange-800">
                        답변을 맞출 대상
                    </h2>
                    <p className="mb-4 text-lg text-orange-700">
                        <span className="font-semibold text-orange-800">
                            "{sessionData[targetUserIndexRef.current].nickname}"
                        </span>{' '}
                        님에 대한 질문의 답변을 맞춰보세요
                    </p>
                    <p className="mb-4 font-bold text-xl text-orange-800 bg-orange-200 p-4 rounded-lg shadow-inner">
                        "{sessionData[targetUserIndexRef.current].question}"
                    </p>
                    <p className="text-sm text-orange-500">
                        이 창은 5초 후 자동으로 닫힙니다.
                    </p>
                </div>
            </div>
        );
    };

    // TTS 기능 추가
    const handleTTS = useCallback(
        (username, message) => {
            const utterance = new SpeechSynthesisUtterance(
                `${username}님, ${message}`
            );
            utterance.lang = 'ko-KR';
            utterance.onend = () => {
                // TTS가 끝나면 스트림을 종료합니다.
                if (ttsStreamRef.current) {
                    const tracks = ttsStreamRef.current.getTracks();
                    tracks.forEach((track) => track.stop());
                    ttsStreamRef.current = null;
                }
            };
            window.speechSynthesis.speak(utterance);

            // Web Audio API를 사용하여 TTS를 MediaStream으로 변환
            const audioContext = new (window.AudioContext ||
                window.webkitAudioContext)();
            const destination = audioContext.createMediaStreamDestination();
            const source = audioContext.createMediaElementSource(
                utterance.audioElement
            );
            source.connect(destination);
            source.connect(audioContext.destination);

            // TTS 스트림을 OpenVidu로 송출
            const ttsStream = destination.stream;
            ttsStreamRef.current = ttsStream;
            const ttsPublisher = OV.initPublisher(undefined, {
                audioSource: ttsStream.getAudioTracks()[0],
                videoSource: null,
                publishAudio: true,
                publishVideo: false,
            });
            session.publish(ttsPublisher);
        },
        [OV, session]
    );

    const startInactivityTimer = () => {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = setTimeout(() => {
            handleTTS(userInfo.username, '말하세요');
        }, 10000); // 10초 후에 "말하세요" TTS 재생
    };

    const resetInactivityTimer = () => {
        clearTimeout(inactivityTimeoutRef.current);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#f7f3e9] to-[#e7d4b5]">
            <header className="w-full bg-gradient-to-r from-[#a16e47] to-[#c18a67] p-3 flex items-center justify-between shadow-lg">
                <img
                    src={logo}
                    alt="명톡 로고"
                    className="w-14 h-14 sm:w-18 sm:h-18 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300"
                />
                <div className="flex items-center">
                    <h2 className="text-white text-2xl font-bold bg-[#8b5e3c] bg-opacity-80 rounded-lg px-5 py-3 mr-5 shadow-inner">
                        남은 시간: {Math.floor(remainingTime / 60)}분{' '}
                        {remainingTime % 60}초
                    </h2>
                    <button
                        onClick={leaveSession}
                        className="text-white text-xl bg-gradient-to-r from-red-500 to-red-600 px-7 py-3 rounded-lg hover:from-red-600 hover:to-red-700 transition-colors duration-300 shadow-lg transform hover:scale-105"
                    >
                        중단하기
                    </button>
                </div>
            </header>
            <div className="flex flex-1 overflow-hidden relative">
                <div className="flex flex-col w-3/4 bg-gradient-to-br from-[#fff8e8] to-[#fff2d6] border-r border-[#d4b894] shadow-inner">
                    <RaccoonHand
                        onQuizEvent={handleQuizInProgress}
                        quizResult={quizResult}
                        quizResultTrigger={quizResultTrigger}
                        isChallengeCompleted={isChallengeCompleted}
                        isChallengeCompletedTrigger={
                            isChallengeCompletedTrigger
                        }
                    />
                    <div className="grid grid-cols-2 grid-rows-2 gap-2 p-2 h-full">
                        {publisher && (
                            <div className="relative w-full h-full border-2 border-[#d4b894] rounded-xl shadow-2xl overflow-hidden">
                                <OpenViduVideo
                                    streamManager={publisher}
                                    className="w-full h-full object-cover"
                                />

                                <div className="absolute top-3 left-1/2 transform -translate-x-1/2 text-black text-4xl tracking-widest font-extrabold">
                                    {publisher.stream.connection.data}
                                </div>

                                {quizChallenger ===
                                    publisher.stream.connection.data && (
                                    <div className="absolute top-0 left-0 w-full bg-gradient-to-r from-[#a16e47] to-[#c18a67] bg-opacity-60 text-white py-4 px-6 rounded-b-xl shadow-lg border-x-2 border-b-2 border-[#8b5e3c] backdrop-filter backdrop-blur-sm z-20">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <p className="text-3xl font-bold text-shadow animate-pulse whitespace-nowrap">
                                                🔥 미션 진행 중!
                                            </p>
                                            <div className="overflow-hidden w-full">
                                                <p className="text-4xl font-extrabold text-yellow-300 text-shadow-lg whitespace-nowrap animate-[slideLeft_10s_linear_infinite]">
                                                    {quizChallenger} 님
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <style jsx>{`
                                    @keyframes slideLeft {
                                        0% {
                                            transform: translateX(100%);
                                        }
                                        100% {
                                            transform: translateX(-100%);
                                        }
                                    }
                                `}</style>

                                <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-r from-[#a16e47] to-[#8b5e3c] py-3">
                                    <div className="flex justify-center items-center w-full">
                                        {sessionData
                                            .find(
                                                (user) =>
                                                    user.userId ===
                                                    userInfo.username
                                            )
                                            ?.userInterests.slice(0, 3)
                                            .map((interest, index) => (
                                                <span
                                                    key={index}
                                                    className="text-xl px-6 py-2 bg-[#d4b894] text-[#4a3728] font-bold rounded-full mx-3 whitespace-nowrap transform transition-all duration-300 hover:scale-105 hover:bg-[#e7d4b5] tracking-wide"
                                                >
                                                    {interest}
                                                </span>
                                            ))}
                                    </div>
                                </div>

                                {/* <img
                                    src={settingsIcon}
                                    alt="설정"
                                    className="absolute top-3 right-3 w-9 h-9 cursor-pointer bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100 transition-colors duration-300"
                                    onClick={toggleSettings}
                                /> */}
                                {/* {showSettings && (
                                    <div className="absolute top-14 right-3 z-50">
                                        <SettingMenu
                                            publisher={publisher}
                                            onMirroredChange={
                                                handleMirrorChange
                                            }
                                        />
                                    </div>
                                )} */}
                            </div>
                        )}
                        {subscribers.map((subscriber, index) => (
                            <div
                                key={index}
                                className="relative w-full h-full border-2 border-[#d4b894] rounded-xl shadow-lg overflow-hidden "
                            >
                                <OpenViduVideo
                                    streamManager={subscriber}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-3 left-1/2 transform -translate-x-1/2 text-black text-4xl tracking-widest font-extrabold">
                                    {subscriber.stream.connection.data}
                                </div>

                                {quizChallenger ===
                                    subscriber.stream.connection.data && (
                                    <div className="absolute top-0 left-0 w-full bg-gradient-to-r from-[#a16e47] to-[#c18a67] bg-opacity-60 text-white py-4 px-6 rounded-b-xl shadow-lg border-x-2 border-b-2 border-[#8b5e3c] backdrop-filter backdrop-blur-sm z-20">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <p className="text-3xl font-bold text-shadow animate-pulse whitespace-nowrap">
                                                🔥 미션 진행 중!
                                            </p>
                                            <div className="overflow-hidden w-full">
                                                <p className="text-4xl font-extrabold text-yellow-300 text-shadow-lg whitespace-nowrap animate-[slideLeft_10s_linear_infinite]">
                                                    {quizChallenger} 님
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-r from-[#a16e47] to-[#8b5e3c] py-3">
                                    <div className="flex justify-center items-center w-full">
                                        {sessionData
                                            .find(
                                                (user) =>
                                                    user.nickname ===
                                                    subscriber.stream.connection
                                                        .data
                                            )
                                            ?.userInterests.slice(0, 3)
                                            .map((interest, index) => (
                                                <span
                                                    key={index}
                                                    className="text-xl px-6 py-2 bg-[#d4b894] text-[#4a3728] font-bold rounded-full mx-3 whitespace-nowrap transform transition-all duration-300 hover:scale-105 hover:bg-[#e7d4b5] tracking-wide"
                                                >
                                                    {interest}
                                                </span>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {Array.from({
                            length:
                                4 - subscribers.length - (publisher ? 1 : 0),
                        }).map((_, index) => (
                            <div
                                key={`empty-${index}`}
                                className="relative w-full h-full border-3 border-[#d4b894] rounded-xl shadow-2xl flex items-center justify-center bg-gradient-to-br from-[#f7f3e9] to-[#e7d4b5]"
                            >
                                <div className="text-[#8b5e3c] flex flex-col items-center">
                                    <svg
                                        className="animate-spin h-12 w-12 text-[#8b5e3c] mb-3"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    <span className="text-lg font-semibold">
                                        로딩 중...!
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-1/4 flex flex-col p-5 bg-gradient-to-b from-[#a8e6a8] via-[#7cb772] to-[#5c9f52] shadow-inner relative ">
                    <MovingDogs sessionData={sessionData} />

                    <button
                        onClick={requestTopicRecommendations}
                        className="bg-white bg-opacity-95 text-[#4a6741] text-xl font-bold px-5 py-2 rounded-full shadow-lg transform hover:scale-102 transition-transform duration-300 border-b-2 border-[#7cb772] absolute"
                        style={{
                            fontSize: '24px',
                            top: '450px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                        }}
                    >
                        주제 추천
                    </button>

                    <div
                        className="w-full flex flex-col items-center absolute"
                        style={{ top: '400px', left: '4px' }}
                    >
                        {recommendedTopics.length > 0 &&
                            !quizChallenger &&
                            !quizResult && (
                                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                                    <div className="bg-gradient-to-r from-yellow-100 via-orange-50 to-yellow-100 p-6 rounded-2xl shadow-2xl w-4/5 max-w-4xl h-40 text-center transform transition-all duration-300 scale-105 hover:scale-110 flex items-center justify-between overflow-hidden border-2 border-orange-200 backdrop-filter backdrop-blur-sm">
                                        <div className="flex-1 text-left space-y-2">
                                            <h1 className="text-4xl font-extrabold text-orange-700 animate-pulse">
                                                🎯 추천 주제
                                            </h1>
                                            <p className="text-xl text-orange-600">
                                                오늘의 대화 주제입니다!
                                            </p>
                                        </div>
                                        <div className="flex-2 font-bold text-2xl text-orange-700 bg-orange-100 bg-opacity-60 p-4 rounded-xl shadow-inner mx-4 transform rotate-1 w-1/2 flex items-center justify-center">
                                            <p className="animate-bounce text-center">
                                                "{recommendedTopics[0]}"
                                            </p>
                                        </div>
                                        <div className="flex-1/2 text-right space-y-2">
                                            <p className="text-base text-orange-500 animate-pulse">
                                                5초 후 자동으로 닫힘
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                        {showQuizSuccess && (
                            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                                <div className="bg-gradient-to-r from-yellow-200 via-orange-100 to-yellow-200 bg-opacity-80 p-6 rounded-2xl shadow-2xl w-4/5 max-w-4xl h-48 text-center transform transition-all duration-300 scale-105 hover:scale-110 flex items-center justify-between overflow-hidden border-2 border-orange-300 backdrop-filter backdrop-blur-sm">
                                    <div className="flex-1 text-left space-y-2">
                                        <h1 className="text-5xl font-extrabold text-orange-800 animate-pulse">
                                            🎉 미션 성공
                                        </h1>
                                        <p className="text-2xl text-orange-700">
                                            축하합니다!{' '}
                                            <span className="font-semibold text-orange-800 text-3xl">
                                                {userInfo.username}
                                            </span>{' '}
                                            님
                                        </p>
                                    </div>
                                    <div className="flex-1 font-bold text-3xl text-orange-800 bg-orange-200 bg-opacity-60 p-5 rounded-xl shadow-inner mx-4 transform rotate-3">
                                        <p className="animate-bounce">
                                            "{quizAnswerRef.current}"
                                        </p>
                                    </div>
                                    <div className="flex-1 text-right space-y-2">
                                        <p className="text-2xl text-orange-700">
                                            멋있는 추리력입니다.
                                        </p>
                                        <p className="text-lg text-orange-600 animate-pulse">
                                            5초 후 자동으로 닫힘
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {showQuizFailure && (
                            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                                <div className="bg-gradient-to-r from-yellow-200 via-orange-100 to-yellow-200 bg-opacity-80 p-6 rounded-2xl shadow-2xl w-4/5 max-w-4xl h-48 text-center transform transition-all duration-300 scale-105 hover:scale-110 flex items-center justify-between overflow-hidden border-2 border-orange-300 backdrop-filter backdrop-blur-sm">
                                    <div className="flex-1 text-left space-y-2">
                                        <h1 className="text-5xl font-extrabold text-orange-800 animate-pulse">
                                            😢 미션 실패
                                        </h1>
                                        <p className="text-2xl text-orange-700">
                                            아쉽게도{' '}
                                            <span className="font-semibold text-orange-800 text-3xl">
                                                {userInfo.username}
                                            </span>{' '}
                                            님
                                        </p>
                                    </div>
                                    <div className="flex-1 font-bold text-3xl text-orange-800 bg-orange-200 bg-opacity-60 p-5 rounded-xl shadow-inner mx-4 transform -rotate-3">
                                        <p className="animate-bounce">
                                            정답이 틀렸습니다..
                                        </p>
                                    </div>
                                    <div className="flex-1 text-right space-y-2">
                                        <p className="text-2xl text-orange-700">
                                            다음에 더 잘하실 거예요!
                                        </p>
                                        <p className="text-lg text-orange-600 animate-pulse">
                                            5초 후 자동으로 닫힘
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {showInitialModal && <InitialQuestionModal />}
        </div>
    );
};
export default VideoChatPage;
