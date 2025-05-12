import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './GamePage.css';

const path = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 2, y: 0 },
  { x: 2, y: 1 },
  { x: 2, y: 2 },
  { x: 3, y: 2 },
  { x: 4, y: 2 },
  { x: 5, y: 2 },
  { x: 5, y: 1 },
  { x: 5, y: 0 },
];

function FrogGame() {
  const [position, setPosition] = useState(0);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [fingerCount, setFingerCount] = useState({ right: 0, left: 0 });
  const [countdown, setCountdown] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const calculateExpectedMoves = () => {
    const current = path[position];
    const next = path[position + 1];
    let direction = null;

    if (next.x > current.x) direction = 'right';
    else if (next.x < current.x) direction = 'left';
    else if (next.y > current.y) direction = 'down';
    else if (next.y < current.y) direction = 'up';

    let count = 0;
    for (let i = position + 1; i < path.length; i++) {
      const from = path[i - 1];
      const to = path[i];

      const isSameDirection =
        (direction === 'right' && to.x === from.x + 1 && to.y === from.y) ||
        (direction === 'left' && to.x === from.x - 1 && to.y === from.y) ||
        (direction === 'down' && to.y === from.y + 1 && to.x === from.x) ||
        (direction === 'up' && to.y === from.y - 1 && to.x === from.x);

      if (isSameDirection) {
        count++;
      } else {
        break;
      }
    }
    
    return count;
  };
  const startDetection = () => {
    setIsDetecting(true);
    setCountdown(5);
  
    const ws = new WebSocket('ws://localhost:8000/ws/finger_count');
    
    ws.onopen = () => {
      console.log('WebSocket connection established');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setFingerCount({
        right: data.right_hand,
        left: data.left_hand
      });
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error. Please try again.');
      setIsDetecting(false);
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          ws.close();
          handleGestureSubmit();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearInterval(countdownInterval);
      ws.close();
    };
  };
  const handleGestureSubmit = () => {
    const totalFingers = fingerCount.right + fingerCount.left;
    setInput(totalFingers.toString());
    setIsDetecting(false);
    
    if (totalFingers > 0) {
      timerRef.current = setTimeout(() => {
        handleMove(totalFingers);
      }, 1000);
    }
  };

  const handleMove = (steps = null) => {
    const moveSteps = steps !== null ? steps : parseInt(input);
    
    if (isNaN(moveSteps) || moveSteps < 1) {
      setError('Please show a valid number of fingers');
      return;
    }

    const expectedMoves = calculateExpectedMoves();
    
    if (position + moveSteps >= path.length) {
      setError("That's too far!");
      return;
    }

    if (moveSteps === expectedMoves) {
      setPosition(position + moveSteps);
      setInput('');
      setError('');
      
      // const audio = new Audio('/sounds/correct.mp3');
      // audio.play();
      
      if (position + moveSteps === path.length - 1) {
        setTimeout(() => navigate('/success'), 800);
      }
    } else {
      setError(`sad`);
      
      // const audio = new Audio('/sounds/wrong.mp3');
      // audio.play();
    }
  };

  return (
    <div className="game-container">
      
      <div className="path-grid">
        {path.map((p, idx) => (
          <div
            key={idx}
            className="leaf"
            style={{
              left: `${p.x * 80}px`,
              top: `${p.y * 80}px`,
            }}
          >
            🍀
            {position === idx && <div className="frog">🐸</div>}
            {idx === path.length - 1 && <div className="flag">🚩</div>}
          </div>
        ))}
      </div>

      {isDetecting ? (
        <div className="detection-container">
          <video 
            ref={videoRef}
            className="video-display"
            autoPlay
          />
          <div className="countdown-display">
            <p>Show {calculateExpectedMoves()} finger{calculateExpectedMoves() !== 1 ? 's' : ''} in {countdown} seconds</p>
            <div className="finger-count">
              Right hand: {fingerCount.right} | Left hand: {fingerCount.left}
            </div>
          </div>
        </div>
      ) : (
        <div className="input-controls">
          
          <div className="button-group">
            <button className="gesture-button" onClick={startDetection}>
              Camera
            </button>
            
            <div className="manual-input">
              <input
                type="number"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="..."
                className={error ? 'invalid-input' : ''}
              />
              <button onClick={() => handleMove()}>Go</button>
            </div>
          </div>
          
          {error && <div className="error-msg">{error}</div>}
        </div>
      )}
    </div>
  );
}

export default FrogGame;