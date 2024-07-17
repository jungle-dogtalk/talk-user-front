import React from 'react';
import SlideImage from '../../assets/Slide22.png';

const Slide2 = () => (
    <div className="content">
        <h2
            className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center mt-10"
            style={{ fontSize: '40px', marginBottom: '0' }}
        >
            '미션은 어떻게 진행하나요?'
        </h2>
        <br></br>
        <br></br>
        <img
            src={SlideImage}
            alt="Slide2"
            style={{
                width: '1250px',
                height: 'auto',
                objectFit: 'cover',
            }}
        />
    </div>
);

export default Slide2;
