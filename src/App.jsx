import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import AppRouter from './AppRouter';
import { setUserFromLocalStorage } from './redux/slices/userSlice';
import Cookies from 'js-cookie'; // js-cookie 라이브러리 임포트

function App() {
    // Redux 디스패치를 초기화하여 사용
    const dispatch = useDispatch();

    // 컴포넌트가 마운트될 때 실행되는 useEffect
    useEffect(() => {
        // 쿠키에서 토큰과 사용자 정보 가져오기
        const token = Cookies.get('token');
        const user = Cookies.get('user');

        if (token && user) {
            try {
                const parsedUser = JSON.parse(user);
                dispatch(
                    setUserFromLocalStorage({
                        userInfo: parsedUser,
                        token: token,
                    })
                );
            } catch (error) {
                console.error('Failed to parse user from localStorage:', error);
            }
        }
    }, [dispatch]);

    return <AppRouter />;
}

export default App;
