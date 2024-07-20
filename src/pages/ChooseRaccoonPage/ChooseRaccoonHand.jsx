import { Canvas, useFrame } from '@react-three/fiber';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Color, Euler, Matrix4, Vector3 } from 'three';
import { useGLTF, Sphere } from '@react-three/drei';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedModel } from '../../redux/slices/racoonSlice.js';
import {
    FaceLandmarker,
    HandLandmarker,
    GestureRecognizer,
    FilesetResolver,
} from '@mediapipe/tasks-vision';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage.js';
import { useNavigate } from 'react-router-dom';

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
    '/raccoon_head.glb',
    '/yellow_raccoon_head.glb',
    '/blue_raccoon.glb',
    '/jungle_raccoon_head.glb',
    '/warrior_raccoon_head.glb',
];

const handColors = ['red', 'blue', 'white', 'yellow', 'purple'];

function ChooseRaccoonHand() {
    const dispatch = useDispatch(); // 상태관리를 위한 dispatch 함수
    const currentModel = useSelector(state => state.racoon.selectedModel);
    const [modelPath, setModelPath] = useState(models[0]);
    const [modelIndex, setModelIndex] = useState(0);
    const [handColorIndex, setHandColorIndex] = useState(0);
    const navigate = useNavigate();

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

        //////
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

    const minX = -0.8,
        maxX = 1,
        minY = -0.5,
        maxY = 0.5; // 바운더리 설정

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
                    case 'Thumb_Up':
                        avatarPosition.y = Math.min(
                            avatarPosition.y + moveSpeed,
                            maxY
                        );
                        break;
                    case 'Thumb_Down':
                        avatarPosition.y = Math.max(
                            avatarPosition.y - moveSpeed,
                            minY
                        );
                        break;
                    case 'Closed_Fist':
                        avatarPosition.x = Math.max(
                            avatarPosition.x - moveSpeed,
                            minX
                        );
                        break;
                    case 'Open_Palm':
                        avatarPosition.x = Math.min(
                            avatarPosition.x + moveSpeed,
                            maxX
                        );
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

    /* 버튼 클릭 시 라쿤 모델 변경 */
    const changeModel = useCallback(() => {
        const nextIndex = (modelIndex + 1) % models.length;
        const newModel = models[nextIndex];

        setModelIndex(nextIndex);
        setModelPath(newModel);
        dispatch(setSelectedModel(newModel));

        saveToLocalStorage('racoon', newModel); // 사용자의 선택 기억
        
        // Redux 상태 출력
        console.log('Model changed. New Redux State:', {
            previousModel: currentModel,
            newModel: newModel,
            // fullState: store.getState() // 이 부분은 제거하거나 다른 방식으로 구현해야 합니다
        });

        // navigate('/videochat');
    }, [modelIndex, currentModel, dispatch]);

    const changeHandColor = () => {
        const nextColorIndex = (handColorIndex + 1) % handColors.length;
        setHandColorIndex(nextColorIndex);
    };

    return (
        <div
            className="App w-full max-w-[480px] mx-auto"
            style={{ position: 'relative', aspectRatio: '4 / 3' }}
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
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'transparent',
                }}
                camera={{
                    fov: 16,
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
                <Hand handColor={handColors[handColorIndex]} />
            </Canvas>
            <div className="absolute top-2 left-2 right-2 flex justify-between z-10">
                {/* <button
                    onClick={changeModel}
                    className="bg-[#f7f3e9] text-[#a16e47] py-1 px-3 sm:py-2 sm:px-4 rounded-full border-2 border-[#a16e47] shadow-md hover:bg-[#e4d7c7] hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-xs sm:text-sm"
                >
                    Change
                </button> */}
                <button
                    onClick={changeModel}
                    className="bg-[white] text-[#5b484a] py-1 px-3 sm:py-2 sm:px-4 rounded-full border-2 border-[#5b484a] shadow-md hover:bg-[white] hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-xs sm:text-sm"
                >
                    Change
                </button>
                {/* <button
                    onClick={changeHandColor}
                    className="bg-[#f7f3e9] text-[#a16e47] py-1 px-3 sm:py-2 sm:px-4 rounded-full border-2 border-[#a16e47] shadow-md hover:bg-[#e4d7c7] hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-xs sm:text-sm"
                >
                    Change Hand Color
                </button> */}
            </div>
        </div>
    );
}

function Raccoon({ modelPath }) {
    const { scene, nodes } = useGLTF(modelPath);
    const headMeshRef = useRef();
    const hairMeshRef = useRef();
    const earsMeshRef = useRef();
    const tuftsMeshRef = useRef();
    const [modelScale, setModelScale] = useState(new Vector3(1, 1, 1));
    const [modelPosition, setModelPosition] = useState(new Vector3(0, 0.5, 0)); // y 좌표 조정

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
                    if (ref.current) {
                        ref.current.position.copy(position).add(avatarPosition);
                    }
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

            const scaleFactor = 1.0;

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
                        ref.current.position.add(modelPosition); // 모델 위치 조정
                        ref.current.scale.copy(modelScale); // 스케일 적용
                    }
                }
            );
        }
    });

    return <primitive object={scene} scale={modelScale} />;
}

function Hand({ handColor }) {
    const handRef = useRef();

    const minX = -1.5,
        maxX = 1.5,
        minY = -0.6,
        maxY = 0.6; // 바운더리 설정

    useFrame(() => {
        if (handLandmarks.length > 0 && handRef.current) {
            handLandmarks.forEach((hand, index) => {
                hand.forEach((landmark, i) => {
                    const joint = handRef.current.children[index * 21 + i];
                    if (joint) {
                        const x = (landmark.x - 0.5) * 2 + avatarPosition.x;
                        const y = -(landmark.y - 0.5) * 2 + avatarPosition.y;

                        joint.position.set(
                            Math.max(minX, Math.min(maxX, x)),
                            Math.max(minY, Math.min(maxY, y)),
                            landmark.z
                        );
                        joint.scale.set(0.5, 0.5, 0.5); // 손의 크기 조정
                    }
                });
            });
        } else if (handRef.current) {
            // 손 랜드마크가 없을 때 위치 초기화
            handRef.current.children.forEach((joint) => {
                joint.position.set(0, 0, -1000000); // 화면 밖의 좌표로 설정하여 보이지 않게 함
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
                            args={[0.018, 16, 16]} // 손의 크기
                        >
                            {/* <meshBasicMaterial color={handColor} /> */}
                            <meshBasicMaterial color={'#5b484a'} />
                        </Sphere>
                    ))
            )}
        </group>
    );
}

export default ChooseRaccoonHand;
