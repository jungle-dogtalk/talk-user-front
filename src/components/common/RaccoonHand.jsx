import { Canvas, useFrame } from '@react-three/fiber';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { startMission, stopMission } from '../../redux/slices/missionSlice';
import {
    Color,
    Euler,
    Matrix4,
    Vector3,
    TextureLoader,
    CanvasTexture,
} from 'three';
import { useGLTF, Sphere } from '@react-three/drei';
import {
    FaceLandmarker,
    HandLandmarker,
    GestureRecognizer,
    FilesetResolver,
} from '@mediapipe/tasks-vision';

let video;
let faceLandmarker;
let handLandmarker;
let gestureRecognizer;
let lastVideoTime = -1;

let rotation = null;
let blendshapes = [];
let faceLandmarks = [];
let transformationMatrix = null;
let handLandmarks = [];
let avatarPosition = new Vector3(0, 0, 0);
let currentGesture = '';

const models = [
    '/blue_raccoon.glb',
    '/jungle_raccoon_head.glb',
    '/raccoon_head.glb',
    '/warrior_raccoon_head.glb',
    '/yellow_raccoon_head.glb',
    '/yupyup_raccoon_head.glb',
];

const victoryModels = [
    '/jungle_raccoon_crown.glb',
    '/raccoon_crown.glb',
    '/warrior_raccoon_crown.glb',
    '/yellow_raccoon_crown.glb',
    '/yupyup_raccoon_crown.glb',
    '/blue_raccoon_crown.glb',
];

const handColors = ['red', 'blue', 'white', 'yellow', 'purple'];

function RaccoonHand() {
    const dispatch = useDispatch();

    const [modelPath, setModelPath] = useState(models[0]);
    const [modelIndex, setModelIndex] = useState(0);
    const [victoryModelPath, setVictoryModelPath] = useState(victoryModels[0]);
    const [victoryModelIndex, setVictoryModelIndex] = useState(0);
    const [handColorIndex, setHandColorIndex] = useState(0);
    const [iceBreakingActive, setIceBreakingActive] = useState(false);
    const [handPositions, setHandPositions] = useState([]);
    const [clearedPercentage, setClearedPercentage] = useState(0);

    useEffect(() => {
        const updateHandPositions = () => {
            if (handLandmarks.length > 0) {
                setHandPositions([...handLandmarks]);
            }
        };

        const intervalId = setInterval(updateHandPositions, 16); // 약 60fps

        return () => clearInterval(intervalId);
    }, []);

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
            outputFaceLandmarks: true,
            runningMode: 'VIDEO',
        });

        handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numHands: 2,
        });

        //Gesture
        gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task`,
                delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        // Setup video
        video = document.getElementById('video');
        navigator.mediaDevices
            .getUserMedia({
                video: { width: 640, height: 480 },
            })
            .then((stream) => {
                video.srcObject = stream;
                video.addEventListener('loadeddata', predict);
            });
    };

    const minX = -2,
        maxX = 2,
        minY = -1.5,
        maxY = 1.5; // 바운더리 설정

    /* 퀴즈 실행 */
    const performQuiz = () => {
        console.log('퀴즈 시작');
        dispatch(startMission());
        // TODO: 퀴즈 미션 로직 수행

        // 퀴즈 성공 시 왕관 모델로 변경, 실패 시 얼음 미션 수행 및 완료 전까지 퀴즈 수행 불가
        let isVictory = true;
        if (isVictory) {
            changeVictoryModel();
            // dispatch(stopMission());
        } else {
            console.log('얼음 미션 수행');
            // dispatch(startMission());
        }
    };

    const predict = () => {
        const nowInMs = Date.now();
        if (lastVideoTime !== video.currentTime) {
            lastVideoTime = video.currentTime;

            const faceResult = faceLandmarker.detectForVideo(video, nowInMs);
            const handResult = handLandmarker.detectForVideo(video, nowInMs);
            const gestureResult = gestureRecognizer.recognizeForVideo(
                video,
                nowInMs
            );

            // Face result processing
            if (
                faceResult.facialTransformationMatrixes &&
                faceResult.facialTransformationMatrixes.length > 0 &&
                faceResult.faceBlendshapes &&
                faceResult.faceBlendshapes.length > 0 &&
                faceResult.faceLandmarks &&
                faceResult.faceLandmarks.length > 0
            ) {
                const matrix = new Matrix4().fromArray(
                    faceResult.facialTransformationMatrixes[0].data
                );
                rotation = new Euler().setFromRotationMatrix(matrix);
                blendshapes = faceResult.faceBlendshapes[0].categories;
                faceLandmarks = faceResult.faceLandmarks[0];
                transformationMatrix = matrix;
            }

            // Hand result processing
            if (handResult.landmarks) {
                handLandmarks = handResult.landmarks;
                setHandPositions(handResult.landmarks); // // 손의 위치 업데이트
                // console.log(handResult.landmarks);
            } else {
                handLandmarks = [];
            }

            //TODO: 제스처 결과 수정 필요
            // Gesture result processing
            if (
                gestureResult &&
                gestureResult.gestures &&
                gestureResult.gestures.length > 0
            ) {
                const gesture = gestureResult.gestures[0][0];
                currentGesture = gesture.categoryName;
                // console.log('Current Gesture:', currentGesture);

                // Update avatar position based on gesture
                const moveSpeed = 0.1;

                switch (currentGesture) {
                    // case 'Thumb_Up':
                    //     avatarPosition.y = Math.min(
                    //         avatarPosition.y + moveSpeed,
                    //         maxY
                    //     );
                    //     break;
                    // case 'Thumb_Down':
                    //     avatarPosition.y = Math.max(
                    //         avatarPosition.y - moveSpeed,
                    //         minY
                    //     );
                    //     break;
                    case 'Closed_Fist':
                        handleIceBreaking();
                        break;
                    // case 'Open_Palm':
                    //     avatarPosition.x = Math.min(
                    //         avatarPosition.x + moveSpeed,
                    //         maxX
                    //     );
                    //     break;
                    case 'Victory':
                        performQuiz();
                        break;
                    default:
                        // No movement for other gestures
                        break;
                }
            }
        }
        requestAnimationFrame(predict);
    };

    useEffect(() => {
        setup();
    }, []);

    const changeModel = () => {
        const nextIndex = (modelIndex + 1) % models.length;
        setModelIndex(nextIndex);
        setModelPath(models[nextIndex]);
    };

    // TODO: 왕관 모델로 변경
    const changeVictoryModel = () => {
        const nextIndex = (victoryModelIndex + 1) % victoryModels.length;
        setModelIndex(nextIndex);
        setModelPath(victoryModels[nextIndex]);
    };

    const changeHandColor = () => {
        const nextColorIndex = (handColorIndex + 1) % handColors.length;
        setHandColorIndex(nextColorIndex);
    };

    const handleIceBreaking = () => {
        setIceBreakingActive(!iceBreakingActive);
    };

    return (
        <div
            className="App"
            style={{
                position: 'absolute',
                left: '-9999px',
                top: '-9999px',
            }}
        >
            <video
                autoPlay
                id="video"
                style={{ width: 640, height: 480 }}
            ></video>
            <Canvas
                id="avatar_canvas"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none',
                    width: 640,
                    height: 480,
                }}
                camera={{
                    fov: 10,
                    position: [0, 0, 10],
                }}
            >
                <ambientLight intensity={2} />
                <pointLight
                    position={[1, 1, 1]}
                    color={new Color(1, 0, 0)}
                    intensity={0.5}
                />
                <pointLight
                    position={[-1, 0, 1]}
                    color={new Color(0, 1, 0)}
                    intensity={0.5}
                />
                <Raccoon modelPath={modelPath} />
                {iceBreakingActive && (
                    <IceBreakingBackground
                        handPositions={handPositions}
                        onPercentageChange={setClearedPercentage}
                    />
                )}
                {/* <Hand handColor={handColors[handColorIndex]} /> */}
            </Canvas>
            <div
                style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    color: 'white',
                    fontSize: '20px',
                    fontWeight: 'bold',
                }}
            >
                Cleared: {clearedPercentage.toFixed(2)}%
            </div>
            <button
                onClick={changeModel}
                style={{ position: 'absolute', top: 10, left: 10 }}
            >
                Change Raccoon Face
            </button>
            {/* <button
                onClick={changeHandColor}
                style={{ position: 'absolute', top: 10, right: 30 }}
            >
                Change Raccoon Hand Color
            </button> */}
            <button
                onClick={handleIceBreaking}
                style={{ position: 'absolute', top: 10, right: 30 }}
            >
                ICE BREAKING
            </button>
        </div>
    );
}

function IceBreakingBackground({ handPositions, onPercentageChange }) {
    const meshRef = useRef();
    const canvasRef = useRef();
    const textureRef = useRef();
    const [canvasTexture, setCanvasTexture] = useState(null);
    const [clearedPercentage, setClearedPercentage] = useState(0);
    const originalImageData = useRef(null);
    const erasedPixels = useRef(new Set());
    const lastEraseTime = useRef({});
    const REGENERATION_DELAY = 3000; // 2초 후 재생성 시작

    useEffect(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');

        const textureLoader = new TextureLoader();

        // 이미지 로드
        textureLoader.load('/ice.jpg', (texture) => {
            ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
            const newTexture = new CanvasTexture(canvas);
            setCanvasTexture(newTexture);
            textureRef.current = texture;
            originalImageData.current = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            );
        });

        canvasRef.current = canvas;
    }, []);

    // 이징 함수
    const easeInOutCubic = (t) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    useFrame(() => {
        if (
            canvasRef.current &&
            canvasTexture &&
            meshRef.current &&
            textureRef.current &&
            originalImageData.current
        ) {
            const ctx = canvasRef.current.getContext('2d');
            const imageData = ctx.getImageData(
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height
            );
            const data = imageData.data;
            const originalData = originalImageData.current.data;
            const currentTime = Date.now();

            // 얼음 재생성
            for (let i = 0; i < data.length; i += 4) {
                const pixelIndex = i / 4;
                if (erasedPixels.current.has(pixelIndex)) {
                    const timeSinceErase =
                        currentTime - lastEraseTime.current[pixelIndex];
                    if (timeSinceErase > REGENERATION_DELAY) {
                        const regenerationProgress = Math.min(
                            (timeSinceErase - REGENERATION_DELAY) / 2000,
                            1
                        );
                        const easedProgress =
                            easeInOutCubic(regenerationProgress);

                        // 주변 픽셀과의 블렌딩
                        const x = pixelIndex % canvasRef.current.width;
                        const y = Math.floor(
                            pixelIndex / canvasRef.current.width
                        );
                        let sumR = 0,
                            sumG = 0,
                            sumB = 0,
                            sumA = 0,
                            count = 0;

                        for (let dx = -1; dx <= 1; dx++) {
                            for (let dy = -1; dy <= 1; dy++) {
                                const nx = x + dx;
                                const ny = y + dy;
                                if (
                                    nx >= 0 &&
                                    nx < canvasRef.current.width &&
                                    ny >= 0 &&
                                    ny < canvasRef.current.height
                                ) {
                                    const neighborIndex =
                                        (ny * canvasRef.current.width + nx) * 4;
                                    sumR += data[neighborIndex];
                                    sumG += data[neighborIndex + 1];
                                    sumB += data[neighborIndex + 2];
                                    sumA += data[neighborIndex + 3];
                                    count++;
                                }
                            }
                        }

                        // 랜덤성 추가
                        const randomFactor = 0.9 + Math.random() * 0.2;

                        // 복원 적용
                        for (let j = 0; j < 3; j++) {
                            const blendedValue =
                                (sumR + sumG + sumB) / (count * 3);
                            data[i + j] =
                                (originalData[i + j] * easedProgress +
                                    blendedValue * (1 - easedProgress)) *
                                randomFactor;
                        }
                        data[i + 3] =
                            (originalData[i + 3] * easedProgress +
                                (sumA / count) * (1 - easedProgress)) *
                            randomFactor;

                        if (regenerationProgress === 1) {
                            erasedPixels.current.delete(pixelIndex);
                        }
                    }
                }
            }

            ctx.putImageData(imageData, 0, 0);

            if (handPositions.length > 0) {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.fillStyle = 'rgba(0, 0, 0, 1)';
                ctx.globalAlpha = 1; // 완전히 투명하게 지우기

                handPositions.forEach((hand) => {
                    const palmCenter = hand[9];
                    const x = palmCenter.x * canvasRef.current.width;
                    const y = (1 - palmCenter.y) * canvasRef.current.height;
                    const radius = 20;

                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, 2 * Math.PI);
                    ctx.fill();

                    // 지워진 픽셀 기록
                    for (
                        let px = Math.max(0, Math.floor(x - radius));
                        px <
                        Math.min(
                            canvasRef.current.width,
                            Math.ceil(x + radius)
                        );
                        px++
                    ) {
                        for (
                            let py = Math.max(0, Math.floor(y - radius));
                            py <
                            Math.min(
                                canvasRef.current.height,
                                Math.ceil(y + radius)
                            );
                            py++
                        ) {
                            if (
                                Math.sqrt((px - x) ** 2 + (py - y) ** 2) <=
                                radius
                            ) {
                                const pixelIndex =
                                    py * canvasRef.current.width + px;
                                erasedPixels.current.add(pixelIndex);
                                lastEraseTime.current[pixelIndex] = currentTime;
                            }
                        }
                    }
                });

                canvasTexture.needsUpdate = true;
            }

            // 지워진 영역 계산
            let clearedPixels = erasedPixels.current.size;
            const newClearedPercentage =
                (clearedPixels /
                    (canvasRef.current.width * canvasRef.current.height)) *
                100;
            setClearedPercentage(newClearedPercentage);
            onPercentageChange(newClearedPercentage);
            cibsike, kig;

            meshRef.current.material.map = canvasTexture;
            meshRef.current.material.needsUpdate = true;
        }
    });

    return (
        <mesh ref={meshRef} position={[0, 0, 1]}>
            <planeGeometry args={[10, 10]} />
            <meshBasicMaterial
                map={canvasTexture}
                transparent={true}
                opacity={0.8}
            />
        </mesh>
    );
}

function Raccoon({ modelPath }) {
    const { scene, nodes } = useGLTF(modelPath);
    const headMeshRef = useRef();
    const hairMeshRef = useRef();
    const earsMeshRef = useRef();
    const tuftsMeshRef = useRef();
    const [modelScale, setModelScale] = useState(new Vector3(1, 1, 1));

    useEffect(() => {
        headMeshRef.current = nodes.head_geo002;
        hairMeshRef.current = nodes.hair_geo;
        earsMeshRef.current = nodes.ears_geo;
        tuftsMeshRef.current = nodes.tufts_geo;
    }, [nodes]);

    useFrame(() => {
        if (rotation) {
            [headMeshRef, hairMeshRef, earsMeshRef, tuftsMeshRef].forEach(
                (ref) => {
                    if (ref.current)
                        ref.current.rotation.set(
                            rotation.x,
                            rotation.y,
                            rotation.z
                        );
                }
            );
        }

        if (transformationMatrix) {
            const position = new Vector3();
            position.setFromMatrixPosition(transformationMatrix);
            [headMeshRef, hairMeshRef, earsMeshRef, tuftsMeshRef].forEach(
                (ref) => {
                    if (ref.current)
                        ref.current.position.copy(position).add(avatarPosition);
                }
            );
        }

        if (blendshapes.length > 0 && headMeshRef.current) {
            blendshapes.forEach((blendshape) => {
                const index =
                    headMeshRef.current.morphTargetDictionary[
                        blendshape.categoryName
                    ];
                if (index !== undefined) {
                    headMeshRef.current.morphTargetInfluences[index] =
                        blendshape.score;
                }
            });
        }

        if (faceLandmarks.length > 0) {
            const noseLandmark = faceLandmarks[1]; // 코 랜드마크 사용

            // 스케일 팩터 계산 (이 값은 조정이 필요할 수 있습니다)
            const scaleFactor = 1.3;

            // 새로운 스케일 설정
            setModelScale(new Vector3(scaleFactor, scaleFactor, scaleFactor));

            const facePosition = new Vector3(
                (noseLandmark.x - 0.5) * 2, // x 좌표 정규화
                -(noseLandmark.y - 0.5) * 2, // y 좌표 정규화
                noseLandmark.z // z 좌표
            );
            [headMeshRef, hairMeshRef, earsMeshRef, tuftsMeshRef].forEach(
                (ref) => {
                    if (ref.current) {
                        ref.current.position
                            .copy(facePosition)
                            .add(avatarPosition);
                        // 스케일 적용
                        ref.current.scale.copy(modelScale);
                    }
                }
            );
        }
    });

    return <primitive object={scene} scale={modelScale} />;
}

function Hand({ handColor }) {
    const handRef = useRef();

    useFrame(() => {
        if (handLandmarks.length > 0 && handRef.current) {
            handLandmarks.forEach((hand, index) => {
                hand.forEach((landmark, i) => {
                    const joint = handRef.current.children[index * 21 + i];
                    if (joint) {
                        joint.position.set(
                            (landmark.x - 0.5) * 2 + avatarPosition.x,
                            -(landmark.y - 0.5) * 2 + avatarPosition.y,
                            landmark.z
                        );
                    }
                });
            });
        } else if (handRef.current) {
            // 손 랜드마크가 없을 때 위치 초기화
            handRef.current.children.forEach((joint) => {
                joint.position.set(0, 0, -10); // 화면 밖의 좌표로 설정하여 보이지 않게 함
            });
        }
    });

    return (
        <group ref={handRef}>
            {[0, 1].map((handIndex) =>
                Array(21)
                    .fill()
                    .map((_, i) => (
                        <Sphere
                            key={`hand-${handIndex}-${i}`}
                            args={[0.05, 16, 16]}
                        >
                            <meshBasicMaterial color={handColor} />
                        </Sphere>
                    ))
            )}
        </group>
    );
}

export default RaccoonHand;
