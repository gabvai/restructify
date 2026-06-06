def clamp(value, min_value=0.0, max_value=1.0):
    return max(min_value, min(max_value, value))


def grade_from_score(score):
    if score >= 90:
        return "A"
    if score >= 75:
        return "B"
    if score >= 60:
        return "C"
    if score >= 40:
        return "D"
    return "F"


def calculate_material_score(rust_percentage, bend_result, rust_full_penalty_percent=20.0):
    rust_penalty = clamp(rust_percentage / max(0.1, rust_full_penalty_percent), 0.0, 1.0) * 10.0

    bend_penalty = 0.0
    if bend_result and bend_result.get("assessed"):
        bend_penalty = clamp(float(bend_result.get("severity_score", 0.0)), 0.0, 1.0) * 90.0

    total_penalty = min(100.0, rust_penalty + bend_penalty)
    score = max(0.0, 100.0 - total_penalty)

    return {
        "score": round(score, 2),
        "grade": grade_from_score(score),
        "rust_penalty": round(rust_penalty, 2),
        "bend_penalty": round(bend_penalty, 2),
        "total_penalty": round(total_penalty, 2),
    }
