import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import './css/ThinkPage.css';

export default function ThinkPage() {
  const navigate = useNavigate();
  const totalLevels = 5;

  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operator, setOperator] = useState('+');
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [result, setResult] = useState("");
  const [level, setLevel] = useState(0);
  const [shakeCamera, setShakeCamera] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [shake, setShake] = useState(false);

  const videoRef = useRef(null);
  const ws = useRef(null);
  const lastValidFingerCountRef = useRef(null);
  const [fingerCount, setFingerCount] = useState(null);
  const successAudioRef = useRef(null);
  const failAudioRef = useRef(null);
  const thinkAudioRef = useRef(null);
  const totalAudioRef = useRef(null);
  const fruitAudioRef = useRef(null);

  const playSound = (ref, src) => {
    if (ref.current) {
      ref.current.pause();
      ref.current.currentTime = 0;
    }
    ref.current = new Audio(src);
    ref.current.play().catch(err => console.warn("Audio play error:", err));
  };

  const generateChallenge = () => {
    const operators = ["+", "-"];
    const op = operators[Math.floor(Math.random() * operators.length)];
    let n1 = Math.floor(Math.random() * 10) + 1;
    let n2 = Math.floor(Math.random() * 10) + 1;
    let res = op === "+" ? n1 + n2 : n1 - n2;

    while (res < 1 || res > 10) {
      n1 = Math.floor(Math.random() * 10) + 1;
      n2 = Math.floor(Math.random() * 10) + 1;
      res = op === "+" ? n1 + n2 : n1 - n2;
    }

    setNum1(n1);
    setNum2(n2);
    setOperator(op);
    setCorrectAnswer(res);
    setUserAnswer("");
    setResult("");
    lastValidFingerCountRef.current = null;

    if (op === "+") {
      playSound(totalAudioRef, '/sounds/total.mp3');
    } else {
      playSound(fruitAudioRef, '/sounds/fruit.mp3');
    }

    playSound(thinkAudioRef, '/sounds/think.mp3');
  };

  useEffect(() => {
    generateChallenge();
  }, []);

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

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.fingers !== undefined) {
        setFingerCount(data.fingers);
        if (data.fingers !== 0) {
          lastValidFingerCountRef.current = data.fingers;
        }
      }
    };

    const interval = setInterval(() => {
      if (
        videoRef.current &&
        ws.current &&
        ws.current.readyState === WebSocket.OPEN
      ) {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const image = canvas.toDataURL("image/jpeg");
        ws.current.send(JSON.stringify({ image }));
      }
    }, 300);

    return () => {
      clearInterval(interval);
      if (ws.current) ws.current.close();
    };
  }, []);

  useEffect(() => {
    if (
      fingerCount === 0 &&
      lastValidFingerCountRef.current !== null &&
      !gameWon
    ) {
      handleCheckWithValue(lastValidFingerCountRef.current);
    }
  }, [fingerCount]);

  useEffect(() => {
    if (gameWon) {
      confetti({ particleCount: 100, spread: 80 });
      setTimeout(() => navigate('/Success2'), 300);
    }
  }, [gameWon, navigate]);

  const handleCheck = () => {
    const value =
      userAnswer !== ""
        ? userAnswer
        : fingerCount > 0
          ? fingerCount
          : lastValidFingerCountRef.current;

    handleCheckWithValue(value);
  };

  const handleCheckWithValue = (value) => {
    if (value === "" || value === null || value === undefined) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }

    const answerToCheck = parseInt(value, 10);

    if (answerToCheck === correctAnswer) {
      playSound(successAudioRef, '/sounds/success.mp3');

      confetti({ particleCount: 100, spread: 80 });
      const nextLevel = level + 1;
      setLevel(nextLevel);
      setResult("🎉 Зөв байна!");

      if (nextLevel === totalLevels) {
        setGameWon(true);
      } else {
        setTimeout(() => {
          generateChallenge();
        }, 1000);
      }
    } else {
      playSound(failAudioRef, '/sounds/incorrect.mp3');

      setShake(true);
      setShakeCamera(true);
      setTimeout(() => {
        setShake(false);
        setShakeCamera(false);
      }, 600);
    }
  };

  const progressWidth = `${(level / totalLevels) * 100}%`;

  return (
    <div className="game-container">
      <div className="top-bar">
        <button aria-label="Pause game" className="pause-button" onClick={() => navigate('/page1/pause')}>
          <span className="pause-icon">
            <div></div>
            <div></div>
          </span>
        </button>
        <div className="progress-wrapper" aria-label="Level progress bar">
          <div className="level-progress-barThink" role="progressbar" aria-valuemin={0} aria-valuemax={totalLevels} aria-valuenow={level}>
            <div className="level-progress-fill" style={{ width: progressWidth }}></div>
          </div>
        </div>
      </div>

      <div className="learn-content">
        <section className="expression-row" aria-label="Math expression">
          <div className="expression-box">
            <div className="fruit-container">
              {Array.from({ length: num1 }, (_, i) => (
                <span key={i} role="img" aria-label="apple">🍎</span>
              ))}
            </div>
          </div>

          <div className="operator-box">{operator}</div>

          <div className="expression-box">
            <div className="fruit-container">
              {Array.from({ length: num2 }, (_, i) => (
                <span key={i} role="img" aria-label="apple">🍎</span>
              ))}
            </div>
          </div>

          <div className="operator-box">=</div>
        </section>

        <div className="learn-video-side">
          <video className="videoThink"
            ref={videoRef}
            autoPlay
            width="400px"
            height="480"
          />
          <h3 className="finger-count">
            Танигдсан хурууны тоо: {" "}
            <span className="highlighted-number">
              {fingerCount !== null
                ? fingerCount
                : lastValidFingerCountRef.current !== null
                  ? lastValidFingerCountRef.current
                  : "..."}
            </span>
          </h3>

          <input
            type="number"
            placeholder="Хэдэн жимс байна вэ?"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            className={`learn-input ${shake ? "shake" : ""}`}
          />
          <button
            onClick={handleCheck}
            className="learn-input check-btnThink" 
            style={{ marginTop: "10px" }}
          >
            Шалгах
          </button>

          <div className="result-text">{result}</div>
        </div>
      </div>
    </div>
  );
}
