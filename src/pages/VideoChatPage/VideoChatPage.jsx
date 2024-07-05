import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    logoutUser,
    setUserFromLocalStorage,
} from '../../redux/slices/userSlice'; // 로그아웃 액션 가져오기
import { OpenVidu } from 'openvidu-browser';
import { createSession, createToken } from '../../services/openviduService';
import './VideoChatPage.css';
import dogImage from '../../assets/dog.jpg'; // 강아지 이미지
import dogHouseImage from '../../assets/doghouse.jpg'; // 강아지 집 이미지
import settingsIcon from '../../assets/settings-icon.jpg'; // 설정 아이콘

const VideoChatPage = () => {
    // 여러 상태 관리
    const [session, setSession] = useState(null);
    const [mainStreamManager, setMainStreamManager] = useState(null); // 메인 스트림 관리자 상태를 관리
    const [publisher, setPublisher] = useState(null);
    const [subscribers, setSubscribers] = useState([]); // 구독자 목록 상태 관리
    const [isVideoActive, setIsVideoActive] = useState(true);
    const [isAudioActive, setIsAudioActive] = useState(true);
    const [isMirrored, setIsMirrored] = useState(false); // 좌우 반전 상태 관리
    const [showSettings, setShowSettings] = useState(false); // 설정 창 상태 관리
    const [devices, setDevices] = useState([]); // 미디어 장치 목록 상태 관리
    const [selectedVideoDevice, setSelectedVideoDevice] = useState(''); // 선택된 비디오 장치
    const [selectedAudioDevice, setSelectedAudioDevice] = useState(''); // 선택된 오디오 장치

    // 요소 참조
    const sessionRef = useRef(null); // 세션 참조 관리
    const videoRef = useRef(null); // 비디오 요소 참조

    // 네트워크 상태를 모니터링하기 위한 상태
    const [networkQuality, setNetworkQuality] = useState('good'); // 네트워크 품질 상태 관리 ('good', 'poor', 'bad')

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { userInfo, token } = useSelector((state) => state.user);

    // console.log(userInfo, token);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token && storedToken && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                dispatch(
                    setUserFromLocalStorage({
                        userInfo: parsedUser,
                        token: storedToken,
                    })
                );
            } catch (error) {
                console.error('Failed to parse user from localStorage:', error);
            }
        }

        if (!storedToken || !storedUser) {
            navigate('/'); // 로그인 페이지로 리다이렉트
        }
    }, [token, dispatch, navigate]);

    // 네트워크 상태 모니터링 및 비디오 품질 조정
    const monitorNetwork = () => {
        // 브라우저에서 네트워크 연결 상태를 가져오는 API
        const connection =
            navigator.connection ||
            navigator.mozConnection ||
            navigator.webkitConnection;

        if (connection) {
            const updateNetworkQuality = () => {
                const effectiveType = connection.effectiveType;

                // 네트워크 유형에 따른 품질 상태 설정
                if (effectiveType === '4g') {
                    setNetworkQuality('good'); // 4G 네트워크 - 좋은 상태
                } else if (effectiveType === '3g') {
                    setNetworkQuality('poor'); // 3G 네트워크 - 중간 상태
                } else {
                    setNetworkQuality('bad'); // 그 외 네트워크 - 나쁜 상태
                }
            };

            updateNetworkQuality(); // 초기 네트워크 품질 업데이트

            // 네트워크 상태가 변경될 때마다 품질 업데이트
            connection.addEventListener('change', updateNetworkQuality);

            // 컴포넌트 언마운트 시 이벤트 리스너 제거
            return () => {
                connection.removeEventListener('change', updateNetworkQuality);
            };
        } else {
            // `navigator.connection` API를 지원하지 않는 경우 기본 네트워크 상태를 'good'으로 설정
            setNetworkQuality('good');
        }
    };

    // 네트워크 품질에 따라 비디오 품질 조정
    useEffect(() => {
        if (publisher) {
            // 네트워크 품질이 'good'일 경우
            if (networkQuality === 'good') {
                // 비디오를 켜고 높은 품질로 설정
                publisher.publishVideo(true);
            }
            // 네트워크 품질이 'poor'일 경우
            else if (networkQuality === 'poor') {
                publisher.publishVideo(true);

                // 중간 네트워크 상태에서는 중간 해상도 사용
                publisher.stream
                    .getMediaStream()
                    .getVideoTracks()[0]
                    .applyConstraints({
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        frameRate: { ideal: 15 },
                    });

                // 네트워크 품질이 'bad'일 경우
            } else {
                // 나쁜 네트워크 상태에서는 비디오를 끄기
                publisher.publishVideo(false);
            }
        }
        // networkQuality 또는 publisher 상태가 변경될 때마다 실행
    }, [networkQuality, publisher]);

    // 미디어 장치 목록 가져오기
    useEffect(() => {
        const getDevices = async () => {
            try {
                // 모든 미디어 장치 정보 가져옴
                const deviceInfos =
                    await navigator.mediaDevices.enumerateDevices();

                // 비디오 입력 장치만 필터링하여 배열에 저장
                const videoDevices = deviceInfos.filter(
                    (device) => device.kind === 'videoinput'
                );

                // 오디오 입력 장치만 필터링하여 배열에 저장
                const audioDevices = deviceInfos.filter(
                    (device) => device.kind === 'audioinput'
                );
                setDevices({ videoDevices, audioDevices });

                if (videoDevices.length > 0)
                    setSelectedVideoDevice(videoDevices[0].deviceId);
                if (audioDevices.length > 0)
                    setSelectedAudioDevice(audioDevices[0].deviceId);
            } catch (error) {
                console.error('Error getting devices:', error);
            }
        };

        // 컴포넌트가 마운트될 때 getDevices 함수를 호출하여 장치 목록을 가져옴
        getDevices();

        // 네트워크 상태 모니터링 시작
        const stopMonitoring = monitorNetwork();

        // 컴포넌트 언마운트 시 네트워크 상태 모니터링 중지
        return () => {
            if (stopMonitoring) {
                stopMonitoring();
            }
        };
    }, []);

    const initOpenVidu = async () => {
        try {
            const OV = new OpenVidu();
            const session = OV.initSession();

            session.on('streamCreated', (event) => {
                const subscriber = session.subscribe(event.stream, undefined);
                setSubscribers((prevSubscribers) => [
                    ...prevSubscribers,
                    subscriber,
                ]);
            });

            session.on('streamDestroyed', (event) => {
                setSubscribers((prevSubscribers) =>
                    prevSubscribers.filter(
                        (subscriber) =>
                            subscriber !== event.stream.streamManager
                    )
                );
            });

            session.on('exception', (exception) => {
                console.error(exception);
            });

            // ICE 연결 상태 변경 이벤트 핸들러 추가
            session.on('iceConnectionStateChange', (event) => {
                console.log(`ICE connection state change: ${event}`);
            });

            console.log('Requesting session ID and token from server');
            const sessionId = await createSession();
            console.log('Received session ID:', sessionId);
            const token = await createToken(sessionId);
            console.log('Received token:', token);

            sessionRef.current = session;
            await session.connect(token, { clientData: 'Participant' });

            const publisher = OV.initPublisher(undefined, {
                audioSource: undefined,
                videoSource: undefined,
                publishAudio: true,
                publishVideo: true,
                resolution: '640x480',
                frameRate: 30,
                insertMode: 'APPEND',
                mirror: false,
            });

            session.publish(publisher);
            setMainStreamManager(publisher);
            setPublisher(publisher);
            setSession(session);
        } catch (error) {
            console.error('Error initializing OpenVidu:', error);
        }
    };

    useEffect(() => {
        if (token) {
            initOpenVidu();
        }

        return () => {
            if (sessionRef.current) {
                sessionRef.current.disconnect();
                sessionRef.current = null;
                setSession(null);
                setMainStreamManager(null);
                setPublisher(null);
                setSubscribers([]);
            }
        };
    }, [token]);

    useEffect(() => {
        // mainStreamManager 가 변경될 때마다 videoRef 요소에 스트림 추가
        if (mainStreamManager && videoRef.current) {
            mainStreamManager.addVideoElement(videoRef.current);
        }
    }, [mainStreamManager]);

    useEffect(() => {
        subscribers.forEach((subscriber, index) => {
            const videoElement = document.getElementById(`subscriber-video-${index}`);
            if (videoElement) {
                subscriber.addVideoElement(videoElement);
            }
        });
    }, [subscribers]);

    // publisher.publishVideo를 호출하여 비디오 제어.
    const toggleVideo = () => {
        if (publisher) {
            if (isVideoActive) {
                publisher.publishVideo(false);
            } else {
                publisher.publishVideo(true);
            }
            setIsVideoActive(!isVideoActive);
        }
    };

    // publisher.publishAudio를 호출하여 오디오 제어.
    const toggleAudio = () => {
        if (publisher) {
            if (isAudioActive) {
                publisher.publishAudio(false);
            } else {
                publisher.publishAudio(true);
            }
            setIsAudioActive(!isAudioActive);
        }
    };

    // 비디오 미러링 토글 함수
    const toggleMirror = () => {
        setIsMirrored(!isMirrored);
    };

    // 설정 창 표시/숨기기 토글 함수
    const toggleSettings = () => {
        setShowSettings(!showSettings);
    };

    // 선택된 비디오 장치 변경 함수
    const handleVideoDeviceChange = (event) => {
        setSelectedVideoDevice(event.target.value);
    };

    // 선택된 오디오 장치 변경 함수
    const handleAudioDeviceChange = (event) => {
        setSelectedAudioDevice(event.target.value);
    };

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate('/');
    };

    return (
        <div className="video-chat-page">
            <div className="header">
                <h1>멍톡</h1>
                <button onClick={handleLogout}>Logout</button>
            </div>
            <div className="content">
            <div className="video-container">
    {mainStreamManager && (
        <div
            className={`stream-container ${isMirrored ? 'mirrored' : ''}`}
        >
            <video autoPlay={true} ref={videoRef} />
            <div className="stream-label">
                {userInfo?.username || '나'}
            </div>
            <img
                src={settingsIcon}
                alt="설정"
                className="settings-icon"
                onClick={toggleSettings}
            />
            {showSettings && (
                <div className="settings-menu">
                    <button onClick={toggleVideo}>
                        {isVideoActive ? '비디오 끄기' : '비디오 켜기'}
                    </button>
                    <button onClick={toggleAudio}>
                        {isAudioActive ? '오디오 끄기' : '오디오 켜기'}
                    </button>
                    <button onClick={toggleMirror}>
                        {isMirrored ? '반전 해제' : '반전 적용'}
                    </button>

                    <div>
                        <label>카메라 선택:</label>
                        <select onChange={handleVideoDeviceChange} value={selectedVideoDevice}>
                            {devices.videoDevices &&
                                devices.videoDevices.map((device) => (
                                    <option key={device.deviceId} value={device.deviceId}>
                                        {device.label}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <div>
                        <label>마이크 선택:</label>
                        <select onChange={handleAudioDeviceChange} value={selectedAudioDevice}>
                            {devices.audioDevices &&
                                devices.audioDevices.map((device) => (
                                    <option key={device.deviceId} value={device.deviceId}>
                                        {device.label}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>
            )}
            <div className={`audio-status ${isAudioActive ? 'active' : 'inactive'}`}>
                {isAudioActive ? '오디오 켜짐' : '오디오 꺼짐'}
            </div>
        </div>
    )}
    {subscribers.map((subscriber, index) => (
        <div key={index} className="stream-container">
            <video id={`subscriber-video-${index}`} autoPlay={true} />
            <div className="stream-label">상대방 {index + 1}</div>
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
