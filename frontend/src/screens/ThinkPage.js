import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ThinkPage.css"; 
import confetti from "canvas-confetti";

function App() {
  const navigate = useNavigate();
  const totalLevels = 5;
  const [userAnswer, setUserAnswer] = useState("");
  const [result, setResult] = useState("");
  const [level, setLevel] = useState(0);
  const [canRetry, setCanRetry] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const lastValidFingerCountRef = useRef(null);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operator, setOperator] = useState("+");
  const [isError, setIsError] = useState(false);


  const generateChallenge = () => {
    const operators = ["+", "-"];
    const op = operators[Math.floor(Math.random() * operators.length)];

    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;

    let res;
    switch (op) {
      case "+":
        res = n1 + n2;
        break;
      case "-":
        res = n1 - n2;
        break;
    }

    if (res < 1 || res > 10) {
      return generateChallenge();
    }

    setNum1(n1);
    setNum2(n2);
    setOperator(op);
    setCorrectAnswer(res);
    setUserAnswer("");
    setResult("");
    setCanRetry(false);
    lastValidFingerCountRef.current = null;
  };

  const videoRef = useRef(null);
  const ws = useRef(null);
  const [fingerCount, setFingerCount] = useState(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("🎥 Камер асаахад алдаа:", err);
      }
    };

    startCamera();

    ws.current = new WebSocket("ws://localhost:8765");

    ws.current.onopen = () => {
      console.log("✅ WebSocket холбогдлоо");
    };

    ws.current.onerror = (err) => {
      console.error("❌ WebSocket алдаа:", err);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.fingers !== undefined) {
        setFingerCount(data.fingers);
        if (data.fingers !== 0) {
          lastValidFingerCountRef.current = data.fingers;
        }
      }
    };

}, []);

useEffect(() => {
if (fingerCount !== null && !canRetry && !gameWon) {
setUserAnswer(String(fingerCount));
}
}, [fingerCount, canRetry, gameWon]);

function fireConfettiExplosion() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    spread: 360,
    ticks: 200,
    gravity: 0.9,
    scalar: 1.2,
    zIndex: 9999,
  };

  function shoot(x, y) {
    confetti({
      ...defaults,
      particleCount: count / 5,
      origin: { x, y }
    });
  }

  shoot(0.1, 0.5);
  shoot(0.3, 0.3);
  shoot(0.5, 0.5);
  shoot(0.7, 0.3);
  shoot(0.9, 0.5);
}

const handleCheck = () => {
  if (gameWon) return;

  if (userAnswer === "") {
    setIsError(true);
  setTimeout(() => setIsError(false), 500); 
  setCanRetry(true);
    return;
  }

  const isCorrect = parseInt(userAnswer, 10) === correctAnswer;

  if (isCorrect) {
    fireConfettiExplosion(); // 🎇 EXTRA explosion

    if (level + 1 === totalLevels) {
      setGameWon(true);
      setResult("🎉 Баяр хүргэе! Та хожлоо!");
    } else {
      setLevel((prev) => prev + 1);
      setTimeout(() => {
        generateChallenge();
      }, 4000);
    }
    setCanRetry(false);
  } else {
  setIsError(true);
  setTimeout(() => setIsError(false), 500); 
  setCanRetry(true);
}
};
const progressWidth = ((level + (gameWon ? 1 : 0)) / totalLevels) * 100 + "%";

useEffect(() => {
generateChallenge();
}, []);

return (
<div className="game-container">
<div className="top-bar">
<button
aria-label="Pause game"
className="pause-button"
                onClick={() => navigate('/page1/pause')}

>
<span className="pause-icon">
<div></div>
<div></div>
</span>
</button>    <div className="progress-wrapper" aria-label="Level progress bar">
      <div className="level-progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={totalLevels} aria-valuenow={level}>
        <div
          className="level-progress-fill"
          style={{ width: progressWidth }}
        ></div>
      </div>
    </div>
  </div>

  <main className="game-main">
    <section className="expression-row" aria-label="Math expression">
  <div className="expression-box" aria-live="polite">
    <div className="fruit-container" aria-hidden="true" role="presentation">
      {Array.from({ length: num1 }, (_, i) => (
        <span key={i} role="img" aria-label="apple">🍎</span>
      ))}
    </div>
  </div>

  <div className="operator-box" aria-hidden="true">{operator}</div>

  <div className="expression-box" aria-live="polite">
    <div className="fruit-container" aria-hidden="true" role="presentation">
      {Array.from({ length: num2 }, (_, i) => (
        <span key={i} role="img" aria-label="apple">🍎</span>
      ))}
    </div>
  </div>
</section>
    {/* <section className="operator-box" aria-label="Equals sign">=</section> */}
  <div className="operator-box" aria-hidden="true">=</div>
    
    <section className="right-half expression-row">
  <video
  className={`video-box ${isError ? "error-shake" : ""}`}
  ref={videoRef}
  autoPlay
  muted
  playsInline
/>
      <input
        type="number"
        aria-label="Your answer input"
        min="1"
        max="10"
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        disabled={gameWon}
      />
      <button
        onClick={handleCheck}
        disabled={gameWon && !canRetry}
        className="check-btn"
        aria-live="assertive"
      >
        {gameWon ? "Тоглоом дууссан" : "Шалгах"}
      </button>

      <div className="check-result" aria-live="polite">
        {result}
      </div>
    </section>
  </main>
</div>
);
}

export default App; 