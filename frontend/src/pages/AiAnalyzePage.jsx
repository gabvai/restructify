import { useState } from "react";

import Button from "../components/Button.jsx";
import { analyzeImagesRequest } from "../api/ai.js";

const AiAnalyzePage = () => {
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    setFiles(event.target.files);
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!files || files.length === 0) {
      setError("Pasirinkite bent vieną nuotrauką.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const analysis = await analyzeImagesRequest(files);
      setResult(analysis);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h1>AI defektų analizė</h1>
      <p className="muted">
        Įkelkite vieną ar kelias metalo konstrukcijų nuotraukas. Dabartinė versija aptinka rūdis.
      </p>

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
      />

      <div style={{ marginTop: "16px" }}>
        <Button type="button" onClick={handleAnalyze} disabled={loading}>
          {loading ? "Analizuojama..." : "Analizuoti nuotraukas"}
        </Button>
      </div>

      {error && (
        <div style={{ marginTop: "16px", color: "crimson" }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: "24px" }}>
          <h2>Rezultatai</h2>

          <p>
            Iš viso rasta defektų:{" "}
            <strong>{result.summary.total_defect_count}</strong>
          </p>

          {result.images.map((image) => (
            <div
              key={image.filename}
              style={{
                marginTop: "24px",
                padding: "16px",
                border: "1px solid #ddd",
                borderRadius: "12px"
              }}
            >
              <h3>{image.filename}</h3>

              <p>
                Rūdys aptiktos:{" "}
                <strong>
                  {image.summary.rust_detected ? "Taip" : "Ne"}
                </strong>
              </p>

              <p>
                Defektų kiekis: {image.summary.defect_count}
              </p>

              <p>
                Didžiausias pasitikėjimas:{" "}
                {(image.summary.max_confidence * 100).toFixed(1)}%
              </p>

              <img
                src={image.preview_image}
                alt={`AI result for ${image.filename}`}
                style={{
                  maxWidth: "100%",
                  borderRadius: "12px",
                  marginTop: "12px"
                }}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AiAnalyzePage;