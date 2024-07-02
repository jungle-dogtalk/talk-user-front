import { useState, useEffect, useRef } from 'react';
import { apiCall } from './utils/apiCall';
import { API_LIST } from './utils/apiList';

export const useSpeechRecognition = (onResult, onError) => {
    const [recognizedText, setRecognizedText] = useState([]);
    const recognitionRef = useRef(null);

    const sendTextToServer = async (text) => {
        try {
            await apiCall(API_LIST.SEND_TEXT, { text });
        } catch (error) {
            console.error('텍스트 전송 오류: ', error);
        }
    };

    const startRecognition = () => {
        if (!window.webkitSpeechRecognition) {
            alert('Web Speech API is not supported in this browser.');
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.lang = 'ko-KR';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = true;

        // 음성인식 될 때마다 server에 전송
        recognition.onresult = (event) => {
            const speechResult = event.results[event.results.length - 1][0].transcript;
            setRecognizedText((prevText) => [...prevText, speechResult]);
            sendTextToServer(speechResult);
            if (onResult) onResult(speechResult);
        };

        recognition.onerror = (event) => {
            if (onError) onError(event.error);
        };

        recognition.onend = () => {
            console.log('음성 인식이 종료되었습니다. isRecognizing:', recognitionRef.current);
            // 음성인식 종료 버튼을 누르지 않아 참조가 해제된 상태가 아니라면 음성인식 재시작
            if (recognitionRef.current) {
                recognition.start();
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const stopRecognition = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
    };

    return {
        recognizedText,
        startRecognition,
        stopRecognition,
    };
};
