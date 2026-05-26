from pathlib import Path
import base64

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from ultralytics import YOLO


MODEL_PATH = Path("models/best.pt")
CONFIDENCE_THRESHOLD = 0.25
IMAGE_SIZE = 640

app = FastAPI(title="ReStructify AI Service")

model = YOLO(str(MODEL_PATH))


def decode_image(file_bytes: bytes):
    array = np.frombuffer(file_bytes, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Could not decode image")

    return image


def encode_image(image):
    success, buffer = cv2.imencode(".jpg", image)

    if not success:
        raise ValueError("Could not encode result image")

    encoded = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/jpeg;base64,{encoded}"


def analyze_single_image(image):
    results = model.predict(
        source=image,
        imgsz=IMAGE_SIZE,
        conf=CONFIDENCE_THRESHOLD,
        verbose=False
    )

    result = results[0]
    preview = image.copy()

    detections = []

    boxes = result.boxes
    masks = result.masks
    names = result.names

    polygons = []

    if masks is not None and masks.xy is not None:
        polygons = list(masks.xy)

    if boxes is not None:
        for index, box in enumerate(boxes):
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            class_name = names[class_id]

            x1, y1, x2, y2 = box.xyxy[0].tolist()

            polygon_points = []

            if index < len(polygons):
                polygon = polygons[index].astype(np.int32)
                polygon_points = polygon.tolist()

                cv2.polylines(
                    preview,
                    [polygon.reshape((-1, 1, 2))],
                    isClosed=True,
                    color=(0, 255, 0),
                    thickness=2
                )

                overlay = preview.copy()
                cv2.fillPoly(
                    overlay,
                    [polygon.reshape((-1, 1, 2))],
                    color=(0, 140, 255)
                )
                preview = cv2.addWeighted(overlay, 0.35, preview, 0.65, 0)

            cv2.rectangle(
                preview,
                (int(x1), int(y1)),
                (int(x2), int(y2)),
                (0, 255, 0),
                2
            )

            detections.append({
                "type": class_name,
                "confidence": round(confidence, 4),
                "bbox": [
                    round(float(x1), 2),
                    round(float(y1), 2),
                    round(float(x2), 2),
                    round(float(y2), 2)
                ],
                "polygon": polygon_points
            })

    return {
        "detections": detections,
        "summary": {
            "defect_count": len(detections),
            "rust_detected": len(detections) > 0,
            "max_confidence": max(
                [d["confidence"] for d in detections],
                default=0
            )
        },
        "preview_image": encode_image(preview)
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_path": str(MODEL_PATH),
        "confidence_threshold": CONFIDENCE_THRESHOLD
    }


@app.post("/analyze")
async def analyze_images(images: list[UploadFile] = File(...)):
    if not images:
        raise HTTPException(status_code=400, detail="No images uploaded")

    analyzed_images = []

    for uploaded_file in images:
        if not uploaded_file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail=f"{uploaded_file.filename} is not an image"
            )

        file_bytes = await uploaded_file.read()

        try:
            image = decode_image(file_bytes)
            result = analyze_single_image(image)
        except Exception as error:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to analyze {uploaded_file.filename}: {error}"
            )

        analyzed_images.append({
            "filename": uploaded_file.filename,
            **result
        })

    total_defects = sum(
        item["summary"]["defect_count"]
        for item in analyzed_images
    )

    return {
        "pipeline": {
            "version": "rust_segmentation_v1",
            "material_detection_enabled": False,
            "defect_models": ["rust"]
        },
        "summary": {
            "image_count": len(analyzed_images),
            "total_defect_count": total_defects,
            "rust_detected": total_defects > 0
        },
        "images": analyzed_images
    }