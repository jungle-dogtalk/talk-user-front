import React from 'react';
import SlideImage from '../../assets/Slide22.png';

const Slide2 = () => (
    <div className="slide-content">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center mt-10">
            '미션은 어떻게 진행하나요?'
        </h2>
        <br />
        <br />
        <img
            src={SlideImage}
            alt="Slide2"
            className="slide-image"
            style={{
                width: '100%',
                height: 'auto',
                objectFit: 'cover',
            }}
        />
    </div>
);

export default Slide2;
