import React, { useState, useEffect } from 'react';
import Slide1 from '../pages/Slides/Slide1';
import Slide2 from '../pages/Slides/Slide2';
import Slide3 from '../pages/Slides/Slide3';
import Slide4 from '../pages/Slides/Slide4';
import Slide5 from '../pages/Slides/Slide5';

const SpeechBubble = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [<Slide1 />, <Slide2 />, <Slide3 />, <Slide4 />, <Slide5 />];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000); // 5초 간격으로 슬라이드 변경

        return () => clearInterval(interval); // 컴포넌트가 언마운트될 때 인터벌 제거
    }, [slides.length]);

    return (
        <div className="speech-bubble relative">
            {slides[currentSlide]}
            <div className="absolute left-5 top-1/2 transform -translate-y-1/2 z-10">
                <button
                    onClick={() =>
                        setCurrentSlide(
                            (prev) => (prev - 1 + slides.length) % slides.length
                        )
                    }
                    className="text-3xl font-bold"
                >
                    {'<<'}
                </button>
            </div>
            <div className="absolute right-5 top-1/2 transform -translate-y-1/2 z-10">
                <button
                    onClick={() =>
                        setCurrentSlide((prev) => (prev + 1) % slides.length)
                    }
                    className="text-3xl font-bold"
                >
                    {'>>'}
                </button>
            </div>
        </div>
    );
};

export default SpeechBubble;
