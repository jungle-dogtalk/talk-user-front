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
    const [url, setUrl] = useState(
        'https://models.readyplayer.me/6682c315649e11cdd6dd8a8a.glb'
    );
    const navigate = useNavigate(); // useNavigate 훅 사용

    const handleOnChange = (event) => {
        setUrl(event.target.value);
    };

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
                    video.addEventListener('loadeddata', predict);
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

    // TODO: 너구리 불러오기
    const handleRetry = () => {
        // 아바타 변경 로직 (임의의 아바타 이미지 설정)

        const urls = [
            'https://models.readyplayer.me/668293698a5ecca99f9b06c1.glb',
            'https://models.readyplayer.me/6682c315649e11cdd6dd8a8a.glb',
            'https://models.readyplayer.me/66857649a6014cc4b10e8f73.glb',
            'https://models.readyplayer.me/668d1456878f8e58dc12d758.glb',
            'https://models.readyplayer.me/668d14b51847c40762af418e.glb',
            'https://models.readyplayer.me/668d14d83369b0756b9c487c.glb',
            'https://models.readyplayer.me/668d14e93369b0756b9c48b0.glb',
            'https://models.readyplayer.me/668d14f634432ca7edca24af.glb',
            'https://models.readyplayer.me/668d150a7a0772243cddc4af.glb',
            'https://models.readyplayer.me/668d152063703fb7530e8a0d.glb',
        ];
        const randomUrl = urls[Math.floor(Math.random() * urls.length)];
        setUrl(randomUrl);
    };

    // TODO: 너구리 선택 후 처리 로직
    const handleSelect = () => {
        // 아바타 선택 후 처리 로직
        console.log('Selected avatar url:', url); // TODO: Redux로 처리 요망 or 쿼리스트링 사용 / 대기화면으로 먼저 가야 함
        // navigate('/questions');
        navigate('/videochat?sessionId=sessionA');
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-b from-[#FFF8E1] to-[#FFE0B2]">
            <header className="w-full bg-gradient-to-r from-[#a16e47] to-[#8a5d3b] p-2 flex items-center justify-between shadow-lg">
                <img
                    src={logo}
                    alt="멍톡 로고"
                    className="w-12 h-12 sm:w-16 sm:h-16"
                />
            </header>
            <div className="flex flex-1 flex-col lg:flex-row items-center justify-center gap-6 sm:gap-10 p-6 sm:p-10">
                <div className="w-full lg:w-1/2 flex flex-col items-center justify-center mb-6 lg:mb-0">
                    <h2
                        className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-[#8B4513]"
                        style={{
                            fontSize: '40px',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                        }}
                    >
                        내 모습
                    </h2>
                    <div className="relative w-full max-w-[520px] h-auto max-h-[390px] rounded-2xl overflow-hidden shadow-2xl">
                        <video
                            ref={webcamRef}
                            autoPlay
                            id="video"
                            className="w-full h-full object-cover"
                        ></video>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                        <div className="absolute bottom-4 left-4 text-white text-lg font-semibold">
                            실시간 영상
                        </div>
                    </div>
                </div>
                <div className="w-full lg:w-1/2 flex flex-col items-center justify-center">
                    <h2
                        className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-[#8B4513]"
                        style={{
                            fontSize: '40px',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                        }}
                    >
                        내 마스크
                    </h2>
                    <div className="relative w-full max-w-[520px] h-auto max-h-[390px] bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <ChooseRaccoonHand />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-2xl"></div>
                        <div className="absolute bottom-4 left-4 text-white text-lg font-semibold">
                            선택된 마스크
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex justify-center space-x-8 py-6 mb-6">
                <button
                    className="bg-gradient-to-r from-[#f7f3e9] to-[#e4d7c7] text-[#8B4513] py-3 px-8 sm:py-4 sm:px-10 rounded-full border-2 border-[#a16e47] shadow-lg hover:shadow-xl transition duration-300 ease-in-out transform hover:scale-105 text-xl sm:text-2xl font-bold"
                    onClick={() => window.history.back()}
                    style={{ fontSize: '24px' }}
                >
                    뒤로가기
                </button>
                <button
                    className="bg-gradient-to-r from-[#a16e47] to-[#8a5d3b] text-white py-3 px-8 sm:py-4 sm:px-10 rounded-full border-2 border-[#a16e47] shadow-lg hover:shadow-xl transition duration-300 ease-in-out transform hover:scale-105 text-xl sm:text-2xl font-bold"
                    onClick={handleSelect}
                    style={{ fontSize: '24px' }}
                >
                    선택
                </button>
            </div>
        </div>
    );
};

export default ChooseRaccoonPage;
