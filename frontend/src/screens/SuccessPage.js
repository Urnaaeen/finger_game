import React from 'react';
import { useNavigate } from 'react-router-dom';

const SuccessPage = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        backgroundColor: '#FFF0F6',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Comic Sans MS", cursive, sans-serif',
        textAlign: 'center',
        padding: '20px',
      }}
    >
      <h1 style={{ fontSize: '60px', color: '#FF69B4' }}>🎉 Баяр хүргэе! 🎉</h1>
      
      <button
        onClick={() => navigate('/')}
        style={{
          fontSize: '24px',
          padding: '15px 30px',
          borderRadius: '15px',
          border: 'none',
          backgroundColor: '#FFB6C1',
          color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        }}
      >
        Нүүр хуудас руу очих
      </button>
    </div>
  );
};

export default SuccessPage;
