import asyncio
import websockets
import base64
import json
import cv2
import numpy as np
import mediapipe as mp


# Mediapipe тохиргоо
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands = mp_hands.Hands(max_num_hands=2, min_detection_confidence=0.7)

cap = cv2.VideoCapture(0)

# Хуруу тоолох функц
def count_fingers(hand_landmarks, hand_label):
    count = 0
    tips = [8, 12, 16, 20]
    for tip in tips:
        if hand_landmarks.landmark[tip].y < hand_landmarks.landmark[tip - 2].y:
            count += 1
    if hand_label == "Right":
        if hand_landmarks.landmark[4].x < hand_landmarks.landmark[3].x:
            count += 1
    else:
        if hand_landmarks.landmark[4].x > hand_landmarks.landmark[3].x:
            count += 1
    return count

# WebSocket холболт
async def handler(websocket):
    async for message in websocket:
        try:
            data = json.loads(message)
            image_data = data["image"].split(",")[1]
            img_bytes = base64.b64decode(image_data)
            np_arr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

            # Mediapipe ашиглан гар илрүүлэх
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            results = hands.process(img_rgb)

            total_fingers = 0
            if results.multi_hand_landmarks and results.multi_handedness:
                for hand_landmarks, handedness in zip(results.multi_hand_landmarks, results.multi_handedness):
                    label = handedness.classification[0].label  # "Left" эсвэл "Right"
                    total_fingers += count_fingers(hand_landmarks, label)

            await websocket.send(json.dumps({"fingers": total_fingers})) 
        except Exception as e:
            print("🔥 Алдаа:", e)
            await websocket.send(json.dumps({"fingers": 0}))


# Сервер эхлүүлэх
async def main():
    async with websockets.serve(handler, "localhost", 8765):
        print("✅ WebSocket сервер ажиллаж байна: ws://localhost:8765")
        await asyncio.Future()  # Битгий хаагдаарай

if __name__ == "__main__":
    asyncio.run(main())
