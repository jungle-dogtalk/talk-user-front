import React from 'react';
import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import PropTypes from 'prop-types';

const ProtectedRoute = ({ component: Component }) => {
    const token = Cookies.get('token');
    const user = Cookies.get('user');
    
    if (!token || !user) {
        alert('로그인 하세요!');
        return <Navigate to="/" replace />;
    }

    return <Component />;
};

ProtectedRoute.propTypes = {
    component: PropTypes.elementType.isRequired,
};

export default ProtectedRoute;
