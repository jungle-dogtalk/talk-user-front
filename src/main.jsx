import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './redux/store';
import App from './App';
import io from 'socket.io-client';

import './index.css';

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
const randomNum = Math.floor(Math.random() * 9999);

const socket = io('http://localhost:5000', {
    query: { userId: 'user' + randomNum },
});

// const socket = io('https://api.barking-talk.org', {
//     query: { userId: 'user' + randomNum },
// });

socket.on('matched', (data) => {
    console.log('Matched! Session ID:', data.sessionId);
    location.href = '/videochat?sessionId=' + data.sessionId;
    // 매칭 성공 시 처리 로직
});

root.render(
    <Provider store={store}>
        <Router>
            <App />
        </Router>
    </Provider>
);
