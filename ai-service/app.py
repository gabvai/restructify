from pathlib import Path
import base64

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException

from detection.material_detector import MaterialDetector
from detection.rust_processing import analyze_rust


app = FastAPI(title="ReStructify AI Service")

material_detector = MaterialDetector(
    model_path="models/material.pt",
    confidence=0.25
)


def decode_image(file_bytes: bytes):
    array = np.frombuffer(file_bytes, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Could not decode image")

    return image


def encode_image(image_bgr):
    success, buffer = cv2.imencode(".jpg", image_bgr)

    if not success:
        raise ValueError("Could not encode result image")

    encoded = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/jpeg;base64,{encoded}"


def draw_rust_overlay(preview, rust_mask, offset_x=0, offset_y=0):
    """
    Draw rust mask from a crop back onto the full preview image.
    """
    crop_height, crop_width = rust_mask.shape[:2]

    overlay_region = preview[
        offset_y:offset_y + crop_height,
        offset_x:offset_x + crop_width
    ]

    if overlay_region.size == 0:
        return preview

    orange_overlay = overlay_region.copy()
    orange_overlay[rust_mask > 0] = (0, 140, 255)

    blended = cv2.addWeighted(
        orange_overlay,
        0.45,
        overlay_region,
        0.55,
        0
    )

    preview[
        offset_y:offset_y + crop_height,
        offset_x:offset_x + crop_width
    ] = blended

    return preview


def analyze_single_image(image_bgr):
    preview = image_bgr.copy()

    materials = material_detector.detect(image_bgr)

    all_detections = []
    material_results = []

    for material_index, material in enumerate(materials):
        x1, y1, x2, y2 = material["bbox"]

        material_crop = image_bgr[y1:y2, x1:x2]

        if material_crop.size == 0:
            continue

        material_mask_full = material.get("mask")

        material_mask_crop = None
        if material_mask_full is not None:
            material_mask_crop = material_mask_full[y1:y2, x1:x2]

        rust_result = analyze_rust(
            image_bgr=material_crop,
            material_mask=material_mask_crop
        )

        rust_mask_crop = rust_result["rust_mask"]

        preview = draw_rust_overlay(
            preview=preview,
            rust_mask=rust_mask_crop,
            offset_x=x1,
            offset_y=y1
        )

        # Draw material box
        if not material.get("is_fallback", False):
            cv2.rectangle(
                preview,
                (x1, y1),
                (x2, y2),
                (255, 180, 0),
                2
            )

            cv2.putText(
                preview,
                material["type"],
                (x1, max(20, y1 - 8)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 180, 0),
                2
            )

        material_detections = []

        for region in rust_result["regions"]:
            rx1, ry1, rx2, ry2 = region["bbox"]

            original_bbox = [
                x1 + rx1,
                y1 + ry1,
                x1 + rx2,
                y1 + ry2
            ]

            cv2.rectangle(
                preview,
                (original_bbox[0], original_bbox[1]),
                (original_bbox[2], original_bbox[3]),
                (0, 255, 0),
                2
            )

            # This is a heuristic score because image processing has no real AI confidence.
            area_score = min(region["area_pixels"] / 2500.0, 1.0)
            confidence = round(0.45 + area_score * 0.45, 4)

            detection = {
                "type": "rust",
                "method": "image_processing_hsv",
                "confidence": confidence,
                "bbox": original_bbox,
                "area_pixels": round(region["area_pixels"], 2),
                "material_index": material_index
            }

            all_detections.append(detection)
            material_detections.append(detection)

        material_results.append({
            "type": material["type"],
            "confidence": material["confidence"],
            "bbox": material["bbox"],
            "rust_percentage": round(rust_result["rust_percentage"], 4),
            "rust_pixels": rust_result["rust_pixels"],
            "material_pixels": rust_result["material_pixels"],
            "defects": material_detections
        })

    max_confidence = max(
        [d["confidence"] for d in all_detections],
        default=0
    )

    return {
        "detections": all_detections,
        "materials": material_results,
        "summary": {
            "defect_count": len(all_detections),
            "rust_detected": len(all_detections) > 0,
            "max_confidence": max_confidence,
            "total_rust_percentage": round(
                max([m["rust_percentage"] for m in material_results], default=0),
                4
            )
        },
        "preview_image": encode_image(preview)
    }


@app.get("/health")
def health():
    material_model_exists = Path("models/material.pt").exists()

    return {
        "status": "ok",
        "pipeline": "hybrid_material_crop_plus_rust_image_processing",
        "material_detection_enabled": material_model_exists,
        "rust_detection_method": "HSV color thresholding + morphology",
        "future_models": [
            "models/material.pt for beam/column/truss detection",
            "models/defects.pt for cracks/holes/dents/buckling later"
        ]
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
            "version": "hybrid_rust_processing_v1",
            "material_detection_enabled": Path("models/material.pt").exists(),
            "defect_methods": [
                "rust_image_processing"
            ],
            "future_defects": [
                "holes",
                "bends",
                "buckling",
                "dents",
                "cracks"
            ]
        },
        "summary": {
            "image_count": len(analyzed_images),
            "total_defect_count": total_defects,
            "rust_detected": total_defects > 0
        },
        "images": analyzed_images
    }