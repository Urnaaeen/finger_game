import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';

const GameEndPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Run confetti for 3 seconds
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

 return (
  <div
    style={{
      backgroundImage: 'url("/images/ehnii-togloom-tugsgul.png")',
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundColor: '#F9F1FF', // ← энэ хэсэгт зургийн фоны өнгийг тохируул
      width: '100vw',
      height: '100vh',
      position: 'relative',
      overflow: 'hidden',
    }}
  />
);


};

export default GameEndPage;
