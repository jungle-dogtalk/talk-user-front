import { Canvas, useFrame } from '@react-three/fiber';
import React, { useEffect, useRef, useState } from 'react';
import { Color, Euler, Matrix4, Vector3 } from 'three';
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

const handColors = ['red', 'blue', 'white', 'yellow', 'purple'];

function RaccoonHand() {
    const [modelPath, setModelPath] = useState(models[0]);
    const [modelIndex, setModelIndex] = useState(0);
    const [handColorIndex, setHandColorIndex] = useState(0);

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

    const minX = -2,
        maxX = 2,
        minY = -1.5,
        maxY = 1.5; // 바운더리 설정

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

            // Gesture result processing
            if (
                gestureResult &&
                gestureResult.gestures &&
                gestureResult.gestures.length > 0
            ) {
                const gesture = gestureResult.gestures[0][0];
                currentGesture = gesture.categoryName;
                console.log('Current Gesture:', currentGesture);

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

    const changeModel = () => {
        const nextIndex = (modelIndex + 1) % models.length;
        setModelIndex(nextIndex);
        setModelPath(models[nextIndex]);
    };

    const changeHandColor = () => {
        const nextColorIndex = (handColorIndex + 1) % handColors.length;
        setHandColorIndex(nextColorIndex);
    };

    return (
        <div
            className="App"
            style={{ position: 'relative', width: '500px', height:30 }}
        >
            <video
                autoPlay
                id="video"
                style={{
                    position: 'absolute',
                    top: -9999,
                    left: -9999,
                    pointerEvents: 'none',
                    width: 640, height: 480
                }}
            ></video>

            <Canvas
                id="avatar_canvas"
                style={{
                    position: 'absolute',
                    top: -9999,
                    left: -9999,
                    pointerEvents: 'none',
                    width: 640,
                    height: 480,
                    backgroundColor: 'green',
                }}
                camera={{
                    fov: 20,
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
            <button
                onClick={changeModel}
                style={{ position: 'absolute', top: 10, left: 10 }}
            >
                Change Raccoon Face
            </button>
            <button
                onClick={changeHandColor}
                style={{ position: 'absolute', top: 10, right: 30 }}
            >
                Change Raccoon Hand Color
            </button>
        </div>
    );
}

function Raccoon({ modelPath }) {
    const { scene, nodes } = useGLTF(modelPath);
    const headMeshRef = useRef();
    const hairMeshRef = useRef();
    const earsMeshRef = useRef();
    const tuftsMeshRef = useRef();

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
                    }
                }
            );
        }
    });

    return <primitive object={scene} />;
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
