import React from 'react';
import SlideImage from '../../assets/Slide3.png';

const Slide3 = () => (
    <div className="content">
        <h2
            className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center mt-10"
            style={{ fontSize: '35px', marginBottom: '0' }}
        >
            각 기능 사용법을 알려드릴게요!
        </h2>
        <br></br>
        <br></br>
        <br></br>
        <img
            src={SlideImage}
            alt="Slide3"
            style={{
                width: '1200px',
                height: 'auto',
                objectFit: 'cover',
            }}
        />
    </div>
);

export default Slide3;
