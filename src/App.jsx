import React from 'react';
import { Route, Routes } from 'react-router-dom';
import LoginPage from './components/pages/LoginPage/LoginPage';
import SignUpPage from './components/pages/SignUpPage/SignUpPage';
import VideoChatPage from './components/pages/VideoChatPage/VideoChatPage';
import MainPage from './components/pages/MainPage/MainPage';
import ProfilePage from './components/pages/ProfilePage/ProfilePage'; // 추가된 부분
import ReportPage from './components/pages/ReportPage/ReportPage'; // 추가된 부분
import ReviewPage from './components/pages/ReviewPage/ReviewPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/videochat" element={<VideoChatPage />} />
      <Route path="/main" element={<MainPage />} />
      <Route path="/profile" element={<ProfilePage />} /> {/* 추가된 부분 */}
      <Route path="/report" element={<ReportPage />} /> {/* 추가된 부분 */}
      <Route path="/review" element={<ReviewPage />} />
    </Routes>
  );
}

export default App;
