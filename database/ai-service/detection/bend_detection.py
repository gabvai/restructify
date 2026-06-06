import cv2
import numpy as np

from detection.material_detector import is_group_type, is_single_beam_type


def _largest_component(binary_mask):
    mask = (binary_mask > 0).astype(np.uint8) * 255
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    if num_labels <= 1:
        return mask

    # Ignore label 0 because it is background.
    areas = stats[1:, cv2.CC_STAT_AREA]
    largest_label = int(np.argmax(areas)) + 1
    return (labels == largest_label).astype(np.uint8) * 255


def _clean_mask(mask):
    mask = (mask > 0).astype(np.uint8) * 255

    kernel_small = np.ones((3, 3), np.uint8)
    kernel_medium = np.ones((5, 5), np.uint8)

    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel_small)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel_medium)
    mask = _largest_component(mask)

    return mask


def _line_distance_residuals(x_values, y_values):
    coefficients = np.polyfit(x_values, y_values, deg=1)
    fitted = np.polyval(coefficients, x_values)
    return np.abs(y_values - fitted), coefficients


def _quadratic_improvement(x_values, y_values, line_residuals):
    if len(x_values) < 5:
        return 0.0

    try:
        quad_coefficients = np.polyfit(x_values, y_values, deg=2)
        fitted_quad = np.polyval(quad_coefficients, x_values)
        quad_residuals = np.abs(y_values - fitted_quad)
        line_error = float(np.mean(line_residuals))
        quad_error = float(np.mean(quad_residuals))
        return max(0.0, (line_error - quad_error) / max(1.0, line_error))
    except Exception:
        return 0.0




def _centerline_smoothness_score(s_values, t_values):
    """
    Estimate whether the centerline is a smooth curve or a noisy zig-zag.

    A real bent beam usually changes direction gradually. False detections on
    wide perspective I-beams often produce a jagged centerline that jumps
    between different visible faces/flanges. This helper gives a value in
    approximately 0..1, where higher means smoother/more curve-like.
    """
    if len(s_values) < 8:
        return 0.0, 0

    order = np.argsort(s_values)
    t_sorted = np.asarray(t_values, dtype=np.float32)[order]

    # Smooth enough to ignore small mask noise, but not so much that a real
    # bend disappears.
    window = max(3, int(len(t_sorted) / 8))
    if window % 2 == 0:
        window += 1

    if len(t_sorted) >= window:
        kernel = np.ones(window, dtype=np.float32) / float(window)
        t_smooth = np.convolve(t_sorted, kernel, mode="same")
        # Avoid edge artifacts from convolution.
        half = window // 2
        if half > 0 and len(t_smooth) > 2 * half:
            t_smooth[:half] = t_smooth[half]
            t_smooth[-half:] = t_smooth[-half - 1]
    else:
        t_smooth = t_sorted

    diffs = np.diff(t_smooth)
    if len(diffs) == 0:
        return 0.0, 0

    # Ignore very tiny slope changes.
    eps = max(1.0, float(np.percentile(np.abs(diffs), 35)))
    signs = []
    for d in diffs:
        if abs(float(d)) >= eps:
            signs.append(1 if d > 0 else -1)

    sign_changes = 0
    for a, b in zip(signs[:-1], signs[1:]):
        if a != b:
            sign_changes += 1

    total_variation = float(np.sum(np.abs(diffs)))
    lateral_range = float(np.ptp(t_smooth))

    if total_variation <= 1e-6:
        return 1.0, sign_changes

    smoothness = lateral_range / total_variation
    # Penalize repeated back-and-forth zig-zags.
    smoothness *= 1.0 / (1.0 + 0.22 * sign_changes)

    return float(np.clip(smoothness, 0.0, 1.0)), int(sign_changes)


def _centerline_from_mask(mask, bin_count=56):
    """
    Estimate a beam centerline directly from the segmentation mask.

    This is much more useful than using a rectangular bounding box.  The method
    is perspective-independent: it finds the beam's dominant axis with PCA,
    slices the mask along that axis, and measures how far the center of each
    slice deviates from a straight line.
    """
    clean_mask = _clean_mask(mask)
    ys, xs = np.where(clean_mask > 0)

    if len(xs) < 250:
        return None

    points = np.column_stack((xs, ys)).astype(np.float32)
    mean = np.mean(points, axis=0)
    centered = points - mean

    try:
        _, _, vh = np.linalg.svd(centered, full_matrices=False)
    except np.linalg.LinAlgError:
        return None

    long_axis = vh[0].astype(np.float32)
    short_axis = vh[1].astype(np.float32)

    # Normalize direction so debug drawings are stable left-to-right.
    if long_axis[0] < 0:
        long_axis *= -1
        short_axis *= -1

    longitudinal = centered @ long_axis
    lateral = centered @ short_axis

    s_min = float(np.percentile(longitudinal, 1.0))
    s_max = float(np.percentile(longitudinal, 99.0))
    length_span = s_max - s_min

    if length_span < 50:
        return None

    bin_edges = np.linspace(s_min, s_max, bin_count + 1)
    centerline = []
    widths = []

    # Minimum pixels per slice scales with mask size.  It prevents using tiny
    # noisy slivers near the ends as centerline points.
    min_pixels = max(8, int(len(xs) / (bin_count * 9)))

    for left, right in zip(bin_edges[:-1], bin_edges[1:]):
        in_bin = (longitudinal >= left) & (longitudinal < right)
        lateral_values = lateral[in_bin]
        longitudinal_values = longitudinal[in_bin]

        if len(lateral_values) < min_pixels:
            continue

        low = float(np.percentile(lateral_values, 10))
        high = float(np.percentile(lateral_values, 90))
        local_width = high - low

        if local_width < 3:
            continue

        # Median is robust to small holes, rust details, and segmentation noise.
        s_center = float(np.median(longitudinal_values))
        t_center = float(np.median(lateral_values))

        centerline.append((s_center, t_center))
        widths.append(local_width)

    if len(centerline) < 10:
        return None

    centerline = np.array(centerline, dtype=np.float32)
    widths = np.array(widths, dtype=np.float32)

    # Remove extreme centerline outliers caused by bad mask pieces.
    s_values = centerline[:, 0]
    t_values = centerline[:, 1]
    residuals, _ = _line_distance_residuals(s_values, t_values)
    median_residual = float(np.median(residuals))
    mad = float(np.median(np.abs(residuals - median_residual)))
    keep = residuals <= median_residual + max(8.0, 4.0 * mad)

    if int(np.count_nonzero(keep)) >= 10:
        centerline = centerline[keep]
        widths = widths[keep]
        s_values = centerline[:, 0]
        t_values = centerline[:, 1]
        residuals, _ = _line_distance_residuals(s_values, t_values)

    # Convert centerline back to image/crop coordinates for debug drawing.
    image_points = []
    for s, t in centerline:
        xy = mean + long_axis * s + short_axis * t
        image_points.append([int(round(float(xy[0]))), int(round(float(xy[1])))])

    dominant_angle = float(np.degrees(np.arctan2(long_axis[1], long_axis[0])))
    while dominant_angle > 90:
        dominant_angle -= 180
    while dominant_angle < -90:
        dominant_angle += 180

    return {
        "clean_mask": clean_mask,
        "centerline": centerline,
        "image_points": image_points,
        "widths": widths,
        "length_span": float(length_span),
        "dominant_angle_degrees": dominant_angle,
        "residuals": residuals,
    }


def _mask_bend_score(mask, full_penalty_threshold=0.20):
    data = _centerline_from_mask(mask)
    if data is None:
        return None

    centerline = data["centerline"]
    widths = data["widths"]
    residuals = data["residuals"]
    s_values = centerline[:, 0]
    t_values = centerline[:, 1]

    median_width = max(6.0, float(np.median(widths)))
    length_span = max(1.0, float(data["length_span"]))

    max_deviation_px = float(np.max(residuals))
    mean_deviation_px = float(np.mean(residuals))

    max_deviation_width_ratio = max_deviation_px / median_width
    mean_deviation_width_ratio = mean_deviation_px / median_width
    max_deviation_length_ratio = max_deviation_px / length_span
    mean_deviation_length_ratio = mean_deviation_px / length_span
    width_length_ratio = median_width / length_span

    curve_improvement = _quadratic_improvement(s_values, t_values, residuals)
    smoothness_score, direction_changes = _centerline_smoothness_score(s_values, t_values)

    # Important guard: bend detection is only reliable for long, slender,
    # single-beam masks.  A straight I-beam photographed in perspective can
    # produce a thick mask with several visible faces/flanges; its estimated
    # centerline may zig-zag even though the beam is straight.
    too_wide_for_reliable_bend = width_length_ratio > 0.32
    too_noisy_for_reliable_bend = smoothness_score < 0.28 and direction_changes >= 3

    # Main score: deviation relative to beam width. Secondary score: deviation
    # relative to beam length. This helps detect long, thin curved beams.
    width_score = max_deviation_width_ratio / max(0.10, full_penalty_threshold)
    length_score = max_deviation_length_ratio / 0.085

    raw_score = max(width_score, length_score)

    # Give a small bonus only when the centerline looks like a smooth curve.
    if curve_improvement > 0.10 and smoothness_score >= 0.35:
        raw_score *= min(1.12, 1.0 + curve_improvement)

    if too_wide_for_reliable_bend or too_noisy_for_reliable_bend:
        raw_score *= 0.30

    severity_score = float(np.clip(raw_score, 0.0, 1.0))

    possible_bend = (
        not too_wide_for_reliable_bend
        and not too_noisy_for_reliable_bend
        and severity_score >= 0.48
        and max_deviation_width_ratio >= 0.18
        and mean_deviation_width_ratio >= 0.045
        and max_deviation_length_ratio >= 0.025
        and (smoothness_score >= 0.42 or curve_improvement >= 0.12)
    )

    severity = "none"
    if possible_bend:
        if severity_score >= 0.80:
            severity = "high"
        elif severity_score >= 0.60:
            severity = "medium"
        else:
            severity = "low"

    return {
        "assessed": True,
        "possible_bend": bool(possible_bend),
        "severity": severity,
        "severity_score": round(float(severity_score), 4),
        "method": "segmentation_mask_pca_centerline_deviation",
        "reason": "Bend estimated from the segmentation mask centerline.",
        "dominant_angle_degrees": round(float(data["dominant_angle_degrees"]), 2),
        "centerline_points": int(len(data["centerline"])),
        "debug_centerline_points": data["image_points"],
        "median_width_px": round(float(median_width), 2),
        "length_span_px": round(float(length_span), 2),
        "width_length_ratio": round(float(width_length_ratio), 4),
        "smoothness_score": round(float(smoothness_score), 4),
        "direction_changes": int(direction_changes),
        "too_wide_for_reliable_bend": bool(too_wide_for_reliable_bend),
        "too_noisy_for_reliable_bend": bool(too_noisy_for_reliable_bend),
        "max_deviation_px": round(float(max_deviation_px), 2),
        "mean_deviation_px": round(float(mean_deviation_px), 2),
        "max_deviation_width_ratio": round(float(max_deviation_width_ratio), 4),
        "mean_deviation_width_ratio": round(float(mean_deviation_width_ratio), 4),
        "max_deviation_length_ratio": round(float(max_deviation_length_ratio), 4),
        "mean_deviation_length_ratio": round(float(mean_deviation_length_ratio), 4),
        "curve_improvement": round(float(curve_improvement), 4),
        "has_material_mask": True,
        "penalty": round(float(severity_score * 90.0), 2),
    }


def _boxes_touch_or_close(box_a, box_b, expansion=0.35):
    ax1, ay1, ax2, ay2 = box_a
    bx1, by1, bx2, by2 = box_b

    aw = max(1, ax2 - ax1)
    ah = max(1, ay2 - ay1)
    bw = max(1, bx2 - bx1)
    bh = max(1, by2 - by1)

    ea_x = aw * expansion
    ea_y = ah * expansion
    eb_x = bw * expansion
    eb_y = bh * expansion

    ax1e, ay1e, ax2e, ay2e = ax1 - ea_x, ay1 - ea_y, ax2 + ea_x, ay2 + ea_y
    bx1e, by1e, bx2e, by2e = bx1 - eb_x, by1 - eb_y, bx2 + eb_x, by2 + eb_y

    return not (ax2e < bx1e or bx2e < ax1e or ay2e < by1e or by2e < ay1e)


def _connected_box_clusters(indexed_boxes):
    n = len(indexed_boxes)
    seen = [False] * n
    clusters = []

    for start in range(n):
        if seen[start]:
            continue
        stack = [start]
        seen[start] = True
        cluster = []

        while stack:
            current = stack.pop()
            cluster.append(indexed_boxes[current])
            _, current_box = indexed_boxes[current]

            for other in range(n):
                if seen[other]:
                    continue
                _, other_box = indexed_boxes[other]
                if _boxes_touch_or_close(current_box, other_box):
                    seen[other] = True
                    stack.append(other)

        clusters.append(cluster)

    return clusters


def detect_multibox_bend(materials, image_shape, full_penalty_threshold=0.20):
    """
    Fallback bend detector for cases where one curved beam is split into several
    beam boxes.  Prefer segmentation-mask bend detection when a good mask exists.
    """
    image_height, image_width = image_shape[:2]

    indexed_boxes = []
    for index, material in enumerate(materials):
        if material.get("is_fallback"):
            continue
        if not is_single_beam_type(material.get("type", "")):
            continue
        indexed_boxes.append((index, material["bbox"]))

    if len(indexed_boxes) < 3:
        return {
            "assessed": False,
            "possible_bend": False,
            "reason": "Multi-box bend detection skipped because fewer than 3 single-beam detections were found.",
            "penalty": 0.0,
            "material_indices": [],
        }

    best_result = None

    for cluster in _connected_box_clusters(indexed_boxes):
        if len(cluster) < 3:
            continue

        indices = [item[0] for item in cluster]
        boxes = [item[1] for item in cluster]

        centers = []
        short_sides = []
        for box in boxes:
            x1, y1, x2, y2 = box
            w = max(1.0, float(x2 - x1))
            h = max(1.0, float(y2 - y1))
            centers.append([(x1 + x2) / 2.0, (y1 + y2) / 2.0])
            short_sides.append(min(w, h))

        centers = np.array(centers, dtype=np.float32)
        mean = np.mean(centers, axis=0)
        centered = centers - mean
        try:
            _, _, vh = np.linalg.svd(centered, full_matrices=False)
        except np.linalg.LinAlgError:
            continue

        long_axis = vh[0].astype(np.float32)
        short_axis = vh[1].astype(np.float32)
        s = centered @ long_axis
        t = centered @ short_axis

        if float(np.ptp(s)) < max(35.0, min(image_width, image_height) * 0.08):
            continue

        residuals, _ = _line_distance_residuals(s, t)
        max_deviation_px = float(np.max(residuals))
        mean_deviation_px = float(np.mean(residuals))
        normalizer = max(12.0, float(np.median(short_sides)))
        max_deviation_ratio = max_deviation_px / normalizer
        mean_deviation_ratio = mean_deviation_px / normalizer
        length_ratio = max_deviation_px / max(1.0, float(np.ptp(s)))

        curve_improvement = _quadratic_improvement(s, t, residuals)
        raw_score = max(max_deviation_ratio / max(0.08, full_penalty_threshold), length_ratio / 0.07)
        if curve_improvement > 0.10:
            raw_score *= min(1.15, 1.0 + curve_improvement)
        severity_score = float(np.clip(raw_score, 0.0, 1.0))

        possible_bend = (
            severity_score >= 0.35
            and max_deviation_ratio >= 0.10
            and mean_deviation_ratio >= 0.025
        )

        severity_label = "none"
        if possible_bend:
            if severity_score >= 0.80:
                severity_label = "high"
            elif severity_score >= 0.55:
                severity_label = "medium"
            else:
                severity_label = "low"

        angle = float(np.degrees(np.arctan2(long_axis[1], long_axis[0])))
        while angle > 90:
            angle -= 180
        while angle < -90:
            angle += 180

        result = {
            "assessed": True,
            "possible_bend": bool(possible_bend),
            "severity": severity_label,
            "severity_score": round(float(severity_score), 4),
            "method": "multi_box_centerline_deviation",
            "reason": "Possible bend estimated from a connected chain of single-beam boxes.",
            "material_indices": indices,
            "center_count": int(len(centers)),
            "dominant_angle_degrees": round(float(angle), 2),
            "max_deviation_px": round(max_deviation_px, 2),
            "mean_deviation_px": round(mean_deviation_px, 2),
            "max_deviation_ratio": round(float(max_deviation_ratio), 4),
            "mean_deviation_ratio": round(float(mean_deviation_ratio), 4),
            "max_deviation_length_ratio": round(float(length_ratio), 4),
            "curve_improvement": round(float(curve_improvement), 4),
            "penalty": round(float(severity_score * 90.0), 2),
        }

        if best_result is None or result["severity_score"] > best_result["severity_score"]:
            best_result = result

    if best_result is None:
        return {
            "assessed": False,
            "possible_bend": False,
            "reason": "Multi-box bend detection skipped because no connected chain of single-beam detections was suitable.",
            "penalty": 0.0,
            "material_indices": [],
        }

    return best_result


def _fallback_box_bend(image_bgr, full_penalty_threshold=0.20):
    """Very conservative fallback when no real segmentation mask exists."""
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(gray, 60, 160)
    rough = cv2.dilate(edges, np.ones((5, 5), np.uint8), iterations=1)
    rough = cv2.morphologyEx(rough, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))

    result = _mask_bend_score(rough, full_penalty_threshold)
    if result is None:
        return {
            "assessed": False,
            "possible_bend": False,
            "reason": "Bend detection skipped because no stable centerline could be estimated.",
            "penalty": 0.0,
            "has_material_mask": False,
        }

    # Box/edge fallback is noisy, so require stronger evidence and reduce score.
    result["has_material_mask"] = False
    result["method"] = "fallback_edge_centerline_deviation"
    result["severity_score"] = round(float(result["severity_score"] * 0.55), 4)
    result["penalty"] = round(float(result["severity_score"] * 90.0), 2)
    result["possible_bend"] = bool(result["severity_score"] >= 0.55 and result.get("max_deviation_width_ratio", 0) >= 0.20)
    if not result["possible_bend"]:
        result["severity"] = "none"
    return result


def detect_bend(
    image_bgr,
    material_type,
    material_mask=None,
    full_penalty_threshold=0.20,
):
    """
    Detect possible visual bend/deformation.

    If a segmentation mask is available, the detector uses the beam mask's PCA
    centerline.  This is robust to diagonal/perspective photos because the beam
    is compared to its own best-fit line rather than image-horizontal lines.
    """
    if is_group_type(material_type):
        return {
            "assessed": False,
            "possible_bend": False,
            "reason": "Bend detection skipped for beam group/stack images.",
            "penalty": 0.0,
        }

    if not is_single_beam_type(material_type):
        return {
            "assessed": False,
            "possible_bend": False,
            "reason": "Bend detection skipped because the detected material is not a single beam.",
            "penalty": 0.0,
        }

    height, width = image_bgr.shape[:2]
    if width < 80 or height < 50:
        return {
            "assessed": False,
            "possible_bend": False,
            "reason": "Bend detection skipped because the beam crop is too small.",
            "penalty": 0.0,
        }

    if material_mask is not None and np.count_nonzero(material_mask) > max(250, height * width * 0.01):
        result = _mask_bend_score(material_mask, full_penalty_threshold=full_penalty_threshold)
        if result is not None:
            return result

    return _fallback_box_bend(image_bgr, full_penalty_threshold=full_penalty_threshold)
