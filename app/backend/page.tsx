"use client";

import React, { useState } from "react";

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
  const [activeSection, setActiveSection] = useState("dashboard");
  const [modal, setModal] = useState<ModalType>(null);

  const today = getToday();

  const sectionTitles: Record<string, string> = {
    dashboard: "Dashboard",
    warehouse: "Lager",
    finance: "Finanzen",
    buddies: "Buddies",
    addressbook: "Adressbuch",
    users: "User",
    settings: "Einstellungen",
  };

  const sectionTitle = sectionTitles[activeSection];

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
            onClick={() => setActiveSection("dashboard")}
          >
            Dashboard
          </button>

          <button
            className={activeSection === "warehouse" ? "active" : ""}
            onClick={() => setActiveSection("warehouse")}
          >
            Lager
          </button>

          <button
            className={activeSection === "finance" ? "active" : ""}
            onClick={() => setActiveSection("finance")}
          >
            Finanzen
          </button>

          <button
            className={activeSection === "buddies" ? "active" : ""}
            onClick={() => setActiveSection("buddies")}
          >
            Buddies
          </button>

          <button
            className={activeSection === "addressbook" ? "active" : ""}
            onClick={() => setActiveSection("addressbook")}
          >
            Adressbuch
          </button>

          <button
            className={activeSection === "users" ? "active" : ""}
            onClick={() => setActiveSection("users")}
          >
            User
          </button>

          <button
            className={activeSection === "settings" ? "active" : ""}
            onClick={() => setActiveSection("settings")}
          >
            Einstellungen
          </button>
        </nav>

        <div className="backend-sidebar-footer">
          <div className="backend-user">
            <div className="backend-user-avatar">A</div>

            <div>
              <strong>Alex</strong>
              <span>Development</span>
            </div>
          </div>
        </div>
      </aside>

      <section className="backend-main">
        <header className="backend-topbar">
          <div>
            <span className="backend-kicker">EHRENFELD INTERN</span>
            <h1>{sectionTitle}</h1>
          </div>

          <div className="backend-status">
            <span className="backend-status-dot" />
            Dummy-Daten
          </div>
        </header>

        <div className="backend-content">
          {activeSection === "dashboard" && (
            <>
              <section className="dashboard-trends">
                <TrendCard
                  label="Bierbestand"
                  value="1.248"
                  detail="Flaschen · aktueller Bestand"
                  change="+8,3 % vs. Juli"
                  data={dashboardTrends.beer}
                />

                <TrendCard
                  label="Warenwert"
                  value="1.415,52 €"
                  detail="aktueller Bestand"
                  change="+6,8 % vs. Juli"
                  data={dashboardTrends.stockValue}
                />

                <TrendCard
                  label="Einnahmen"
                  value="316,00 €"
                  detail="August 2026"
                  change="+17,9 % vs. Juli"
                  data={dashboardTrends.income}
                />

                <TrendCard
                  label="Ausgaben"
                  value="1.356,60 €"
                  detail="August 2026"
                  change="+78,5 % vs. Juli"
                  data={dashboardTrends.expenses}
                />

                <TrendCard
                  label="Liquide Mittel"
                  value="4.280,00 €"
                  detail="zuletzt manuell aktualisiert"
                  change="-1,6 % vs. Juli"
                  data={dashboardTrends.cash}
                />
              </section>

              <section className="backend-section">
                <div className="backend-section-head">
                  <div>
                    <span className="backend-section-kicker">LAGER</span>
                    <h2>Letzte Bewegungen</h2>
                  </div>

                  <button
                    className="backend-text-button"
                    onClick={() => setActiveSection("warehouse")}
                  >
                    Alle anzeigen
                  </button>
                </div>

                <div className="backend-table-wrap">
                  <table className="backend-table">
                    <thead>
                      <tr>
                        <th>Datum</th>
                        <th>Art</th>
                        <th>Artikel</th>
                        <th>Menge</th>
                        <th>Ziel / Ort</th>
                      </tr>
                    </thead>

                    <tbody>
                      {dashboardWarehouseRows.map((row, index) => (
                        <tr key={`${row.date}-${index}`}>
                          <td>{row.date}</td>
                          <td>{row.type}</td>
                          <td>{row.item}</td>
                          <td className="backend-number">{row.amount}</td>
                          <td>{row.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="backend-section">
                <div className="backend-section-head">
                  <div>
                    <span className="backend-section-kicker">FINANZEN</span>
                    <h2>Letzte Bewegungen</h2>
                  </div>

                  <button
                    className="backend-text-button"
                    onClick={() => setActiveSection("finance")}
                  >
                    Alle anzeigen
                  </button>
                </div>

                <div className="backend-table-wrap">
                  <table className="backend-table">
                    <thead>
                      <tr>
                        <th>Datum</th>
                        <th>Beschreibung</th>
                        <th>Kostenstelle</th>
                        <th>Betrag</th>
                      </tr>
                    </thead>

                    <tbody>
                      {dashboardFinanceRows.map((row, index) => (
                        <tr key={`${row.date}-${index}`}>
                          <td>{row.date}</td>
                          <td>{row.description}</td>
                          <td>{row.costCenter}</td>
                          <td className="backend-number">{row.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {activeSection === "warehouse" && (
            <>
              <section className="section-trends section-trends-four">
                <TrendCard
                  label="Bierbestand"
                  value="1.248"
                  detail="Flaschen · aktueller Bestand"
                  change="+8,3 % vs. Juli"
                  data={warehouseTrends.beerStock}
                />

                <TrendCard
                  label="Warenwert"
                  value="1.415,52 €"
                  detail="aktueller Bestand"
                  change="+6,8 % vs. Juli"
                  data={warehouseTrends.stockValue}
                />

                <TrendCard
                  label="Wareneingänge"
                  value="1.000"
                  detail="Einheiten im August"
                  change="+455,6 % vs. Juli"
                  data={warehouseTrends.incoming}
                />

                <TrendCard
                  label="Ausgänge"
                  value="168"
                  detail="Einheiten im August"
                  change="+18,3 % vs. Juli"
                  data={warehouseTrends.outgoing}
                />
              </section>

              <div className="warehouse-actions">
                <button
                  className="backend-primary-action"
                  onClick={() => setModal("incoming")}
                >
                  + Wareneingang
                </button>

                <button
                  className="backend-secondary-action"
                  onClick={() => setModal("outgoing")}
                >
                  − Ausbuchung
                </button>

                <button
                  className="backend-secondary-action"
                  onClick={() => setModal("transfer")}
                >
                  Transfer
                </button>
              </div>

              <section className="backend-section">
                <div className="backend-section-head">
                  <div>
                    <span className="backend-section-kicker">BESTAND</span>
                    <h2>Aktueller Lagerbestand</h2>
                  </div>

                  <span className="backend-section-note">
                    Stand 28.08.2026
                  </span>
                </div>

                <div className="backend-table-wrap">
                  <table className="backend-table">
                    <thead>
                      <tr>
                        <th>Produkt</th>
                        <th>Kategorie</th>
                        <th>Bestand</th>
                        <th>Ø Einstand</th>
                        <th>Warenwert</th>
                        <th>Lagerort</th>
                      </tr>
                    </thead>

                    <tbody>
                      {inventoryRows.map((row) => (
                        <tr key={row.product}>
                          <td>
                            <strong className="backend-product-name">
                              {row.product}
                            </strong>
                          </td>

                          <td>{row.category}</td>

                          <td>
                            <strong>{row.stock}</strong>{" "}
                            <span className="backend-muted-inline">
                              {row.unit}
                            </span>
                          </td>

                          <td>{row.unitCost}</td>
                          <td className="backend-number">{row.value}</td>
                          <td>{row.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="backend-section">
                <div className="backend-section-head">
                  <div>
                    <span className="backend-section-kicker">HISTORIE</span>
                    <h2>Bewegungen</h2>
                  </div>

                  <div className="warehouse-filter-dummy">
                    <button className="active">Alle</button>
                    <button>Wareneingang</button>
                    <button>Ausbuchung</button>
                    <button>Verkauf</button>
                    <button>Transfer</button>
                  </div>
                </div>

                <div className="backend-table-wrap">
                  <table className="backend-table">
                    <thead>
                      <tr>
                        <th>Datum</th>
                        <th>Art</th>
                        <th>Produkt</th>
                        <th>Charge</th>
                        <th>Menge</th>
                        <th>Kostenstelle</th>
                        <th>Ziel / Ort</th>
                        <th>User</th>
                      </tr>
                    </thead>

                    <tbody>
                      {movementRows.map((row, index) => (
                        <tr key={`${row.date}-${index}`}>
                          <td>{row.date}</td>
                          <td>{row.type}</td>
                          <td>{row.product}</td>
                          <td>{row.batch}</td>
                          <td className="backend-number">{row.amount}</td>
                          <td>{row.costCenter}</td>
                          <td>{row.location}</td>
                          <td>{row.user}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {activeSection === "finance" && (
            <>
              <section className="section-trends section-trends-four">
                <TrendCard
                  label="Einnahmen"
                  value="316,00 €"
                  detail="August 2026"
                  change="+17,9 % vs. Juli"
                  data={financeTrends.income}
                />

                <TrendCard
                  label="Ausgaben"
                  value="1.356,60 €"
                  detail="August 2026"
                  change="+78,5 % vs. Juli"
                  data={financeTrends.expenses}
                />

                <TrendCard
                  label="Saldo"
                  value="-1.040,60 €"
                  detail="August 2026"
                  change="-111,5 % vs. Juli"
                  data={financeTrends.balance}
                />

                <TrendCard
                  label="Liquide Mittel"
                  value="4.280,00 €"
                  detail="zuletzt manuell aktualisiert"
                  change="-1,6 % vs. Juli"
                  data={financeTrends.cash}
                />
              </section>

              <div className="finance-actions">
                <button
                  className="backend-primary-action"
                  onClick={() => setModal("expense")}
                >
                  + Ausgabe
                </button>

                <button
                  className="backend-secondary-action"
                  onClick={() => setModal("income")}
                >
                  + Einnahme
                </button>

                <button
                  className="backend-secondary-action"
                  onClick={() => setModal("cash")}
                >
                  Kontostand aktualisieren
                </button>
              </div>

              <section className="backend-section">
                <div className="backend-section-head">
                  <div>
                    <span className="backend-section-kicker">FINANZEN</span>
                    <h2>Bewegungen</h2>
                  </div>

                  <div className="warehouse-filter-dummy">
                    <button className="active">Alle</button>
                    <button>Einnahmen</button>
                    <button>Ausgaben</button>
                  </div>
                </div>

                <div className="backend-table-wrap">
                  <table className="backend-table">
                    <thead>
                      <tr>
                        <th>Datum</th>
                        <th>Art</th>
                        <th>Beschreibung</th>
                        <th>Kontakt</th>
                        <th>Kostenstelle</th>
                        <th>Quelle</th>
                        <th>Betrag</th>
                        <th>User</th>
                      </tr>
                    </thead>

                    <tbody>
                      {financeRows.map((row, index) => (
                        <tr key={`${row.date}-${index}`}>
                          <td>{row.date}</td>
                          <td>{row.type}</td>

                          <td>
                            <strong className="backend-product-name">
                              {row.description}
                            </strong>
                          </td>

                          <td>{row.contact}</td>
                          <td>{row.costCenter}</td>
                          <td>{row.source}</td>
                          <td className="backend-number">{row.amount}</td>
                          <td>{row.user}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="backend-section">
                <div className="backend-section-head finance-cost-center-head">
                  <div>
                    <span className="backend-section-kicker">
                      KOSTENSTELLEN
                    </span>
                    <h2>Einnahmen vs. Ausgaben</h2>
                  </div>

                  <div className="finance-period-dummy">
                    <button>Monat</button>
                    <button className="active">Jahr</button>
                    <button>Gesamt</button>
                  </div>
                </div>

                <div className="finance-cost-center-grid">
                  {costCenterSummaries.map((item) => (
                    <article
                      key={item.id}
                      className="finance-cost-center-card"
                    >
                      <span className="finance-cost-center-id">
                        {item.id}
                      </span>

                      <div className="finance-cost-center-row">
                        <span>Einnahmen</span>
                        <strong>{item.income}</strong>
                      </div>

                      <div className="finance-cost-center-row">
                        <span>Ausgaben</span>
                        <strong>{item.expenses}</strong>
                      </div>

                      <div className="finance-cost-center-divider" />

                      <div className="finance-cost-center-delta">
                        <span>Delta</span>
                        <strong>{item.delta}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}

          {!["dashboard", "warehouse", "finance"].includes(activeSection) && (
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