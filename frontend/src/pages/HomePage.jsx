import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { listAllBeamsRequest } from "../api/beams.js";
import { useAuth } from "../context/AuthContext.jsx";
import { translations } from "../i18n/translations.js";
import ecoConstructionImage from "../assets/images/eco-construction.png";
import homeHeroImage from "../assets/images/home-hero-sustainable-building.png";
import styles from "./HomePage.module.css";

const common = translations.common;
const listingsT = translations.listings;

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return common.emptyValue;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? String(value) : parsed.toLocaleString();
};

const formatPrice = (value) => {
  if (value === null || value === undefined || value === "") {
    return common.emptyValue;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return String(value);
  }
  return `€${parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const CountUpValue = ({ value }) => {
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const clean = String(value).replace(/[^\d]/g, "");
    const target = Number(clean);

    if (!target) {
      setDisplay(String(value));
      return undefined;
    }

    const prefix = String(value).startsWith("~") ? "~" : "";
    const suffix = String(value).includes("%") ? "%" : "";
    const durationMs = 1400;
    const start = performance.now();
    let frameId = 0;

    const animate = (now) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      const current = Math.round(target * eased);
      setDisplay(`${prefix}${current}${suffix}`);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return <span>{display}</span>;
};

const Reveal = ({ children }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
          }
        });
      },
      { threshold: 0.18 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${styles.reveal} ${visible ? styles.revealVisible : ""}`}>
      {children}
    </div>
  );
};

const HomePage = () => {
  const t = translations.home;
  const { user } = useAuth();
  const [activeView, setActiveView] = useState("problem");
  const [pointer, setPointer] = useState({ x: 50, y: 50 });
  const [beams, setBeams] = useState([]);
  const [beamsLoading, setBeamsLoading] = useState(true);
  const [beamsError, setBeamsError] = useState(null);
  const [scrollOverflow, setScrollOverflow] = useState({ left: false, right: false });
  const productsTrackRef = useRef(null);

  const updateScrollOverflow = useCallback(() => {
    const el = productsTrackRef.current;
    if (!el) {
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setScrollOverflow({
      left: scrollLeft > 6,
      right: scrollLeft + clientWidth < scrollWidth - 6
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setBeamsLoading(true);
      setBeamsError(null);
      try {
        const data = await listAllBeamsRequest();
        if (!cancelled) {
          setBeams(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setBeamsError(err.message);
          setBeams([]);
        }
      } finally {
        if (!cancelled) {
          setBeamsLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (beamsLoading || beams.length === 0) {
      setScrollOverflow({ left: false, right: false });
      return undefined;
    }

    const el = productsTrackRef.current;
    if (!el) {
      return undefined;
    }

    const run = () => {
      updateScrollOverflow();
    };

    run();
    el.addEventListener("scroll", run, { passive: true });
    window.addEventListener("resize", run);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(run) : null;
    ro?.observe(el);

    return () => {
      el.removeEventListener("scroll", run);
      window.removeEventListener("resize", run);
      ro?.disconnect();
    };
  }, [beams, beamsLoading, updateScrollOverflow]);

  const scrollProducts = (direction) => {
    const el = productsTrackRef.current;
    if (!el) {
      return;
    }
    const delta = Math.max(240, Math.floor(el.clientWidth * 0.85));
    el.scrollBy({ left: direction * delta, behavior: "smooth" });
  };

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setPointer({ x, y });
  };

  return (
    <section
      className={styles.page}
      onMouseMove={handlePointerMove}
      style={{ "--pointer-x": pointer.x, "--pointer-y": pointer.y }}
    >
      <Reveal>
        <header className={styles.hero}>
          <span className={styles.orbA} aria-hidden />
          <span className={styles.orbB} aria-hidden />
          <div className={styles.heroText}>
            <p className={styles.kicker}>
              {t.welcome}
              {user?.name ? `, ${user.name}` : ""}
            </p>
            <h1>{t.heroTitle}</h1>
            <p className={styles.subtitle}>{t.heroSubtitle}</p>
            <div className={styles.heroActions}>
              <Link to="/beams/new" className={styles.primaryButton}>
                {t.heroPrimaryCta}
              </Link>
              <Link to="/beams" className={styles.secondaryButton}>
                {t.heroSecondaryCta}
              </Link>
            </div>
          </div>

          <aside className={styles.heroMedia}>
            <img src={homeHeroImage} alt={t.heroImageAlt} />
          </aside>
        </header>
      </Reveal>

      <Reveal>
        <section>
          <h2 className={styles.sectionTitle}>{t.statsSectionTitle}</h2>
          <div className={styles.statsGrid}>
            {t.statsCards.map((card) => (
              <article key={card.description} className={styles.statsCard}>
                <div className={styles.statsValue}>
                  {card.value === "∞" ? card.value : <CountUpValue value={card.value} />}
                </div>
                <p className={styles.statsDescription}>{card.description}</p>
                {card.source && <p className={styles.statsSource}>{card.source}</p>}
              </article>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className={styles.toggleSection}>
          <div className={styles.toggleWrap}>
            <button
              type="button"
              className={`${styles.toggleButton} ${activeView === "problem" ? styles.problemActive : ""}`}
              onClick={() => setActiveView("problem")}
            >
              {t.toggle.problem}
            </button>
            <button
              type="button"
              className={`${styles.toggleButton} ${activeView === "solution" ? styles.solutionActive : ""}`}
              onClick={() => setActiveView("solution")}
            >
              {t.toggle.solution}
            </button>
          </div>

          <div className={styles.togglePanels}>
            <article className={`${styles.panel} ${activeView === "problem" ? styles.panelFocusProblem : ""}`}>
              <h3>{t.toggle.problemTitle}</h3>
              <ul>
                {t.toggle.problemPoints.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className={`${styles.panel} ${activeView === "solution" ? styles.panelFocusSolution : ""}`}>
              <h3>{t.toggle.solutionTitle}</h3>
              <ul>
                {t.toggle.solutionPoints.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section>
          <h2 className={styles.sectionTitle}>{t.howTitle}</h2>
          <div className={styles.stepsRow}>
            {t.steps.map((step, index) => (
              <article key={step.title} className={styles.stepCard}>
                <div className={styles.stepIcon}>{index + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                {index < t.steps.length - 1 && <span className={styles.stepArrow}>→</span>}
              </article>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section>
          <h2 className={styles.sectionTitle}>{t.productsTitle}</h2>
          {beamsLoading && <p className={styles.productsState}>{t.productsLoading}</p>}
          {!beamsLoading && beamsError && <p className={styles.productsState}>{beamsError}</p>}
          {!beamsLoading && !beamsError && beams.length === 0 && (
            <p className={styles.productsState}>{t.productsEmpty}</p>
          )}
          {!beamsLoading && !beamsError && beams.length > 0 && (
            <div className={styles.productsCarousel}>
              {scrollOverflow.left && (
                <button
                  type="button"
                  className={`${styles.carouselBtn} ${styles.carouselBtnLeft}`}
                  onClick={() => scrollProducts(-1)}
                  aria-label={t.scrollPrev}
                >
                  ‹
                </button>
              )}
              <div ref={productsTrackRef} className={styles.productsTrack}>
                {beams.map((beam) => (
                  <Link
                    key={beam.id}
                    to={`/beams/all/${beam.id}`}
                    className={styles.productCardLink}
                  >
                    <article className={styles.productCard}>
                      <div className={styles.productMedia}>
                        <img
                          src={beam.image_src || "/tab-logo.png"}
                          alt={beam.title || listingsT.untitledBeam}
                          onLoad={updateScrollOverflow}
                        />
                      </div>
                      <div className={styles.productBody}>
                        <h3>{beam.title || listingsT.untitledBeam}</h3>
                        <dl>
                          <div>
                            <dt>{t.labels.length}</dt>
                            <dd>{formatNumber(beam.length_mm)} mm</dd>
                          </div>
                          <div>
                            <dt>{t.labels.weight}</dt>
                            <dd>{formatNumber(beam.weight_kg)} kg</dd>
                          </div>
                          <div>
                            <dt>{t.labels.quantity}</dt>
                            <dd>{formatNumber(beam.quantity)}</dd>
                          </div>
                        </dl>
                        <p className={styles.price}>{formatPrice(beam.price_eur)}</p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
              {scrollOverflow.right && (
                <button
                  type="button"
                  className={`${styles.carouselBtn} ${styles.carouselBtnRight}`}
                  onClick={() => scrollProducts(1)}
                  aria-label={t.scrollNext}
                >
                  ›
                </button>
              )}
            </div>
          )}
        </section>
      </Reveal>

      <Reveal>
        <section className={styles.impactSection}>
          <aside className={styles.impactImageWrap}>
            <img src={ecoConstructionImage} alt={t.impactImageAlt} />
          </aside>
          <div className={styles.impactContent}>
            <h2>{t.impactTitle}</h2>
            <div className={styles.impactStats}>
              {t.impactItems.map((item) => (
                <article key={item.value} className={styles.impactStatCard}>
                  <h3>{item.value}</h3>
                  <p>{item.label}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className={styles.finalCta}>
          <h2>{t.finalTitle}</h2>
          <p>{t.finalSubtitle}</p>
          <Link to="/beams/new" className={styles.primaryButton}>
            {t.finalCta}
          </Link>
        </section>
      </Reveal>
    </section>
  );
};

export default HomePage;
