import React, { useEffect, useRef, useState } from 'react';
import { OpenVidu } from 'openvidu-browser';
import { createSession, createToken } from '../../services/openviduService';
import './VideoChatPage.css';
import dogImage from '../../../assets/dog.jpg'; // 강아지 이미지
import dogHouseImage from '../../../assets/doghouse.jpg'; // 강아지 집 이미지
import settingsIcon from '../../../assets/settings-icon.jpg'; // 설정 아이콘

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

  // 요소 참조
  const sessionRef = useRef(); // 세션 참조 관리
  const videoRef = useRef(null); // 비디오 요소 참조

  // OpenVidu 세션 초기화 + createSession + createToken을 호출하여 세션 + 토큰 생성. 
  useEffect(() => {
    const initOpenVidu = async () => {
      // try - catch 문으로 OpenVidu 초기화 과정에서 발생하는 오류 처리. 
      try {
        const OV = new OpenVidu(); // OpenVidu 인스턴스를 생성
        const session = OV.initSession(); // 세션을 초기화

        // 새로운 스트림이 생성될 때 호출되는 이벤트 핸들러 - 새로운 구독자 추가
        session.on('streamCreated', (event) => {
          const subscriber = session.subscribe(event.stream, undefined);
          setSubscribers((prevSubscribers) => [...prevSubscribers, subscriber]);
        });

        // 스트림이 파괴될 때 호출되는 이벤트 핸들러 - 구독자들 목록에서 제거
        session.on('streamDestroyed', (event) => {
          setSubscribers((prevSubscribers) =>
            prevSubscribers.filter(
              (subscriber) => subscriber !== event.stream.streamManager
            )
          );
        });

        // 예외가 발생시 호출
        session.on('exception', (exception) => {
          console.error(exception);
        });

        // 세션 ID를 생성
        const sessionId = await createSession();
        // 세션에 연결할 토큰 생성
        const token = await createToken(sessionId);

        sessionRef.current = session;
        // 세션에 연결
        await session.connect(token, { clientData: 'Participant' });

        // 퍼블리셔를 초기화하고 퍼블리셔 설정 작용
        const publisher = OV.initPublisher(undefined, {
          audioSource: undefined, // 기본 마이크
          videoSource: undefined, // 기본 웹캠
          publishAudio: true, // 오디오를 퍼블리시
          publishVideo: true,
          resolution: '640x480', // 해상도 설정
          frameRate: 30, // 프레임 속도 설정
          insertMode: 'APPEND',
          mirror: false, // 비디오 미러링 설정
        });

        session.publish(publisher); // 퍼블리셔를 세션에 퍼블리시
        setMainStreamManager(publisher); // 메인 스트림 관리자 설정
        setPublisher(publisher);
        setSession(session);
      } catch (error) {
        console.error('Error initializing OpenVidu:', error);
      }
    };

    initOpenVidu(); // OpenVidu 초기화 함수 호출

    return () => {
      if (sessionRef.current) {
        sessionRef.current.disconnect(); // 컴포넌트 언마운트 시 세션 연결 해제
      }
    };
  }, []);

  useEffect(() => {
    // mainStreamManager 가 변경될 때마다 videoRef 요소에 스트림 추가
    if (mainStreamManager && videoRef.current) {
      mainStreamManager.addVideoElement(videoRef.current);
    }
  }, [mainStreamManager]);

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

  return (
    <div className="video-chat-page">
      <div className="header">
        <h1>멍톡</h1>
      </div>
      <div className="content">
        <div className="video-container">
          {mainStreamManager && (
            <div className={`stream-container ${isMirrored ? 'mirrored' : ''}`}>
              <video autoPlay={true} ref={videoRef} />
              <div className="stream-label">나</div>
              <img src={settingsIcon} alt="설정" className="settings-icon" onClick={toggleSettings} />
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
                </div>
              )}
              <div className={`audio-status ${isAudioActive ? 'active' : 'inactive'}`}>
                {isAudioActive ? '오디오 켜짐' : '오디오 꺼짐'}
              </div>
            </div>
          )}
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="stream-container">
              {subscribers[index] ? (
                <>
                  <video autoPlay={true} ref={(video) => subscribers[index].addVideoElement(video)} />
                  <div className="stream-label">상대방 {index + 1}</div>
                </>
              ) : (
                <div className="stream-label">상대방 {index + 1}</div>
              )}
            </div>
          ))}
        </div>
        <div className="chat-container">
          <div className="chat-box">
            {/* 채팅 메시지들 */}
          </div>
          <input type="text" placeholder="메시지를 입력하세요..." className="chat-input" />
        </div>
      </div>
      <div className="bottom-section">
        <div className="dog-container">
          {Array.from({ length: 4 }).map((_, index) => (
            <img key={index} src={dogImage} alt={`Dog ${index + 1}`} className="dog-image" />
          ))}
        </div>
        <div className="mission">
          <h2>미션!</h2>
          <p>통화를 시작하기 위해서 '멍'을 외쳐주세요! 음성이 인식되어야 본격적인 통화가 시작됩니다. 멍멍!</p>
        </div>
        <div className="dog-house-container">
          {Array.from({ length: 4 }).map((_, index) => (
            <img key={index} src={dogHouseImage} alt={`Dog House ${index + 1}`} className="dog-house-image" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoChatPage;
