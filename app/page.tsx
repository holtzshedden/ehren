"use client";

import React from "react";

const INSTAGRAM_URL = "https://www.instagram.com/ehrenpils";

const kiosks = [
  {
    name: "The Korner Kiosk",
    address: "Venloer Straße 270 / Ecke Körnerstraße, 50823 Köln",
    maps: "https://maps.app.goo.gl/tHGtCk64D96LviQp9",
  },
  {
    name: "Jeff's Kiosk",
    address: "Helmholtzstraße 2, 50825 Ehrenfeld",
    maps: "https://maps.app.goo.gl/mjcanTChtKmZ9uxL8",
  },
  {
    name: "Ehrenkiosk",
    address: "Vogelsanger Str. 191, 50825 Ehrenfeld",
    maps: "https://maps.app.goo.gl/qgSJSHgQRLGFCfHW8",
  },
  {
    name: "Venlo Kiosk",
    address: "Venloer Str. 394, 50825 Ehrenfeld",
    maps: "https://maps.app.goo.gl/YcYqN48gtodUaAer9",
  },
  {
    name: "Minis Kiosk",
    address: "Vogelsanger Str. 199, 50825 Ehrenfeld",
    maps: "https://maps.app.goo.gl/3DQwnCLtapz2aJNe8",
  },
];

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="instagram-icon">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.4" cy="6.7" r="1.15" fill="currentColor" />
    </svg>
  );
}

export default function EhrenPage() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <main className="ehren-page">
      <header className="ehren-header">
        <div className="header-inner">
          <button className="brand" onClick={scrollTop} aria-label="Nach oben">
            <span>EHREN</span><span>FELD</span>
          </button>

          <nav className="main-nav" aria-label="Hauptnavigation">
            <button onClick={() => scrollTo("bier")}>Bier</button>
            <button onClick={() => scrollTo("kaufen")}>Kaufen</button>
            <a className="instagram-link" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="EHREN Pils auf Instagram">
              <InstagramIcon />
            </a>
          </nav>
        </div>
      </header>

      <section className="hero campaign-section" id="home">
        <img src="/images/hero-image.png" alt="" className="hero-image campaign-image" />
        <div className="hero-shade" />
        <div className="hero-content">
          <div className="eyebrow">EHRENFELD. FÜR KÖLN.</div>
          <h1>KOMMT<br />AN.</h1>
        </div>
      </section>

      <section className="beer-section campaign-section" id="bier">
        <img src="/images/bier.png" alt="Ehrenfeld Pils" className="beer-image campaign-image" />
        <div className="beer-shade" />
        <div className="beer-inner">
          <div className="beer-content">
            <div className="eyebrow">DAS BIER</div>
            <h2>PILS.</h2>
            <div className="beer-meta">0,2 L&nbsp;&nbsp;·&nbsp;&nbsp;X,X % VOL.</div>
            <p>Klein. Kalt. Direkt aus dem Veedel.<br />Mehr muss man eigentlich nicht sagen.</p>
          </div>
        </div>
      </section>

      <section className="kaufen-section campaign-section" id="kaufen">
        <img src="/images/buddies.png" alt="Kiosk in Ehrenfeld" className="kaufen-image campaign-image" />
        <div className="kaufen-shade" />
        <div className="kaufen-inner">
          <div className="kaufen-content">
            <div className="eyebrow">HIER STEHT&apos;S KALT.</div>
            <h2>WO GIBT&apos;S<br />DAS?</h2>
            <div className="kiosk-list" aria-label="Verkaufsstellen">
              {kiosks.map((kiosk) => (
                <a className="kiosk-entry" href={kiosk.maps} target="_blank" rel="noopener noreferrer" key={kiosk.name}>
                  <span className="kiosk-name">{kiosk.name}</span>
                  <span className="kiosk-address">{kiosk.address}<span className="external-arrow" aria-hidden="true"> ↗</span></span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <footer className="ehren-footer">
          <div className="footer-inner">
            <nav className="footer-links" aria-label="Footer Navigation">
              <a className="footer-instagram" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="EHREN Pils auf Instagram"><InstagramIcon /></a>
              <a href="/impressum">Impressum</a>
              <a href="/datenschutz">Datenschutz</a>
            </nav>
            <div className="footer-copyright">© 2026 Ehrendrinks UG</div>
          </div>
        </footer>
      </section>
    </main>
  );
}
