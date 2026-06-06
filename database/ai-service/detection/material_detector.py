from pathlib import Path

import cv2
import numpy as np
from ultralytics import YOLO


def _iou(box_a, box_b):
    ax1, ay1, ax2, ay2 = box_a
    bx1, by1, bx2, by2 = box_b

    ix1 = max(ax1, bx1)
    iy1 = max(ay1, by1)
    ix2 = min(ax2, bx2)
    iy2 = min(ay2, by2)

    iw = max(0, ix2 - ix1)
    ih = max(0, iy2 - iy1)
    inter = iw * ih

    area_a = max(1, (ax2 - ax1) * (ay2 - ay1))
    area_b = max(1, (bx2 - bx1) * (by2 - by1))
    union = area_a + area_b - inter

    return inter / union if union > 0 else 0.0


def _intersection_over_a(box_a, box_b):
    """How much of box A is covered by box B."""
    ax1, ay1, ax2, ay2 = box_a
    bx1, by1, bx2, by2 = box_b

    ix1 = max(ax1, bx1)
    iy1 = max(ay1, by1)
    ix2 = min(ax2, bx2)
    iy2 = min(ay2, by2)

    iw = max(0, ix2 - ix1)
    ih = max(0, iy2 - iy1)
    inter = iw * ih
    area_a = max(1, (ax2 - ax1) * (ay2 - ay1))

    return inter / area_a


def _area_fraction(box, image_width, image_height):
    x1, y1, x2, y2 = box
    box_area = max(0, x2 - x1) * max(0, y2 - y1)
    image_area = max(1, image_width * image_height)
    return box_area / image_area


def is_group_type(class_name: str) -> bool:
    normalized = class_name.lower().replace(" ", "_").replace("-", "_")
    return "group" in normalized or "stack" in normalized or "pile" in normalized


def is_single_beam_type(class_name: str) -> bool:
    normalized = class_name.lower().replace(" ", "_").replace("-", "_")
    return "beam" in normalized and not is_group_type(normalized)


class MaterialDetector:
    def __init__(self, model_path="models/material.pt", confidence=0.15):
        self.model_path = Path(model_path)
        self.default_confidence = confidence
        self.model = None

        if self.model_path.exists():
            self.model = YOLO(str(self.model_path))
            print(f"[material] Loaded material detector: {self.model_path}")
        else:
            print("[material] No material detector found. Using full-image fallback.")

    @property
    def enabled(self):
        return self.model is not None

    def _fallback_material(self, image_bgr):
        height, width = image_bgr.shape[:2]
        full_mask = np.ones((height, width), dtype=np.uint8) * 255
        return [
            {
                "type": "unknown_material",
                "confidence": 1.0,
                "bbox": [0, 0, width, height],
                "mask": full_mask,
                "mask_source": "fallback_full_image",
                "mask_pixels": int(np.count_nonzero(full_mask)),
                "is_fallback": True,
                "area_fraction": 1.0,
            }
        ]

    def detect(self, image_bgr, confidence=None, overlap_threshold=0.55, min_area_fraction=0.02):
        height, width = image_bgr.shape[:2]
        warnings = []

        if self.model is None:
            warnings.append("Material detector model was not found. Full image fallback was used.")
            return self._fallback_material(image_bgr), warnings

        used_confidence = self.default_confidence if confidence is None else confidence

        results = self.model.predict(
            source=image_bgr,
            conf=used_confidence,
            imgsz=640,
            verbose=False,
        )

        result = results[0]

        if result.boxes is None or len(result.boxes) == 0:
            warnings.append("No beam/material was detected. Analysis quality is low.")
            return [], warnings

        names = result.names
        materials = []

        for index, box in enumerate(result.boxes):
            class_id = int(box.cls[0])
            class_name = names[class_id]
            confidence_value = float(box.conf[0])

            x1, y1, x2, y2 = box.xyxy[0].tolist()
            x1 = max(0, int(round(x1)))
            y1 = max(0, int(round(y1)))
            x2 = min(width, int(round(x2)))
            y2 = min(height, int(round(y2)))

            if x2 <= x1 or y2 <= y1:
                continue

            bbox = [x1, y1, x2, y2]
            area_fraction = _area_fraction(bbox, width, height)
            if area_fraction < min_area_fraction:
                warnings.append(
                    f"Small {class_name} detection ignored because it covered only {area_fraction * 100:.2f}% of the image."
                )
                continue

            mask = np.zeros((height, width), dtype=np.uint8)
            mask_source = "bbox_fallback"

            if result.masks is not None and result.masks.data is not None and index < len(result.masks.data):
                mask_data = result.masks.data[index].cpu().numpy()
                mask_resized = cv2.resize(mask_data, (width, height), interpolation=cv2.INTER_LINEAR)
                mask = (mask_resized > 0.5).astype(np.uint8) * 255
                mask_source = "segmentation"
            else:
                cv2.rectangle(mask, (x1, y1), (x2, y2), 255, -1)

            materials.append(
                {
                    "type": class_name,
                    "confidence": round(confidence_value, 4),
                    "bbox": bbox,
                    "mask": mask,
                    "mask_source": mask_source,
                    "mask_pixels": int(np.count_nonzero(mask)),
                    "is_fallback": False,
                    "area_fraction": round(float(area_fraction), 5),
                }
            )

        if not materials:
            warnings.append("All material detections were too small or invalid, so the image was not analyzed.")
            return [], warnings

        resolved, overlap_warnings = self._resolve_group_overlaps(materials, overlap_threshold)
        warnings.extend(overlap_warnings)

        return resolved, warnings

    def _resolve_group_overlaps(self, materials, overlap_threshold):
        """
        Failsafe: if a single beam is mostly covered by a beam group detection,
        keep the group and suppress the single beam. This avoids double-counting.
        """
        groups = [material for material in materials if is_group_type(material["type"])]
        resolved = []
        warnings = []

        for material in materials:
            if not is_single_beam_type(material["type"]):
                resolved.append(material)
                continue

            suppress = False
            for group in groups:
                coverage = _intersection_over_a(material["bbox"], group["bbox"])
                iou = _iou(material["bbox"], group["bbox"])

                if coverage >= overlap_threshold or iou >= max(0.35, overlap_threshold * 0.65):
                    suppress = True
                    warnings.append(
                        "A beam detection overlapped strongly with a beam group, so it was counted as part of the group."
                    )
                    break

            if not suppress:
                resolved.append(material)

        return resolved, warnings
