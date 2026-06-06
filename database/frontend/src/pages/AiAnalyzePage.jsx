import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Button from "../components/Button.jsx";
import { analyzeImagesRequest } from "../api/ai.js";
import styles from "./AiAnalyzePage.module.css";

const MAX_IMAGES = 5;

const createPreviewItems = (fileList) =>
  Array.from(fileList || []).map((file) => ({
    file,
    name: file.name,
    url: URL.createObjectURL(file)
  }));

const formatScore = (value) => Number(value || 0).toFixed(1);
const formatPoints = (value) => Number(value || 0).toFixed(1);

const AiAnalyzePage = () => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      selectedImages.forEach((item) => URL.revokeObjectURL(item.url));
    };
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

  const handleAnalyze = async () => {
    if (selectedImages.length === 0) {
      setError("Pasirinkite bent vieną nuotrauką.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const analysis = await analyzeImagesRequest(selectedImages.map((item) => item.file));
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
          <h1>AI konstrukcijos kokybės analizė</h1>
          <p>
            Įkelkite iki 5 metalo konstrukcijos nuotraukų. Sistema pateikia bendrą kokybės balą,
            įvertinimą ir vidutiniškai nuimtus taškus dėl rūdžių bei galimos deformacijos.
          </p>
        </div>
        <Link to="/ai/debug" className={styles.debugLink}>Atidaryti debug puslapį</Link>
      </div>

      <div className={styles.panel}>
        <input
          className={styles.fileInput}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
        />
        <p className={styles.hint}>Limitas: {MAX_IMAGES} nuotraukos. Produkciniame puslapyje rodomos tik originalios nuotraukos ir ataskaita.</p>

        <div className={styles.actions}>
          <Button type="button" onClick={handleAnalyze} disabled={loading || selectedImages.length === 0}>
            {loading ? "Analizuojama..." : "Analizuoti nuotraukas"}
          </Button>
          <span className={styles.hint}>Pasirinkta: {selectedImages.length}/{MAX_IMAGES}</span>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {result && (
        <div className={styles.summaryCard}>
          <h2>Galutinė klasifikacija</h2>
          <div className={styles.summaryGrid}>
            <div className={styles.metric}>
              <span>Bendras balas</span>
              <strong>{formatScore(result.summary.score)}</strong>
            </div>
            <div className={styles.metric}>
              <span>Įvertinimas</span>
              <strong>{result.summary.grade}</strong>
            </div>
            <div className={styles.metric}>
              <span>Vidutinis balas</span>
              <strong>{formatScore(result.summary.average_score)}</strong>
            </div>
            <div className={styles.metric}>
              <span>Vid. rūdžių nuobauda</span>
              <strong>{formatPoints(result.summary.average_rust_penalty)} / 10</strong>
            </div>
            <div className={styles.metric}>
              <span>Vid. lenkimo nuobauda</span>
              <strong>{formatPoints(result.summary.average_bend_penalty)} / 90</strong>
            </div>
          </div>
          <p className={styles.reportText}>
            Rūdžių regionų: <strong>{result.summary.total_rust_regions}</strong>. Galimų deformacijų: <strong>{result.summary.total_possible_bends}</strong>.
          </p>
        </div>
      )}

      {result && (
        <div className={styles.results}>
          {result.images.map((image, index) => {
            const preview = selectedImages[index];
            return (
              <article key={`${image.filename}-${index}`} className={styles.resultCard}>
                <div className={styles.resultHeader}>
                  <h3>{image.filename}</h3>
                  <span className={styles.grade}>Grade {image.summary.grade}</span>
                </div>

                <div className={styles.imageGrid}>
                  {preview && (
                    <img className={styles.originalImage} src={preview.url} alt={preview.name} />
                  )}

                  <div className={styles.details}>
                    <div className={styles.scoreGrid}>
                      <div className={styles.metric}>
                        <span>Balas</span>
                        <strong>{formatScore(image.summary.score)}</strong>
                      </div>
                      <div className={styles.metric}>
                        <span>Medžiagos</span>
                        <strong>{image.summary.material_count}</strong>
                      </div>
                      <div className={styles.metric}>
                        <span>Rūdžių nuobauda</span>
                        <strong>{formatPoints(image.summary.average_rust_penalty)} / 10</strong>
                      </div>
                      <div className={styles.metric}>
                        <span>Lenkimo nuobauda</span>
                        <strong>{formatPoints(image.summary.average_bend_penalty)} / 90</strong>
                      </div>
                    </div>

                    <p className={styles.reportText}>
                      Rūdžių regionai: <strong>{image.summary.total_rust_regions}</strong>. Galimi lenkimai/deformacijos: <strong>{image.summary.possible_bend_count}</strong>.
                    </p>

                    {image.materials.length === 0 && (
                      <p className={styles.materialText}>Sija ar metalo grupė neaptikta arba aptikimai buvo per maži, todėl nuotrauka laikoma netinkama analizei.</p>
                    )}

                    {image.summary.warnings?.length > 0 && (
                      <ul className={styles.warningList}>
                        {image.summary.warnings.map((warning, warningIndex) => (
                          <li key={warningIndex}>{warning}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default AiAnalyzePage;
