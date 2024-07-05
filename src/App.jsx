import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import AppRouter from './AppRouter';
import { setUserFromLocalStorage } from './redux/slices/userSlice';

function App() {
    const dispatch = useDispatch();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (token && user) {
            try {
                const parsedUser = JSON.parse(user);
                dispatch(setUserFromLocalStorage(parsedUser, token));
            } catch (error) {
                console.error('Failed to parse user from localStorage:', error);
            }
        }
    }, [dispatch]);

    return <AppRouter />;
}

export default App;
