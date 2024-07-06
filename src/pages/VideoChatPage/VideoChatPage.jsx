import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import './VideoChatPage.css';
import { OpenVidu } from 'openvidu-browser';
import axios from 'axios';
import OpenViduVideo from './OpenViduVideo';

const OPENVIDU_SERVER_URL = 'https://video.barking-talk.org';
const OPENVIDU_SERVER_SECRET = 'namanmu';

const VideoChatPage = () => {
    const [session, setSession] = useState(undefined);
    const [sessionId, setSessionId] = useState('');
    const [subscribers, setSubscribers] = useState([]);
    const [publisher, setPublisher] = useState(undefined);
    const [OV, setOV] = useState(undefined);

    const location = useLocation();

    const leaveSession = useCallback(() => {
        if (session) session.disconnect();

        setOV(undefined);
        setSession(undefined);
        setSessionId('');
        setSubscribers([]);
        setPublisher(undefined);
    }, [session]);

    useEffect(() => {
        window.addEventListener('beforeunload', leaveSession);
        return () => {
            window.removeEventListener('beforeunload', leaveSession);
        };
    }, [leaveSession]);

    useEffect(() => {
        // URL에서 sessionId 파라미터를 가져옵니다.
        const params = new URLSearchParams(location.search);
        const urlSessionId = params.get('sessionId');
        if (urlSessionId) {
            setSessionId(urlSessionId);
            joinSession(urlSessionId);
        }
    }, [location]);

    const joinSession = useCallback((sid) => {
        const OV = new OpenVidu();
        setOV(OV);
        const session = OV.initSession();
        setSession(session);

        session.on('streamCreated', (event) => {
            let subscriber = session.subscribe(event.stream, undefined);
            setSubscribers((prevSubscribers) => [
                ...prevSubscribers,
                subscriber,
            ]);
        });

        session.on('streamDestroyed', (event) => {
            setSubscribers((prevSubscribers) =>
                prevSubscribers.filter(
                    (sub) => sub !== event.stream.streamManager
                )
            );
        });

        getToken(sid).then((token) => {
            session
                .connect(token)
                .then(() => {
                    let publisher = OV.initPublisher(undefined);
                    setPublisher(publisher);
                    session.publish(publisher);
                })
                .catch((error) => {
                    console.log(
                        'There was an error connecting to the session:',
                        error.code,
                        error.message
                    );
                });
        });
    }, []);

    const getToken = (sessionId) => {
        return createSession(sessionId).then((sessionId) =>
            createToken(sessionId)
        );
    };

    const createSession = (sessionId) => {
        return new Promise((resolve, reject) => {
            var data = JSON.stringify({ customSessionId: sessionId });
            axios
                .post(OPENVIDU_SERVER_URL + '/openvidu/api/sessions', data, {
                    headers: {
                        Authorization:
                            'Basic ' +
                            btoa('OPENVIDUAPP:' + OPENVIDU_SERVER_SECRET),
                        'Content-Type': 'application/json',
                    },
                })
                .then((response) => {
                    console.log('CREATE SESION', response);
                    resolve(response.data.id);
                })
                .catch((response) => {
                    var error = Object.assign({}, response);
                    if (error?.response?.status === 409) {
                        resolve(sessionId);
                    } else {
                        console.log(error);
                        console.warn(
                            'No connection to OpenVidu Server. This may be a certificate error at ' +
                                OPENVIDU_SERVER_URL
                        );
                        if (
                            window.confirm(
                                'No connection to OpenVidu Server. This may be a certificate error at "' +
                                    OPENVIDU_SERVER_URL +
                                    '"\n\nClick OK to navigate and accept it. ' +
                                    'If no certificate warning is shown, then check that your OpenVidu Server is up and running at "' +
                                    OPENVIDU_SERVER_URL +
                                    '"'
                            )
                        ) {
                            window.location.assign(
                                OPENVIDU_SERVER_URL + '/accept-certificate'
                            );
                        }
                    }
                });
        });
    };

    const createToken = (sessionId) => {
        return new Promise((resolve, reject) => {
            var data = {};
            axios
                .post(
                    OPENVIDU_SERVER_URL +
                        '/openvidu/api/sessions/' +
                        sessionId +
                        '/connection',
                    data,
                    {
                        headers: {
                            Authorization:
                                'Basic ' +
                                btoa('OPENVIDUAPP:' + OPENVIDU_SERVER_SECRET),
                            'Content-Type': 'application/json',
                        },
                    }
                )
                .then((response) => {
                    console.log('TOKEN', response);
                    resolve(response.data.token);
                })
                .catch((error) => reject(error));
        });
    };

    return (
        <div className="video-chat-page">
            <div className="header">
                <h1>멍톡</h1>
                <button onClick={leaveSession}>Leave Session</button>
            </div>
            <div className="content">
                {session ? (
                    <div className="video-container">
                        <div className={`stream-container mirrored`}>
                            {publisher && (
                                <OpenViduVideo streamManager={publisher} />
                            )}
                            <div className="stream-label">{'나'}</div>
                        </div>
                        {subscribers.map((subscriber, index) => (
                            <div key={index} className="stream-container">
                                <OpenViduVideo streamManager={subscriber} />
                                <div className="stream-label">
                                    상대방 {index + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>Joining session...</p>
                )}
            </div>
        </div>
    );
};

export default VideoChatPage;
