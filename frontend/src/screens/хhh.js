import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();
  const totalLevels = 4;

  const [randomExpression, setRandomExpression] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [result, setResult] = useState("");
  const [level, setLevel] = useState(0);
  const [canRetry, setCanRetry] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const lastValidFingerCountRef = useRef(null);
  const gridRows = 8;
  const gridCols = 11;
  const leaf = "🍀";
  const [steps, setSteps] = useState([]);
  const [frogPosition, setFrogPosition] = useState({ x: 0, y: 0 });

  const generateChallenge = () => {
    const directions = ["right", "down", "right", "up"];
    const generatedSteps = directions.map((dir, i) => {
      if (dir === "down") {
        const options = [5, 6];
        return options[Math.floor(Math.random() * options.length)];
      } else {
        return Math.floor(Math.random() * 5) + 1;
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

    const interval = setInterval(() => {
      if (
        videoRef.current &&
        ws.current &&
        ws.current.readyState === WebSocket.OPEN &&
        videoRef.current.videoWidth > 0 &&
        videoRef.current.videoHeight > 0
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
    generateChallenge();
  }, []);

  const handleCheck = () => {
    const value = userAnswer !== "" ? userAnswer : (fingerCount > 0 ? fingerCount : lastValidFingerCountRef.current);
    handleCheckWithValue(value);
  };

  const handleCheckWithValue = (value) => {
    const answerToCheck = parseInt(value);
    if (answerToCheck === steps[level]) {
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
      setResult("😅 Буруу байна. Дахин оролдоорой!");
      setCanRetry(true);
    }
  };


  const progressWidth = `${(level / totalLevels) * 100}%`;

  useEffect(() => {
    if (gameWon) {
      const timeout = setTimeout(() => {
        navigate('/page4');
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [gameWon, navigate]);

  return (
    <div style={{ backgroundColor: "#CCFFFE", minHeight: "100vh" }}>
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
 
 
 
          .custom-button {
  background-color: #E2FBCD;
  padding: 10px 20px;
  font-size: 18px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  width: 100%;
  transition: background-color 0.3s ease;
}
 
.custom-button:hover {
  background-color: #5DC26C; /* Hover үед өөр өнгө */
}
 
 
        `}
      </style>

      <div style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        width: "80%",
        margin: "0 auto",
        gap: "20px",
        padding: "20px",
        borderRadius: "15px",
        backgroundColor: "#CCFFFE",
      }}>
        <div
          style={{
            background: "#E2FBCD",
            height: "50px",
            width: "80%",
            margin: "20px auto",
            borderRadius: "20px",
            overflow: "hidden",
            flex: 9,
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div
            style={{
              background: "#5DC26C",
              height: "100%",
              width: progressWidth,
              transition: "width 0.3s",
            }}
          />
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <button
            onClick={() => navigate('/page1/pause')}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#E2FBCD',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
              cursor: 'pointer'
            }}
          >
            <span style={{ display: 'flex', gap: '3px' }}>
              <div style={{ width: '4px', height: '16px', backgroundColor: '#333' }} />
              <div style={{ width: '4px', height: '16px', backgroundColor: '#333' }} />
            </span>
          </button>
        </div>
      </div>

      <div style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "start",
        width: "90%",
        margin: "0 auto",
        gap: "20px",
        backgroundColor: "#CCFFFE",
        padding: "20px",
        borderRadius: "15px",
      }}>
        <div style={{
          flex: 7,
          display: "flex",
          justifyContent: "center",
          alignItems: "start",
          fontSize: "200px",
          fontWeight: "bold",
          color: "#9C27B0",
          textShadow: "2px 2px 5px rgba(0, 0, 0, 0.3)",
        }}>

          {Array.isArray(randomExpression) && (
            <div
              style={{
                display: "flex",
                border: "2px solid #9C27B0",
                justifyContent: "center",
                alignItems: "center",
                maxWidth: "90%",
                margin: "0 auto"
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${gridCols}, 60px)`, // 🔍 60 эсвэл 70 гэх мэт тохируулж болно
                  gridTemplateRows: `repeat(${gridRows}, 60px)`,
                  gap: "4px",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "#ccfffe",
                  borderRadius: "10px",
                }}
              >
                {randomExpression.flat().map((cell, index) => (
                  <div
                    key={index}
                    style={{
                      width: "80px", // навчны хэмжээтэй ижил
                      height: "80px",
                      position: "relative",
                    }}
                  >
                    {/* Навч - арын давхар */}
                    {cell === "🍀" || cell === "🐸" || cell === "🚩" ? (
                      <img
                        src="/images/navch.png"
                        alt="leaf"
                        width="60"
                        height="60"
                        style={{ position: "absolute", top: 0, left: 0, animation: "grow 0.5s ease" }}
                      />
                    ) : null}

                    {/* Мэлхий - дээр давхар гарч ирнэ */}
                    {cell === "🐸" && (
                      <img
                        src="/images/melhii.png"
                        alt="frog"
                        width="55"
                        height="55"
                        style={{ position: "absolute", top: 0, left: 4, animation: "idleBounce 1.5s infinite ease-in-out" }}
                      />
                    )}

                    {cell === "🚩" && (
                      <img
                        src="/images/1.png"
                        alt="coin"
                        width="50"
                        height="50"
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
            </div>
          )}


        </div>

        <div style={{ flex: 3, textAlign: "center" }}>
          <video
            ref={videoRef}
            autoPlay
            width="640"
            height="480"
            style={{ transform: "scaleX(-1)" }}
          />

          <h3 style={{ marginTop: "20px", fontSize: "24px" }}>
            Танигдсан хурууны тоо:{" "}
            <span style={{ color: "blue" }}>
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
            style={{
              padding: "10px",
              fontSize: "18px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              width: "100%",
              boxSizing: "border-box",
            }}
          />

          <button
            onClick={handleCheck}
            className="custom-button"
            disabled={gameWon}
          >
            Шалгах
          </button>

          <div style={{ marginTop: "10px", fontSize: "20px", color: result.includes("Зөв") ? "green" : "red" }}>
            {result}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;