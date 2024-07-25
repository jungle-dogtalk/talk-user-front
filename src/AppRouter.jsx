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
import ProtectedRoute from './components/ProtectedRoute';
import VideoChatRoute from './components/VideoChatRoute';
import ChooseRaccoonPage from './pages/ChooseRaccoonPage/ChooseRaccoonPage';
import QuestionPage from './pages/QuestionPage/QuestionPage';

function AppRouter() {
    return (
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route
                path="/videochat"
                element={<ProtectedRoute component={VideoChatPage} />}
            />
            <Route
                path="/main"
                element={<ProtectedRoute component={MainPage} />}
            />
            <Route
                path="/profile"
                element={<ProtectedRoute component={ProfilePage} />}
            />
            <Route
                path="/report"
                element={<ProtectedRoute component={ReportPage} />}
            />
            <Route
                path="/review"
                element={<VideoChatRoute component={ReviewPage} />}
            />
            <Route
                path="/matching"
                element={<ProtectedRoute component={MatchingPage} />}
            />
            <Route
                path="/choose-avatar"
                element={<ProtectedRoute component={ChooseAvatarPage} />}
            />
            <Route
                path="/choose-raccoon"
                element={<ProtectedRoute component={ChooseRaccoonPage} />}
            />
            <Route
                path="/questions"
                element={<ProtectedRoute component={QuestionPage} />}
            />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}

export default AppRouter;
