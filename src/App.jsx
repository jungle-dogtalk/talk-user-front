import { useState, useEffect } from 'react';
import './App.css';
import { apiCall } from '../src/utils/apiCall';
import { API_LIST } from '../src/utils/apiList';
import { useSpeechRecognition } from './useSpeechRecognition';

function App() {
    const [count, setCount] = useState(0);
    const [testData, setTestData] = useState([]);
    const [greeting, setGreeting] = useState('');
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [responseTitle, setTitle] = useState(''); // AI 응답 텍스트 저장 상태 (주제)
    const [responseInterest, setInterest] = useState(''); // AI 응답 텍스트 저장 상태 (관심사)

    const { recognizedText, startRecognition, stopRecognition } = useSpeechRecognition(
        (text) => console.log('인식된 텍스트:', text),
        (error) => console.error('음성인식 오류:', error)
    );

    useEffect(() => {
        fetchTestData();
    }, []);

    const fetchTestData = async () => {
        setLoading(true);
        const response = await apiCall(API_LIST.TEST_MULTIPLE_DATA);
        if (response.status) {
            setTestData(response.data);
            setLoading(false);
        } else {
            alert('에러 발생');
            setLoading(false);
        }
    };

    const fetchGreeting = async () => {
        if (!name) {
            alert('이름을 입력해주세요.');
            return;
        }

        const parameters = {
            name: name,
        };

        const response = await apiCall(API_LIST.TEST_GREETING, parameters);
        if (response.status) {
            setGreeting(response.data);
        }
    };

    const handleNameChange = (e) => {
        setName(e.target.value);
    };

    const askAIgetTitle = async () => {
        const response = await apiCall(API_LIST.ASK_AI_TITLE, {});
        if (response.status) {
            setTitle(response.data);
        } else {
            alert('AI 응답 에러 발생');
        }
    };

    const askAIgetInterest = async (text) => {
        const parameters = { query: text };
        const response = await apiCall(API_LIST.ASK_AI_INTER, parameters);
        if (response.status) {
            setInterest(response.data);
        } else {
            alert('AI 응답 에러 발생');
        }
    };

    const handleStopRecognition = async () => {
        stopRecognition();
        if (recognizedText.length > 0) {
            const combinedText = recognizedText.join('. ');
            console.log('합쳐진 스크립트(개인 스크립트): ' + combinedText);
            await askAIgetInterest(combinedText);
        }
        await askAIgetTitle();
    };

    return (
        <>
            <h1>Vite + React</h1>
            <div className="card">
                오른쪽 버튼을 눌러보세요 &nbsp;
                <button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
            </div>
            <div>
                <h2>테스트 API 호출해보기</h2>
                {loading ? (
                    <p>테스트 데이터를 가져오고 있습니다...</p>
                ) : testData.length > 0 ? (
                    <div>
                        {testData.map((item) => (
                            <div key={item.id} style={{ margin: '10px 0' }}>
                                <span style={{ marginRight: '10px' }}>ID: {item.id}</span>
                                <span>이름: {item.name}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>데이터를 불러오지 못했습니다.</p>
                )}
                <button onClick={fetchTestData}>테스트 데이터 가져오기</button>
            </div>

            <br />

            <div>
                <h2>음성인식 테스트</h2>
                <button onClick={startRecognition}>음성인식 시작</button>
                <button onClick={handleStopRecognition}>음성인식 종료</button>
                <p>
                    인식된 텍스트: {recognizedText.length > 0 ? recognizedText.join('. ') : '없음'}
                </p>
                <p>AI 응답 - 주제: {responseTitle}</p>
                <p>AI 응답 - 관심사: {responseInterest}</p>
            </div>
        </>
    );
}

export default App;
