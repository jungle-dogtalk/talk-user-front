import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './VideoChatPage.css';
import { OpenVidu } from 'openvidu-browser';
import axios from 'axios';
import OpenViduVideo from './OpenViduVideo';
import { apiCall, apiCallWithFileData } from '../../utils/apiCall';
import { API_LIST } from '../../utils/apiList';
import dogImage from '../../assets/dog.jpg'; // 강아지 이미지
import dogHouseImage from '../../assets/doghouse.jpg'; // 강아지 집 이미지
import settingsIcon from '../../assets/settings-icon.jpg'; // 설정 아이콘
import { getToken } from '../../services/openviduService';
import SettingMenu from './SettingMenu';
import io from 'socket.io-client';

const VideoChatPage = () => {
    const [session, setSession] = useState(undefined);
    const [subscribers, setSubscribers] = useState([]);
    const [publisher, setPublisher] = useState(undefined);
    const [showSettings, setShowSettings] = useState(false); // 설정 창 상태 관리
    const [isMirrored, setIsMirrored] = useState(false); // 좌우 반전 상태 관리
    const [sttResults, setSttResults] = useState([]); // STT 결과 저장
    const [recommendedTopics, setRecommendedTopics] = useState([]); // 주제 추천 결과 저장
    const [interests, setInterests] = useState([]); // 관심사 결과 저장
    const [isLeaving, setIsLeaving] = useState(false); // 중단 중복 호출 방지

    const recognitionRef = useRef(null);
    const userInfo = useSelector((state) => state.user.userInfo); // redux에서 유저 정보 가져오기
    const location = useLocation();
    const socket = useRef(null);

    // socket 연결 처리
    useEffect(() => {
        socket.current = io('http://localhost:5000');

        socket.current.on('connect', () => {
            console.log('WebSocket connection opened');
        });

        socket.current.on('disconnect', () => {
            console.log('WebSocket connection closed');
        });

        return () => {
            if (socket.current) {
                socket.current.emit('leaveSession', sessionId);
                socket.current.disconnect();
            }
        };
    }, []);

    // 세션 떠남
    const leaveSession = useCallback(() => {
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
                recognitionRef.current.abort(); // 인식 중지
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
        const sessionId = new URLSearchParams(location.search).get('sessionId');

        console.log('중단하기 요청 전송:', { username, sessionId });

        apiCall(API_LIST.END_CALL, { username, sessionId })
            .then((response) => {
                console.log('API 응답:', response);

                if (response.data) {
                    const interestsData = {
                        username: response.data.username,
                        interests: response.data.interests,
                    };
                    console.log(
                        '로컬 스토리지에 저장할 데이터:',
                        interestsData
                    );
                    setInterests(response.data.interests);
                    localStorage.setItem(
                        'interestsData',
                        JSON.stringify(interestsData)
                    );
                    window.location.href = '/review';
                } else {
                    console.error('응답 데이터가 null입니다:', response);
                }

                // 소켓 연결을 끊고 세션을 정리
                if (socket.current) {
                    socket.current.emit('leaveSession', sessionId);
                    socket.current.disconnect();
                }

                setSession(undefined);
                setSubscribers([]);
                setPublisher(undefined);
            })
            .catch((error) => {
                console.error('Error ending call:', error);
            })
            .finally(() => {
                setIsLeaving(true);
            });
    }, [session, publisher, userInfo.username, location.search, isLeaving]);

    // 세션 참여
    const joinSession = useCallback(
        (sid) => {
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

            getToken(sid).then((token) => {
                session
                    .connect(token)
                    .then(() => {
                        let publisher = OV.initPublisher(undefined);
                        setPublisher(publisher);
                        session.publish(publisher);
                        // 음성인식 시작
                        startSpeechRecognition(
                            publisher.stream.getMediaStream(),
                            userInfo.username
                        );
                        socket.current.emit('joinSession', sid);
                    })
                    .catch((error) => {
                        console.log(
                            'There was an error connecting to the session:',
                            error.code,
                            error.message
                        );
                    });
            });
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
        const params = new URLSearchParams(location.search);
        const urlSessionId = params.get('sessionId');
        if (urlSessionId) {
            joinSession(urlSessionId);
        }
    }, [location, joinSession]);

    // 텍스트 데이터를 서버로 전송하는 함수
    const sendTranscription = (username, transcript) => {
        const sessionId = new URLSearchParams(location.search).get('sessionId');
        if (!transcript) {
            // 인식된 게 없으면 전송 x
            console.error('Transcript is empty or null:', transcript);
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

    // 주제 추천 요청을 서버로 보내는 함수
    const requestTopicRecommendations = () => {
        const sessionId = new URLSearchParams(location.search).get('sessionId');
        apiCall(API_LIST.RECOMMEND_TOPICS, { sessionId })
            .then((data) => {
                console.log(data);
                const topics = Array.isArray(data.data.topics)
                    ? data.data.topics
                    : [];
                setRecommendedTopics(topics);
            })
            .catch((error) => {
                console.error('Error fetching topic recommendations:', error);
            });
    };

    // 음성인식 시작
    const startSpeechRecognition = (stream, username) => {
        // 브라우저 지원 확인
        if (!('webkitSpeechRecognition' in window)) {
            console.error('speech recognition을 지원하지 않는 브라우저');
            return;
        }

        if (recognitionRef.current) {
            console.warn('음성인식이 이미 시작됨');
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
            if (recognitionRef.current != null) {
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
        <div className="video-chat-page">
            <div className="header">
                <h1>멍톡</h1>
                <button onClick={leaveSession}>중단하기</button>
            </div>
            <div className="content">
                <div className="video-container">
                    <div
                        className={`stream-container ${
                            isMirrored ? 'mirrored' : ''
                        }`}
                    >
                        {publisher && (
                            <OpenViduVideo streamManager={publisher} />
                        )}
                        <div className="stream-label">{'나'}</div>
                        <img
                            src={settingsIcon}
                            alt="설정"
                            className="settings-icon"
                            onClick={toggleSettings}
                        />
                        {showSettings && (
                            <SettingMenu
                                publisher={publisher}
                                onMirroredChange={handleMirrorChange}
                            />
                        )}
                    </div>
                    {subscribers.map((subscriber, index) => (
                        <div key={index} className="stream-container">
                            <OpenViduVideo streamManager={subscriber} />
                            <div className="stream-label">
                                상대방 {index + 1}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="chat-container">
                    <div className="chat-box">{/* 채팅 메시지들 */}</div>
                    <input
                        type="text"
                        placeholder="메시지를 입력하세요..."
                        className="chat-input"
                    />
                </div>
            </div>
            <div className="bottom-section">
                <div className="dog-container">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <img
                            key={index}
                            src={dogImage}
                            alt={`Dog ${index + 1}`}
                            className="dog-image"
                        />
                    ))}
                </div>
                <div className="mission">
                    <h2>미션!</h2>
                    <p>
                        통화를 시작하기 위해서 '멍'을 외쳐주세요! 음성이
                        인식되어야 본격적인 통화가 시작됩니다. 멍멍!
                    </p>
                    <button onClick={requestTopicRecommendations}>
                        주제 추천
                    </button>
                    {recommendedTopics.length > 0 && (
                        <div className="recommended-topics">
                            <h3>추천 주제</h3>
                            <ul>
                                {recommendedTopics.map((topic, index) => (
                                    <li key={index}>{topic}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="dog-house-container">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <img
                            key={index}
                            src={dogHouseImage}
                            alt={`Dog House ${index + 1}`}
                            className="dog-house-image"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default VideoChatPage;
