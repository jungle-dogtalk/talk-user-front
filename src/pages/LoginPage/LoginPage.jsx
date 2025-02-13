import React, { useState, useEffect } from 'react'; // React와 React 훅스 가져오기
import { useNavigate } from 'react-router-dom'; // 리디렉션을 위해 useNavigate 훅 가져오기
import { useDispatch, useSelector } from 'react-redux'; // Redux 훅스 가져오기
import { loginUser } from '../../redux/slices/userSlice'; // 로그인 액션 가져오기
import logo from '../../assets/barking-talk2.png'; // 로고 이미지 경로

const LoginPage = () => {
    const [username, setUsername] = useState(''); // 사용자 이름 상태 변수와 설정 함수
    const [password, setPassword] = useState(''); // 비밀번호 상태 변수와 설정 함수
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token, error, loading } = useSelector((state) => state.user); // Redux store의 상태를 읽어오는 데 사용.

    // 로그인 핸들러
    const handleLogin = async (e) => {
        e.preventDefault(); // 폼 제출시 페이지가 새로고침 되는 것 방지
        const resultAction = await dispatch(loginUser({ username, password })); // 비동기 액션을 디스패치하여 로그인 요청 보내기

        // resultAction이 성공적으로 완료되었는지
        if (loginUser.fulfilled.match(resultAction)) {
            navigate('/main'); // 로그인 성공 시 메인 페이지로 이동
        } else {
            alert('ID/PW 확인해주세요.'); // 로그인 실패 시 알림
        }
    };

    // 이미 로그인되어 있는 경우 메인 페이지로 리디렉션
    useEffect(() => {
        if (token) {
            navigate('/main');
        }
    }, [token, navigate]);

    return (
        <div className="min-h-screen flex flex-col bg-[#f7f3e9]">
            <div className="flex flex-col justify-center items-center flex-1 px-4 sm:px-8 lg:px-32">
                <img
                    src={logo}
                    alt="명톡 로고"
                    className="w-40 sm:w-62 lg:w-[24rem] mb-8 sm:mb-16 lg:mb-20"
                />
                <form
                    onSubmit={handleLogin}
                    className="space-y-8 sm:space-y-16 w-full max-w-xs sm:max-w-md lg:max-w-5xl flex flex-col items-center"
                >
                    <div className="space-y-4 sm:space-y-8 w-full flex flex-col sm:flex-row justify-center items-center">
                        <div className="flex flex-col space-y-4 sm:space-y-10 w-full sm:w-3/4">
                            <div className="flex flex-col sm:flex-row items-center space-x-0 sm:space-x-8">
                                <label
                                    htmlFor="username"
                                    className="block text-xl sm:text-3xl lg:text-5xl font-medium text-gray-700 w-full sm:w-32"
                                >
                                    ID
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="아이디를 입력하세요"
                                    required
                                    className="block px-4 py-2 sm:px-8 sm:py-6 lg:px-10 lg:py-8 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xl sm:text-3xl lg:text-4xl w-full"
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row items-center space-x-0 sm:space-x-8">
                                <label
                                    htmlFor="password"
                                    className="block text-xl sm:text-3xl lg:text-5xl font-medium text-gray-700 w-full sm:w-32"
                                >
                                    PW
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="비밀번호를 입력하세요"
                                    required
                                    className="block px-4 py-2 sm:px-8 sm:py-6 lg:px-10 lg:py-8 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xl sm:text-3xl lg:text-4xl w-full"
                                />
                            </div>
                        </div>
                        <div className="w-full sm:w-1/4 sm:pl-8">
                            <button
                                type="submit"
                                className="mt-4 sm:mt-0 py-4 sm:py-10 lg:py-12 px-10 lg:px-12 bg-[#a16e47] text-white rounded-full border-2 border-[#a16e47] shadow-lg hover:bg-[#8f5f38] hover:shadow-xl transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8f5f38] text-xl sm:text-3xl lg:text-5xl w-full text-center whitespace-nowrap"
                            >
                                로그인
                            </button>
                        </div>
                    </div>
                </form>
                {loading && (
                    <p className="mt-8 sm:mt-12 text-center text-gray-500 text-xl sm:text-3xl lg:text-5xl">
                        Loading...
                    </p>
                )}
                {error && (
                    <p className="mt-8 sm:mt-12 text-center text-red-500 text-xl sm:text-3xl lg:text-5xl">
                        {error}
                    </p>
                )}
                <div className="mt-12 text-center text-xl sm:text-3xl lg:text-5xl">
                    <a
                        href="/signup"
                        className="text-gray-600 hover:underline transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        회원가입 하기
                    </a>
                    <span className="mx-4 sm:mx-8 lg:mx-12">|</span>
                    <a
                        href="/forgot-password"
                        className="text-gray-600 hover:underline transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        ID/PW 찾기
                    </a>
                    <div className="mt-4 sm:hidden"></div> {/* 작은 화면에서만 마진 추가 */}
                </div>
            </div>
        </div>
    );
    
};

export default LoginPage;
