"use client";

import React, { useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import AddressBookSection from "./AddressBookSection";
import WarehouseSection from "./WarehouseSection";
import ProductsSection from "./ProductsSection";
import FinanceSection from "./FinanceSection";
import CostCentersSection from "./CostCentersSection";
import DashboardSection from "./DashboardSection";

type ModalType =
  | "incoming"
  | "outgoing"
  | "transfer"
  | "expense"
  | "income"
  | "cash"
  | null;

type TrendCardProps = {
  label: string;
  value: string;
  detail: string;
  change: string;
  data: number[];
};

type CostCenterSummary = {
  id: string;
  income: string;
  expenses: string;
  delta: string;
};

const getToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60 * 1000);

  return localDate.toISOString().split("T")[0];
};

const monthLabels = [
  "SEP",
  "OKT",
  "NOV",
  "DEZ",
  "JAN",
  "FEB",
  "MÄR",
  "APR",
  "MAI",
  "JUN",
  "JUL",
  "AUG",
];

const costCenters = [
  "2026-001-PRODUKTION",
  "2026-002-BRAND",
  "2026-003-MARKETING",
  "2026-004-EVENTS",
  "2026-005-LOGISTIK",
  "2026-006-MIETE",
  "2026-007-ADMINISTRATION",
  "2026-008-ENTWICKLUNG",
  "2026-009-VERTRIEB",
  "2026-010-SONSTIGES",
];

const costCenterSummaries: CostCenterSummary[] = [
  {
    id: "2026-001-PRODUKTION",
    income: "0,00 €",
    expenses: "740,00 €",
    delta: "-740,00 €",
  },
  {
    id: "2026-002-BRAND",
    income: "0,00 €",
    expenses: "532,40 €",
    delta: "-532,40 €",
  },
  {
    id: "2026-003-MARKETING",
    income: "0,00 €",
    expenses: "0,00 €",
    delta: "0,00 €",
  },
  {
    id: "2026-004-EVENTS",
    income: "0,00 €",
    expenses: "0,00 €",
    delta: "0,00 €",
  },
  {
    id: "2026-005-LOGISTIK",
    income: "0,00 €",
    expenses: "84,20 €",
    delta: "-84,20 €",
  },
  {
    id: "2026-006-MIETE",
    income: "0,00 €",
    expenses: "0,00 €",
    delta: "0,00 €",
  },
  {
    id: "2026-007-ADMINISTRATION",
    income: "0,00 €",
    expenses: "0,00 €",
    delta: "0,00 €",
  },
  {
    id: "2026-008-ENTWICKLUNG",
    income: "0,00 €",
    expenses: "0,00 €",
    delta: "0,00 €",
  },
  {
    id: "2026-009-VERTRIEB",
    income: "316,00 €",
    expenses: "0,00 €",
    delta: "+316,00 €",
  },
  {
    id: "2026-010-SONSTIGES",
    income: "0,00 €",
    expenses: "0,00 €",
    delta: "0,00 €",
  },
];

const addressBookEntries = [
  "Kiosk 59",
  "Büdchen am Leo",
  "Straßenfest Ehrenfeld",
  "Lager Ehrenfeld",
  "Eventlager",
  "Brauerei Rheinland",
  "Flyeralarm",
  "Max Mustermann",
];

const dashboardWarehouseRows = [
  {
    date: "28.08.2026",
    type: "Wareneingang",
    item: "EHRENFELD Pils",
    amount: "+ 1.000",
    location: "Lager Ehrenfeld",
  },
  {
    date: "28.08.2026",
    type: "Marketing",
    item: "EHRENFELD Pils",
    amount: "- 24",
    location: "Straßenfest Ehrenfeld",
  },
  {
    date: "27.08.2026",
    type: "Verkauf",
    item: "EHRENFELD Pils",
    amount: "- 48",
    location: "Kiosk 59",
  },
  {
    date: "27.08.2026",
    type: "Transfer",
    item: "Gläser",
    amount: "- 24",
    location: "Eventlager",
  },
];

const dashboardFinanceRows = [
  {
    date: "28.08.2026",
    description: "Produktionscharge 2026-001",
    costCenter: "2026-001-PRODUKTION",
    amount: "- 740,00 €",
  },
  {
    date: "28.08.2026",
    description: "Stickerproduktion",
    costCenter: "2026-002-BRAND",
    amount: "- 182,40 €",
  },
  {
    date: "27.08.2026",
    description: "Verkauf Kiosk 59",
    costCenter: "2026-009-VERTRIEB",
    amount: "+ 72,00 €",
  },
  {
    date: "26.08.2026",
    description: "Transport",
    costCenter: "2026-005-LOGISTIK",
    amount: "- 84,20 €",
  },
];

const inventoryRows = [
  {
    product: "EHRENFELD Pils 0,2 L",
    category: "Bier",
    stock: "1.248",
    unit: "Flaschen",
    unitCost: "0,74 €",
    value: "923,52 €",
    location: "Lager Ehrenfeld",
  },
  {
    product: "EHRENFELD Glas 0,2 L",
    category: "Ausstattung",
    stock: "120",
    unit: "Gläser",
    unitCost: "2,60 €",
    value: "312,00 €",
    location: "Lager Ehrenfeld",
  },
  {
    product: "EHRENFELD Sticker",
    category: "Marketing",
    stock: "4.500",
    unit: "Stück",
    unitCost: "0,04 €",
    value: "180,00 €",
    location: "Lager Ehrenfeld",
  },
];

const movementRows = [
  {
    date: "28.08.2026",
    type: "Wareneingang",
    product: "EHRENFELD Pils 0,2 L",
    batch: "2026-001",
    amount: "+ 1.000",
    costCenter: "2026-001-PRODUKTION",
    location: "Lager Ehrenfeld",
    user: "Alex",
  },
  {
    date: "28.08.2026",
    type: "Ausbuchung",
    product: "EHRENFELD Pils 0,2 L",
    batch: "2026-001",
    amount: "- 24",
    costCenter: "2026-003-MARKETING",
    location: "Straßenfest Ehrenfeld",
    user: "Alex",
  },
  {
    date: "27.08.2026",
    type: "Verkauf",
    product: "EHRENFELD Pils 0,2 L",
    batch: "2026-001",
    amount: "- 48",
    costCenter: "2026-009-VERTRIEB",
    location: "Kiosk 59",
    user: "Alex",
  },
  {
    date: "27.08.2026",
    type: "Transfer",
    product: "EHRENFELD Glas 0,2 L",
    batch: "–",
    amount: "- 24",
    costCenter: "–",
    location: "Eventlager",
    user: "Alex",
  },
  {
    date: "26.08.2026",
    type: "Ausbuchung",
    product: "EHRENFELD Pils 0,2 L",
    batch: "2026-001",
    amount: "- 12",
    costCenter: "2026-008-ENTWICKLUNG",
    location: "Lager Ehrenfeld",
    user: "Alex",
  },
];

const financeRows = [
  {
    date: "28.08.2026",
    type: "Ausgabe",
    description: "Produktionscharge 2026-001",
    contact: "Brauerei Rheinland",
    costCenter: "2026-001-PRODUKTION",
    source: "Lager",
    amount: "- 740,00 €",
    user: "Alex",
  },
  {
    date: "28.08.2026",
    type: "Ausgabe",
    description: "5.000 Sticker",
    contact: "Flyeralarm",
    costCenter: "2026-002-BRAND",
    source: "Finanzen",
    amount: "- 182,40 €",
    user: "Alex",
  },
  {
    date: "27.08.2026",
    type: "Einnahme",
    description: "Verkauf 48 Flaschen",
    contact: "Kiosk 59",
    costCenter: "2026-009-VERTRIEB",
    source: "Lager",
    amount: "+ 72,00 €",
    user: "Alex",
  },
  {
    date: "26.08.2026",
    type: "Ausgabe",
    description: "Transport Produktionsware",
    contact: "Brauerei Rheinland",
    costCenter: "2026-005-LOGISTIK",
    source: "Finanzen",
    amount: "- 84,20 €",
    user: "Alex",
  },
  {
    date: "25.08.2026",
    type: "Ausgabe",
    description: "Logoentwicklung",
    contact: "Max Mustermann",
    costCenter: "2026-002-BRAND",
    source: "Finanzen",
    amount: "- 350,00 €",
    user: "Alex",
  },
];

const dashboardTrends = {
  beer: [620, 680, 640, 720, 780, 820, 910, 980, 1040, 1100, 1152, 1248],
  stockValue: [
    620, 690, 710, 780, 850, 920, 1010, 1080, 1160, 1240, 1325, 1415.52,
  ],
  income: [0, 48, 72, 96, 90, 130, 160, 180, 210, 245, 268, 316],
  expenses: [
    120, 240, 180, 420, 260, 510, 330, 740, 480, 910, 760, 1356.6,
  ],
  cash: [5200, 4930, 4710, 4520, 4390, 4280, 4460, 4650, 4510, 4400, 4350, 4280],
};

const warehouseTrends = {
  beerStock: [620, 680, 640, 720, 780, 820, 910, 980, 1040, 1100, 1152, 1248],
  stockValue: [
    620, 690, 710, 780, 850, 920, 1010, 1080, 1160, 1240, 1325, 1415.52,
  ],
  incoming: [240, 0, 120, 240, 0, 320, 180, 0, 360, 240, 180, 1000],
  outgoing: [36, 44, 62, 55, 84, 72, 110, 94, 130, 116, 142, 168],
};

const financeTrends = {
  income: [0, 48, 72, 96, 90, 130, 160, 180, 210, 245, 268, 316],
  expenses: [
    120, 240, 180, 420, 260, 510, 330, 740, 480, 910, 760, 1356.6,
  ],
  balance: [-120, -192, -108, -324, -170, -380, -170, -560, -270, -665, -492, -1040.6],
  cash: [5200, 4930, 4710, 4520, 4390, 4280, 4460, 4650, 4510, 4400, 4350, 4280],
};

function TrendCard({
  label,
  value,
  detail,
  change,
  data,
}: TrendCardProps) {
  const width = 320;
  const height = 82;
  const paddingX = 4;
  const paddingY = 8;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x =
        paddingX +
        (index / (data.length - 1)) * (width - paddingX * 2);

      const y =
        paddingY +
        (1 - (value - min) / range) * (height - paddingY * 2);

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <article className="trend-card">
      <div className="trend-card-top">
        <span className="trend-card-label">{label}</span>
        <span className="trend-card-change">{change}</span>
      </div>

      <strong className="trend-card-value">{value}</strong>
      <small className="trend-card-detail">{detail}</small>

      <div className="trend-chart">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <line
            x1="0"
            y1={height - 1}
            x2={width}
            y2={height - 1}
            className="trend-chart-baseline"
          />

          <polyline
            points={points}
            fill="none"
            className="trend-chart-line"
          />
        </svg>

        <div className="trend-chart-labels">
          <span>{monthLabels[0]}</span>
          <span>{monthLabels[monthLabels.length - 1]}</span>
        </div>
      </div>
    </article>
  );
}

export default function BackendPage() {
  const { user } = useUser();
  const clerk = useClerk();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [addressBookDirty, setAddressBookDirty] = useState(false);
  const [modal, setModal] = useState<ModalType>(null);

  const today = getToday();

  const displayName =
    user?.firstName ||
    user?.fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress ||
    "User";

  const email = user?.primaryEmailAddress?.emailAddress || "";
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";
  const avatarUrl = user?.imageUrl || null;

  const sectionTitles: Record<string, string> = {
    dashboard: "Dashboard",
    warehouse: "Lager",
    finance: "Finanzen",
    costcenters: "Kostenstellen",
    products: "Produkte",
    addressbook: "Adressbuch",
  };

  const sectionTitle = sectionTitles[activeSection];

  const changeSection = (section: string) => {
    if (
      activeSection === "addressbook" &&
      addressBookDirty &&
      section !== "addressbook" &&
      !window.confirm("Achtung: Deine Änderungen wurden noch nicht gespeichert. Änderungen verwerfen?")
    ) {
      return;
    }
    setAddressBookDirty(false);
    setActiveSection(section);
  };

  return (
    <main className="backend-shell">
      <aside className="backend-sidebar">
        <div className="backend-brand">
          <span>EHREN</span>
          <span>FELD</span>
          <small>BACKEND</small>
        </div>

        <nav className="backend-nav" aria-label="Backend Navigation">
          <button
            className={activeSection === "dashboard" ? "active" : ""}
            onClick={() => changeSection("dashboard")}
          >
            Dashboard
          </button>

          <button
            className={activeSection === "warehouse" ? "active" : ""}
            onClick={() => changeSection("warehouse")}
          >
            Lager
          </button>

          <button
            className={activeSection === "finance" ? "active" : ""}
            onClick={() => changeSection("finance")}
          >
            Finanzen
          </button>

          <button
            className={activeSection === "costcenters" ? "active" : ""}
            onClick={() => changeSection("costcenters")}
          >
            Kostenstellen
          </button>

          <button
            className={activeSection === "products" ? "active" : ""}
            onClick={() => changeSection("products")}
          >
            Produkte
          </button>

          <button
            className={activeSection === "addressbook" ? "active" : ""}
            onClick={() => changeSection("addressbook")}
          >
            Adressbuch
          </button>

          <a
            className="backend-nav-external"
            href="https://drive.google.com/drive/folders/0ALgqRHOmfK_1Uk9PVA"
            target="_blank"
            rel="noopener noreferrer"
          >
            Dateien
          </a>
        </nav>

        <div className="backend-sidebar-footer">
          <div className="backend-account">
            {userMenuOpen && (
              <div className="backend-account-menu">
                <div className="backend-account-menu-profile">
                  <strong>{displayName}</strong>
                  <span>{email}</span>
                </div>

                <div className="backend-account-status">
                  <span className="backend-account-status-dot" />
                  Ehrenmann
                </div>

                <button
                  type="button"
                  className="backend-account-logout"
                  onClick={async () => {
                    await clerk.signOut({ redirectUrl: "/backend" });
                  }}
                >
                  <span>Ausloggen</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            )}

            <button
              type="button"
              className="backend-user backend-user-button"
              onClick={() => setUserMenuOpen((open) => !open)}
              aria-expanded={userMenuOpen}
            >
              <div className="backend-user-avatar">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    width={38}
                    height={38}
                  />
                ) : (
                  <span>{initial}</span>
                )}
              </div>

              <div className="backend-user-copy">
                <strong>{displayName}</strong>
                <span>Ehrenmann</span>
              </div>

              <span
                className={`backend-user-chevron ${
                  userMenuOpen ? "open" : ""
                }`}
                aria-hidden="true"
              >
                ↑
              </span>
            </button>
          </div>
        </div>
      </aside>

      <section className="backend-main">
        <header className="backend-topbar">
          <div>
            <span className="backend-kicker">EHRENFELD INTERN</span>
            <h1>{sectionTitle}</h1>
          </div>

        </header>

        <div className="backend-content">
          {activeSection === "dashboard" && <DashboardSection go={changeSection} />}

          {activeSection === "warehouse" && <WarehouseSection />}

          {activeSection === "products" && <ProductsSection />}

          {activeSection === "finance" && <FinanceSection />}

          {activeSection === "costcenters" && <CostCentersSection />}

          {activeSection === "addressbook" && (
            <AddressBookSection onDirtyChange={setAddressBookDirty} />
          )}

          {!["dashboard", "warehouse", "products", "finance", "costcenters", "addressbook"].includes(activeSection) && (
            <section className="backend-placeholder">
              <span className="backend-section-kicker">
                {activeSection.toUpperCase()}
              </span>

              <h2>{sectionTitle}</h2>

              <p>
                Diese Seite bauen wir als Nächstes. Aktuell konzentrieren wir
                uns ausschließlich auf das visuelle Konzept.
              </p>
            </section>
          )}
        </div>
      </section>

      {modal && (
        <div
          className="backend-modal-backdrop"
          onClick={() => setModal(null)}
        >
          <div
            className="backend-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="backend-modal-head">
              <div>
                <span className="backend-section-kicker">
                  {["incoming", "outgoing", "transfer"].includes(modal)
                    ? "LAGERBEWEGUNG"
                    : "FINANZEN"}
                </span>

                <h2>
                  {modal === "incoming" && "Wareneingang"}
                  {modal === "outgoing" && "Ausbuchung"}
                  {modal === "transfer" && "Transfer"}
                  {modal === "expense" && "Ausgabe erfassen"}
                  {modal === "income" && "Einnahme erfassen"}
                  {modal === "cash" && "Kontostand aktualisieren"}
                </h2>
              </div>

              <button
                className="backend-modal-close"
                onClick={() => setModal(null)}
                aria-label="Schließen"
              >
                ×
              </button>
            </div>

            {modal === "incoming" && (
              <div className="backend-form-grid">
                <label>
                  <span>Produkt</span>
                  <select defaultValue="pils">
                    <option value="pils">EHRENFELD Pils 0,2 L</option>
                    <option>EHRENFELD Glas 0,2 L</option>
                    <option>EHRENFELD Sticker</option>
                  </select>
                </label>

                <label>
                  <span>Charge</span>
                  <input defaultValue="2026-001" />
                </label>

                <label>
                  <span>Menge</span>
                  <input defaultValue="1000" />
                </label>

                <label>
                  <span>Einstand / Einheit</span>
                  <input defaultValue="0,74 €" />
                </label>

                <label>
                  <span>Kostenstelle</span>
                  <select defaultValue="2026-001-PRODUKTION">
                    {costCenters.map((costCenter) => (
                      <option key={costCenter}>{costCenter}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Lieferant</span>
                  <select defaultValue="Brauerei Rheinland">
                    {addressBookEntries.map((entry) => (
                      <option key={entry}>{entry}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Lagerort</span>
                  <select defaultValue="Lager Ehrenfeld">
                    <option>Lager Ehrenfeld</option>
                    <option>Eventlager</option>
                  </select>
                </label>

                <label>
                  <span>Datum</span>
                  <input type="date" defaultValue={today} />
                </label>

                <label className="backend-form-full">
                  <span>Notiz</span>
                  <textarea defaultValue="Erste Produktionscharge" />
                </label>
              </div>
            )}

            {modal === "outgoing" && (
              <div className="backend-form-grid">
                <label>
                  <span>Produkt</span>
                  <select defaultValue="pils">
                    <option value="pils">EHRENFELD Pils 0,2 L</option>
                    <option>EHRENFELD Glas 0,2 L</option>
                    <option>EHRENFELD Sticker</option>
                  </select>
                </label>

                <label>
                  <span>Menge</span>
                  <input defaultValue="24" />
                </label>

                <label>
                  <span>Art</span>
                  <select defaultValue="Marketing">
                    <option>Marketing</option>
                    <option>Verkauf</option>
                    <option>Event</option>
                    <option>Bruch / Verlust</option>
                    <option>Sonstiges</option>
                  </select>
                </label>

                <label>
                  <span>Kostenstelle</span>
                  <select defaultValue="2026-003-MARKETING">
                    {costCenters.map((costCenter) => (
                      <option key={costCenter}>{costCenter}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Ziel / Empfänger</span>
                  <select defaultValue="Straßenfest Ehrenfeld">
                    {addressBookEntries.map((entry) => (
                      <option key={entry}>{entry}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Datum</span>
                  <input type="date" defaultValue={today} />
                </label>

                <label className="backend-form-full">
                  <span>Notiz</span>
                  <textarea defaultValue="Sampling" />
                </label>
              </div>
            )}

            {modal === "transfer" && (
              <div className="backend-form-grid">
                <label>
                  <span>Produkt</span>
                  <select defaultValue="pils">
                    <option value="pils">EHRENFELD Pils 0,2 L</option>
                    <option>EHRENFELD Glas 0,2 L</option>
                    <option>EHRENFELD Sticker</option>
                  </select>
                </label>

                <label>
                  <span>Menge</span>
                  <input defaultValue="48" />
                </label>

                <label>
                  <span>Von</span>
                  <select defaultValue="Lager Ehrenfeld">
                    <option>Lager Ehrenfeld</option>
                    <option>Eventlager</option>
                  </select>
                </label>

                <label>
                  <span>Nach</span>
                  <select defaultValue="Eventlager">
                    <option>Eventlager</option>
                    <option>Lager Ehrenfeld</option>
                  </select>
                </label>

                <label>
                  <span>Datum</span>
                  <input type="date" defaultValue={today} />
                </label>

                <label>
                  <span>Verantwortlich</span>
                  <input defaultValue="Alex" />
                </label>

                <label className="backend-form-full">
                  <span>Notiz</span>
                  <textarea defaultValue="Material für Event" />
                </label>
              </div>
            )}

            {modal === "expense" && (
              <div className="backend-form-grid">
                <label>
                  <span>Beschreibung</span>
                  <input defaultValue="Logoentwicklung" />
                </label>

                <label>
                  <span>Betrag</span>
                  <input defaultValue="350,00 €" />
                </label>

                <label>
                  <span>Empfänger / Lieferant</span>
                  <select defaultValue="Max Mustermann">
                    {addressBookEntries.map((entry) => (
                      <option key={entry}>{entry}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Kostenstelle</span>
                  <select defaultValue="2026-002-BRAND">
                    {costCenters.map((costCenter) => (
                      <option key={costCenter}>{costCenter}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Datum</span>
                  <input type="date" defaultValue={today} />
                </label>

                <label>
                  <span>Zahlungsart</span>
                  <select defaultValue="Bankkonto">
                    <option>Bankkonto</option>
                    <option>Barkasse</option>
                    <option>Privat ausgelegt</option>
                  </select>
                </label>

                <label className="backend-form-full">
                  <span>Notiz</span>
                  <textarea defaultValue="Logo- und Brandentwicklung" />
                </label>
              </div>
            )}

            {modal === "income" && (
              <div className="backend-form-grid">
                <label>
                  <span>Beschreibung</span>
                  <input defaultValue="Verkauf EHRENFELD Pils" />
                </label>

                <label>
                  <span>Betrag</span>
                  <input defaultValue="72,00 €" />
                </label>

                <label>
                  <span>Zahler / Kunde</span>
                  <select defaultValue="Kiosk 59">
                    {addressBookEntries.map((entry) => (
                      <option key={entry}>{entry}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Kostenstelle</span>
                  <select defaultValue="2026-009-VERTRIEB">
                    {costCenters.map((costCenter) => (
                      <option key={costCenter}>{costCenter}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Datum</span>
                  <input type="date" defaultValue={today} />
                </label>

                <label>
                  <span>Zahlungsart</span>
                  <select defaultValue="Bankkonto">
                    <option>Bankkonto</option>
                    <option>Barkasse</option>
                  </select>
                </label>

                <label className="backend-form-full">
                  <span>Notiz</span>
                  <textarea defaultValue="48 Flaschen à 1,50 €" />
                </label>
              </div>
            )}

            {modal === "cash" && (
              <div className="backend-form-grid">
                <label>
                  <span>Konto</span>
                  <select defaultValue="Bankkonto">
                    <option>Bankkonto</option>
                    <option>Barkasse</option>
                  </select>
                </label>

                <label>
                  <span>Aktueller Stand</span>
                  <input defaultValue="4.280,00 €" />
                </label>

                <label>
                  <span>Datum</span>
                  <input type="date" defaultValue={today} />
                </label>

                <label>
                  <span>Verantwortlich</span>
                  <input defaultValue="Alex" />
                </label>

                <label className="backend-form-full">
                  <span>Notiz</span>
                  <textarea defaultValue="Manueller Kontostand" />
                </label>
              </div>
            )}

            <div className="backend-modal-actions">
              <button
                className="backend-secondary-action"
                onClick={() => setModal(null)}
              >
                Abbrechen
              </button>

              <button className="backend-primary-action">
                {modal === "incoming" && "Einbuchen"}
                {modal === "outgoing" && "Ausbuchen"}
                {modal === "transfer" && "Transfer buchen"}
                {modal === "expense" && "Ausgabe erfassen"}
                {modal === "income" && "Einnahme erfassen"}
                {modal === "cash" && "Stand übernehmen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}