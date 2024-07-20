import React, { useEffect, useRef, useState } from 'react';
import logo from '../../assets/barking-talk.png'; // 로고 이미지 경로
import { Canvas, useFrame, useGraph } from '@react-three/fiber';
import { Color, Euler, Matrix4 } from 'three';
import { useGLTF } from '@react-three/drei';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { useNavigate } from 'react-router-dom';
import ChooseRaccoonHand from './ChooseRaccoonHand.jsx';

let video;
let faceLandmarker;
let lastVideoTime = -1;
let headMesh;
let rotation;
let blendshapes = [];

const ChooseRaccoonPage = () => {
    const webcamRef = useRef(null);
    const navigate = useNavigate(); // useNavigate 훅 사용

    useEffect(() => {
        // 웹캠 스트림 설정
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                webcamRef.current.srcObject = stream;
            })
            .catch((error) => {
                console.error('Error accessing webcam:', error);
            });

        const setup = async () => {
            const vision = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
            );
            faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                    delegate: 'GPU',
                },
                outputFaceBlendshapes: true,
                outputFacialTransformationMatrixes: true,
                runningMode: 'VIDEO',
            });
            video = document.getElementById('video');
            navigator.mediaDevices
                .getUserMedia({
                    video: { width: 1280, height: 720 },
                })
                .then((stream) => {
                    video.srcObject = stream;
                    video.addEventListener('loadedmetadata', predict);
                });
        };

        const predict = () => {
            let startTimeMs = performance.now();
            if (lastVideoTime !== video.currentTime) {
                lastVideoTime = video.currentTime;
                const result = faceLandmarker.detectForVideo(
                    video,
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

        setup();
    }, []);

    // TODO: 너구리 선택 후 처리 로직
    const handleSelect = () => {
        navigate('/questions');
    };

    //마이크 체크
    navigator.mediaDevices.enumerateDevices().then((devices) => {
        const audioDevices = devices.filter(
            (device) => device.kind === 'audioinput'
        );
        console.log(audioDevices);
    });

    useEffect(() => {
        const audioContext = new (window.AudioContext ||
            window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((stream) => {
                const source = audioContext.createMediaStreamSource(stream);
                source.connect(analyser);

                const dataArray = new Uint8Array(analyser.frequencyBinCount);

                const updateMeter = () => {
                    analyser.getByteFrequencyData(dataArray);
                    const average =
                        dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                    const height = (average / 255) * 100;

                    document.querySelectorAll('.bar').forEach((bar, index) => {
                        if (index < Math.floor(height / 10)) {
                            bar.style.height = '70px';
                            bar.style.backgroundColor = 'orange';
                        } else {
                            bar.style.height = '70px';
                            bar.style.backgroundColor = 'lightgray';
                        }
                    });

                    requestAnimationFrame(updateMeter);
                };

                updateMeter();
            })
            .catch((err) => {
                console.error('Error accessing the microphone', err);
            });
    }, []);

    return (
        <div className="flex flex-col h-screen bg-gradient-to-b from-[#FFF8E1] to-[#FFE0B2]">
            <header className="w-full bg-gradient-to-r from-[#a16e47] to-[#8a5d3b] p-2 flex items-center justify-between shadow-lg">
                <img
                    src={logo}
                    alt="멍톡 로고"
                    className="w-12 h-12 sm:w-16 sm:h-16"
                />
            </header>
            <div className="flex flex-1 flex-col lg:flex-row items-center justify-center gap-2 p-2">
                {/* 왼쪽 섹션 */}
                <div className="w-full lg:w-1/2 flex flex-col items-center justify-center h-full section">
                    {/* CAM 섹션 */}
                    <div className="flex flex-col items-center mt-4 section">
                        <h2
                            className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-4 text-[#8B4513]"
                            style={{
                                fontSize: '40px',
                                textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                            }}
                        >
                            CAM
                        </h2>
                        <div className="relative w-[480px] h-[390px] rounded-2xl overflow-hidden shadow-2xl">
                            <video
                                ref={webcamRef}
                                autoPlay
                                id="video"
                                className="w-full h-full object-cover"
                                width="480"
                                height="390"
                            ></video>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                            <div className="absolute bottom-4 left-4 text-white text-lg font-semibold">
                                실시간 영상
                            </div>
                        </div>
                    </div>
                    {/* 마이크 입력 테스트 섹션 */}
                    <div className="flex flex-col items-center justify-center my-2 section">
                        <h2
                            className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-4 text-[#8B4513]"
                            style={{
                                fontSize: '40px',
                                textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                            }}
                        >
                            마이크 입력 테스트
                        </h2>
                        <div className="flex space-x-2">
                            {[...Array(10)].map((_, index) => (
                                <div
                                    key={index}
                                    className="bar w-4 h-16 bg-lightgray"
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>
                {/* 오른쪽 섹션 */}
                <div className="w-full lg:w-1/2 flex flex-col items-center justify-center h-full section">
                    {/* 내 마스크 섹션 */}
                    <div className="flex flex-col items-center mt-4 section">
                        <h2
                            className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-4 text-[#8B4513]"
                            style={{
                                fontSize: '40px',
                                textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                            }}
                        >
                            내 마스크
                        </h2>
                        <div className="relative w-full max-w-[520px] h-auto max-h-[390px] bg-white rounded-2xl shadow-2xl overflow-hidden">
                            <ChooseRaccoonHand />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent rounded-2xl"></div>
                            <div className="absolute bottom-4 left-4 text-white text-lg font-semibold">
                                선택된 마스크
                            </div>
                        </div>
                    </div>
                    {/* 버튼 섹션 */}
                    <div className="flex justify-center space-x-4 py-4 mt-4 buttons">
                        <button
                            className="bg-gradient-to-r from-[#f7f3e9] to-[#e4d7c7] text-[#8B4513] py-2 px-6 sm:py-3 sm:px-8 rounded-full border-2 border-[#a16e47] shadow-lg hover:shadow-xl transition duration-300 ease-in-out transform hover:scale-105 text-xl sm:text-2xl font-bold"
                            onClick={() => window.history.back()}
                            style={{ fontSize: '24px' }}
                        >
                            뒤로가기
                        </button>
                        <button
                            className="bg-gradient-to-r from-[#a16e47] to-[#8a5d3b] text-white py-2 px-6 sm:py-3 sm:px-8 rounded-full border-2 border-[#a16e47] shadow-lg hover:shadow-xl transition duration-300 ease-in-out transform hover:scale-105 text-xl sm:text-2xl font-bold"
                            onClick={handleSelect}
                            style={{ fontSize: '24px' }}
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
