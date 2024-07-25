import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

const VideoChatRoute = ({ component: Component }) => {
    const isAuthenticated = useSelector((state) => state.user.token);
    const fromVideoChat = sessionStorage.getItem('fromVideoChat');

    if (!(isAuthenticated && fromVideoChat)) {
        alert('비디오 채팅을 통해서만 접근 가능합니다.');
    }

    return isAuthenticated && fromVideoChat ? (
        <Component />
    ) : (
        <Navigate to="/main" replace />
    );
};

VideoChatRoute.propTypes = {
    component: PropTypes.elementType.isRequired,
};

export default VideoChatRoute;
