import React, { useEffect, useRef, useState } from 'react';
import './ChooseAvatarPage.css';
import logo from '../../assets/barking-talk.png'; // 로고 이미지 경로
import { Canvas, useFrame, useGraph } from '@react-three/fiber';
import { Color, Euler, Matrix4 } from 'three';
import { useGLTF } from '@react-three/drei';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let video;
let faceLandmarker;
let lastVideoTime = -1;
let headMesh;
let rotation;
let blendshapes = [];

const ChooseAvatarPage = () => {
    const webcamRef = useRef(null);
    const [url, setUrl] = useState("https://models.readyplayer.me/6682c315649e11cdd6dd8a8a.glb");

    const handleOnChange = (event) => {
        setUrl(event.target.value);
    };

    useEffect(() => {
        // 웹캠 스트림 설정
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                webcamRef.current.srcObject = stream;
            })
            .catch(error => {
                console.error("Error accessing webcam:", error);
            });

        const setup = async () => {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );
            faceLandmarker = await FaceLandmarker.createFromOptions(
                vision,
                {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                        delegate: "GPU"
                    },
                    outputFaceBlendshapes: true,
                    outputFacialTransformationMatrixes: true,
                    runningMode: "VIDEO"
                });
            video = document.getElementById('video');
            navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 }
            }).then((stream) => {
                video.srcObject = stream;
                video.addEventListener('loadeddata', predict);
            });
        };

        const predict = () => {
            let startTimeMs = performance.now();
            if (lastVideoTime !== video.currentTime) {
                lastVideoTime = video.currentTime;
                const result = faceLandmarker.detectForVideo(video, startTimeMs);
                if (result.facialTransformationMatrixes && result.facialTransformationMatrixes.length > 0 && result.faceBlendshapes && result.faceBlendshapes.length > 0) {
                    const matrix = new Matrix4().fromArray(result.facialTransformationMatrixes[0].data);
                    rotation = new Euler().setFromRotationMatrix(matrix);

                    blendshapes = result.faceBlendshapes[0].categories;
                }
            }
            requestAnimationFrame(predict);
        };

        setup();
    }, []);

    const handleRetry = () => {
        // 아바타 변경 로직 (임의의 아바타 이미지 설정)

        const urls = [
            "https://models.readyplayer.me/668293698a5ecca99f9b06c1.glb",
            "https://models.readyplayer.me/6682c315649e11cdd6dd8a8a.glb",
            "https://models.readyplayer.me/66857649a6014cc4b10e8f73.glb",
            "https://models.readyplayer.me/668d1456878f8e58dc12d758.glb",
            "https://models.readyplayer.me/668d14b51847c40762af418e.glb",
            "https://models.readyplayer.me/668d14d83369b0756b9c487c.glb",
            "https://models.readyplayer.me/668d14e93369b0756b9c48b0.glb",
            "https://models.readyplayer.me/668d14f634432ca7edca24af.glb",
            "https://models.readyplayer.me/668d150a7a0772243cddc4af.glb",
            "https://models.readyplayer.me/668d152063703fb7530e8a0d.glb"
        ];
        const randomUrl = urls[Math.floor(Math.random() * urls.length)];
        setUrl(randomUrl);
    };

    const handleSelect = () => {
        // 아바타 선택 후 처리 로직
        console.log("Selected avatar url:", url);
    };

    return (
        <div className="avatar-page">
            <div className="header">
                <img src={logo} alt="명톡 로고" className="logo" />
            </div>
            <div className="content">
                <div className="section">
                    <h2>나의 모습</h2>
                    <video ref={webcamRef} autoPlay id='video' className="video-box"></video>
                </div>
                <div className="section">
                    <h2>내 아바타</h2>
                    <Canvas className="avatar-box"
                        camera={{
                            fov: 25
                        }}>
                        <ambientLight intensity={0.5} />
                        <pointLight position={[1, 1, 1]} color={new Color(1, 0, 0)} intensity={0.5} />
                        <pointLight position={[-1, 0, 1]} color={new Color(0, 1, 0)} intensity={0.5} />

                        <Avatar url={url} />
                    </Canvas>
                </div>
            </div>
            <div className="buttons">
                <button className="action-button" onClick={() => window.history.back()}>뒤로가기</button>
                <button className="action-button" onClick={handleRetry}>다시 추천</button>
                <button className="action-button" onClick={handleSelect}>선택</button>
            </div>
        </div>
    );
};

function Avatar({ url }) {
    const avatar = useGLTF(`${url}?morphTargets=ARKit&textureAtlas=1024`);
    const { nodes } = useGraph(avatar.scene);
    useEffect(() => {
        headMesh = nodes.Wolf3D_Avatar;
    }, [nodes]);

    useFrame(() => {
        if (headMesh !== null) {
            blendshapes.forEach((blendshape) => {
                let index = headMesh.morphTargetDictionary[blendshape.categoryName];
                if (index >= 0) {
                    headMesh.morphTargetInfluences[index] = blendshape.score;
                }
            });
        }

        nodes.Head.rotation.set(rotation.x / 3, rotation.y / 3, rotation.z / 3);
        nodes.Neck.rotation.set(rotation.x / 3, rotation.y / 3, rotation.z / 3);
        nodes.Spine1.rotation.set(rotation.x / 3, rotation.y / 3, rotation.z / 3);
    });

    return <primitive object={avatar.scene} position={[0, -1.65, 4]} />;
}

export default ChooseAvatarPage;
