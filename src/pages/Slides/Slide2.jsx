import React from 'react';
import SlideImage from '../../assets/Slide2.png';

const Slide2 = () => (
    <div className="content">
        <h2
            className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center mt-10"
            style={{ fontSize: '35px', marginBottom: '0' }}
        >
            - 질문 미션 기능 -
        </h2>
        <img
            src={SlideImage}
            alt="Slide2"
            style={{
                width: '1200px',
                height: 'auto',
                objectFit: 'cover',
            }}
        />
    </div>
);

export default Slide2;
