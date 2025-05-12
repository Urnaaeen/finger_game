import asyncio
import json
import websockets
import cv2
import mediapipe as mp
import numpy as np
from typing import Dict, List

# MediaPipe setup
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands = mp_hands.Hands(max_num_hands=2, min_detection_confidence=0.7)

# Function to count fingers
def count_fingers(hand_landmarks, hand_label):
    count = 0
    tips = [8, 12, 16, 20]  # Indices for fingers (except thumb)
    
    # Count fingers (except thumb)
    for tip in tips:
        if hand_landmarks.landmark[tip].y < hand_landmarks.landmark[tip - 2].y:
            count += 1
    
    # Count thumb based on hand orientation
    if hand_label == "Right":
        if hand_landmarks.landmark[4].x < hand_landmarks.landmark[3].x:
            count += 1
    else:
        if hand_landmarks.landmark[4].x > hand_landmarks.landmark[3].x:
            count += 1
    
    return count

# Process a frame and get finger counts
def process_frame(frame):
    # Convert to RGB for MediaPipe
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb_frame)
    
    hand_count = {"right_hand": 0, "left_hand": 0}
    
    # Process hand landmarks if detected
    if results.multi_hand_landmarks:
        for hand_landmarks, handedness in zip(results.multi_hand_landmarks, results.multi_handedness):
            # Get hand label (Left or Right)
            hand_label = handedness.classification[0].label
            
            # Count fingers for this hand
            finger_count = count_fingers(hand_landmarks, hand_label)
            
            # Store the count based on hand label
            if hand_label == "Right":
                hand_count["right_hand"] = finger_count
            else:
                hand_count["left_hand"] = finger_count
                
            # Draw landmarks on the frame for visualization (if needed)
            mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
    
    return frame, hand_count

# Create WebSocket server
async def finger_counter(websocket, path):
    # Check the path
    if path != "/ws/finger_count":
        await websocket.close(code=1008, reason="Invalid path")
        return
    
    print(f"New client connected")
    
    # Start video capture
    cap = cv2.VideoCapture(0)
    
    try:
        while True:
            # Read a frame from the camera
            success, frame = cap.read()
            if not success:
                await asyncio.sleep(0.1)
                continue
            
            # Flip the frame horizontally for a more intuitive view
            frame = cv2.flip(frame, 1)
            
            # Process the frame to get finger counts
            processed_frame, hand_count = process_frame(frame)
            
            # Send finger count data to the client
            await websocket.send(json.dumps(hand_count))
            
            # Brief pause to avoid overwhelming the connection
            await asyncio.sleep(0.1)
    
    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")
    finally:
        # Release camera when done
        cap.release()

# Start the server
async def main():
    server = await websockets.serve(finger_counter, "localhost", 8000)
    print("WebSocket server started on ws://localhost:8000")
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())
