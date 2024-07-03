import { useState, useEffect, useRef } from 'react';
import './App.css';
import { apiCall, apiCallWithFileData } from '../src/utils/apiCall';
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
    const [whisperText, setWhisperText] = useState(''); // 오디오 데이터 기반 AI 요청 후 응답 상태
    const [whisperInterest, setWhisperInterest] = useState(''); // 오디오 데이터 기반 AI 요청 후 응답 상태
    const [isRecording, setIsRecording] = useState(false);
    const [mediaBlobUrl, setMediaBlobUrl] = useState(null);

    const mediaRecorderRef = useRef(null);
    const mediaChunksRef = useRef([]);
    const audioRef = useRef(null);

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

    const handleAudioStop = async (blob) => {
        console.log('Recorded blob:', blob);
        console.log('Blob type:', blob.type);

        const file = new File([blob], 'audio.webm', { type: 'audio/webm' });
        console.log('File:', file);
        console.log('File type:', file.type);

        const parameters = {};
        const response = await apiCallWithFileData(API_LIST.UPLOAD_AUDIO, parameters, file);

        if (response.status) {
            console.log('STT Result:', response.data.text); // 음성 데이터 기반 STT
            console.log('AI answer: ', response.data.answer); // STT 기반 AI 응답
            setWhisperText(response.data.text);
            setWhisperInterest(response.data.answer);
        } else {
            alert('STT 에러 발생');
        }
        setIsRecording(false);
    };

    const startRecording = async () => {
        if (!isRecording) {
            setIsRecording(true);
            mediaChunksRef.current = [];

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    mediaChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                const blob = new Blob(mediaChunksRef.current, { type: 'audio/webm' });
                const blobUrl = URL.createObjectURL(blob);
                setMediaBlobUrl(blobUrl);
                handleAudioStop(blob);
            };

            mediaRecorderRef.current.start();
        }
    };

    const stopRecording = () => {
        if (isRecording && mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
            setIsRecording(false);
        }
    };

    return (
        <>
            <h1>Vite + React</h1>
            {/* <div>
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
            </div> */}

            <br />

            <div>
                <h2>음성인식 테스트 (Web Speech API + OpenAI API)</h2>
                <button onClick={startRecognition}>음성인식 시작</button>
                <button onClick={handleStopRecognition}>음성인식 종료</button>
                <p>
                    인식된 텍스트: {recognizedText.length > 0 ? recognizedText.join('. ') : '없음'}
                </p>
                <p>AI 응답 - 주제: {responseTitle}</p>
                <p>AI 응답 - 관심사: {responseInterest}</p>
            </div>

            <div>
                <h2>음성녹음 테스트 (MediaRecorder + Whisper + OpenAI API)</h2>
                <button onClick={startRecording}>녹음 시작</button>
                <button onClick={stopRecording}>녹음 종료</button>
            </div>
            <br />
            <div>
                {mediaBlobUrl && <audio ref={audioRef} src={mediaBlobUrl} controls />}
                <p>음성 녹음 STT 결과: {whisperText}</p>
                <p>STT 기반 AI 응답 - 관심사: {whisperInterest}</p>
            </div>
        </>
    );
}

export default App;
