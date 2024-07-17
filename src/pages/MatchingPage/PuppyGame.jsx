import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage } from 'react-konva';
import {
    FaceLandmarker,
    HandLandmarker,
    GestureRecognizer,
    FilesetResolver,
} from '@mediapipe/tasks-vision';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Sphere } from '@react-three/drei';
import { Vector3, Euler, Matrix4 } from 'three';

const CHARACTER_SPEED = 10;
const OBSTACLE_SPEED = 5;

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

const PuppyGame = () => {
    const [raccoonPosition, setRaccoonPosition] = useState({ x: 0, y: 0 });
    const [obstaclePosition, setObstaclePosition] = useState({ x: 800, y: Math.random() * 550 });
    const [characterImage, setCharacterImage] = useState(null);
    const [objectImage, setObjectImage] = useState(null);
    const [collision, setCollision] = useState(false);
    const [modelPath, setModelPath] = useState(models[0]);
    const videoRef = useRef(null);

    useEffect(() => {
        const loadImage = (src) => {
            return new Promise((resolve) => {
                const img = new window.Image();
                img.src = src;
                img.onload = () => resolve(img);
            });
        };

        const loadImages = async () => {
            const characterImg = await loadImage('public/fat_cat.png'); // 이미지 경로를 실제 경로로 변경하세요
            const objectImg = await loadImage('public/fat_cat.png'); // 이미지 경로를 실제 경로로 변경하세요
            setCharacterImage(characterImg);
            setObjectImage(objectImg);
        };

        loadImages();
    }, []);

    useEffect(() => {
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

            videoRef.current = document.getElementById('video');
            navigator.mediaDevices
                .getUserMedia({
                    video: { width: 640, height: 480 },
                })
                .then((stream) => {
                    videoRef.current.srcObject = stream;
                    videoRef.current.addEventListener('loadeddata', predict);
                });
        };

        setup();
    }, []);

    const predict = () => {
        const nowInMs = Date.now();
        if (lastVideoTime !== videoRef.current.currentTime) {
            lastVideoTime = videoRef.current.currentTime;

            const faceResult = faceLandmarker.detectForVideo(videoRef.current, nowInMs);
            const handResult = handLandmarker.detectForVideo(videoRef.current, nowInMs);
            const gestureResult = gestureRecognizer.recognizeForVideo(videoRef.current, nowInMs);

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
            if (gestureResult && gestureResult.gestures && gestureResult.gestures.length > 0) {
                const gesture = gestureResult.gestures[0][0];
                currentGesture = gesture.categoryName;

                switch (currentGesture) {
                    case 'Thumb_Down':
                        setRaccoonPosition((prev) => ({ ...prev, y: Math.max(prev.y - CHARACTER_SPEED, 0) }));
                        break;
                    case 'Thumb_Up':
                        setRaccoonPosition((prev) => ({ ...prev, y: Math.min(prev.y + CHARACTER_SPEED, 600) }));
                        break;
                    default:
                        break;
                }
            }
        }
        requestAnimationFrame(predict);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setObstaclePosition((prev) => ({
                x: prev.x - OBSTACLE_SPEED,
                y: prev.y,
            }));

            if (obstaclePosition.x < -50) {
                setObstaclePosition({ x: 800, y: Math.random() * 550 });
            }

            if (
                avatarPosition.x < obstaclePosition.x + 50 &&
                avatarPosition.x + 50 > obstaclePosition.x &&
                avatarPosition.y < obstaclePosition.y + 50 &&
                avatarPosition.y + 50 > obstaclePosition.y
            ) {
                setCollision(true);
            } else {
                setCollision(false);
            }
        }, 50);

        return () => clearInterval(interval);
    }, [obstaclePosition, avatarPosition]);

    useEffect(() => {
        if (collision) {
            const changeCharacterImage = async () => {
                const newCharacterImg = await loadImage('public/new_character.png'); // 충돌 시 새로운 캐릭터 이미지 경로
                setCharacterImage(newCharacterImg);
            };

            changeCharacterImage();
        }
    }, [collision]);

    return (
        <div style={{ display: 'flex', position: 'relative', width: '800px', height: '600px' }}>
            <video autoPlay id="video" style={{ width: 640, height: 480, display: 'none' }}></video>
            <ObstacleCanvas
                obstaclePosition={obstaclePosition}
                objectImage={objectImage}
            />
            <Canvas
                id="avatar_canvas"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none',
                    width: 800,
                    height: 600,
                }}
                camera={{
                    fov: 75,
                    position: [0, 0, 5],
                }}
            >
                <ambientLight intensity={2} />
                <pointLight position={[1, 1, 1]} intensity={0.5} />
                <pointLight position={[-1, 0, 1]} intensity={0.5} />
                <Raccoon modelPath={modelPath} position={raccoonPosition} />
            </Canvas>
        </div>
    );
};


const ObstacleCanvas = ({ obstaclePosition, objectImage }) => (
    <Stage width={800} height={600} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Layer>
            {objectImage && (
                <KonvaImage
                    x={obstaclePosition.x}
                    y={obstaclePosition.y}
                    image={objectImage}
                    width={50}
                    height={50}
                />
            )}
        </Layer>
    </Stage>
);

function Raccoon({ modelPath, position }) {
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
            const matrixPosition = new Vector3();
            matrixPosition.setFromMatrixPosition(transformationMatrix);
            [headMeshRef, hairMeshRef, earsMeshRef, tuftsMeshRef].forEach(
                (ref) => {
                    if (ref.current)
                        ref.current.position.copy(matrixPosition).add(new Vector3(position.x / 100, position.y / 100, 0));
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
            const noseLandmark = faceLandmarks[1];

            const scaleFactor = 1;
            setModelScale(new Vector3(scaleFactor, scaleFactor, scaleFactor));

            const facePosition = new Vector3(
                (position.x / 800) * 4 - 2, // x 좌표를 -2에서 2 사이로 정규화
                -((position.y / 600) * 4 - 2), // y 좌표를 -2에서 2 사이로 정규화
                0 // z 좌표
            );
            [headMeshRef, hairMeshRef, earsMeshRef, tuftsMeshRef].forEach(
                (ref) => {
                    if (ref.current) {
                        ref.current.position.copy(facePosition);
                        ref.current.scale.copy(modelScale);
                    }
                }
            );
        }
    });

    return <primitive object={scene} scale={modelScale} />;
}

export default PuppyGame;
