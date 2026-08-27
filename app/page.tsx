"use client";

import React from "react";

export default function EhrenkoelschPage() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const scrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <main className="ehren-page">
      {/* =====================================================
          HEADER
      ===================================================== */}
      <header className="ehren-header">
        <div className="header-inner">
          <button
            className="brand"
            onClick={scrollTop}
            aria-label="Nach oben"
          >
            <span>EHREN</span>
            <span>FELD</span>
          </button>

          <nav className="main-nav" aria-label="Hauptnavigation">
            <button onClick={() => scrollTo("bier")}>
              Bier
            </button>

            <button onClick={() => scrollTo("buddies")}>
              Buddies
            </button>

            <button onClick={() => scrollTo("ehrensache")}>
              Ehrensache
            </button>
          </nav>
        </div>
      </header>

      {/* =====================================================
          HERO / KOMMT AN.
      ===================================================== */}
      <section
        className="hero campaign-section"
        id="home"
      >
        <img
          src="/images/hero-image.png"
          alt=""
          className="hero-image campaign-image"
        />

        <div className="hero-shade" />

        <div className="hero-content">
          <div className="eyebrow">
            EHRENFELD. FÜR KÖLN.
          </div>

          <h1>
            KOMMT
            <br />
            AN.
          </h1>
        </div>
      </section>

      {/* =====================================================
          BIER / PILS.
      ===================================================== */}
      <section
        className="beer-section campaign-section"
        id="bier"
      >
        <img
          src="/images/bier.png"
          alt="Ehrenfeld Pils"
          className="beer-image campaign-image"
        />

        <div className="beer-shade" />

        <div className="beer-inner">
          <div className="beer-content">
            <div className="eyebrow">
              DAS BIER
            </div>

            <h2>PILS.</h2>

            <div className="beer-meta">
              0,2 L&nbsp;&nbsp;·&nbsp;&nbsp;X,X % VOL.
            </div>

            <p>
              Klein. Kalt. Direkt aus dem Veedel.
              <br />
              Mehr muss man eigentlich nicht sagen.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          BUDDIES / WO GIBT'S DAS?
      ===================================================== */}
      <section
        className="buddies-section campaign-section"
        id="buddies"
      >
        <img
          src="/images/buddies.png"
          alt="Ehrenfeld"
          className="buddies-image campaign-image"
        />

        <div className="buddies-shade" />

        <div className="buddies-inner">
          <div className="buddies-content">
            <div className="eyebrow">
              DEIN VEEDEL. DEIN BIER.
            </div>

            <h2>
              WO GIBT&apos;S
              <br />
              DAS?
            </h2>
          </div>
        </div>
      </section>

      {/* =====================================================
          EHRENSACHE / FÜRS VEEDEL.
      ===================================================== */}
      <section
        className="ehrensache-section campaign-section"
        id="ehrensache"
      >
        <img
          src="/images/fuersveedel.png"
          alt="Fürs Veedel"
          className="ehrensache-image campaign-image"
        />

        <div className="ehrensache-shade" />

        <div className="ehrensache-inner">
          <div className="ehrensache-content">
            <div className="eyebrow">
              EHRENSACHE.
            </div>

            <h2>
              FÜRS
              <br />
              VEEDEL.
            </h2>

            <div className="ehrensache-copy">
              <p>
                Ehrenfeld ist mehr als ein Name auf der Flasche.
              </p>

              <p>
                Wir wollen dort stattfinden, wo das Veedel stattfindet:
                am Kiosk, auf der Straße und mit den Leuten, die es zu
                dem machen, was es ist.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}
      <footer className="ehren-footer">
        <div className="footer-inner">
          <button
            className="footer-brand"
            onClick={scrollTop}
            aria-label="Nach oben"
          >
            <span>EHREN</span>
            <span>FELD</span>
          </button>

          <nav
            className="footer-links"
            aria-label="Footer Navigation"
          >
            <a
              href="#"
              aria-label="Instagram"
            >
              Instagram
            </a>

            <a href="/impressum">
              Impressum
            </a>

            <a href="/datenschutz">
              Datenschutz
            </a>
          </nav>
        </div>

        <div className="footer-bottom">
          <span>EHRENFELD. FÜR KÖLN.</span>

          <span>
            © 2026 Ehrendrinks Inc.
          </span>
        </div>
      </footer>
    </main>
  );
}