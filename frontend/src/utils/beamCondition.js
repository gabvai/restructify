export const BEAM_CONDITION_OPTIONS = [
  { value: "new", label: "Nauja" },
  { value: "used", label: "Naudota" }
];

const LABEL_BY_VALUE = Object.fromEntries(
  BEAM_CONDITION_OPTIONS.map(({ value, label }) => [value, label])
);

export const normalizeBeamCondition = (value) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const normalized = String(value).trim().toLowerCase();

  if (normalized === "new" || normalized === "nauja") {
    return "new";
  }

  if (normalized === "used" || normalized === "naudota") {
    return "used";
  }

  return "";
};

export const formatBeamCondition = (value, emptyLabel = "—") => {
  const normalized = normalizeBeamCondition(value);

  if (!normalized) {
    if (value === null || value === undefined || value === "") {
      return emptyLabel;
    }

    return String(value);
  }

  return LABEL_BY_VALUE[normalized];
};
