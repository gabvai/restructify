from pathlib import Path
import base64

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, Query, UploadFile

from detection.bend_detection import detect_bend, detect_multibox_bend
from detection.material_detector import MaterialDetector, is_group_type, is_single_beam_type
from detection.rust_processing import analyze_rust
from detection.scoring import calculate_material_score, grade_from_score


MAX_IMAGES = 5
DEFAULT_MATERIAL_CONFIDENCE = 0.15
DEFAULT_OVERLAP_THRESHOLD = 0.55
DEFAULT_MIN_MATERIAL_AREA_FRACTION = 0.02
DEFAULT_RUST_MIN_AREA = 160
DEFAULT_RUST_FULL_PENALTY_PERCENT = 20.0
DEFAULT_BEND_FULL_PENALTY_THRESHOLD = 0.20

app = FastAPI(title="ReStructify AI Service")

material_detector = MaterialDetector(
    model_path="models/material.pt",
    confidence=DEFAULT_MATERIAL_CONFIDENCE,
)


def decode_image(file_bytes: bytes):
    array = np.frombuffer(file_bytes, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Could not decode image")

    return image


def encode_image(image_bgr, max_width=1200, jpeg_quality=82):
    height, width = image_bgr.shape[:2]

    if width > max_width:
        scale = max_width / float(width)
        new_size = (max_width, max(1, int(height * scale)))
        image_bgr = cv2.resize(image_bgr, new_size, interpolation=cv2.INTER_AREA)

    encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), int(jpeg_quality)]
    success, buffer = cv2.imencode(".jpg", image_bgr, encode_params)

    if not success:
        raise ValueError("Could not encode result image")

    encoded = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/jpeg;base64,{encoded}"


def draw_rust_overlay(preview, rust_mask, offset_x=0, offset_y=0):
    crop_height, crop_width = rust_mask.shape[:2]
    overlay_region = preview[offset_y:offset_y + crop_height, offset_x:offset_x + crop_width]

    if overlay_region.size == 0:
        return preview

    orange_overlay = overlay_region.copy()
    orange_overlay[rust_mask > 0] = (0, 140, 255)

    blended = cv2.addWeighted(orange_overlay, 0.45, overlay_region, 0.55, 0)
    preview[offset_y:offset_y + crop_height, offset_x:offset_x + crop_width] = blended

    return preview


def draw_debug_material(preview, material, score_info, bend_result):
    x1, y1, x2, y2 = material["bbox"]

    if is_group_type(material["type"]):
        color = (255, 180, 0)
    elif is_single_beam_type(material["type"]):
        color = (0, 200, 255)
    else:
        color = (160, 160, 160)

    thickness = 2
    font_scale = max(0.45, min(0.75, preview.shape[1] / 1600.0))

    cv2.rectangle(preview, (x1, y1), (x2, y2), color, thickness)

    material_mask = material.get("mask")
    if material_mask is not None and np.count_nonzero(material_mask) > 0:
        contours, _ = cv2.findContours((material_mask > 0).astype(np.uint8) * 255, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(preview, contours, -1, color, 2)

    debug_points = bend_result.get("debug_centerline_points") or []
    if len(debug_points) >= 2:
        offset_points = np.array([[int(x1 + p[0]), int(y1 + p[1])] for p in debug_points], dtype=np.int32)
        # Red = counted as bend. Green = assessed as straight/no reliable bend.
        centerline_color = (0, 0, 255) if bend_result.get("possible_bend") else (0, 180, 0)
        cv2.polylines(preview, [offset_points.reshape((-1, 1, 2))], isClosed=False, color=centerline_color, thickness=3)

    label = f"{material['type']} {material['confidence']:.2f} score {score_info['score']:.0f}"
    cv2.putText(
        preview,
        label,
        (x1, max(20, y1 - 8)),
        cv2.FONT_HERSHEY_SIMPLEX,
        font_scale,
        color,
        2,
    )

    if bend_result.get("assessed") and bend_result.get("possible_bend"):
        cv2.putText(
            preview,
            f"possible bend: {bend_result.get('severity', 'unknown')}",
            (x1, min(preview.shape[0] - 10, y2 + 22)),
            cv2.FONT_HERSHEY_SIMPLEX,
            font_scale,
            (0, 0, 255),
            2,
        )


def material_counts(material_results):
    beam_count = 0
    group_count = 0
    fallback_count = 0

    for material in material_results:
        material_type = material["type"]
        if material.get("is_fallback"):
            fallback_count += 1
        elif is_group_type(material_type):
            group_count += 1
        elif is_single_beam_type(material_type):
            beam_count += 1

    return {
        "beam_count": beam_count,
        "beam_group_count": group_count,
        "fallback_count": fallback_count,
        "material_count": len(material_results),
    }


def _average(values):
    values = list(values)
    return sum(values) / len(values) if values else 0.0


def analyze_single_image(image_bgr, settings):
    preview = image_bgr.copy()
    warnings = []

    materials, detector_warnings = material_detector.detect(
        image_bgr,
        confidence=settings["material_confidence"],
        overlap_threshold=settings["overlap_threshold"],
        min_area_fraction=settings["min_material_area_fraction"],
    )
    warnings.extend(detector_warnings)

    all_detections = []
    material_results = []

    multi_box_bend = detect_multibox_bend(
        materials,
        image_bgr.shape,
        full_penalty_threshold=settings["bend_full_penalty_threshold"],
    )
    multi_box_bend_indices = set(multi_box_bend.get("material_indices", []))

    if multi_box_bend.get("assessed") and multi_box_bend.get("possible_bend"):
        warnings.append("Possible bend detected from the combined path of several beam detections.")

    if not materials:
        return {
            "detections": [],
            "materials": [],
            "summary": {
                "score": 0.0,
                "grade": "F",
                "defect_count": 0,
                "rust_detected": False,
                "possible_bend_detected": False,
                "max_confidence": 0,
                "total_rust_regions": 0,
                "possible_bend_count": 0,
                "average_rust_penalty": 0.0,
                "average_bend_penalty": 0.0,
                **material_counts([]),
                "warnings": warnings,
            },
            "preview_image": encode_image(preview) if settings["debug"] else None,
        }

    for material_index, material in enumerate(materials):
        x1, y1, x2, y2 = material["bbox"]
        material_crop = image_bgr[y1:y2, x1:x2]

        if material_crop.size == 0:
            warnings.append("A detected material crop was empty and was skipped.")
            continue

        material_mask_full = material.get("mask")
        material_mask_crop = None
        if material_mask_full is not None:
            material_mask_crop = material_mask_full[y1:y2, x1:x2]

        rust_result = analyze_rust(
            image_bgr=material_crop,
            material_mask=material_mask_crop,
            min_area=settings["rust_min_area"],
        )

        bend_result = detect_bend(
            image_bgr=material_crop,
            material_type=material["type"],
            material_mask=material_mask_crop,
            full_penalty_threshold=settings["bend_full_penalty_threshold"],
        )

        # Failsafe for bent beams that are split into multiple beam boxes.
        # If the whole chain of beam boxes is curved, use that image-level
        # bend result even when each small crop looks locally straight.
        if material_index in multi_box_bend_indices:
            current_score = float(bend_result.get("severity_score", 0.0) or 0.0)
            multi_score = float(multi_box_bend.get("severity_score", 0.0) or 0.0)
            if multi_score > current_score:
                bend_result = {
                    **multi_box_bend,
                    "assessed": True,
                    "possible_bend": bool(multi_box_bend.get("possible_bend")),
                    "reason": "Bend estimated from the combined path of several beam detections.",
                }

        score_info = calculate_material_score(
            rust_percentage=rust_result["rust_percentage"],
            bend_result=bend_result,
            rust_full_penalty_percent=settings["rust_full_penalty_percent"],
        )

        material_detections = []

        for region in rust_result["regions"]:
            rx1, ry1, rx2, ry2 = region["bbox"]
            original_bbox = [x1 + rx1, y1 + ry1, x1 + rx2, y1 + ry2]

            detection = {
                "type": "rust",
                "method": "image_processing_hsv",
                "confidence": None,
                "bbox": original_bbox,
                "area_pixels": region["area_pixels"],
                "material_index": material_index,
            }
            all_detections.append(detection)
            material_detections.append(detection)

        if bend_result.get("assessed") and bend_result.get("possible_bend"):
            bend_detection = {
                "type": "possible_bend",
                "method": "conservative_centerline_deviation",
                "confidence": bend_result.get("severity_score"),
                "bbox": material["bbox"],
                "severity": bend_result.get("severity"),
                "material_index": material_index,
            }
            all_detections.append(bend_detection)
            material_detections.append(bend_detection)

        if settings["debug"]:
            preview = draw_rust_overlay(preview, rust_result["rust_mask"], offset_x=x1, offset_y=y1)
            for region in rust_result["regions"]:
                rx1, ry1, rx2, ry2 = region["bbox"]
                cv2.rectangle(preview, (x1 + rx1, y1 + ry1), (x1 + rx2, y1 + ry2), (0, 255, 0), 2)
            draw_debug_material(preview, material, score_info, bend_result)

        material_results.append(
            {
                "type": material["type"],
                "confidence": material["confidence"],
                "bbox": material["bbox"],
                "area_fraction": material.get("area_fraction"),
                "mask_source": material.get("mask_source", "unknown"),
                "mask_pixels": material.get("mask_pixels"),
                "is_fallback": material.get("is_fallback", False),
                "usable_for_bend_detection": bool(is_single_beam_type(material["type"])),
                "rust": {
                    "detected": rust_result["rust_detected"],
                    "percentage": rust_result["rust_percentage"],
                    "region_count": rust_result["region_count"],
                    "rust_pixels": rust_result["rust_pixels"],
                    "material_pixels": rust_result["material_pixels"],
                    "max_penalty_points": 10,
                    "penalty": score_info["rust_penalty"],
                },
                "bend": {
                    **bend_result,
                    "max_penalty_points": 90,
                    "penalty": score_info["bend_penalty"],
                },
                "score": score_info["score"],
                "grade": score_info["grade"],
                "penalties": score_info,
                "defects": material_detections,
            }
        )

    if not material_results:
        image_score = 0.0
    else:
        # Conservative grading: the worst inspected object determines image score.
        image_score = min(material["score"] for material in material_results)

    counts = material_counts(material_results)
    total_rust_regions = sum(material["rust"]["region_count"] for material in material_results)
    possible_bends = sum(1 for material in material_results if material["bend"].get("possible_bend"))
    max_confidence = max(
        [material.get("confidence", 0) for material in material_results if not material.get("is_fallback")],
        default=0,
    )
    average_rust_penalty = _average(material["rust"]["penalty"] for material in material_results)
    average_bend_penalty = _average(material["bend"]["penalty"] for material in material_results)

    image_summary = {
        "score": round(image_score, 2),
        "grade": grade_from_score(image_score),
        "defect_count": len(all_detections),
        "rust_detected": total_rust_regions > 0,
        "possible_bend_detected": possible_bends > 0,
        "max_confidence": max_confidence,
        "total_rust_regions": total_rust_regions,
        "possible_bend_count": possible_bends,
        "average_rust_penalty": round(average_rust_penalty, 2),
        "average_bend_penalty": round(average_bend_penalty, 2),
        **counts,
        "warnings": warnings,
    }

    response = {
        "detections": all_detections,
        "materials": material_results,
        "summary": image_summary,
    }

    if settings["debug"]:
        response["preview_image"] = encode_image(preview)

    return response


@app.get("/health")
def health():
    return {
        "status": "ok",
        "pipeline": "material_detection_rust_and_bend_scoring_v3",
        "max_images": MAX_IMAGES,
        "material_detection_enabled": material_detector.enabled,
        "material_model_path": "models/material.pt",
        "rust_detection_method": "stricter HSV/Lab thresholding + morphology",
        "bend_detection_method": "segmentation mask PCA centerline deviation",
        "scoring": {
            "perfect_score": 100,
            "rust_max_penalty": 10,
            "bend_max_penalty": 90,
        },
    }


@app.post("/analyze")
async def analyze_images(
    images: list[UploadFile] = File(...),
    debug: bool = Query(False),
    material_confidence: float = Query(DEFAULT_MATERIAL_CONFIDENCE, ge=0.01, le=0.95),
    overlap_threshold: float = Query(DEFAULT_OVERLAP_THRESHOLD, ge=0.10, le=0.95),
    min_material_area_fraction: float = Query(DEFAULT_MIN_MATERIAL_AREA_FRACTION, ge=0.001, le=0.50),
    rust_min_area: int = Query(DEFAULT_RUST_MIN_AREA, ge=20, le=5000),
    rust_full_penalty_percent: float = Query(DEFAULT_RUST_FULL_PENALTY_PERCENT, ge=1.0, le=100.0),
    bend_full_penalty_threshold: float = Query(DEFAULT_BEND_FULL_PENALTY_THRESHOLD, ge=0.05, le=0.60),
):
    if not images:
        raise HTTPException(status_code=400, detail="No images uploaded")

    if len(images) > MAX_IMAGES:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_IMAGES} images can be uploaded at once")

    settings = {
        "debug": debug,
        "material_confidence": material_confidence,
        "overlap_threshold": overlap_threshold,
        "min_material_area_fraction": min_material_area_fraction,
        "rust_min_area": rust_min_area,
        "rust_full_penalty_percent": rust_full_penalty_percent,
        "bend_full_penalty_threshold": bend_full_penalty_threshold,
    }

    analyzed_images = []

    for uploaded_file in images:
        if not uploaded_file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail=f"{uploaded_file.filename} is not an image")

        file_bytes = await uploaded_file.read()

        try:
            image = decode_image(file_bytes)
            result = analyze_single_image(image, settings)
        except Exception as error:
            raise HTTPException(status_code=500, detail=f"Failed to analyze {uploaded_file.filename}: {error}")

        analyzed_images.append({"filename": uploaded_file.filename, **result})

    image_scores = [image["summary"]["score"] for image in analyzed_images]
    worst_score = min(image_scores, default=0.0)
    average_score = sum(image_scores) / len(image_scores) if image_scores else 0.0

    total_defects = sum(image["summary"]["defect_count"] for image in analyzed_images)
    total_rust_regions = sum(image["summary"]["total_rust_regions"] for image in analyzed_images)
    total_bends = sum(image["summary"].get("possible_bend_count", 0) for image in analyzed_images)
    average_rust_penalty = _average(image["summary"].get("average_rust_penalty", 0.0) for image in analyzed_images)
    average_bend_penalty = _average(image["summary"].get("average_bend_penalty", 0.0) for image in analyzed_images)

    return {
        "pipeline": {
            "version": "ai_quality_scoring_v3",
            "debug": debug,
            "material_detection_enabled": material_detector.enabled,
            "defect_methods": ["rust_image_processing", "segmentation_mask_bend_detection"],
            "settings": settings,
        },
        "summary": {
            "image_count": len(analyzed_images),
            "total_defect_count": total_defects,
            "total_rust_regions": total_rust_regions,
            "total_possible_bends": total_bends,
            "rust_detected": total_rust_regions > 0,
            "possible_bend_detected": total_bends > 0,
            "score": round(worst_score, 2),
            "grade": grade_from_score(worst_score),
            "average_score": round(average_score, 2),
            "worst_score": round(worst_score, 2),
            "average_rust_penalty": round(average_rust_penalty, 2),
            "average_bend_penalty": round(average_bend_penalty, 2),
        },
        "images": analyzed_images,
    }
