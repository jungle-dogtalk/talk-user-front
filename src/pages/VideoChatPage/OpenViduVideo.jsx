import React, { useRef, useEffect } from 'react';

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
            className={`w-full h-full object-fill ${
                props.isMirrored ? 'scale-x-[-1]' : ''
            }`}
        />
    );
};

export default OpenViduVideo;
