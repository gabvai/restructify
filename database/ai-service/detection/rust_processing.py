import cv2
import numpy as np


def enhance_image_for_rust(image_bgr):
    """
    Very light contrast enhancement.  It keeps colour information because rust
    detection depends strongly on colour.  We avoid aggressive sharpening or
    colour shifts because they can create fake rust-like pixels on grey steel.
    """
    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=1.6, tileGridSize=(8, 8))
    enhanced_l = clahe.apply(l_channel)

    enhanced_lab = cv2.merge((enhanced_l, a_channel, b_channel))
    return cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)


def create_rust_mask(image_bgr, material_mask=None):
    enhanced = enhance_image_for_rust(image_bgr)
    hsv = cv2.cvtColor(enhanced, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(enhanced, cv2.COLOR_BGR2LAB)

    h, s, v = cv2.split(hsv)
    l_channel, a_channel, b_channel = cv2.split(lab)
    b, g, r = cv2.split(enhanced)

    # OpenCV hue range is 0-179.  These ranges are intentionally stricter than
    # the first version because grey beams were being detected as rust.
    # Main rust colours: orange, brown, red-brown and dark red rust.
    ranges = [
        (np.array([6, 75, 35]), np.array([34, 255, 245])),    # orange / brown rust
        (np.array([0, 70, 25]), np.array([18, 255, 195])),    # dark red-brown rust
        (np.array([170, 70, 25]), np.array([179, 255, 220])), # red wraparound rust
    ]

    rust_mask = np.zeros(hsv.shape[:2], dtype=np.uint8)
    for lower, upper in ranges:
        rust_mask = cv2.bitwise_or(rust_mask, cv2.inRange(hsv, lower, upper))

    # Extra colour conditions to reject grey/neutral steel.  Grey usually has
    # low saturation and nearly equal R/G/B channels.  Rust usually has visible
    # red/yellow chroma: R is higher than B and Lab b-channel is elevated.
    rgb_condition = (
        (s.astype(np.float32) >= 68) &
        (r.astype(np.float32) > b.astype(np.float32) * 1.22) &
        (r.astype(np.float32) >= g.astype(np.float32) * 0.92) &
        (g.astype(np.float32) > b.astype(np.float32) * 0.72) &
        (r > 55) &
        (g > 30)
    )

    # Lab condition helps keep actual rusty yellow/brown regions while rejecting
    # flat grey areas with tiny orange noise after enhancement.
    lab_condition = (
        (a_channel.astype(np.int16) > 118) &
        (b_channel.astype(np.int16) > 135)
    )

    rust_like = (rgb_condition & lab_condition).astype(np.uint8) * 255
    rust_mask = cv2.bitwise_and(rust_mask, rust_like)

    if material_mask is not None:
        rust_mask = cv2.bitwise_and(rust_mask, material_mask)

    kernel_small = np.ones((3, 3), np.uint8)
    kernel_medium = np.ones((5, 5), np.uint8)
    rust_mask = cv2.morphologyEx(rust_mask, cv2.MORPH_OPEN, kernel_small)
    rust_mask = cv2.morphologyEx(rust_mask, cv2.MORPH_CLOSE, kernel_medium)

    return rust_mask, enhanced


def extract_rust_regions(rust_mask, min_area=160, max_area_fraction=0.45):
    contours, _ = cv2.findContours(rust_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    image_area = max(1, rust_mask.shape[0] * rust_mask.shape[1])
    regions = []

    for contour in contours:
        area = float(cv2.contourArea(contour))
        if area < min_area:
            continue
        if area > image_area * max_area_fraction:
            # Very large regions are usually threshold failures caused by warm
            # lighting/background or a full orange painted surface.
            continue

        x, y, w, h = cv2.boundingRect(contour)
        bbox_area = max(1, w * h)
        fill_ratio = area / bbox_area

        # Grey/noisy false positives often appear as sparse dots spread across a
        # large bounding box.  Real rust patches are usually more spatially dense.
        if fill_ratio < 0.08:
            continue

        regions.append(
            {
                "bbox": [int(x), int(y), int(x + w), int(y + h)],
                "area_pixels": round(area, 2),
                "fill_ratio": round(float(fill_ratio), 4),
            }
        )

    return regions


def analyze_rust(image_bgr, material_mask=None, min_area=160):
    rust_mask, enhanced = create_rust_mask(image_bgr, material_mask)
    regions = extract_rust_regions(rust_mask, min_area=min_area)

    # Rebuild the mask from accepted contours/regions only.  This prevents tiny
    # rejected grey/orange noise from still contributing to rust percentage.
    accepted_mask = np.zeros_like(rust_mask)
    for region in regions:
        x1, y1, x2, y2 = region["bbox"]
        accepted_mask[y1:y2, x1:x2] = cv2.bitwise_or(accepted_mask[y1:y2, x1:x2], rust_mask[y1:y2, x1:x2])

    if material_mask is not None:
        material_pixels = int(np.count_nonzero(material_mask))
    else:
        material_pixels = int(image_bgr.shape[0] * image_bgr.shape[1])

    rust_pixels = int(np.count_nonzero(accepted_mask))
    rust_percentage = (rust_pixels / material_pixels * 100.0) if material_pixels > 0 else 0.0

    return {
        "rust_mask": accepted_mask,
        "enhanced_image": enhanced,
        "regions": regions,
        "region_count": len(regions),
        "rust_pixels": rust_pixels,
        "material_pixels": material_pixels,
        "rust_percentage": round(rust_percentage, 4),
        "rust_detected": len(regions) > 0,
    }
