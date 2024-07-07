import React, { useState, useEffect } from 'react';

const SettingMenu = ({ onMirroredChange, publisher }) => {
    const [devices, setDevices] = useState([]); // 미디어 장치 목록 상태 관리
    const [selectedVideoDevice, setSelectedVideoDevice] = useState(''); // 선택된 비디오 장치
    const [selectedAudioDevice, setSelectedAudioDevice] = useState(''); // 선택된 오디오 장치

    const [isMirrored, setIsMirrored] = useState(false); // 좌우 반전 상태 관리
    const [isVideoActive, setIsVideoActive] = useState(true);
    const [isAudioActive, setIsAudioActive] = useState(true);

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

    // 비디오 좌우반전 토글
    const toggleMirror = () => {
        setIsMirrored(!isMirrored);
        onMirroredChange(isMirrored);
    };

    // 비디오 ON/OFF 토글
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

    // 오디오 ON/OFF 토글
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

    // 선택된 비디오 장치 변경 함수
    const handleVideoDeviceChange = (event) => {
        setSelectedVideoDevice(event.target.value);
    };

    // 선택된 오디오 장치 변경 함수
    const handleAudioDeviceChange = (event) => {
        setSelectedAudioDevice(event.target.value);
    };

    useEffect(() => {
        // 컴포넌트가 마운트될 때 getDevices 함수를 호출하여 장치 목록을 가져옴
        getDevices();
    }, []);

    return (
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
                <select
                    onChange={handleVideoDeviceChange}
                    value={selectedVideoDevice}
                >
                    {devices.videoDevices &&
                        devices.videoDevices.map((device) => (
                            <option
                                key={device.deviceId}
                                value={device.deviceId}
                            >
                                {device.label}
                            </option>
                        ))}
                </select>
            </div>
            <div>
                <label>마이크 선택:</label>
                <select
                    onChange={handleAudioDeviceChange}
                    value={selectedAudioDevice}
                >
                    {devices.audioDevices &&
                        devices.audioDevices.map((device) => (
                            <option
                                key={device.deviceId}
                                value={device.deviceId}
                            >
                                {device.label}
                            </option>
                        ))}
                </select>
            </div>
        </div>
    );
};

export default SettingMenu;
