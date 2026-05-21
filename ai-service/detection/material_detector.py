from pathlib import Path

import cv2
import numpy as np
from ultralytics import YOLO


class MaterialDetector:
    def __init__(self, model_path="models/material.pt", confidence=0.10):
        self.model_path = Path(model_path)
        self.confidence = confidence
        self.model = None

        if self.model_path.exists():
            self.model = YOLO(str(self.model_path))
            print(f"[material] Loaded material detector: {self.model_path}")
        else:
            print("[material] No material detector found. Using full image fallback.")

    @staticmethod
    def _full_image_fallback(width, height):
        full_mask = np.ones((height, width), dtype=np.uint8) * 255
        return [
            {
                "type": "unknown_material",
                "confidence": 1.0,
                "bbox": [0, 0, width, height],
                "mask": full_mask,
                "is_fallback": True,
            }
        ]

    def detect(self, image_bgr):
        height, width = image_bgr.shape[:2]

        if self.model is None:
            return self._full_image_fallback(width, height)

        results = self.model.predict(
            source=image_bgr,
            conf=self.confidence,
            imgsz=640,
            verbose=False,
        )

        result = results[0]

        if result.boxes is None or len(result.boxes) == 0:
            return self._full_image_fallback(width, height)

        names = result.names
        materials = []

        for index, box in enumerate(result.boxes):
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            class_name = names[class_id]

            x1, y1, x2, y2 = box.xyxy[0].tolist()

            x1 = max(0, int(x1))
            y1 = max(0, int(y1))
            x2 = min(width, int(x2))
            y2 = min(height, int(y2))

            # If the model is a segmentation model later, use the real mask.
            # If it is a detection model, use the bounding box as a rectangular mask.
            if result.masks is not None and result.masks.data is not None and index < len(result.masks.data):
                mask_data = result.masks.data[index].cpu().numpy()
                mask_resized = cv2.resize(mask_data, (width, height))
                mask = (mask_resized > 0.5).astype(np.uint8) * 255
            else:
                mask = np.zeros((height, width), dtype=np.uint8)
                cv2.rectangle(mask, (x1, y1), (x2, y2), 255, -1)

            materials.append(
                {
                    "type": class_name,
                    "confidence": round(confidence, 4),
                    "bbox": [x1, y1, x2, y2],
                    "mask": mask,
                    "is_fallback": False,
                }
            )

        return materials
