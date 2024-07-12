import { apiCall } from '../utils/apiCall';
import { API_LIST } from '../utils/apiList';
import axios from 'axios';

const OPENVIDU_SERVER_URL = import.meta.env.VITE_OPENVIDU_SERVER_URL;
const OPENVIDU_SERVER_SECRET = import.meta.env.VITE_OPENVIDU_SERVER_SECRET;

const getTokenForTest = async (sessionId) => {
    const createSession = (sessionId) => {
        return new Promise((resolve, reject) => {
            var data = JSON.stringify({ customSessionId: sessionId });
            axios
                .post(`${OPENVIDU_SERVER_URL}/openvidu/api/sessions`, data, {
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

    return createSession(sessionId).then((sessionId) => createToken(sessionId));
};

const getToken = async (sessionId, userId) => {

    const parameters = {
        sessionId,
        userId,
    }
    const result = await apiCall(API_LIST.GET_TOKEN, parameters);
    if (!result.status) {
        alert('토큰 발급 실패');
        return;
    }

    return result.data;
};

export { getToken, getTokenForTest };
