import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';

const Model = () => {
    const { scene } = useGLTF('/raccoon_head.glb');
    const modelRef = useRef();

    return (
        <>
            <primitive
                object={scene}
                ref={modelRef}
                position={[0, -1, 0]}
                rotation={[-0.1, -0.1, -0.1]}
                scale={7}
            />
        </>
    );
};

const GLTFModel = () => {
    return (
        <Canvas
            style={{
                height: '300px',
                width: '300px',
                position: 'absolute',
                bottom: '0px',
                right: '10px',
            }}
        >
            <ambientLight intensity={0.5} />
            <directionalLight position={[0, 5, 20]} intensity={2} />
            <Model />
            <OrbitControls
                enablePan={false}
                enableZoom={false}
                enableRotate={true}
            />
        </Canvas>
    );
};

export default GLTFModel;
