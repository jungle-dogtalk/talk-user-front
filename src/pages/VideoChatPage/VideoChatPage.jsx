import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { OpenVidu } from 'openvidu-browser';
import axios from 'axios';
import OpenViduVideo from './OpenViduVideo';
import { apiCall, apiCallWithFileData } from '../../utils/apiCall';
import { API_LIST } from '../../utils/apiList';
import settingsIcon from '../../assets/settings-icon.jpg'; // 설정 아이콘
import { getToken, getTokenForTest } from '../../services/openviduService';
import SettingMenu from './SettingMenu';
import io from 'socket.io-client';
import AvatarApp from '../../components/common/AvatarApp';
import RaccoonHand from '../../components/common/RaccoonHand';
import MovingDogs from './MovingDogs';

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

    const userInfo = useSelector((state) => state.user.userInfo); // redux에서 유저 정보 가져오기
    // userInfo가 null인 경우 처리
    if (!userInfo) {
        return <div>Loading...</div>;
    }

    const [remainingTime, setRemainingTime] = useState(0);

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

            window.location.href = '/review';
        } catch (error) {
            console.error('Error ending call:', error);
        } finally {
            setIsLeaving(false);
        }
    }, [session, publisher, userInfo.username, location.search, isLeaving]);

    const startStreaming = (session, OV, mediaStream) => {
        setTimeout(() => {
            const video = document.createElement('video');
            video.srcObject = new MediaStream([
                mediaStream.getVideoTracks()[0],
            ]);
            video.play();

            const canvasElement = document
                .getElementById('avatar_canvas')
                .querySelector('canvas');
            const ctx = canvasElement.getContext('2d');

            const outputCanvas = document.createElement('canvas');
            const outputCtx = outputCanvas.getContext('2d');
            outputCanvas.width = canvasElement.width;
            outputCanvas.height = canvasElement.height;

            const chromaKey = (imageData) => {
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    if (g > 100 && r < 100 && b < 100) {
                        data[i + 3] = 0; // 투명하게 설정
                    }
                }
                return imageData;
            };

            const render = () => {
                outputCtx.clearRect(
                    0,
                    0,
                    outputCanvas.width,
                    outputCanvas.height
                );
                outputCtx.drawImage(
                    canvasElement,
                    0,
                    0,
                    outputCanvas.width,
                    outputCanvas.height
                );
                const imageData = outputCtx.getImageData(
                    0,
                    0,
                    outputCanvas.width,
                    outputCanvas.height
                );
                outputCtx.putImageData(chromaKey(imageData), 0, 0);
                requestAnimationFrame(render);
            };

            render();

            const canvasStream = outputCanvas.captureStream(FRAME_RATE);
            const publisher = OV.initPublisher(undefined, {
                audioSource: undefined,
                videoSource: canvasStream.getVideoTracks()[0],
            });

            setPublisher(publisher);
            session.publish(publisher);

            startSpeechRecognition(
                publisher.stream.getMediaStream(),
                userInfo.username
            );
            socket.current.emit('joinSession', sessionId);
        }, 5000);
    };
    // 세션 참여
    const joinSession = useCallback(
        async (sid) => {
            const OV = new OpenVidu();
            const session = OV.initSession();
            setSession(session);

            session.on('streamCreated', (event) => {
                let subscriber = session.subscribe(event.stream, undefined);
                setSubscribers((prevSubscribers) => [
                    ...prevSubscribers,
                    subscriber,
                ]);
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
                getToken(sid, userInfo._id).then((token) => {
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

    const handleSubscriberChromaKey = (stream) => {
        const videoElement = document.createElement('video');
        videoElement.srcObject = stream.getMediaStream();
        videoElement.play();

        const canvasElement = document.createElement('canvas');
        const ctx = canvasElement.getContext('2d');
        document.body.appendChild(canvasElement);

        const chromaKey = (imageData) => {
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                if (g > 100 && r < 100 && b < 100) {
                    data[i + 3] = 0; // 투명하게 설정
                }
            }
            return imageData;
        };

        const render = () => {
            ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            ctx.drawImage(
                videoElement,
                0,
                0,
                canvasElement.width,
                canvasElement.height
            );
            const imageData = ctx.getImageData(
                0,
                0,
                canvasElement.width,
                canvasElement.height
            );
            ctx.putImageData(chromaKey(imageData), 0, 0);
            requestAnimationFrame(render);
        };

        render();

        const canvasStream = canvasElement.captureStream(FRAME_RATE);
        const newPublisher = OV.initPublisher(undefined, {
            audioSource: undefined,
            videoSource: canvasStream.getVideoTracks()[0],
        });

        session.publish(newPublisher);
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

        // if (recognitionRef.current) {
        //     console.warn('음성인식이 이미 시작됨');
        //     return;
        // }

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

    return (
        <div className="min-h-screen flex flex-col bg-[#f7f3e9]">
            <header className="w-full bg-[#a16e47] p-4 flex items-center justify-between">
                <h1 className="text-white text-4xl">멍톡</h1>
                <button
                    onClick={leaveSession}
                    className="text-white text-lg bg-red-600 px-4 py-2 rounded-md"
                >
                    중단하기
                </button>
            </header>
            <div className="flex flex-1 overflow-hidden relative">
                <div className="flex flex-col w-3/4">
                    {/* <AvatarApp></AvatarApp>
                     */}
                    <RaccoonHand></RaccoonHand>
                    // TODO: 화면을 하나로 합쳐야함
                    <div
                        // className="grid grid-cols-2 gap-4 p-4 border-2 border-gray-300 relative"
                        // className="grid grid-cols-1 gap-4 p-4 border-2 border-gray-300 relative"
                        className="relative flex-1 p-4 border-2 border-gray-300"
                        style={{ flex: '1 1 auto' }}
                    >
                        {publisher && (
                            // <div className="relative border-2 border-gray-300 aspect-video">
                            //     <OpenViduVideo streamManager={publisher} />
                            //     <div className="absolute top-0 left-0 bg-transparent bg-opacity-50 text-white p-2 rounded-md">
                            //         {publisher.stream.connection.data}
                            //     </div>
                            <div className="absolute inset-0">
                                <OpenViduVideo streamManager={publisher} />
                                <div className="absolute top-0 left-0 bg-transparent bg-opacity-50 text-white p-2 rounded-md">
                                    {publisher.stream.connection.data}
                                </div>
                                <img
                                    src={settingsIcon}
                                    alt="설정"
                                    className="absolute top-2 right-2 w-6 h-6 cursor-pointer"
                                    onClick={toggleSettings}
                                />
                                {showSettings && (
                                    <div className="absolute top-10 right-2 w-38 bg-white shadow-lg rounded-lg p-2 z-50">
                                        <SettingMenu
                                            publisher={publisher}
                                            onMirroredChange={
                                                handleMirrorChange
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                        // TODO: 구독자의 화면도 하나로 합침. 그런데 사용자들의
                        화면을 투명한 색으로 만들고 싶음
                        {/* {subscribers.map((subscriber, index) => (
                            <div
                                key={index}
                                className="relative border-2 border-gray-300 aspect-video"
                            >
                                <OpenViduVideo streamManager={subscriber} />
                                <div className="absolute top-0 left-0 bg-black bg-opacity-50 text-white p-2 rounded-md">
                                    {subscriber.stream.connection.data}
                                </div>
                            </div>
                        ))} */}
                        {subscribers.map((subscriber, index) => (
                            <div
                                key={index}
                                className="absolute inset-0"
                                style={{ zIndex: index + 1 }}
                            >
                                <OpenViduVideo streamManager={subscriber} />
                                <div className="absolute top-0 left-0 bg-transparent bg-opacity-50 text-white p-2 rounded-md">
                                    {subscriber.stream.connection.data}
                                </div>
                            </div>
                        ))}
                        {Array.from({ length: 4 - subscribers.length - 1 }).map(
                            (_, index) => (
                                <div
                                    key={index}
                                    className="relative border-2 border-gray-300 aspect-video flex items-center justify-center"
                                >
                                    <div className="text-gray-500">
                                        화면이 나올 공간
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                    <div
                        className="flex-grow bg-white p-4 rounded-md text-center overflow-y-auto"
                        style={{ height: '200px' }}
                    >
                        <button
                            onClick={requestTopicRecommendations}
                            className="bg-gray-300 text-brown-700 text-2xl font-bold px-4 py-2 rounded-md inline-block mb-4"
                        >
                            주제 추천 Btn
                        </button>

                        {recommendedTopics.length > 0 && (
                            <div className="recommended-topics mt-4">
                                <h3 className="text-lg font-semibold">
                                    추천 주제
                                </h3>
                                <ul className="list-disc list-inside">
                                    {recommendedTopics.map((topic, index) => (
                                        <li key={index}>{topic}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
                <div className="w-1/4 flex flex-col bg-[#CFFFAA] p-4">
                    <h2 className="text-lg font-bold mb-2 text-center">
                        남은 시간: {Math.floor(remainingTime / 60)}분{' '}
                        {remainingTime % 60}초
                    </h2>
                    <MovingDogs sessionData={sessionData} />
                </div>
            </div>
        </div>
    );
};
export default VideoChatPage;
