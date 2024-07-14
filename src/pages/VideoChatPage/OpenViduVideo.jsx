import React, { useRef, useEffect } from 'react';
import styles from './VideoChatPage.module.css';

const OpenViduVideo = (props) => {
    const videoRef = useRef();

    useEffect(() => {
        if (props.streamManager && videoRef) {
            props.streamManager.addVideoElement(videoRef.current);
        }
    }, [props.streamManager]);

    return (
        <video
            autoPlay={true}
            ref={videoRef}
            className={props.isMirrored ? styles.mirrored : ''}
        />
    );
};

export default OpenViduVideo;
