import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

const ProtectedRoute = ({ component: Component }) => {
    const isAuthenticated = useSelector((state) => state.user.token);
    
    if (!isAuthenticated) {
        alert('로그인 하세요!');
        return <Navigate to="/" replace />;
    }

    return <Component />;
};

ProtectedRoute.propTypes = {
    component: PropTypes.elementType.isRequired,
};

export default ProtectedRoute;
