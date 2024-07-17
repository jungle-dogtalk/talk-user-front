import React from 'react';
import SlideImage from '../../assets/Slide2.png';

const Slide2 = () => (
    <div className="content">
        <h2
            className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center mt-10"
            style={{ fontSize: '38px', marginBottom: '0' }}
        >
            '미션은 어떻게 진행하나요?'
        </h2>
        <img
            src={SlideImage}
            alt="Slide2"
            style={{
                width: '1100px',
                height: 'auto',
                objectFit: 'cover',
            }}
        />
    </div>
);

export default Slide2;
