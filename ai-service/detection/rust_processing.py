import cv2
import numpy as np


def enhance_image_for_rust(image_bgr):
    """
    Light enhancement:
    - keeps color information
    - improves local contrast
    - avoids aggressive filtering
    """
    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)

    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    enhanced_l = clahe.apply(l_channel)
    enhanced_lab = cv2.merge((enhanced_l, a_channel, b_channel))
    enhanced_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

    return enhanced_bgr


def create_rust_mask(image_bgr, material_mask=None):
    """
    Detect visible rust using HSV color thresholding.
    This is rule-based, not AI.
    """
    enhanced = enhance_image_for_rust(image_bgr)

    hsv = cv2.cvtColor(enhanced, cv2.COLOR_BGR2HSV)

    # OpenCV HSV hue range is 0-179.
    # Rust often appears orange, brown, red-brown, or dark brown.

    # Orange / brown rust
    lower_orange_brown = np.array([5, 45, 35])
    upper_orange_brown = np.array([35, 255, 255])

    # Dark red / dark brown rust
    lower_dark_brown = np.array([0, 35, 25])
    upper_dark_brown = np.array([20, 255, 180])

    # Red-ish rust near hue wraparound
    lower_red_1 = np.array([0, 40, 30])
    upper_red_1 = np.array([10, 255, 255])

    lower_red_2 = np.array([170, 40, 30])
    upper_red_2 = np.array([179, 255, 255])

    mask_orange = cv2.inRange(hsv, lower_orange_brown, upper_orange_brown)
    mask_brown = cv2.inRange(hsv, lower_dark_brown, upper_dark_brown)
    mask_red_1 = cv2.inRange(hsv, lower_red_1, upper_red_1)
    mask_red_2 = cv2.inRange(hsv, lower_red_2, upper_red_2)

    rust_mask = cv2.bitwise_or(mask_orange, mask_brown)
    rust_mask = cv2.bitwise_or(rust_mask, mask_red_1)
    rust_mask = cv2.bitwise_or(rust_mask, mask_red_2)

    # Extra RGB/BGR condition to reduce false positives from bright yellow/orange objects.
    b, g, r = cv2.split(enhanced)

    rust_color_condition = (
        (r.astype(np.float32) > b.astype(np.float32) * 1.15) &
        (g.astype(np.float32) > b.astype(np.float32) * 0.85) &
        (r > 60) &
        (g > 35)
    )

    rust_color_condition = rust_color_condition.astype(np.uint8) * 255

    rust_mask = cv2.bitwise_and(rust_mask, rust_color_condition)

    if material_mask is not None:
        rust_mask = cv2.bitwise_and(rust_mask, material_mask)

    # Clean small noise and fill small holes.
    kernel_small = np.ones((3, 3), np.uint8)
    kernel_medium = np.ones((5, 5), np.uint8)

    rust_mask = cv2.morphologyEx(rust_mask, cv2.MORPH_OPEN, kernel_small)
    rust_mask = cv2.morphologyEx(rust_mask, cv2.MORPH_CLOSE, kernel_medium)

    return rust_mask, enhanced


def extract_rust_regions(rust_mask, min_area=120):
    contours, _ = cv2.findContours(
        rust_mask,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    regions = []

    for contour in contours:
        area = cv2.contourArea(contour)

        if area < min_area:
            continue

        x, y, w, h = cv2.boundingRect(contour)

        regions.append({
            "bbox": [int(x), int(y), int(x + w), int(y + h)],
            "area_pixels": float(area)
        })

    return regions


def analyze_rust(image_bgr, material_mask=None):
    rust_mask, enhanced = create_rust_mask(
        image_bgr=image_bgr,
        material_mask=material_mask
    )

    regions = extract_rust_regions(rust_mask)

    if material_mask is not None:
        material_pixels = int(np.count_nonzero(material_mask))
    else:
        material_pixels = image_bgr.shape[0] * image_bgr.shape[1]

    rust_pixels = int(np.count_nonzero(rust_mask))

    rust_percentage = 0.0
    if material_pixels > 0:
        rust_percentage = (rust_pixels / material_pixels) * 100.0

    return {
        "rust_mask": rust_mask,
        "enhanced_image": enhanced,
        "regions": regions,
        "rust_pixels": rust_pixels,
        "material_pixels": material_pixels,
        "rust_percentage": rust_percentage,
        "rust_detected": len(regions) > 0
    }