import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import {
    FaceLandmarker,
    HandLandmarker,
    GestureRecognizer,
    FilesetResolver,
} from '@mediapipe/tasks-vision';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Vector3, Euler, Matrix4 } from 'three';
import './PuppyGame.css';

const CHARACTER_SPEED = 10;
const OBSTACLE_SPEED = 5;
const OBSTACLE_COUNT = 5;

let faceLandmarker;
let handLandmarker;
let gestureRecognizer;
let lastVideoTime = -1;

let rotation = null;
let blendshapes = [];
let faceLandmarks = [];
let transformationMatrix = null;
let handLandmarks = [];
let currentGesture = '';

const models = ['/raccoon_crown.glb'];
const objectImages = [
    '/cake.gif',
    '/star.gif',
    'cat.gif',
    'dog4.gif',
    'turtle.gif',
];

const PuppyGame = () => {
    const [raccoonPosition, setRaccoonPosition] = useState({ x: 400, y: 300 });
    const [obstacles, setObstacles] = useState([]);
    const [modelPath] = useState(models[0]);
    const [heartImage, setHeartImage] = useState(null);

    const videoRef = useRef(null);
    const obstaclesRef = useRef([]);
    const raccoonPositionRef = useRef({ x: 400, y: 300 });

    useEffect(() => {
        obstaclesRef.current = obstacles;
    }, [obstacles]);

    useEffect(() => {
        raccoonPositionRef.current = raccoonPosition;
    }, [raccoonPosition]);

    useEffect(() => {
        const loadImage = (src) => {
            return new Promise((resolve) => {
                const img = new window.Image();
                img.src = src;
                img.onload = () => resolve(img);
            });
        };

        const loadImages = async () => {
            const heartImg = await loadImage('/heart.gif');
            setHeartImage(heartImg);

            const initialObstacles = await Promise.all(
                Array(OBSTACLE_COUNT)
                    .fill()
                    .map(async (_, index) => ({
                        id: index,
                        position: {
                            x: 800 + index * 200,
                            y: Math.random() * 550,
                        },
                        image: await loadImage(
                            objectImages[index % objectImages.length]
                        ),
                        showHeart: false,
                    }))
            );
            setObstacles(initialObstacles);
            obstaclesRef.current = initialObstacles;
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

            gestureRecognizer = await GestureRecognizer.createFromOptions(
                vision,
                {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task`,
                        delegate: 'GPU',
                    },
                    runningMode: 'VIDEO',
                    minHandDetectionConfidence: 0.5,
                    minHandPresenceConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                }
            );

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

            const faceResult = faceLandmarker.detectForVideo(
                videoRef.current,
                nowInMs
            );
            const handResult = handLandmarker.detectForVideo(
                videoRef.current,
                nowInMs
            );
            const gestureResult = gestureRecognizer.recognizeForVideo(
                videoRef.current,
                nowInMs
            );

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

            if (handResult.landmarks) {
                handLandmarks = handResult.landmarks;
            } else {
                handLandmarks = [];
            }

            if (
                gestureResult &&
                gestureResult.gestures &&
                gestureResult.gestures.length > 0
            ) {
                const gesture = gestureResult.gestures[0][0];
                currentGesture = gesture.categoryName;

                switch (currentGesture) {
                    case 'Thumb_Up':
                        setRaccoonPosition((prev) => ({
                            ...prev,
                            y: (prev.y - CHARACTER_SPEED + 600) % 600,
                        }));
                        break;
                    case 'Thumb_Down':
                        setRaccoonPosition((prev) => ({
                            ...prev,
                            y: (prev.y + CHARACTER_SPEED) % 600,
                        }));
                        break;
                    case 'Closed_Fist':
                        setRaccoonPosition((prev) => ({
                            ...prev,
                            x: (prev.x - CHARACTER_SPEED + 800) % 800,
                        }));
                        break;
                    case 'Open_Palm':
                        setRaccoonPosition((prev) => ({
                            ...prev,
                            x: (prev.x + CHARACTER_SPEED) % 800,
                        }));
                        break;
                    default:
                        break;
                }
            }
        }
        requestAnimationFrame(predict);
    };

    const checkCollision = (obstacle, raccoon) => {
        return (
            raccoon.x < obstacle.position.x + 50 &&
            raccoon.x + 50 > obstacle.position.x &&
            raccoon.y < obstacle.position.y + 50 &&
            raccoon.y + 50 > obstacle.position.y
        );
    };

    const updateObstaclePosition = (obstacle) => {
        let newX = obstacle.position.x - OBSTACLE_SPEED;
        if (newX < -50) {
            newX = 800;
            return {
                ...obstacle,
                position: { x: newX, y: Math.random() * 550 },
                showHeart: false,
            };
        }
        return { ...obstacle, position: { ...obstacle.position, x: newX } };
    };

    const collisionDetectionLoop = () => {
        obstaclesRef.current = obstaclesRef.current.map((obstacle) => {
            const updatedObstacle = updateObstaclePosition(obstacle);

            if (
                checkCollision(updatedObstacle, raccoonPositionRef.current) &&
                !updatedObstacle.showHeart
            ) {
                setTimeout(() => {
                    obstaclesRef.current = obstaclesRef.current.map((ob) =>
                        ob.id === updatedObstacle.id
                            ? {
                                  ...ob,
                                  showHeart: false,
                                  position: {
                                      x: 800,
                                      y: Math.random() * 550,
                                  },
                              }
                            : ob
                    );
                }, 500);

                return { ...updatedObstacle, showHeart: true };
            }

            return updatedObstacle;
        });

        requestAnimationFrame(collisionDetectionLoop);
    };

    const gameLoop = () => {
        setObstacles([...obstaclesRef.current]);
        requestAnimationFrame(gameLoop);
    };

    useEffect(() => {
        const collisionAnimationId = requestAnimationFrame(
            collisionDetectionLoop
        );
        const gameAnimationId = requestAnimationFrame(gameLoop);
        return () => {
            cancelAnimationFrame(collisionAnimationId);
            cancelAnimationFrame(gameAnimationId);
        };
    }, []);

    return (
        <div
            className={'puppy-game-container'}
            style={{
                display: 'flex',
                position: 'relative',
                width: '800px',
                height: '600px',
            }}
        >
            <video
                autoPlay
                id="video"
                style={{ width: 640, height: 480, display: 'none' }}
            ></video>
            <ObstacleCanvas obstacles={obstacles} heartImage={heartImage} />
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
                    fov: 25,
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

const ObstacleCanvas = ({ obstacles, heartImage }) => (
    <Stage
        width={800}
        height={600}
        style={{ position: 'absolute', top: 0, left: 0 }}
    >
        <Layer>
            {obstacles.map((obstacle) => (
                <KonvaImage
                    key={obstacle.id}
                    x={obstacle.position.x}
                    y={obstacle.position.y}
                    image={obstacle.showHeart ? heartImage : obstacle.image}
                    width={50}
                    height={50}
                />
            ))}
        </Layer>
    </Stage>
);

function Raccoon({ modelPath, position }) {
    const { scene, nodes } = useGLTF(modelPath);
    const headMeshRef = useRef();
    const hairMeshRef = useRef();
    const earsMeshRef = useRef();
    const tuftsMeshRef = useRef();
    const [modelScale] = useState(new Vector3(0.5, 0.5, 0.5));

    useEffect(() => {
        if (nodes) {
            headMeshRef.current = nodes.head_geo002;
            hairMeshRef.current = nodes.hair_geo;
            earsMeshRef.current = nodes.ears_geo;
            tuftsMeshRef.current = nodes.tufts_geo;
        }
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

        const meshes = [headMeshRef, hairMeshRef, earsMeshRef, tuftsMeshRef];
        meshes.forEach((ref) => {
            if (ref.current) {
                ref.current.position.set(
                    (position.x - 400) / 100,
                    -(position.y - 300) / 100,
                    0
                );
            }
        });

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
    });

    return <primitive object={scene} scale={modelScale} />;
}

export default PuppyGame;
