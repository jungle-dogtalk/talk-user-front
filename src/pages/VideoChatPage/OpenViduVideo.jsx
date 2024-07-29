import React, { useRef, useEffect } from 'react';
import styles from './VideoChatPage.module.css';

const OpenViduVideo = ({ streamManager, isPublisher }) => {
    const videoRef = useRef();
    const canvasRef = useRef();

    useEffect(() => {
        if (streamManager && videoRef.current) {
            streamManager.addVideoElement(videoRef.current);
        }
    }, [streamManager]);

    return (
        <video
            autoPlay={true}
            ref={videoRef}
            className={`w-full h-full object-fill ${
                props.isMirrored ? 'scale-x-[-1]' : ''
            }`}
        />
    );
};

export default OpenViduVideo;
