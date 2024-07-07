import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import './VideoChatPage.css';
import { OpenVidu } from 'openvidu-browser';
import axios from 'axios';
import OpenViduVideo from './OpenViduVideo';
import dogImage from '../../assets/dog.jpg'; // 강아지 이미지
import dogHouseImage from '../../assets/doghouse.jpg'; // 강아지 집 이미지
import settingsIcon from '../../assets/settings-icon.jpg'; // 설정 아이콘
import { getToken } from '../../services/openviduService';

const VideoChatPage = () => {
    const [session, setSession] = useState(undefined);
    const [subscribers, setSubscribers] = useState([]);
    const [publisher, setPublisher] = useState(undefined);

    const [devices, setDevices] = useState([]); // 미디어 장치 목록 상태 관리
    const [showSettings, setShowSettings] = useState(false); // 설정 창 상태 관리
    const [selectedVideoDevice, setSelectedVideoDevice] = useState(''); // 선택된 비디오 장치
    const [selectedAudioDevice, setSelectedAudioDevice] = useState(''); // 선택된 오디오 장치
    const [isMirrored, setIsMirrored] = useState(false); // 좌우 반전 상태 관리
    const [isVideoActive, setIsVideoActive] = useState(true);
    const [isAudioActive, setIsAudioActive] = useState(true);

    const location = useLocation();

    const leaveSession = useCallback(() => {
        if (session) session.disconnect();

        setSession(undefined);
        setSubscribers([]);
        setPublisher(undefined);
    }, [session]);

    const getDevices = async () => {
        try {
            // 모든 미디어 장치 정보 가져옴
            const deviceInfos = await navigator.mediaDevices.enumerateDevices();

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

    // 미디어 장치 목록 가져오기
    useEffect(() => {
        // 컴포넌트가 마운트될 때 getDevices 함수를 호출하여 장치 목록을 가져옴
        getDevices();
    }, []);

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
    }, [location]);

    const joinSession = useCallback((sid) => {
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

        getToken(sid).then((token) => {
            session
                .connect(token)
                .then(() => {
                    let publisher = OV.initPublisher(undefined);
                    setPublisher(publisher);
                    session.publish(publisher);
                })
                .catch((error) => {
                    console.log(
                        'There was an error connecting to the session:',
                        error.code,
                        error.message
                    );
                });
        });
    }, []);

    // 설정 창 표시/숨기기 토글 함수
    const toggleSettings = () => {
        setShowSettings(!showSettings);
    };

    // 선택된 비디오 장치 변경 함수
    const handleVideoDeviceChange = (event) => {
        setSelectedVideoDevice(event.target.value);
    };

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
                            <div className="settings-menu">
                                <button onClick={toggleVideo}>
                                    {isVideoActive
                                        ? '비디오 끄기'
                                        : '비디오 켜기'}
                                </button>
                                <button onClick={toggleAudio}>
                                    {isAudioActive
                                        ? '오디오 끄기'
                                        : '오디오 켜기'}
                                </button>
                                <button onClick={toggleMirror}>
                                    {isMirrored ? '반전 해제' : '반전 적용'}
                                </button>

                                <div>
                                    <label>카메라 선택:</label>
                                    <select
                                        onChange={handleVideoDeviceChange}
                                        value={selectedVideoDevice}
                                    >
                                        {devices.videoDevices &&
                                            devices.videoDevices.map(
                                                (device) => (
                                                    <option
                                                        key={device.deviceId}
                                                        value={device.deviceId}
                                                    >
                                                        {device.label}
                                                    </option>
                                                )
                                            )}
                                    </select>
                                </div>
                            </div>
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
