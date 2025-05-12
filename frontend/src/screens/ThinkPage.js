import React, { useState, useEffect, useRef } from 'react';

const MathGame = () => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operator, setOperator] = useState('+');
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [showGestureInput, setShowGestureInput] = useState(false);
  const [fingerCount, setFingerCount] = useState({ right: 0, left: 0 });
  const [countdown, setCountdown] = useState(null);
  const [wsConnection, setWsConnection] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const generateProblem = () => {
    let a = Math.floor(Math.random() * 11);
    let b = Math.floor(Math.random() * 11);
    const op = Math.random() > 0.5 ? '+' : '-';

    if (op === '+') {
      if (a + b > 10) b = 10 - a;
    } else {
      if (a < b) [a, b] = [b, a];
    }

    setNum1(a);
    setNum2(b);
    setOperator(op);
    setUserAnswer('');
    setIsCorrect(null);
  };

  useEffect(() => {
    generateProblem();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let timer;
    if (isCorrect === true) {
      timer = setTimeout(() => {
        generateProblem();
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [isCorrect]);

  const checkAnswer = (answer = null) => {
    const correctAnswer = operator === '+' ? num1 + num2 : num1 - num2;
    const submittedAnswer = answer !== null ? answer : parseInt(userAnswer);
    
    const correct = submittedAnswer === correctAnswer;
    setIsCorrect(correct);
    
    const audio = new Audio(correct ? '/sounds/correct.mp3' : '/sounds/wrong.mp3');
    audio.play();
    
    if (showGestureInput) {
      cleanupGestureDetection();
    }
  };

  const startGestureDetection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      const ws = new WebSocket('ws://localhost:8000/ws/finger_count');
      setWsConnection(ws);
      
      ws.onopen = () => {
        console.log('WebSocket connection established');
        setShowGestureInput(true);
        setCountdown(5);
        
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
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
        cleanupGestureDetection();
      };
    } catch (error) {
      console.error('Error accessing webcam:', error);
    }
  };

  const cleanupGestureDetection = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (wsConnection) {
      wsConnection.close();
    }
    
    setShowGestureInput(false);
    setCountdown(null);
  };

  const submitFingerCount = () => {
    const totalFingers = fingerCount.right + fingerCount.left;
    setUserAnswer(totalFingers.toString());
    checkAnswer(totalFingers);
  };

  useEffect(() => {
    if (countdown === 0) {
      submitFingerCount();
    }
  }, [countdown]);

  const getCorrectAnswer = () => {
    return operator === '+' ? num1 + num2 : num1 - num2;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.problem}>{num1} {operator} {num2} = ?</div>
        
        {!showGestureInput ? (
          <div style={styles.inputContainer}>
            <input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              style={{
                ...styles.input,
                borderColor: isCorrect === false ? 'red' : '#ccc',
              }}
            />
            <button onClick={() => checkAnswer()} style={styles.button}>Шалгах</button>
            
            <button 
              onClick={startGestureDetection} 
              style={styles.gestureButton}
            >
              Хуруугаар хариулах
            </button>
          </div>
        ) : (
          <div style={styles.gestureContainer}>
            <video 
              ref={videoRef}
              autoPlay 
              playsInline
              style={styles.video}
            />
            
            <div style={styles.countdownContainer}>
              <div style={styles.fingerCount}>
                Баруун гар: {fingerCount.right} | Зүүн гар: {fingerCount.left}
              </div>
              
              <div style={styles.totalCount}>
                Нийт: {fingerCount.right + fingerCount.left}
              </div>
              
              <div style={styles.countdown}>
                {countdown > 0 ? (
                  <>Хариулт илгээхэд: {countdown}</>
                ) : (
                  <>Илгээж байна...</>
                )}
              </div>
              
              <button 
                onClick={cleanupGestureDetection} 
                style={styles.cancelButton}
              >
                Цуцлах
              </button>
            </div>
          </div>
        )}
        
        {isCorrect === true && (
          <div style={styles.correctFeedback}>
            <div style={styles.emoji}>🎉🎉🎉</div>
            <div style={styles.message}>Зөв хариулт!</div>
          </div>
        )}
        
        {isCorrect === false && (
          <div style={styles.incorrectFeedback}>
            <div style={styles.emoji}>😕</div>
            <div style={styles.message}>
              Буруу хариулт. Зөв хариулт: {getCorrectAnswer()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: '"Comic Sans MS", cursive',
    backgroundColor: '#ffe4ec',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '30px',
    boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
    textAlign: 'center',
    width: '90%',
    maxWidth: '500px',
  },
  problem: {
    fontSize: '2.5rem',
    marginBottom: '1.5rem',
    fontWeight: 'bold',
    color: '#333',
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  input: {
    fontSize: '2rem',
    width: '100px',
    padding: '0.5rem',
    borderRadius: '10px',
    border: '2px solid #ccc',
    textAlign: 'center',
  },
  button: {
    padding: '0.7rem 1.5rem',
    fontSize: '1.2rem',
    backgroundColor: '#d81b60',
    color: 'white',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  gestureButton: {
    padding: '0.7rem 1.5rem',
    fontSize: '1.2rem',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    marginTop: '0.5rem',
    width: '100%',
  },
  gestureContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    width: '100%',
  },
  video: {
    width: '100%',
    borderRadius: '15px',
    border: '3px solid #2196f3',
  },
  countdownContainer: {
    padding: '1rem',
    backgroundColor: '#f5f5f5',
    borderRadius: '15px',
    width: '100%',
  },
  fingerCount: {
    fontSize: '1.2rem',
    marginBottom: '0.5rem',
    color: '#333',
  },
  totalCount: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: '0.5rem',
  },
  countdown:{
    fontSize: '1.2rem',
    color: '#d81b60',
    marginBottom: '1rem',
  },
  cancelButton: {
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  correctFeedback: {
    marginTop: '1.5rem',
    animation: 'fadeIn 0.5s',
  },
  incorrectFeedback: {
    marginTop: '1.5rem',
    color: '#f44336',
    animation: 'fadeIn 0.5s',
  },
  emoji: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
  },
  message: {
    fontSize: '1.2rem',
  },
};

export default MathGame;