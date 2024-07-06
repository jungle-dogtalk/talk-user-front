import React, { useEffect, useRef, useState } from 'react';
import './VideoChatPage.css';

const VideoChatPage = () => {
    const handleLogout = () => {};

    return (
        <div className="video-chat-page">
            <div className="header">
                <h1>멍톡</h1>
                <button onClick={handleLogout}>Logout</button>
            </div>
            <div className="content">
                <div className="video-container">
                    <div className={`stream-container mirrored`}>
                        {/* <video id="localVideo" autoPlay={true} ref={videoRef} /> */}
                        <div className="stream-label">{'나'}</div>
                    </div>
                    {/* {subscribers.map((subscriber, index) => (
                        <div key={index} className="stream-container">
                            <video
                                id={`subscriber-video-${index}`}
                                autoPlay={true}
                            />
                            <div className="stream-label">
                                상대방 {index + 1}
                            </div>
                        </div>
                    ))} */}
                </div>
            </div>
        </div>
    );
};

export default VideoChatPage;
