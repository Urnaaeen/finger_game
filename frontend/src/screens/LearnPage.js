import React, { useEffect, useState, useRef } from "react";

const animals = ["🦁", "🐰", "🐶", "🐱", "🐸", "🐵", "🐼"];

function App({ navigate }) { 
    const totalLevels = 5;
    const [randomAnimal, setRandomAnimal] = useState("🦁");
    const [randomCount, setRandomCount] = useState(0);
    const [userAnswer, setUserAnswer] = useState("");
    const [result, setResult] = useState("");
    const [level, setLevel] = useState(0);
    const [canRetry, setCanRetry] = useState(false);
    const [gameWon, setGameWon] = useState(false);
    
    const [isHGRActive, setIsHGRActive] = useState(false);
    const [fingerCount, setFingerCount] = useState({ right_hand: 0, left_hand: 0, total: 0 });
    const [showVideo, setShowVideo] = useState(false);
    const webSocketRef = useRef(null);
    const videoRef = useRef(null);
    
    const generateChallenge = () => {
        const animal = animals[Math.floor(Math.random() * animals.length)];
        const count = Math.floor(Math.random() * 5) + 1; // 1-5
        setRandomAnimal(animal);
        setRandomCount(count);
        setUserAnswer("");
        setResult("");
        setCanRetry(false);
    };

    useEffect(() => {
        generateChallenge();
        
        return () => {
            if (webSocketRef.current) {
                webSocketRef.current.close();
            }
            
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, []);

    const connectToHGR = () => {
        const ws = new WebSocket("ws://localhost:8000");
        
        ws.onopen = () => {
            console.log("Connected to HGR WebSocket server");
            setIsHGRActive(true);
        };
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const total = data.right_hand + data.left_hand;
                setFingerCount({
                    right_hand: data.right_hand,
                    left_hand: data.left_hand,
                    total: total
                });
                
                setUserAnswer(total.toString());
            } catch (error) {
                console.error("Error parsing WebSocket message:", error);
            }
        };
        
        ws.onclose = () => {
            console.log("Disconnected from HGR WebSocket server");
            setIsHGRActive(false);
        };
        
        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            setIsHGRActive(false);
        };
        
        webSocketRef.current = ws;
    };
    const toggleHGR = async () => {
        if (!isHGRActive) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { width: 320, height: 240 }
                });
                
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                
                connectToHGR();
                setShowVideo(true);
            } catch (error) {
                console.error("Error accessing webcam:", error);
                alert("Unable to access webcam. Please check permissions.");
            }
        } else {
            if (webSocketRef.current) {
                webSocketRef.current.close();
            }
        
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
            
            setShowVideo(false);
            setIsHGRActive(false);
        }
    };
    useEffect(() => {
        if (isHGRActive && fingerCount.total > 0) {
            const timer = setTimeout(() => {
                handleCheck();
            }, 1500);
            
            return () => clearTimeout(timer);
        }
    }, [fingerCount.total]);

    const handleCheck = () => {
        const answer = isHGRActive ? fingerCount.total : parseInt(userAnswer);
        
        if (answer === randomCount) {
            const nextLevel = level + 1;
            setLevel(nextLevel);
            setResult("🎉 Зөв байна!");
            if (nextLevel === totalLevels) {
                setGameWon(true);
                setTimeout(() => {
                    // Use your navigation method here
                    if (typeof navigate === 'function') {
                        navigate('/page4');
                    }
                }, 1000);
            } else {
                setTimeout(() => {
                    generateChallenge();
                }, 1000);
            }
        } else {
            setResult("😅 Буруу байна. Дахин оролдоорой!");
            setCanRetry(true);
        }
    };
    const progressWidth = `${(level / totalLevels) * 100}%`;
    
    const handlePause = () => {
        if (typeof navigate === 'function') {
            navigate('/page1/pause');
        }
    };
    
    return (
        <>
            <div style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                width: "80%",
                margin: "0 auto",
                gap: "20px",
                padding: "20px",
                borderRadius: "15px",
            }}>
                {/* Дээрх progress bar */}
                <div
                    style={{
                        background: "#f3d4f8",
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
                            background: "#d48df8",
                            height: "100%",
                            width: progressWidth,
                            transition: "width 0.3s",
                        }}
                    />
                </div>
                <div style={{
                    flex: 1,
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: "10px",
                }} >
                    <button
                        onClick={handlePause}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#eee',
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

            {/* Main content container */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "80%",
                    margin: "0 auto",
                    gap: "20px",
                }}
            >
                {/* HGR toggle and webcam display */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        backgroundColor: "#f0e6ff",
                        padding: "15px",
                        borderRadius: "15px",
                    }}
                >
                    <button
                        onClick={toggleHGR}
                        style={{
                            padding: "10px 20px",
                            fontSize: "16px",
                            borderRadius: "10px",
                            border: "none",
                            backgroundColor: isHGRActive ? "#ff9999" : "#b3ffb3",
                            cursor: "pointer",
                            marginBottom: "10px",
                        }}
                    >
                        {isHGRActive ? "Гараар тоолохыг унтраах" : "Гараар тоолохыг асаах"}
                    </button>

                    {showVideo && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                width: "100%",
                            }}
                        >
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{
                                    width: "320px",
                                    height: "240px",
                                    borderRadius: "10px",
                                    marginBottom: "10px",
                                }}
                            />
                            <div
                                style={{
                                    fontSize: "18px",
                                    fontWeight: "bold",
                                    backgroundColor: "#e6f7ff",
                                    padding: "8px 15px",
                                    borderRadius: "8px",
                                }}
                            >
                                Таны гарын хуруу: {fingerCount.total} 
                                {isHGRActive && fingerCount.total > 0 && (
                                    <span style={{ marginLeft: "10px" }}>
                                        (Зүүн: {fingerCount.left_hand}, Баруун: {fingerCount.right_hand})
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Хоёр хэсэгт хуваасан хүрээ */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "20px",
                        backgroundColor: "#f9f1ff",
                        padding: "20px",
                        borderRadius: "15px",
                    }}
                >
                    {/* Emoji хэсэг (70%) */}
                    <div
                        style={{
                            flex: 7,
                            display: "flex",
                            flexWrap: "wrap",
                            justifyContent: "center",
                            gap: "10px",
                        }}
                    >
                        {[...Array(randomCount)].map((_, index) => (
                            <span key={index} style={{ fontSize: "60px" }}>
                                {randomAnimal}
                            </span>
                        ))}
                    </div>

                    {/* Input + Button хэсэг (30%) */}
                    <div style={{ flex: 3, textAlign: "center" }}>
                        {!isHGRActive && (
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
                        )}

                        {/* Display result message */}
                        {result && (
                            <div 
                                style={{
                                    margin: "10px 0",
                                    padding: "10px",
                                    backgroundColor: result.includes("Зөв") ? "#d4edda" : "#f8d7da",
                                    color: result.includes("Зөв") ? "#155724" : "#721c24",
                                    borderRadius: "8px",
                                    fontWeight: "bold",
                                }}
                            >
                                {result}
                            </div>
                        )}

                        {/* Only show the Check button if not using HGR or if retry is needed */}
                        {(!isHGRActive || canRetry) && (
                            <button
                                onClick={handleCheck}
                                style={{
                                    marginTop: "10px",
                                    padding: "10px 20px",
                                    fontSize: "18px",
                                    borderRadius: "10px",
                                    border: "none",
                                    backgroundColor: "#eecbff",
                                    cursor: "pointer",
                                    width: "100%",
                                }}
                                disabled={gameWon}
                            >
                                Шалгах
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default App;