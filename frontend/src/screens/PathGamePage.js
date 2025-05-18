import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Confetti from 'canvas-confetti';


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
  const gridCols = 10;
  const leaf = "🍀";
  const [steps, setSteps] = useState([]);
  const [frogPosition, setFrogPosition] = useState({ x: 0, y: 0 });

  const [showConfetti, setShowConfetti] = useState(false);
  const [shakeCamera, setShakeCamera] = useState(false);

  const generateChallenge = () => {
    const directions = ["right", "down", "right", "up"];
    const generatedSteps = directions.map((dir, i) => {
      if (dir === "down") {
        const options = [6, 7];
        return options[Math.floor(Math.random() * options.length)];
      } else {
        return Math.floor(Math.random() * 5) + 1;
      }
    });
    let pathMap = Array.from({ length: gridRows }, () =>
      Array(gridCols).fill("")
    );

    let x = 0,
      y = 0;
    pathMap[0][0] = "🐸";

    for (let i = 0; i < generatedSteps.length; i++) {
      const step = generatedSteps[i];
      for (let j = 0; j < step; j++) {
        switch (directions[i]) {
          case "right":
            x++;
            break;
          case "down":
            y++;
            break;
          case "up":
            y--;
            break;
        }

        if (x >= 0 && x < gridCols && y >= 0 && y < gridRows) {
          pathMap[y][x] = leaf;
        }
      }
    }

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
    setFrogPosition({ x: 0, y: 0 });
    setShowConfetti(false);
    setShakeCamera(false);
  };

  const videoRef = useRef(null);
  const ws = useRef(null);
  const [fingerCount, setFingerCount] = useState(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
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
    const value =
      userAnswer !== ""
        ? userAnswer
        : fingerCount > 0
        ? fingerCount
        : lastValidFingerCountRef.current;
    handleCheckWithValue(value);
  };

  const handleCheckWithValue = (value) => {
    const answerToCheck = parseInt(value);
    if (answerToCheck === steps[level]) {
      const nextLevel = level + 1;
      setLevel(nextLevel);
      setResult("🎉 Зөв байна!");
      setShowConfetti(true);
      setShakeCamera(false);
      setCanRetry(false);

      let { x, y } = frogPosition;
      const direction = ["right", "down", "right", "up"][level];
      const stepCount = steps[level];

      const newMap = randomExpression.map((row) => row.slice());
      newMap[y][x] = leaf;

      for (let i = 0; i < stepCount; i++) {
        switch (direction) {
          case "right":
            x++;
            break;
          case "down":
            y++;
            break;
          case "up":
            y--;
            break;
        }

        if (!(x >= 0 && x < gridCols && y >= 0 && y < gridRows)) {
          break;
        }
      }

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
          setShowConfetti(false);
        }, 1500);
      }
    } else {
      setResult("😅 Буруу байна. Дахин оролдоорой!");
      setCanRetry(true);
      setShakeCamera(true);
      setShowConfetti(false);
      setTimeout(() => setShakeCamera(false), 500);
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
    <div
      style={{
        backgroundColor: "#fff",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: "#222",
        padding: "20px",
      }}
    >
      {/* Confetti on correct */}
      {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}

      {/* Top bar with progress and pause */}
      <div
        style={{
          maxWidth: 600,
          margin: "0 auto 20px",
          padding: "10px 20px",
          backgroundColor: "#e6f7ff",
          borderRadius: 20,
          display: "flex",
          alignItems: "center",
          gap: 20,
          boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
        }}
      >
        <div
  style={{
    flex: 1,
    height: 20,
    backgroundColor: "#e0e7ff", // lighter blue background
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.1)", // inner shadow for depth
  }}
  aria-label="Progress bar"
>
  <div
    style={{
      width: progressWidth,
      height: "100%",
      background: "linear-gradient(90deg, #4f83cc, #1890ff)", // gradient fill
      borderRadius: "20px 0 0 20px",
      transition: "width 0.5s ease",
      boxShadow: "0 2px 8px rgba(24,144,255,0.3)", // subtle glow
    }}
  />
</div>


        <button
          onClick={() => navigate("/page1")}
style={{
border: "none",
backgroundColor: "#1890ff",
color: "white",
fontWeight: "bold",
borderRadius: 20,
padding: "6px 15px",
cursor: "pointer",
userSelect: "none",
fontSize: 16,
boxShadow: "0 2px 8px rgba(24,144,255,0.4)",
transition: "background-color 0.3s ease",
}}
onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0f6dd9")}
onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1890ff")}
aria-label="Pause game and go back"
>
❚❚
</button>
</div>
<div style={{ display: "flex", gap: "20px", justifyContent: "center"
 }}>
  {/* Game grid */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
      gridTemplateRows: `repeat(${gridRows}, 1fr)`,
      width: 500,
      height: 400,
      border: "3px solid #1890ff",
      borderRadius: 10,
      overflow: "hidden",
      userSelect: "none",
    }}
    aria-label="Game grid showing frog path"
  >
    {randomExpression.flatMap((row, rowIndex) =>
      row.map((cell, colIndex) => (
        <div
          key={`${rowIndex}-${colIndex}`}
          style={{
            width: 40,
            height: 40,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: 24,
            border:
              cell === "🐸"
                ? "2px solid #096dd9"
                : "1px solid #cce6ff",
            backgroundColor: cell === "🚩" ? "#bae7ff" : "#f0f8ff",
          }}
          aria-label={
            cell === "🐸"
              ? "Frog current position"
              : cell === "🚩"
              ? "Goal"
              : cell === leaf
              ? "Leaf step"
              : "Empty"
          }
        >
          {cell}
        </div>
      ))
    )}
  </div>
 <div style={{ display: "flex", flexDirection: "column", gap: "10px" , justifyContent: "center"}}>
  {/* Camera feed */}
  <div
    style={{
      position: "relative",
      width: 300,
      border: `4px solid ${shakeCamera ? "#ff4d4f" : "#1890ff"}`,
      borderRadius: 12,
      boxShadow: shakeCamera
        ? "0 0 10px 3px #ff4d4f"
        : "0 0 10px 3px #1890ff",
      animation: shakeCamera ? "shake 0.5s" : "none",
      overflow: "hidden",
    }}
  >
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      style={{
        width: "100%",
        display: "block",
        borderRadius: 8,
        filter: "brightness(0.9)",
      }}
      aria-label="Camera video feed"
    />
  </div>

  {/* User input */}
  <div
    style={{
      maxWidth: 600,
      margin: "0 auto",
      display: "flex",
      gap: 10,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <input
      type="number"
      min="0"
      max="20"
      placeholder="Тоо оруулах"
      value={userAnswer}
      onChange={(e) => setUserAnswer(e.target.value)}
      disabled={gameWon}
      style={{
        fontSize: 20,
        padding: "10px",
        borderRadius: 12,
        border: "2px solid #1890ff",
        flexGrow: 1,
        maxWidth: 150,
        outline: "none",
      }}
      aria-label="Input your answer"
      onKeyDown={(e) => {
        if (e.key === "Enter") handleCheck();
      }}
    />

    <button
      onClick={handleCheck}
      disabled={gameWon}
      style={{
        backgroundColor: "#1890ff",
        color: "white",
        border: "none",
        borderRadius: 12,
        fontWeight: "bold",
        fontSize: 18,
        padding: "10px 15px",
        cursor: "pointer",
        userSelect: "none",
        boxShadow: "0 3px 10px rgba(24,144,255,0.6)",
        transition: "background-color 0.3s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0f6dd9")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1890ff")}
      aria-label="Check answer button"
    >
      Шалгах
    </button>
  </div>

  {/* Result message */}
  {result && (
    <div
      style={{
        maxWidth: 600,
        margin: "15px auto 0",
        fontWeight: "bold",
        fontSize: 18,
        color: result.includes("Зөв") ? "#52c41a" : "#ff4d4f",
        textAlign: "center",
        userSelect: "none",
        minHeight: 28,
      }}
      role="alert"
      aria-live="polite"
    >
      {result}
    </div>
  )}
  </div>
  </div>

  <style>{`
    @keyframes shake {
      0% { transform: translate(1px, 1px) rotate(0deg); }
      10% { transform: translate(-1px, -2px) rotate(-1deg); }
      20% { transform: translate(-3px, 0px) rotate(1deg); }
      30% { transform: translate(3px, 2px) rotate(0deg); }
      40% { transform: translate(1px, -1px) rotate(1deg); }
      50% { transform: translate(-1px, 2px) rotate(-1deg); }
      60% { transform: translate(-3px, 1px) rotate(0deg); }
      70% { transform: translate(3px, 1px) rotate(-1deg); }
      80% { transform: translate(-1px, -1px) rotate(1deg); }
      90% { transform: translate(1px, 2px) rotate(0deg); }
      100% { transform: translate(1px, -2px) rotate(-1deg); }
    }
  `}</style>
</div>
);
}

export default App;