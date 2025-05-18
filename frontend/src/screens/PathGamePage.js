import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import './css/GamePage.css';


export default function LearnPage() {
  const navigate = useNavigate();
  const totalLevels = 5;

  const [randomCount, setRandomCount] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [result, setResult] = useState("");
  const [level, setLevel] = useState(0);
  const [shakeCamera, setShakeCamera] = useState(false);
  const [canRetry, setCanRetry] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [shake, setShake] = useState(false);

  const gridRows = 10;
  const gridCols = 10;
  const leaf = "🍀";
  const [steps, setSteps] = useState([]);
  const [frogPosition, setFrogPosition] = useState({ x: 0, y: 0 });
  const [randomExpression, setRandomExpression] = useState([]);

  const videoRef = useRef(null);
  const ws = useRef(null);
  const lastValidFingerCountRef = useRef(null);
  const [fingerCount, setFingerCount] = useState(null);

  const generateChallenge = () => {
    const directions = ["right", "down", "right", "up"];
    const generatedSteps = directions.map((dir, i) => {
      if (dir === "down") {
        const options = [6, 7, 8];
        return options[Math.floor(Math.random() * options.length)];
      } else {
        return Math.floor(Math.random() * 4) + 1;
      }
    });
    let pathMap = Array.from({ length: gridRows }, () => Array(gridCols).fill(""));

    let x = 0, y = 0;
    pathMap[0][0] = "🐸";

    for (let i = 0; i < generatedSteps.length; i++) {
      const step = generatedSteps[i];
      for (let j = 0; j < step; j++) {
        switch (directions[i]) {
          case "right": x++; break;
          case "down": y++; break;
          case "up": y--; break;
        }

        // Шалгах хэсэг: x болон y-ийн хязгаарыг шалгах
        if (x >= 0 && x < gridCols && y >= 0 && y < gridRows) {
          pathMap[y][x] = leaf;
        }
      }
    }

    // Эцсийн байрлалд улаан туг тавина
    if (x >= 0 && x < gridCols && y >= 0 && y < gridRows) {
      pathMap[y][x] = "🚩";
    }

    setSteps(generatedSteps);
    setRandomExpression(pathMap);
    setLevel(0);
    setUserAnswer("");
    setResult("");
    setCanRetry(false);
    lastValidFingerCountRef.current = null;
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
      setTimeout(() => navigate('/page4'), 1500);
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


  const handleCheckWithValue = (value) => {
    const answerToCheck = parseInt(value);
    if (answerToCheck === steps[level]) {
      fireConfettiExplosion();
      const nextLevel = level + 1;
      setLevel(nextLevel);
      setResult("🎉 Зөв байна!");

      // 🐸 Мэлхийг дараагийн байрлалд шилжүүлнэ
      let { x, y } = frogPosition;
      const direction = ["right", "down", "right", "up"][level];
      const stepCount = steps[level];

      // Хуучин мэлхийг цэвэрлэнэ
      const newMap = randomExpression.map(row => row.slice());
      newMap[y][x] = leaf;

      // Мэлхийг зөвхөн сүүлийн байрлалд тавихын тулд давталтаар зөвхөн координат тооцоолно
      for (let i = 0; i < stepCount; i++) {
        switch (direction) {
          case "right": x++; break;
          case "down": y++; break;
          case "up": y--; break;
        }

        if (!(x >= 0 && x < gridCols && y >= 0 && y < gridRows)) {
          break; // хязгаараас гарвал зогсооно
        }
      }

      // Сүүлчийн байрлалд мэлхийг тавих
      if (x >= 0 && x < gridCols && y >= 0 && y < gridRows) {
        if (newMap[y][x] === leaf || newMap[y][x] === "🚩") {
          newMap[y][x] = "🐸";
        }
      }


      setRandomExpression(newMap);
      setFrogPosition({ x, y });

      if (nextLevel === steps.length) {
        setGameWon(true);
      } else {
        setTimeout(() => {
          setResult("");
          setUserAnswer("");
        }, 1000);
      }
    } else {
      //  if (failAudioRef.current) {
      //           failAudioRef.current.pause();
      //           failAudioRef.current.currentTime = 0;
      //       }
      //       failAudioRef.current = new Audio('/sounds/incorrect.mp3');
      //       failAudioRef.current.play();
 
            setShake(true);
            setShakeCamera(true);
            setTimeout(() => {
                setShake(false);
                setShakeCamera(false);
            }, 600);
            setCanRetry(true);
    }
  };


  const progressWidth = `${(level / totalLevels) * 100}%`;

  useEffect(() => {
    if (gameWon) {
      const timeout = setTimeout(() => {
        navigate("/Success3");
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [gameWon, navigate]);

  return (
    <div className="gamess-container">
      <style>

        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.15); }
            100% { transform: scale(1); }
          }
 
          @keyframes idleBounce {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-5px);
            }
          }
 
 
          @keyframes grow {
            from { transform: scale(0.5); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
 
          @keyframes jump {
            0% { transform: translateY(0); }
            30% { transform: translateY(-20px); }
            60% { transform: translateY(5px); }
            100% { transform: translateY(0); }
          }
 
          @keyframes coinSpin {
            0% {
              transform: rotateY(0deg);
              content: url('/images/1.png');
            }
            50% {
              transform: rotateY(90deg);
              content: url('/images/2.png');
            }
            100% {
              transform: rotateY(180deg);
              content: url('/images/3.png');
            }
          }
          
          
          @keyframes coinSpin {
            0% {
              transform: rotateY(0deg);
              content: url('/images/1.png');
            }
            50% {
              transform: rotateY(90deg);
              content: url('/images/2.png');
            }
            100% {
              transform: rotateY(180deg);
              content: url('/images/3.png');
            }
          } 
        `}
      </style>
      <div className="top-bar">
        <button aria-label="Pause game" className="pause-button" onClick={() => navigate('/page1/pause')}>
          <span className="pause-icon">
            <div></div>
            <div></div>
          </span>
        </button>
        <div className="progress-wrapper" aria-label="Level progress bar">
          <div className="level-progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={totalLevels} aria-valuenow={level}>
            <div className="level-progress-fill1" style={{ width: progressWidth }}></div>
          </div>
        </div>
      </div>

      

      {Array.isArray(randomExpression) && (

          <div className="learn-content">
          {/* 👉 Grid хэсэг */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${gridCols}, 45px)`,
              gridTemplateRows: `repeat(${gridRows}, 45px)`,
              gap: "4px",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#ccfffe",
              borderRadius: "10px",
              border: "4px solid #0096c7",
              padding: "top:20px"
            }}
          >
            {randomExpression.flat().map((cell, index) => (
              <div
                key={index}
                style={{
                  width: "50px",
                  height: "55px",
                  position: "relative",
                }}
              >
                {cell === "🍀" || cell === "🐸" || cell === "🚩" ? (
                  <img
                    src="/images/navch.png"
                    alt="leaf"
                    width="50"
                    height="50"
                    style={{ position: "absolute", top: 0, left: 0, animation: "grow 0.5s ease" }}
                  />
                ) : null}

                {cell === "🐸" && (
                  <img
                    src="/images/melhii.png"
                    alt="frog"
                    width="45"
                    height="45"
                    style={{ position: "absolute", top: 2, left: 2, animation: "idleBounce 1.5s infinite ease-in-out" }}
                  />
                )}

                {cell === "🚩" && (
                  <img
                    src="/images/1.png"
                    alt="coin"
                    width="45"
                    height="45"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 2,
                      animation: "coinSpin 2s infinite linear",
                      transformStyle: "preserve-3d",
                      backfaceVisibility: "hidden",
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* 👉 Input + Видео хэсэг */}
          <div className="learn-video-side" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <video 
              ref={videoRef}
              autoPlay
              width="320"
              height="240"
              style={{ transform: "scaleX(-1)", marginBottom: "10px" }}
              className={shakeCamera ? "shake-camera" : ""}
            />
            <h3 className="finger-count">
              Танигдсан хурууны тоо:{" "}
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
              placeholder="Хэдэн амьтан байна?"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className={`learn-input ${shake ? "shake" : ""}`}
              style={{ marginTop: "10px" }}
            />
            <button onClick={handleCheck} className="check-btn" style={{ marginTop: "10px" }}>
              Шалгах
            </button>

            <div className="result-text" style={{ marginTop: "10px" }}>{result}</div>
          </div>
          </div>

        
      )}
      
    </div >
  );
}
