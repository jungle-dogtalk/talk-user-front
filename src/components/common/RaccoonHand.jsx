import { Canvas, useFrame } from '@react-three/fiber';
import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import { loadFromLocalStorage } from '../../utils/localStorage';
import { useDispatch } from 'react-redux';
import { setSelectedModel } from '../../redux/slices/racoonSlice';

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
    '/monkey.glb',
    '/panda.glb',
    '/cat.glb',
];

const victoryModels = [
    '/blue_raccoon_crown.glb',
    '/jungle_raccoon_crown.glb',
    '/raccoon_crown.glb',
    '/warrior_raccoon_crown.glb',
    '/yellow_raccoon_crown.glb',
    '/monkey_crown.glb',
    '/panda_crown.glb',
    '/cat_crown.glb',
];

const combinedModels = models.map((model, i) => [model, victoryModels[i]]);
const randomElement =
    combinedModels[Math.floor(Math.random() * combinedModels.length)];
const modelVictoryMap = models.reduce(
    (acc, model, index) => ({ ...acc, [model]: victoryModels[index] }),
    {}
);

const handColors = ['red', 'blue', 'white', 'yellow', 'purple'];

console.log(randomElement);
console.log(modelVictoryMap, '매핑정보');

function RaccoonHand(props) {
    const savedModel = loadFromLocalStorage('racoon');
    const [modelPath, setModelPath] = useState(savedModel);
    const [modelIndex, setModelIndex] = useState(0);
    const [victoryModelIndex, setVictoryModelIndex] = useState(0);
    const [handColorIndex, setHandColorIndex] = useState(0);
    const [iceBreakingActive, setIceBreakingActive] = useState(false);
    const [handPositions, setHandPositions] = useState([]);
    const [clearedPercentage, setClearedPercentage] = useState(0);
    const isQuizCompletedRef = useRef(false);
    const quizInProgressRef = useRef(false);
    const [isVictoryModelLoading, setIsVictoryModelLoading] = useState(false);
    const dispatch = useDispatch();
    const victoryModel = modelVictoryMap[savedModel];

    useEffect(() => {
        if (props.quizResult === 'success') {
            isQuizCompletedRef.current = true;
            changeVictoryModel();
        }

        if (props.quizResult === 'failure') {
            handleIceBreaking();
        }
    }, [props.quizResult, props.quizResultTrigger]);

    useEffect(() => {
        if (props.isChallengeCompleted) {
            quizInProgressRef.current = false;
        }
    }, [props.isChallengeCompleted, props.isChallengeCompletedTrigger]);

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
        console.log('자식컴포넌트 퀴즈 시작');
        quizInProgressRef.current = true;
        const data = {
            quizInProgress: true,
        };

        props.onQuizEvent(data);
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

                //감정 인식
                recognizeEmotion(blendshapes);
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
                    // avatarPosition.y = Math.min(
                    //     avatarPosition.y + moveSpeed,
                    //     maxY
                    // );
                    // changeVictoryModel();
                    // break;
                    // case 'Thumb_Down':
                    //     avatarPosition.y = Math.max(
                    //         avatarPosition.y - moveSpeed,
                    //         minY
                    //     );
                    //     break;
                    // case 'Closed_Fist':
                    //     handleIceBreaking();
                    //     break;
                    // case 'Open_Palm':
                    //     handleIceBreaking();
                    //     break;
                    // case 'Open_Palm':
                    //     avatarPosition.x = Math.min(
                    //         avatarPosition.x + moveSpeed,
                    //         maxX
                    //     );
                    //     break;
                    case 'Victory':
                        console.log('브이감지');
                        if (isQuizCompletedRef.current) {
                            break;
                        }
                        if (!quizInProgressRef.current) {
                            performQuiz();
                        }
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
        setIsVictoryModelLoading(true); // 모델 로딩 시작
        const nextIndex = (victoryModelIndex + 1) % victoryModels.length;
        setVictoryModelIndex(nextIndex);
        setModelPath(victoryModel);
        setIsVictoryModelLoading(false); // 모델 로딩
    };

    const changeHandColor = () => {
        const nextColorIndex = (handColorIndex + 1) % handColors.length;
        setHandColorIndex(nextColorIndex);
    };

    const handleIceBreaking = () => {
        setIceBreakingActive(!iceBreakingActive);
        setTimeout(() => {
            setIceBreakingActive(false);
        }, 10000);
    };

    const recognizeEmotion = (blendshapes) => {
        const blendshapeMap = blendshapes.reduce((map, obj) => {
            map[obj.categoryName] = obj.score;
            return map;
        }, {});

        // 웃음 (smile)을 인식 'mouthSmileLeft' 'mouthSmileRight'
        const smileValueLeft = blendshapeMap['mouthSmileLeft'] || 0;
        const smileValueRight = blendshapeMap['mouthSmileRight'] || 0;
        const smileValue = (smileValueLeft + smileValueRight) / 2;

        // console.log(
        //     `Smile Left: ${smileValueLeft}, Smile Right: ${smileValueRight}, Average: ${smileValue}`
        // );

        if (smileValue > 0.5) {
            console.log('Smiling');
        }
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
                {!isVictoryModelLoading && (
                    <Raccoon
                        modelPath={modelPath}
                        onLoad={() => setIsVictoryModelLoading(false)}
                    />
                )}

                {iceBreakingActive && (
                    <IceBreakingBackground
                        handPositions={handPositions}
                        onPercentageChange={setClearedPercentage}
                    />
                )}
                {/* <Hand handColor={handColors[handColorIndex]} /> */}
            </Canvas>
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
            {/* <button
                onClick={handleIceBreaking}
                style={{ position: 'absolute', top: 10, right: 30 }}
            >
                ICE BREAKING
            </button> */}
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
    const lastClearedPercentage = useRef(0);

    useEffect(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');

        const textureLoader = new TextureLoader();

        // 이미지 로드
        textureLoader.load('/ice.jpg', (texture) => {
            const img = texture.image;
            canvas.width = img.width; // 이미지의 원래 너비
            canvas.height = img.height; // 이미지의 원래 높이
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const newTexture = new CanvasTexture(canvas);
            setCanvasTexture(newTexture);
            textureRef.current = texture;
            originalImageData.current = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            );

            // 이미지 로드 후 텍스처 업데이트
            if (meshRef.current) {
                meshRef.current.material.map = newTexture;
                meshRef.current.material.needsUpdate = true;
            }
        });

        canvasRef.current = canvas;

        // 10초 후에 캔버스를 완전히 지우기
        const timer = setTimeout(() => {
            const ctx = canvasRef.current.getContext('2d');
            clearCanvas(ctx);
            canvasTexture.needsUpdate = true;
        }, 10000);

        return () => clearTimeout(timer);
    }, []);

    const clearCanvas = (ctx) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        setClearedPercentage(100);
        onPercentageChange(100);
        setCanvasTexture(new CanvasTexture(ctx.canvas));
    };

    useFrame(() => {
        if (
            canvasRef.current &&
            canvasTexture &&
            meshRef.current &&
            textureRef.current &&
            originalImageData.current
        ) {
            const ctx = canvasRef.current.getContext('2d');

            // if (currentGesture === 'Closed_Fist' && handPositions.length >= 1) {
            if (handPositions.length >= 1) {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.fillStyle = 'rgba(0, 0, 0, 0.01)'; // 지우는 강도 조절 (여기서 알파 값을 조정)

                ctx.lineWidth = 3; // 브러쉬 크기 조절
                ctx.globalAlpha = 1; // 투명도

                handPositions.forEach((hand) => {
                    ctx.beginPath();
                    const firstPoint = hand[12];
                    const startX = firstPoint.x * canvasRef.current.width;
                    const startY =
                        (1 - firstPoint.y) * canvasRef.current.height;
                    ctx.moveTo(startX, startY);

                    hand.forEach((point) => {
                        const x = point.x * canvasRef.current.width;
                        const y = (1 - point.y) * canvasRef.current.height;
                        ctx.lineTo(x, y);
                    });

                    ctx.closePath();
                    ctx.stroke();
                });

                canvasTexture.needsUpdate = true;
            }

            const newImageData = ctx.getImageData(
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height
            );

            let clearedPixels = 0;
            let totalNonTransparentPixels = 0;

            for (let i = 0; i < newImageData.data.length; i += 4) {
                if (originalImageData.current.data[i + 3] !== 0) {
                    totalNonTransparentPixels++;
                    if (newImageData.data[i + 3] === 0) {
                        clearedPixels++;
                    }
                }
            }

            /// TODO) 현재 의도한 백분율로 나오지 않아서 수정 필요
            // 얼음 배경 픽셀 얼마나 지웠는지 계산 - newClearedPercentage
            const newClearedPercentage =
                (clearedPixels / totalNonTransparentPixels) * 100;
            if (newClearedPercentage > lastClearedPercentage.current) {
                lastClearedPercentage.current = newClearedPercentage;
                setClearedPercentage(newClearedPercentage);
                onPercentageChange(newClearedPercentage);

                // console.log('얼음 얼마나 깼는가:', newClearedPercentage);

                meshRef.current.material.map = canvasTexture;
                meshRef.current.material.needsUpdate = true;
            }
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
