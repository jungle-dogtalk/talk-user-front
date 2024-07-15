import React, { useRef, useEffect } from 'react';

const OpenViduVideo = ({ streamManager }) => {
    const videoRef = useRef();
    const canvasRef = useRef();

    useEffect(() => {
        if (streamManager && videoRef.current) {
            streamManager.addVideoElement(videoRef.current);
        }
    }, [streamManager]);

    useEffect(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            const applyChromaKey = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const imageData = ctx.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );
                const data = imageData.data;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    if (g > 100 && r < 100 && b < 100) {
                        data[i + 3] = 0; // Make pixel transparent
                    }
                }

                ctx.putImageData(imageData, 0, 0);
                requestAnimationFrame(applyChromaKey);
            };

            video.addEventListener('play', applyChromaKey);

            return () => {
                video.removeEventListener('play', applyChromaKey);
            };
        }
    }, []);

    return (
        <>
            <video autoPlay ref={videoRef} style={{ display: 'none' }} />
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        </>
    );
};

export default OpenViduVideo;
