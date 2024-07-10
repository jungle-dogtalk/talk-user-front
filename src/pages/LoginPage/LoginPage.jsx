import React, { useState, useEffect } from 'react'; // React와 React 훅스 가져오기
import { useNavigate } from 'react-router-dom'; // 리디렉션을 위해 useNavigate 훅 가져오기
import { useDispatch, useSelector } from 'react-redux'; // Redux 훅스 가져오기
import { loginUser } from '../../redux/slices/userSlice'; // 로그인 액션 가져오기
import logo from '../../assets/barking-talk.png'; // 로고 이미지 경로

const LoginPage = () => {
    const [username, setUsername] = useState(''); // 사용자 이름 상태 변수와 설정 함수
    const [password, setPassword] = useState(''); // 비밀번호 상태 변수와 설정 함수
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token, error,loading  } = useSelector((state) => state.user); // Redux store의 상태를 읽어오는 데 사용.

    const handleLogin = async (e) => {
        e.preventDefault(); // 폼 제출시 페이지가 새로고침 되는 것 방지
        const resultAction = await dispatch(loginUser({ username, password })); // 비동기 액션을 디스패치하여 로그인 요청 보내기

        // resultAction이 성공적으로 완료되었는지
        if (loginUser.fulfilled.match(resultAction)) {
            navigate('/main'); // 로그인 성공 시 메인 페이지로 이동
        }
        else{
            alert('ID/PW 확인해주세요.')
        }

    };

    useEffect(() => {
        if (token) {
            navigate('/main'); // 이미 로그인되어 있는 경우 메인 페이지로 리디렉션
        }
    }, [token, navigate]);

    return (
        <div className="min-h-screen flex flex-col bg-[#f7f3e9]">
            <header className="w-full bg-[#a16e47] p-6 flex items-center">
                <img src={logo} alt="명톡 로고" className="w-28 h-28" />
            </header>
            <div className="flex flex-col justify-center items-center flex-1 px-16">
                <img src={logo} alt="명톡 로고" className="w-96 mb-16" />
                <form onSubmit={handleLogin} className="space-y-8 w-full max-w-2xl flex flex-col items-center">
                    <div className="space-y-4 w-full flex justify-center items-center">
                        <div className="flex flex-col space-y-4 w-3/4">
                            <div className="flex items-center space-x-4">
                                <label htmlFor="username" className="block text-2xl font-medium text-gray-700 w-20">ID</label>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="아이디를 입력하세요"
                                    required
                                    className="flex-1 block px-6 py-4 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-2xl w-full"
                                />
                            </div>
                            <div className="flex items-center space-x-4">
                                <label htmlFor="password" className="block text-2xl font-medium text-gray-700 w-20">PW</label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="비밀번호를 입력하세요"
                                    required
                                    className="flex-1 block px-6 py-4 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-2xl w-full"
                                />
                            </div>
                        </div>
                        <button type="submit" className="ml-6 py-6 px-8 bg-[#a16e47] text-white rounded-md hover:bg-[#8f5f38] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8f5f38] text-3xl w-35 text-center whitespace-nowrap">
                            로그인
                        </button>
                    </div>
                </form>
                {loading && <p className="mt-8 text-center text-gray-500 text-3xl">Loading...</p>}
                {error && <p className="mt-8 text-center text-red-500 text-3xl">{error}</p>}
                <div className="mt-10 text-center">
                    <a href="/signup" className="text-3xl text-gray-600 hover:underline">회원가입 하기</a>
                    <span className="mx-6">|</span>
                    <a href="/forgot-password" className="text-3xl text-gray-600 hover:underline">ID/PW 찾기</a>
                </div>
            </div>
        </div>
    );
};
    
    
    export default LoginPage;
