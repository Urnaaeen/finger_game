import React from 'react';
import './PausePage.css'; 
import { useNavigate } from 'react-router-dom';

function PauseScreen() {
    const navigate = useNavigate();
  return (
    <div className="pause-screen">
      <div className="pause-container">
        <div className="pause-header">
          <h1>Тоглоом зогссон</h1>
        </div>
        <div className="pause-buttons">
          <PauseButton icon="▶" text="Үргэлжлүүлэх" onClick={() => navigate(-1)} />
          <PauseButton icon="↻" text="Дахиж эхлүүлэх" onClick={() => navigate('/page1')}/>
          <PauseButton icon="≡" text="Тоглоомууд" onClick={() => navigate('/')} />
        </div>
      </div>
    </div>
  );
}

function PauseButton({ icon, text, onClick }) {
    return (
      <div className="pause-button-Pause" onClick={onClick} style={{ cursor: 'pointer' }}>
        <div className="icon">{icon}</div>
        <div className="text">{text}</div>
      </div>
    );
  }

export default PauseScreen;
