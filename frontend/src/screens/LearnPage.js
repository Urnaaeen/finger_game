import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import './css/LearnPage.css';

const animals = [
    { emoji: "🦁", name: "lion", image: "/images/animals/lion.png" },
    { emoji: "🐶", name: "dog", image: "/images/animals/dog.png" },
    { emoji: "🐸", name: "frog", image: "/images/animals/frog.png" },
    { emoji: "🦩", name: "flamingo", image: "/images/animals/flamingo.png" },
    { emoji: "🐘", name: "elephant", image: "/images/animals/elephand.png" }
];

export default function LearnPage() {
    const navigate = useNavigate();
    const totalLevels = 5;

    const [randomAnimal, setRandomAnimal] = useState(animals[0]);
    const [randomCount, setRandomCount] = useState(0);
    const [userAnswer, setUserAnswer] = useState("");
    const [result, setResult] = useState("");
    const [level, setLevel] = useState(0);
    const [shakeCamera, setShakeCamera] = useState(false);
    const [canRetry, setCanRetry] = useState(false);
    const [gameWon, setGameWon] = useState(false);
    const [shake, setShake] = useState(false);

    const videoRef = useRef(null);
    const ws = useRef(null);
    const audioRef = useRef(null);
    const successAudioRef = useRef(null);
    const failAudioRef = useRef(null);
    const lastValidFingerCountRef = useRef(null);
    const [fingerCount, setFingerCount] = useState(null);

    const generateChallenge = () => {
        const animal = animals[Math.floor(Math.random() * animals.length)];
        const count = Math.floor(Math.random() * 10) + 1;
        setRandomAnimal(animal);
        setRandomCount(count);
        setUserAnswer("");
        setResult("");
        setCanRetry(false);
        lastValidFingerCountRef.current = null;

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        audioRef.current = new Audio('/sounds/learn.mp3');
        audioRef.current.play().catch((err) => {
            console.warn("\ud83d\udd07 learn.mp3 тоглуулахад алдаа:", err);
        });
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
                console.error("\ud83c\udfa5 Камер асаахад алдаа:", err);
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

        // ✅ Mission дуун тоглуулах
        const missionAudio = new Audio('/sounds/mission.mp3');
        missionAudio.play().catch((err) => {
            console.warn("🎵 mission.mp3 тоглуулахад алдаа:", err);
        });

        setTimeout(() => navigate('/Success1'), 1500);
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
        if (value === "" || value === null || value === undefined) {
            setShake(true);
            setTimeout(() => setShake(false), 600);
            setCanRetry(true);
            return;
        }

        const answerToCheck = parseInt(value, 10);

        if (answerToCheck === randomCount) {
            if (successAudioRef.current) {
                successAudioRef.current.pause();
                successAudioRef.current.currentTime = 0;
            }
            successAudioRef.current = new Audio('/sounds/success.mp3');
            successAudioRef.current.play();

            fireConfettiExplosion();

            const nextLevel = level + 1;
            setLevel(nextLevel);
            setResult("🎉 Зөв байна!");
            setCanRetry(false);

            if (nextLevel === totalLevels) {
                setGameWon(true);
            } else {
                setTimeout(() => {
                    generateChallenge();
                }, 1000);
            }
        } else {
            if (failAudioRef.current) {
                failAudioRef.current.pause();
                failAudioRef.current.currentTime = 0;
            }
            failAudioRef.current = new Audio('/sounds/incorrect.mp3');
            failAudioRef.current.play();

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

    return (
        <div className="game-container1">
            <div className="top-bar1">
                <button aria-label="Pause game" className="pause-button1" onClick={() => navigate('/page1/pause')}>
                    <span className="pause-icon1">
                        <div></div>
                        <div></div>
                    </span>
                </button>
                <div className="progress-wrapper1" aria-label="Level progress bar">
                    <div className="level-progress-bar1" role="progressbar" aria-valuemin={0} aria-valuemax={totalLevels} aria-valuenow={level}>
                        <div className="level-progress-fill1" style={{ width: progressWidth }}></div>
                    </div>
                </div>
            </div>

            <div className="learn-content1">
                <div className="learn-images1">
                    {[...Array(randomCount)].map((_, index) => (
                        <img key={index} src={randomAnimal.image} alt={randomAnimal.name} className="animal-img1" />
                    ))}
                </div>

                <div className="learn-video-side1">
                    <video
                        ref={videoRef}
                        autoPlay
                        width="640"
                        height="480"
                        style={{ transform: "scaleX(-1)" }}
                        className={shakeCamera ? "shake-camera" : ""}
                    />
                    <h3 className="finger-count1">
                        Танигдсан хурууны тоо:{" "}
                        <span className="highlighted-number1">
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
                    />
                    <button onClick={handleCheck} className="check-btn1">
                        Шалгах
                    </button>

                    <div className="result-text1">{result}</div>
                </div>
            </div>
        </div>
    );
}