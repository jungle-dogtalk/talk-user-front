import { Canvas, useFrame } from '@react-three/fiber';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Color, Euler, Matrix4, Vector3 } from 'three';
import { useGLTF } from '@react-three/drei';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedModel } from '../../redux/slices/racoonSlice.js';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import {
    saveToLocalStorage,
    loadFromLocalStorage,
} from '../../utils/localStorage.js';
import { useNavigate } from 'react-router-dom';

let video;
let faceLandmarker;
let lastVideoTime = -1;

let rotation = null;
let blendshapes = [];
let faceLandmarks = [];
let transformationMatrix = null;
let avatarPosition = new Vector3(0, 0, 0);

const models = ['/raccoon_head.glb', '/monkey.glb', '/panda.glb', '/cat.glb'];

models.forEach(useGLTF.preload);

const MemoizedRaccoon = React.memo(Raccoon);

function ChooseRaccoonHand() {
    const dispatch = useDispatch();
    const currentModel = useSelector((state) => state.racoon.selectedModel);
    const [handColorIndex, setHandColorIndex] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const savedModel = loadFromLocalStorage('racoon');
        if (savedModel && models.includes(savedModel)) {
            dispatch(setSelectedModel(savedModel));
        }
    }, [dispatch]);

    useEffect(() => {
        saveToLocalStorage('racoon', currentModel);
        // console.log('Current Model:', currentModel);
    }, [currentModel]);

    const setup = async () => {
        const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `/models/face_landmarker.task`,
                delegate: 'GPU',
            },
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
            outputFaceLandmarks: true,
            runningMode: 'VIDEO',
        });

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

    const predict = () => {
        const nowInMs = Date.now();
        if (lastVideoTime !== video.currentTime) {
            lastVideoTime = video.currentTime;

            const faceResult = faceLandmarker.detectForVideo(video, nowInMs);

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
        }
        requestAnimationFrame(predict);
    };

    useEffect(() => {
        setup();
    }, []);

    const changeModel = useCallback(() => {
        const currentIndex = models.indexOf(currentModel);
        const nextIndex = (currentIndex + 1) % models.length;
        const newModel = models[nextIndex];
        // console.log('Changing model from', currentModel, 'to', newModel);
        dispatch(setSelectedModel(newModel));
    }, [currentModel, dispatch]);

    return (
        <div
            className="w-full h-0 pb-[56.25%] relative"
            style={{ maxWidth: 'none', aspectRatio: '16/9' }}
        >
            <video
                autoPlay
                id="video"
                style={{ width: '100%', height: '100%' }}
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
                    fov: 5,
                    position: [0, 0, 10],
                }}
            >
                <ambientLight intensity={2.2} />
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
                <MemoizedRaccoon key={currentModel} modelPath={currentModel} />
            </Canvas>
            <div className="absolute top-2 left-2 right-2 flex justify-between z-10">
                <button
                    onClick={changeModel}
                    className="bg-[white] text-[#5b484a] py-1 px-3 sm:py-2 sm:px-4 rounded-full border-2 border-[#5b484a] shadow-md hover:bg-[white] hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-xs sm:text-sm"
                >
                    Change
                </button>
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
    const [modelScale, setModelScale] = useState(new Vector3(0, 0, 0));
    const [modelPosition, setModelPosition] = useState(new Vector3(0, 0, 0)); // y 좌표 조정

    useEffect(() => {
        headMeshRef.current = nodes.head_geo002;
        hairMeshRef.current = nodes.hair_geo;
        earsMeshRef.current = nodes.ears_geo;
        tuftsMeshRef.current = nodes.tufts_geo;
    }, [nodes, modelPath]);

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
                        ref.current.position
                            .set(
                                0,
                                0,
                                // x,y 좌표를 0으로 고정
                                position.z
                            )
                            .add(avatarPosition);
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

                        // 고정
                        ref.current.position.x = 0;
                        ref.current.position.y = -0.1;
                    }
                }
            );
        }
    });

    return (
        <primitive object={scene} scale={modelScale} position={modelPosition} />
    );
}

export default ChooseRaccoonHand;
