import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Button from "../components/Button.jsx";
import { analyzeImagesRequest } from "../api/ai.js";
import styles from "./AiAnalyzePage.module.css";

const MAX_IMAGES = 5;

const getDebugImageSource = (image) =>
  image?.preview_image || image?.debug_image || image?.previewImage || null;

const createPreviewItems = (fileList) =>
  Array.from(fileList || []).map((file) => ({
    file,
    name: file.name,
    url: URL.createObjectURL(file)
  }));

const AiDebugPage = () => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    material_confidence: 0.15,
    overlap_threshold: 0.55,
    min_material_area_fraction: 0.02,
    rust_min_area: 160,
    rust_full_penalty_percent: 20,
    bend_full_penalty_threshold: 0.25
  });

  useEffect(() => {
    return () => selectedImages.forEach((item) => URL.revokeObjectURL(item.url));
  }, [selectedImages]);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    selectedImages.forEach((item) => URL.revokeObjectURL(item.url));
    setResult(null);

    if (files.length > MAX_IMAGES) {
      setSelectedImages([]);
      setError(`Galima įkelti daugiausiai ${MAX_IMAGES} nuotraukas vienu metu.`);
      event.target.value = "";
      return;
    }

    setError(null);
    setSelectedImages(createPreviewItems(files));
  };

  const updateSetting = (name, value) => {
    setSettings((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleAnalyze = async () => {
    if (selectedImages.length === 0) {
      setError("Pasirinkite bent vieną nuotrauką.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const analysis = await analyzeImagesRequest(selectedImages.map((item) => item.file), {
        debug: true,
        ...settings
      });
      setResult(analysis);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>AI debug analizė</h1>
          <p>
            Šis puslapis skirtas testavimui: čia rodomi aptikimo vaizdai ir galima keisti slenksčius.
            Produkcinis puslapis vartotojui rodo tik originalias nuotraukas ir ataskaitą.
          </p>
        </div>
        <Link to="/ai/analyze" className={styles.debugLink}>Grįžti į produkcinį puslapį</Link>
      </div>

      <div className={styles.panel}>
        <div className={styles.controlsGrid}>
          <div className={styles.control}>
            <label>Material confidence</label>
            <input type="number" min="0.01" max="0.95" step="0.01" value={settings.material_confidence} onChange={(event) => updateSetting("material_confidence", event.target.value)} />
          </div>
          <div className={styles.control}>
            <label>Beam/group overlap threshold</label>
            <input type="number" min="0.10" max="0.95" step="0.01" value={settings.overlap_threshold} onChange={(event) => updateSetting("overlap_threshold", event.target.value)} />
          </div>
          <div className={styles.control}>
            <label>Min material area fraction</label>
            <input type="number" min="0.001" max="0.50" step="0.005" value={settings.min_material_area_fraction} onChange={(event) => updateSetting("min_material_area_fraction", event.target.value)} />
          </div>
          <div className={styles.control}>
            <label>Rust min area</label>
            <input type="number" min="20" max="5000" step="10" value={settings.rust_min_area} onChange={(event) => updateSetting("rust_min_area", event.target.value)} />
          </div>
          <div className={styles.control}>
            <label>Rust % for full 10-point penalty</label>
            <input type="number" min="1" max="100" step="1" value={settings.rust_full_penalty_percent} onChange={(event) => updateSetting("rust_full_penalty_percent", event.target.value)} />
          </div>
          <div className={styles.control}>
            <label>Bend threshold for full 90-point penalty</label>
            <input type="number" min="0.05" max="0.60" step="0.01" value={settings.bend_full_penalty_threshold} onChange={(event) => updateSetting("bend_full_penalty_threshold", event.target.value)} />
          </div>
        </div>
      </div>

      <div className={styles.panel}>
        <input className={styles.fileInput} type="file" accept="image/*" multiple onChange={handleFileChange} />
        <div className={styles.actions}>
          <Button type="button" onClick={handleAnalyze} disabled={loading || selectedImages.length === 0}>
            {loading ? "Analizuojama..." : "Debug analizuoti"}
          </Button>
          <span className={styles.hint}>Pasirinkta: {selectedImages.length}/{MAX_IMAGES}</span>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {result && (
        <div className={styles.summaryCard}>
          <h2>Debug rezultatai</h2>
          <div className={styles.summaryGrid}>
            <div className={styles.metric}><span>Bendras balas</span><strong>{result.summary.score}</strong></div>
            <div className={styles.metric}><span>Įvertinimas</span><strong>{result.summary.grade}</strong></div>
            <div className={styles.metric}><span>Vid. rūdžių nuobauda</span><strong>{result.summary.average_rust_penalty} / 10</strong></div>
            <div className={styles.metric}><span>Vid. lenkimo nuobauda</span><strong>{result.summary.average_bend_penalty} / 90</strong></div>
          </div>
        </div>
      )}

      {result && (
        <div className={styles.results}>
          {result.images.map((image, index) => (
            <article key={`${image.filename}-${index}`} className={styles.resultCard}>
              <div className={styles.resultHeader}>
                <h3>{image.filename}</h3>
                <span className={styles.grade}>Grade {image.summary.grade}</span>
              </div>

              <div className={styles.debugImageGrid}>
                <div>
                  <p className={styles.hint}>Originalas</p>
                  <div className={styles.imageFrame}>
                    {selectedImages[index] && (
                      <img className={styles.originalImage} src={selectedImages[index].url} alt={image.filename} />
                    )}
                  </div>
                </div>
                <div>
                  <p className={styles.hint}>Debug aptikimai</p>
                  <div className={styles.imageFrame}>
                    {getDebugImageSource(image) ? (
                      <img
                        className={styles.debugImage}
                        src={getDebugImageSource(image)}
                        alt={`Debug ${image.filename}`}
                        loading="lazy"
                      />
                    ) : (
                      <div className={styles.emptyDebugImage}>
                        Debug vaizdas negrąžintas. Patikrinkite, ar backend ir ai-service paleisti su naujausia kodo versija, ir ar užklausoje yra debug=true.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <h4>Objektai</h4>
              <ul className={styles.materialList}>
                {image.materials.map((material, materialIndex) => (
                  <li key={materialIndex} className={styles.materialItem}>
                    <div className={styles.materialTitle}>
                      <span>{material.type}</span>
                      <span>{material.score} / {material.grade}</span>
                    </div>
                    <p className={styles.materialText}>
                      Area: {material.area_fraction ? `${(material.area_fraction * 100).toFixed(2)}%` : "-"} | Rust: {material.rust.percentage}% | Rust penalty: {material.rust.penalty}/10 | Bend penalty: {material.bend.penalty}/90 | Bend assessed: {String(material.bend.assessed)} | Severity: {material.bend.severity || "-"} | Curve evidence: {material.bend.curve_improvement ?? "-"}
                    </p>
                  </li>
                ))}
              </ul>

              {image.summary.warnings?.length > 0 && (
                <ul className={styles.warningList}>
                  {image.summary.warnings.map((warning, warningIndex) => (
                    <li key={warningIndex}>{warning}</li>
                  ))}
                </ul>
              )}

              <h4>JSON</h4>
              <pre className={styles.debugJson}>{JSON.stringify(image, null, 2)}</pre>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default AiDebugPage;
