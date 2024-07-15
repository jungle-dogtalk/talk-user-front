import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../../utils/apiCall';
import { API_LIST } from '../../utils/apiList';
import { io } from 'socket.io-client';

const ShibaModel = () => {
    const { scene } = useGLTF('/src/assets/shiba/scene.gltf');
    scene.rotation.x = -Math.PI / 50; // x축 회전

    return <primitive object={scene} scale={5} />;
};

const AIChatPage = () => {
    const webcamRef = useRef(null);
    const recognitionRef = useRef(null);
    const [remainingTime, setRemainingTime] = useState(300); // 300초 = 5분
    const [aiResponse, setAiResponse] = useState('');
    const userInfo = useSelector((state) => state.user.userInfo); // redux에서 유저 정보 가져오기
    const navigate = useNavigate();
    const socketRef = useRef(null);
    const timeoutRef = useRef(null);
    const speechSynthesisRef = useRef(window.speechSynthesis);

    if (!userInfo) {
        return <div>Loading...</div>;
    }

    useEffect(() => {
        const setupWebcam = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                });
                if (webcamRef.current) {
                    webcamRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error('Error accessing webcam:', error);
            }
        };

        setupWebcam();
        startSpeechRecognition();

        socketRef.current = io(import.meta.env.VITE_API_URL);

        socketRef.current.on('AI_RESPONSE', (message) => {
            // setAiResponse((prevResponse) => prevResponse + message);
            setAiResponse(message);
            speak(message);
        });

        socketRef.current.on('AI_RESPONSE_END', () => {
            console.log('AI response stream ended');
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                setAiResponse('');
            }, 3000);
        });

        socketRef.current.on('AI_RESPONSE_ERROR', (error) => {
            console.error('AI response error:', error);
        });

        return () => {
            socketRef.current.disconnect();
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setRemainingTime((prevTime) => {
                if (prevTime <= 1) {
                    return 300; // 0초가 되면 다시 5분(300초)으로 리셋
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const startSpeechRecognition = () => {
        if (!('webkitSpeechRecognition' in window)) {
            console.error('speech recognition을 지원하지 않는 브라우저');
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onstart = () => {
            console.log('Speech recognition started');
        };

        recognition.onresult = async (event) => {
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    const transcript = event.results[i][0].transcript;
                    console.log('Transcribed text:', transcript);
                    await aiConversation(userInfo.username, transcript);
                }
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
    };

    const aiConversation = async (username, transcript) => {
        try {
            if (transcript) {
                socketRef.current.emit('AI_RECEIVE_TRANSCRIPT', {
                    username,
                    transcript,
                });
            }
        } catch (error) {
            console.error('Error handling user input:', error);
        }
    };

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            const speech = new SpeechSynthesisUtterance(text);
            speech.lang = 'ko-KR'; // 한국어 설정
            speechSynthesisRef.current.speak(speech);
        } else {
            console.error('TTS를 지원하지 않는 브라우저입니다.');
        }
    };

    const EndConversation = async () => {
        try {
            await apiCall(API_LIST.END_USER_CONVERSATION, {
                username: userInfo.username,
            });
            // TODO: 나중에 대화 피드백 페이지로 수정하기
            navigate('/main');
        } catch (error) {
            console.error('Error ending conversation:', error);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#f7f3e9]">
            <header className="w-full bg-[#a16e47] p-4 flex items-center justify-between">
                <h1 className="text-white text-4xl">멍톡</h1>
                <button
                    onClick={EndConversation}
                    className="text-white text-lg bg-red-600 px-4 py-2 rounded-md"
                >
                    중단하기
                </button>
            </header>
            <div className="flex flex-1 flex-col overflow-hidden relative">
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-md p-2 shadow-lg z-10">
                    <h2 className="text-lg font-bold text-center">
                        남은 시간: {Math.floor(remainingTime / 60)}분{' '}
                        {remainingTime % 60}초
                    </h2>
                </div>
                <div className="flex flex-1">
                    <div className="w-1/2 relative border-2 border-gray-300 aspect-video">
                        <video
                            ref={webcamRef}
                            autoPlay
                            className="w-full h-full object-cover transform scale-x-[-1]"
                        />
                    </div>
                    <div className="w-1/2 relative border-2 border-gray-300 aspect-video">
                        <Canvas>
                            <Suspense fallback={null}>
                                <ambientLight intensity={0.5} />
                                <pointLight position={[10, 10, 10]} />
                                <ShibaModel />
                            </Suspense>
                        </Canvas>
                        {aiResponse && (
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-md shadow-lg">
                                {aiResponse}
                            </div>
                        )}
                    </div>
                </div>
                <div
                    className="flex-grow bg-white p-4 rounded-md text-center overflow-y-auto"
                    style={{ height: '200px' }}
                >
                    <button
                        onClick={() => console.log('주제 추천 요청')}
                        className="bg-gray-300 text-brown-700 text-2xl font-bold px-4 py-2 rounded-md inline-block mb-4"
                    >
                        주제 추천 Btn
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIChatPage;
