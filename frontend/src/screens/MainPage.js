import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const cards = [
  {
    id: 1,
    image: '/images/learn.png',
    route: '/page1',
  },
  {
    id: 2,
    image: '/images/think.png',
    route: '/page2',
  },
  {
    id: 3,
    image: '/images/game.png',
    route: '/page3',
  },
  
];
const MainPage = () => {
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const [audioStarted, setAudioStarted] = useState(false);

const handleUserInteraction = () => {
  if (!audioStarted && audioRef.current) {
    audioRef.current.muted = false; // mute-ийг заавал цуцлах
    audioRef.current.play().then(() => {
      console.log("Audio started");
    }).catch((err) => {
      console.warn("Audio autoplay blocked:", err);
    });
    setAudioStarted(true);
  }
};

  useEffect(() => {
    audioRef.current = new Audio('/sounds/main.mp3');
    audioRef.current.loop = true;

    // Interaction бүрт autoplay эхлүүлэх
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('mousemove', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);

    return () => {
      // Цэвэрлэлт
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('mousemove', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className="main-container"
      style={{
        backgroundImage: "url('/images/start.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        width: "100vw",
        height: "100vh",
      }}
    >
      {cards.map((card) => (
        <div key={card.id} className="card">
          <div className="badge">
            {card.id.toString().padStart(2, '0')}
          </div>
          <div className="image-container">
            <img
              src={card.image}
              alt={`Card ${card.id}`}
              onClick={() => navigate(card.route)}
            />
          </div>
          <button className="play-button" onClick={() => navigate(card.route)}>
            Тоглох
          </button>
        </div>
      ))}
    </div>
  );
};

export default MainPage;
