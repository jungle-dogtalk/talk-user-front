import React from 'react';
import { Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage/LoginPage';
import SignUpPage from './pages/SignUpPage/SignUpPage';
import VideoChatPage from './pages/VideoChatPage/VideoChatPage';
import MainPage from './pages/MainPage/MainPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import ReportPage from './pages/ReportPage/ReportPage';
import ReviewPage from './pages/ReviewPage/ReviewPage';
import MatchingPage from './pages/MatchingPage/MatchingPage';
import ChooseAvatarPage from './pages/ChooseAvatarPage/ChooseAvatarPage';
import NotFoundPage from './pages/NotFoundPage/NotFoundPage';

function AppRouter() {
    return (
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/videochat" element={<VideoChatPage />} />
            <Route path="/main" element={<MainPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/matching" element={<MatchingPage />} />
            <Route path="/choose-avatar" element={<ChooseAvatarPage />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}

export default AppRouter;
