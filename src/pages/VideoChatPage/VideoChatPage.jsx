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
    const FRAME_RATE = 60;
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

    const quizModeRef = useRef(quizMode);
    const targetUserIndexRef = useRef(0);

    let ovSocket = null;

    const handleQuizInProgress = (data) => {
        console.log('자식에서 넘겨받은 데이터 -> ', data);
        console.log('세션정보 -> ', session);
        ovSocket
            .signal({
                data: JSON.stringify({
                    userId: userInfo.username,
                    message: `${userInfo.username} 유저가 미션을 시작합니다.`,
                }),
                to: [],
                type: 'quizStart',
            })
            .then(() => {
                console.log('시그널 성공적으로 전송');
            })
            .catch((error) => {
                console.error('시그널 도중 에러 발생 -> ', error);
            });
        console.log('스타트 퀴즈 미션');
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
            setRecommendedTopics((prevTopics) => {
                if (data === '\n') {
                    return [...prevTopics, ''];
                } else {
                    const updatedTopics = [...prevTopics];
                    if (updatedTopics.length === 0) {
                        updatedTopics.push(data);
                    } else {
                        updatedTopics[updatedTopics.length - 1] += data;
                    }
                    return updatedTopics;
                }
            });
            /*------------본래 주제 한 번에 받아오던 코드-------------*/
            // const topics = Array.isArray(data.data.topics)
            //     ? data.data.topics
            //     : [];
            // setRecommendedTopics(topics);
        });

        socket.current.on('endOfStream', () => {
            console.log('Streaming ended');
        });

        return () => {
            if (socket.current) {
                socket.current.emit('leaveSession', sessionId);
                socket.current.disconnect();
            }
        };
    }, [location]);

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
            compositeCanvas.width = 640; // 원하는 크기로 설정
            compositeCanvas.height = 480;
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
                filter: filterOptions,
            });

            setPublisher(publisher);
            session.publish(publisher);

            // 음성 인식 시작
            startSpeechRecognition(
                publisher.stream.getMediaStream(),
                userInfo.username
            );

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
            ovSocket = session;

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
            });

            // 발화 종료 감지
            session.on('publisherStopSpeaking', (event) => {
                console.log(
                    'User ' + event.connection.connectionId + ' stop speaking'
                );
            });

            const allowedSessionIdList = [
                'sessionA',
                'sessionB',
                'sessionC',
                'sessionD',
                'sessionE',
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
                                resolution: '1280x720',
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
                                resolution: '1280x720',
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
        setRecommendedTopics([]); // 기존 추천 주제를 초기화
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
                            boyerMooreSearch(transcript, quizAnswerRef.current)
                        ) {
                            console.log('정답입니다!');
                            setQuizMode(false); // 퀴즈 모드 해제
                            quizModeRef.current = false; // ref 상태 업데이트
                            setQuizTime(0); // 타이머 초기화
                            ovSocket.signal({
                                data: JSON.stringify({
                                    userId: userInfo.username,
                                    message: `${userInfo.username} 유저 미션 종료`,
                                    result: true,
                                }),
                                to: [],
                                type: 'quizEnd',
                            });
                        }
                    }
                }
            }
        };

        recognition.onend = () => {
            console.log('Speech recognition ended');
            if (recognitionRef.current) {
                recognition.onstart();
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

    function boyerMooreSearch(text, pattern) {
        // text 공백 전처리
        text = text.trim();
        pattern = pattern.trim();

        const m = pattern.length;
        const n = text.length;

        if (m === 0) return true;

        const badChar = Array(256).fill(-1);

        for (let i = 0; i < m; i++) {
            badChar[pattern.charCodeAt(i)] = i;
        }

        let s = 0;

        while (s <= n - m) {
            let j = m - 1;

            while (j >= 0 && pattern[j] === text[s + j]) {
                j--;
            }

            if (j < 0) {
                return true;
            } else {
                const charCode = text.charCodeAt(s + j);
                const badCharShift =
                    badChar[charCode] !== -1 ? j - badChar[charCode] : 1;
                s += Math.max(1, badCharShift);
            }
        }

        return false;
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
                        isChallengeCompletedTrigger={isChallengeCompletedTrigger}
                    />
                    <div className="grid grid-cols-2 gap-8 p-8 relative flex-grow">
                        {publisher && (
                            <div className="relative border-3 border-[#d4b894] rounded-xl shadow-2xl overflow-hidden transform hover:scale-102 transition-transform duration-300">
                                <OpenViduVideo streamManager={publisher} />
                                <div className="absolute top-0 left-0 bg-gradient-to-r from-[#a16e47] to-[#c18a67] text-white p-3 rounded-br-lg">
                                    {publisher.stream.connection.data}
                                </div>
                                <img
                                    src={settingsIcon}
                                    alt="설정"
                                    className="absolute top-3 right-3 w-9 h-9 cursor-pointer bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100 transition-colors duration-300"
                                    onClick={toggleSettings}
                                />
                                {showSettings && (
                                    <div className="absolute top-14 right-3 z-50">
                                        <SettingMenu
                                            publisher={publisher}
                                            onMirroredChange={handleMirrorChange}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                        {subscribers.map((subscriber, index) => (
                            <div
                                key={index}
                                className="relative border-3 border-[#d4b894] rounded-xl shadow-2xl overflow-hidden transform hover:scale-102 transition-transform duration-300"
                            >
                                <OpenViduVideo streamManager={subscriber} />
                                <div className="absolute top-0 left-0 bg-gradient-to-r from-[#a16e47] to-[#c18a67] text-white p-3 rounded-br-lg">
                                    {subscriber.stream.connection.data}
                                </div>
                            </div>
                        ))}
                        {Array.from({ length: 4 - subscribers.length - 1 }).map((_, index) => (
                            <div
                                key={index}
                                className="relative border-3 border-[#d4b894] rounded-xl shadow-2xl flex items-center justify-center bg-gradient-to-br from-[#f7f3e9] to-[#e7d4b5]"
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
                                    <span className="text-lg font-semibold">로딩 중...</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="w-1/4 flex flex-col p-5 bg-gradient-to-b from-[#a8e6a8] via-[#7cb772] to-[#5c9f52] shadow-inner">
                    <MovingDogs sessionData={sessionData} />
                    <div className="mt-auto space-y-5">
                        {recommendedTopics.length > 0 && !quizChallenger && !quizResult && (
                            <div className="bg-white bg-opacity-95 w-full p-5 rounded-xl shadow-lg transform hover:scale-102 transition-transform duration-300">
                                <h3 className="text-2xl font-bold mb-3 text-[#4a6741] border-b-2 border-[#7cb772] pb-2">
                                    추천 주제
                                </h3>
                                <ul className="list-disc list-inside text-[#2c4021] space-y-2">
                                    {recommendedTopics.map((topic, index) => (
                                        <li key={index} className="text-lg">
                                            {topic}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {quizChallenger && (
                            <div className="bg-white bg-opacity-95 w-full p-5 rounded-xl shadow-lg transform hover:scale-102 transition-transform duration-300">
                                <h1 className="text-[#4a6741] text-2xl font-bold mb-3 text-center border-b-2 border-[#7cb772] pb-2">
                                    {quizChallenger} 유저 퀴즈 미션 수행중!
                                </h1>
                                <div className="bg-[#f0f8ff] p-4 rounded-lg shadow-inner">
                                    <h2 className="text-[#2c4021] text-xl mb-2 font-semibold text-center">
                                        {sessionData[targetUserIndexRef.current].nickname} 님의 질문
                                    </h2>
                                    <p className="text-[#4a6741] text-lg text-center italic">
                                        "{sessionData[targetUserIndexRef.current].question}"
                                    </p>
                                </div>
                            </div>
                        )}
                        {showQuizSuccess && (
                            <div className="bg-white bg-opacity-95 w-full p-5 rounded-xl shadow-lg transform hover:scale-102 transition-transform duration-300">
                                <h1 className="text-green-600 text-2xl font-bold mb-3 text-center border-b-2 border-green-400 pb-2">
                                    미션 성공 !!
                                </h1>
                                <h2 className="text-[#2c4021] text-xl font-semibold text-center mt-3">
                                    정답: "{quizAnswerRef.current}"
                                </h2>
                            </div>
                        )}
                        {showQuizFailure && (
                            <div className="bg-white bg-opacity-95 w-full p-5 rounded-xl shadow-lg transform hover:scale-102 transition-transform duration-300">
                                <h1 className="text-blue-600 text-2xl font-bold text-center border-b-2 border-blue-400 pb-2">
                                    미션 실패 ..
                                </h1>
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
