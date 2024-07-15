import React from 'react';
import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import PropTypes from 'prop-types';

const VideoChatRoute = ({ component: Component }) => {
    const token = Cookies.get('token');
    const user = Cookies.get('user');
    const fromVideoChat = sessionStorage.getItem('fromVideoChat');

    if (!(token && user && fromVideoChat)) {
        alert('비디오 채팅을 통해서만 접근 가능합니다.');
    }

    return token && user && fromVideoChat ? (
        <Component />
    ) : (
        <Navigate to="/main" replace />
    );
};

VideoChatRoute.propTypes = {
    component: PropTypes.elementType.isRequired,
};

export default VideoChatRoute;
