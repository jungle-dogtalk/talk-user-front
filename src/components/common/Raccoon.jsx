import { Canvas, useFrame } from '@react-three/fiber';
import React, { useEffect, useState, useRef } from 'react';
import { Color, Euler, Matrix4, Vector3 } from 'three';
import { useGLTF } from '@react-three/drei';

import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let video;
let faceLandmarker;
let lastVideoTime = -1;

let rotation = null;
let blendshapes = [];
let faceLandmarks = [];
let transformationMatrix = null;

function Raccoon() {
    // const [url, setUrl] = useState(
    //   "https://assets.codepen.io/9177687/raccoon_head.glb"
    // );

    const [url, setUrl] = useState('/raccoon_head.glb');

    const handleOnChange = (e) => {
        setUrl(e.target.value);
    };

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

        video = document.getElementById('video');
        navigator.mediaDevices
            .getUserMedia({
                video: { width: 590, height: 340 },
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

            const result = faceLandmarker.detectForVideo(video, nowInMs);

            if (
                result.facialTransformationMatrixes &&
                result.facialTransformationMatrixes.length > 0 &&
                result.faceBlendshapes &&
                result.faceBlendshapes.length > 0 &&
                result.faceLandmarks &&
                result.faceLandmarks.length > 0
            ) {
                const matrix = new Matrix4().fromArray(
                    result.facialTransformationMatrixes[0].data
                );

                rotation = new Euler().setFromRotationMatrix(matrix);
                blendshapes = result.faceBlendshapes[0].categories;
                faceLandmarks = result.faceLandmarks[0];
                transformationMatrix = matrix;
                // console.log(result);
            }
        }

        requestAnimationFrame(predict);
    };

    useEffect(() => {
        setup();
    }, []);

    return (
        <div
            className="App"
            style={{ position: 'relative', width: 640, height: 480 }}
        >
            <video
                autoPlay
                id="video"
                style={{ width: 640, height: 480 }}
            ></video>
            <Canvas
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none',
                    width: 640,
                    height: 480,
                }}
                camera={{
                    fov: 6,
                    position: [0, 0, 10],
                }}
            >
                <ambientLight intensity={0.5} />
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
                <Avatar url={url} />
            </Canvas>
        </div>
    );
}

function Avatar({ url }) {
    const { scene, nodes } = useGLTF(url);
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
            // Set the rotation for all parts
            if (headMeshRef.current)
                headMeshRef.current.rotation.set(
                    rotation.x,
                    rotation.y,
                    rotation.z
                );
            if (hairMeshRef.current)
                hairMeshRef.current.rotation.set(
                    rotation.x,
                    rotation.y,
                    rotation.z
                );
            if (earsMeshRef.current)
                earsMeshRef.current.rotation.set(
                    rotation.x,
                    rotation.y,
                    rotation.z
                );
            if (tuftsMeshRef.current)
                tuftsMeshRef.current.rotation.set(
                    rotation.x,
                    rotation.y,
                    rotation.z
                );
        }

        if (transformationMatrix) {
            const position = new Vector3();
            position.setFromMatrixPosition(transformationMatrix);

            // Set the position for all parts
            if (headMeshRef.current)
                headMeshRef.current.position.copy(position);
            if (hairMeshRef.current)
                hairMeshRef.current.position.copy(position);
            if (earsMeshRef.current)
                earsMeshRef.current.position.copy(position);
            if (tuftsMeshRef.current)
                tuftsMeshRef.current.position.copy(position);
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
            // Example: Map the nose landmark (index 1) to the avatar's position
            const noseLandmark = faceLandmarks[1];
            const avatarPosition = new Vector3(
                (noseLandmark.x - 0.5) * 2, // Normalize x coordinate
                -(noseLandmark.y - 0.5) * 2, // Normalize y coordinate
                noseLandmark.z // z coordinate
            );

            // Set the position for all parts
            if (headMeshRef.current)
                headMeshRef.current.position.copy(avatarPosition);
            if (hairMeshRef.current)
                hairMeshRef.current.position.copy(avatarPosition);
            if (earsMeshRef.current)
                earsMeshRef.current.position.copy(avatarPosition);
            if (tuftsMeshRef.current)
                tuftsMeshRef.current.position.copy(avatarPosition);
        }
    });

    return (
        <>
            <primitive object={scene} />;
        </>
    );
}

export default Raccoon;
