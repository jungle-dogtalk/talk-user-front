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
import SettingsMenu from './SettingMenu';

const VideoChatPage = () => {
    const [session, setSession] = useState(undefined);
    const [subscribers, setSubscribers] = useState([]);
    const [publisher, setPublisher] = useState(undefined);
    const [showSettings, setShowSettings] = useState(false); // 설정 창 상태 관리

    const location = useLocation();

    const leaveSession = useCallback(() => {
        if (session) session.disconnect();

        setSession(undefined);
        setSubscribers([]);
        setPublisher(undefined);
    }, [session]);

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

    const toggleVideo = () => {
        if (publisher) {
            if (isAudioActive) {
                publisher.publishAudio(false);
            } else {
                publisher.publishAudio(true);
            }
            setIsAudioActive(!isAudioActive);
        }
    };
    const [isAudioActive, setIsAudioActive] = useState(true);

    const toggleAudio = () => {
        setIsAudioActive(!isAudioActive);
        // 오디오 on/off 로직 구현
    };

    const toggleMirror = () => {
        setIsMirrored(!isMirrored);
        // 화면 반전 로직 구현
    };

    const handleVideoDeviceChange = (event) => {
        setSelectedVideoDevice(event.target.value);
        // 비디오 디바이스 변경 로직 구현
    };

    const handleAudioDeviceChange = (event) => {
        setSelectedAudioDevice(event.target.value);
        // 오디오 디바이스 변경 로직 구현
    };

    return (
        <div className="video-chat-page">
            <div className="header">
                <h1>멍톡</h1>
                <button onClick={leaveSession}>중단하기</button>
            </div>
            <div className="content">
                <div className="video-container">
                    <div className={`stream-container mirrored`}>
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
                            <SettingsMenu
                                isVideoActive={isVideoActive}
                                isAudioActive={isAudioActive}
                                isMirrored={isMirrored}
                                toggleVideo={toggleVideo}
                                toggleAudio={toggleAudio}
                                toggleMirror={toggleMirror}
                                devices={devices}
                                selectedVideoDevice={selectedVideoDevice}
                                selectedAudioDevice={selectedAudioDevice}
                                handleVideoDeviceChange={
                                    handleVideoDeviceChange
                                }
                                handleAudioDeviceChange={
                                    handleAudioDeviceChange
                                }
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
