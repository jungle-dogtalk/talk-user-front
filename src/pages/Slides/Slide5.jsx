import React from 'react';
import SlideImage from '../../assets/Slide55.png';

const Slide5 = () => (
    <div className="content">
        <h2
            className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center mt-10"
            style={{ fontSize: '40px', marginBottom: '0' }}
        >
            '마이페이지에 보이는 건 뭐예요?'
        </h2>
        <br></br>
        <img
            src={SlideImage}
            alt="Slide5"
            style={{
                width: '1150px',
                height: 'auto',
                objectFit: 'cover',
            }}
        />
    </div>
);

export default Slide5;
