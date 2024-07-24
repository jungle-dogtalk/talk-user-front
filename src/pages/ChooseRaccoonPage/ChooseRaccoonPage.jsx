import React, { useEffect, useRef, useState } from 'react';
import logo from '../../assets/barking-talk.png';
import { Canvas, useFrame, useGraph } from '@react-three/fiber';
import { Color, Euler, Matrix4 } from 'three';
import { useGLTF } from '@react-three/drei';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { useNavigate } from 'react-router-dom';
import ChooseRaccoonHand from './ChooseRaccoonHand.jsx';
import './ChooseRaccoonPage.css';

let faceLandmarker;
let lastVideoTime = -1;
let rotation;
let blendshapes = [];

const ChooseRaccoonPage = () => {
    const webcamRef = useRef(null);
    const videoContainerRef = useRef(null);
    const navigate = useNavigate();
    const [videoReady, setVideoReady] = useState(false);
    const [isMicReady, setIsMicReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [videoLoaded, setVideoLoaded] = useState(false);

    useEffect(() => {
        const setupVideoAndFaceLandmarker = async () => {
            setIsLoading(true);
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720 },
                });

                if (webcamRef.current) {
                    webcamRef.current.srcObject = stream;
                }

                const vision = await FilesetResolver.forVisionTasks(
                    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
                );
                faceLandmarker = await FaceLandmarker.createFromOptions(
                    vision,
                    {
                        baseOptions: {
                            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                            delegate: 'GPU',
                        },
                        outputFaceBlendshapes: true,
                        outputFacialTransformationMatrixes: true,
                        runningMode: 'VIDEO',
                    }
                );

                webcamRef.current.addEventListener('loadedmetadata', predict);

                setIsLoading(false);
            } catch (error) {
                console.error(
                    'Error setting up video or face landmarker:',
                    error
                );
                setIsLoading(false);
            }
        };

        setupVideoAndFaceLandmarker();

        return () => {
            if (webcamRef.current && webcamRef.current.srcObject) {
                webcamRef.current.srcObject
                    .getTracks()
                    .forEach((track) => track.stop());
            }
        };
    }, []);

    const predict = () => {
        let startTimeMs = performance.now();
        if (lastVideoTime !== webcamRef.current.currentTime) {
            lastVideoTime = webcamRef.current.currentTime;
            const result = faceLandmarker.detectForVideo(
                webcamRef.current,
                startTimeMs
            );
            if (
                result.facialTransformationMatrixes &&
                result.facialTransformationMatrixes.length > 0 &&
                result.faceBlendshapes &&
                result.faceBlendshapes.length > 0
            ) {
                const matrix = new Matrix4().fromArray(
                    result.facialTransformationMatrixes[0].data
                );
                rotation = new Euler().setFromRotationMatrix(matrix);
                blendshapes = result.faceBlendshapes[0].categories;
            }
        }
        requestAnimationFrame(predict);
    };

    const handleCanPlay = () => {
        setVideoReady(true);
        setIsLoading(false);
        if (videoContainerRef.current) {
            videoContainerRef.current.style.visibility = 'visible';
        }

        // 비디오 로드 완료 후 약간의 지연을 주고 페이드 인 효과 적용
        setTimeout(() => setVideoLoaded(true), 100);
    };

    const handleSelect = () => {
        navigate('/questions');
    };

    useEffect(() => {
        const setupMicrophone = async () => {
            try {
                const audioContext = new (window.AudioContext ||
                    window.webkitAudioContext)();
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;

                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                });
                const source = audioContext.createMediaStreamSource(stream);
                source.connect(analyser);

                const dataArray = new Uint8Array(analyser.frequencyBinCount);

                const updateMeter = () => {
                    analyser.getByteFrequencyData(dataArray);
                    const average =
                        dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                    const height = (average / 255) * 100;

                    document.querySelectorAll('.bar').forEach((bar, index) => {
                        bar.style.backgroundColor =
                            index < Math.floor(height / 10)
                                ? 'orange'
                                : 'lightgray';
                    });

                    requestAnimationFrame(updateMeter);
                };

                updateMeter();
                setIsMicReady(true);
            } catch (err) {
                console.error('Error accessing the microphone:', err);
            }
        };

        setupMicrophone();
    }, []);

    return (
        <div className="flex flex-col h-screen bg-gradient-to-b from-[#FFF8E1] to-[#FFE0B2]">
            <header className="w-full bg-gradient-to-r from-[#a16e47] to-[#8a5d3b] p-1 flex items-center justify-between shadow-xl">
                <img
                    src={logo}
                    alt="멍톡 로고"
                    className="w-20 h-20 sm:w-24 sm:h-24"
                />
            </header>
            <div className="flex flex-1 flex-col lg:flex-row items-start justify-center gap-10 p-8 overflow-auto">
                <div className="w-full lg:w-1/2 flex flex-col items-center justify-start h-full">
                    <h2
                        className="text-6xl sm:text-7xl font-bold mb-8 text-[#8B4513] tracking-wide"
                        style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.1)' }}
                    >
                        실시간 영상
                    </h2>
                    <div
                        ref={videoContainerRef}
                        className="relative w-full h-0 pb-[56.25%] rounded-3xl overflow-hidden shadow-2xl mb-6"
                    >
                        {isLoading && (
                            <div className="pulse-container">로딩 중...</div>
                        )}
                        <video
                            ref={webcamRef}
                            autoPlay
                            playsInline
                            onCanPlay={handleCanPlay}
                            className={`absolute top-0 left-0 w-full h-full object-cover video-fade-in ${
                                videoLoaded ? 'loaded' : ''
                            }`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    </div>
                    <div className="flex flex-col items-center justify-center w-full">
                        <h2
                            className="text-4xl sm:text-6xl font-bold mb-6 text-[#8B4513] tracking-wide"
                            style={{
                                textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                            }}
                        >
                            마이크 입력 테스트
                        </h2>
                        <div className="flex space-x-4">
                            {[...Array(10)].map((_, index) => (
                                <div
                                    key={index}
                                    className="bar w-8 h-32 bg-lightgray rounded-t-lg"
                                    style={{
                                        height: '70px',
                                        backgroundColor: 'lightgray',
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="w-full lg:w-1/2 flex flex-col items-center justify-start h-full">
                    <h2
                        className="text-4xl sm:text-7xl font-bold mb-8 text-[#8B4513] tracking-wide"
                        style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.1)' }}
                    >
                        선택된 마스크
                    </h2>
                    <div className="relative w-full h-0 pb-[56.25%] bg-white rounded-3xl shadow-2xl overflow-hidden mb-6">
                        <ChooseRaccoonHand />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent rounded-3xl"></div>
                    </div>
                    <div className="flex justify-center space-x-8 mt-8">
                        <button
                            className="bg-gradient-to-r from-[#f7f3e9] to-[#e4d7c7] text-[#8B4513] py-5 px-16 rounded-full border-3 border-[#a16e47] shadow-xl hover:shadow-2xl transition duration-300 ease-in-out transform hover:scale-105 text-xl sm:text-5xl font-bold"
                            onClick={() => window.history.back()}
                        >
                            뒤로가기
                        </button>
                        <button
                            className="bg-gradient-to-r from-[#a16e47] to-[#8a5d3b] text-white py-5 px-16 rounded-full border-3 border-[#a16e47] shadow-xl hover:shadow-2xl transition duration-300 ease-in-out transform hover:scale-105 text-xl sm:text-5xl font-bold"
                            onClick={handleSelect}
                        >
                            선택
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChooseRaccoonPage;
