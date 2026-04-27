import { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

const API_URL = "http://localhost:3000/api";
const api = axios.create({ baseURL: API_URL });
const COLORS = ["#63b3ed", "#48bb78", "#f6ad55", "#b794f4", "#fc8181"];
const statusLabel = {
  pending: "En attente",
  assigned: "Assigné",
  picked_up: "En cours",
  delivered: "Livré",
  cancelled: "Annulé",
};

const NAV_ITEMS = [
  {
    id: "overview",
    label: "Vue d'ensemble",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: "deliveries",
    label: "Livraisons",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" />
        <rect x="9" y="11" width="14" height="10" rx="2" />
        <circle cx="12" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
      </svg>
    ),
  },
  {
    id: "announcements",
    label: "Annonces",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    id: "users",
    label: "Utilisateurs",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    id: "revenue",
    label: "Revenus",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    id: "analytics",
    label: "Analytique",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    id: "reviews",
    label: "Évaluations",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
];

const tooltipStyle = {
  contentStyle: {
    background: "#161b27",
    border: "1px solid #1e2535",
    borderRadius: "8px",
    color: "#e2e8f0",
    fontSize: "12px",
  },
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [topDeliverers, setTopDeliverers] = useState([]);
  const [parcelsBySize, setParcelsBySize] = useState([]);
  const [users, setUsers] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [distanceStats, setDistanceStats] = useState(null);

  const login = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.data.user.role !== "admin") {
        setError("Accès réservé aux administrateurs");
        return;
      }
      setToken(res.data.token);
      localStorage.setItem("adminToken", res.data.token);
      setError("");
    } catch {
      setError("Email ou mot de passe incorrect");
    }
  };

  const logout = () => {
    setToken("");
    localStorage.removeItem("adminToken");
  };

  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [ov, rev, top, sizes, usersRes, parcelsRes, distRes, reviewsRes] =
          await Promise.all([
            api.get("/analytics/overview", { headers }),
            api.get("/analytics/revenue", { headers }),
            api.get("/analytics/top-deliverers", { headers }),
            api.get("/analytics/parcels-by-size", { headers }),
            api.get("/users", { headers }),
            api.get("/users/parcels", { headers }),
            api.get("/analytics/distances", { headers }),
            api.get("/reviews", { headers }),
          ]);
        setOverview(ov.data.data);
        setRevenue(rev.data.data);
        setTopDeliverers(top.data.data);
        setParcelsBySize(
          sizes.data.data.map((d) => ({
            name: d._id.toUpperCase(),
            value: d.count,
          })),
        );
        setUsers(usersRes.data.users);
        setParcels(parcelsRes.data.parcels);
        setDistanceStats(distRes.data.data);
        setReviews(reviewsRes.data.reviews || []);
      } catch {
        setError("Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  if (!token)
    return (
      <div className="login-wrap">
        <div className="login-card">
          <div className="login-title">DeliverConnect</div>
          <div className="login-sub">Connexion au dashboard admin</div>
          {error && <div className="login-error">{error}</div>}
          <form className="login-form" onSubmit={login}>
            <input
              className="login-input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="login-input"
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="login-btn" type="submit">
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );

  const kpis = overview
    ? [
        {
          label: "Utilisateurs",
          value: overview.users.total,
          sub: `${overview.users.clients} clients · ${overview.users.livreurs} livreurs`,
          color: "#63b3ed",
        },
        {
          label: "Colis total",
          value: overview.parcels.total,
          sub: `${overview.parcels.delivered} livrés · ${overview.parcels.pending} en attente`,
          color: "#48bb78",
        },
        {
          label: "Taux de complétion",
          value: `${overview.completionRate}%`,
          sub: "Livraisons réussies",
          color: "#b794f4",
        },
        {
          label: "Revenus plateforme",
          value: `${overview.totalRevenue}€`,
          sub: "Commissions perçues",
          color: "#f6ad55",
        },
      ]
    : [];

  // ================================
  // Vue d'ensemble
  // ================================
  const renderOverview = () => (
    <>
      <div className="kpi-grid">
        {kpis.map((k, i) => (
          <div
            key={i}
            className="kpi-card"
            style={{ borderLeftColor: k.color }}
          >
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ color: k.color }}>
              {k.value}
            </div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Dernières livraisons */}
      <div className="table-card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "14px",
          }}
        >
          <div className="chart-title" style={{ marginBottom: 0 }}>
            Dernières livraisons
          </div>
          <span
            onClick={() => setPage("deliveries")}
            style={{ fontSize: "11px", color: "#63b3ed", cursor: "pointer" }}
          >
            Voir tout →
          </span>
        </div>
        <div
          className="table-row table-head"
          style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}
        >
          <div>Expéditeur</div>
          <div>Destination</div>
          <div>Statut</div>
          <div>Prix</div>
        </div>
        {parcels.slice(0, 5).map((p, i) => (
          <div
            key={i}
            className="table-row"
            style={{
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              borderBottom:
                i === Math.min(parcels.length, 5) - 1
                  ? "none"
                  : "1px solid #1e2535",
            }}
          >
            <div style={{ color: "#e2e8f0" }}>
              {p.sender?.firstName} {p.sender?.lastName}
            </div>
            <div style={{ color: "#718096" }}>
              {p.recipient?.address?.city || "—"}
            </div>
            <div>
              <span className={`pill pill-${p.status}`}>
                {statusLabel[p.status]}
              </span>
            </div>
            <div style={{ color: "#48bb78" }}>{p.price}€</div>
          </div>
        ))}
      </div>

      {/* Dernières annonces */}
      <div className="table-card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "14px",
          }}
        >
          <div className="chart-title" style={{ marginBottom: 0 }}>
            Dernières annonces
          </div>
          <span
            onClick={() => setPage("announcements")}
            style={{ fontSize: "11px", color: "#63b3ed", cursor: "pointer" }}
          >
            Voir tout →
          </span>
        </div>
        <div
          className="table-row table-head"
          style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}
        >
          <div>Trajet</div>
          <div>Taille</div>
          <div>Statut</div>
          <div>Prix</div>
        </div>
        {parcels
          .filter((p) => p.status === "pending")
          .slice(0, 5)
          .map((p, i) => (
            <div
              key={i}
              className="table-row"
              style={{
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                borderBottom: i === 4 ? "none" : "1px solid #1e2535",
              }}
            >
              <div style={{ color: "#e2e8f0" }}>
                {p.sender?.address?.city} → {p.recipient?.address?.city}
              </div>
              <div style={{ color: "#718096" }}>{p.size?.toUpperCase()}</div>
              <div>
                <span className="pill pill-pending">En attente</span>
              </div>
              <div style={{ color: "#48bb78" }}>{p.price}€</div>
            </div>
          ))}
      </div>

      {/* Derniers inscrits */}
      <div className="table-card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "14px",
          }}
        >
          <div className="chart-title" style={{ marginBottom: 0 }}>
            Derniers inscrits
          </div>
          <span
            onClick={() => setPage("users")}
            style={{ fontSize: "11px", color: "#63b3ed", cursor: "pointer" }}
          >
            Voir tout →
          </span>
        </div>
        <div
          className="table-row table-head"
          style={{ gridTemplateColumns: "2fr 1fr 1fr" }}
        >
          <div>Utilisateur</div>
          <div>Rôle</div>
          <div>Inscrit le</div>
        </div>
        {users.slice(0, 5).map((u, i) => (
          <div
            key={i}
            className="table-row"
            style={{
              gridTemplateColumns: "2fr 1fr 1fr",
              borderBottom:
                i === Math.min(users.length, 5) - 1
                  ? "none"
                  : "1px solid #1e2535",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  background: "#1e2d45",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  color: "#63b3ed",
                  fontWeight: "600",
                  flexShrink: 0,
                }}
              >
                {u.firstName?.[0]}
                {u.lastName?.[0]}
              </div>
              <div>
                <div style={{ color: "#e2e8f0", fontSize: "12px" }}>
                  {u.firstName} {u.lastName}
                </div>
                <div style={{ color: "#4a5568", fontSize: "10px" }}>
                  {u.email}
                </div>
              </div>
            </div>
            <div>
              <span
                className={`pill ${u.role === "admin" ? "pill-delivered" : u.role === "livreur" ? "pill-assigned" : "pill-pending"}`}
              >
                {u.role}
              </span>
            </div>
            <div style={{ color: "#4a5568" }}>
              {new Date(u.createdAt).toLocaleDateString("fr-FR")}
            </div>
          </div>
        ))}
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "14px",
            }}
          >
            <div className="chart-title" style={{ marginBottom: 0 }}>
              Revenus — 30 jours
            </div>
            <span
              onClick={() => setPage("revenue")}
              style={{ fontSize: "11px", color: "#63b3ed", cursor: "pointer" }}
            >
              Voir tout →
            </span>
          </div>
          {revenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={revenue}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e2535"
                  vertical={false}
                />
                <XAxis
                  dataKey="_id"
                  tick={{ fill: "#4a5568", fontSize: 11 }}
                  tickFormatter={(v) => v.slice(5)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#4a5568", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip {...tooltipStyle} formatter={(v) => `${v}€`} />
                <Line
                  type="monotone"
                  dataKey="totalRevenue"
                  stroke="#63b3ed"
                  strokeWidth={2}
                  dot={false}
                  name="Revenus"
                />
                <Line
                  type="monotone"
                  dataKey="totalCommission"
                  stroke="#48bb78"
                  strokeWidth={2}
                  dot={false}
                  name="Commission"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">Pas encore de données</div>
          )}
        </div>
        <div className="chart-card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "14px",
            }}
          >
            <div className="chart-title" style={{ marginBottom: 0 }}>
              Colis par taille
            </div>
            <span
              onClick={() => setPage("analytics")}
              style={{ fontSize: "11px", color: "#63b3ed", cursor: "pointer" }}
            >
              Voir tout →
            </span>
          </div>
          {parcelsBySize.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart margin={{ top: 20, right: 20, bottom: 0, left: 20 }}>
                <Pie
                  data={parcelsBySize}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  innerRadius={35}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={{ stroke: "#1e2535" }}
                >
                  {parcelsBySize.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">Pas encore de données</div>
          )}
        </div>
      </div>
    </>
  );

  // ================================
  // Livraisons détaillées
  // ================================
  const renderDeliveries = () => {
    const cancelDelivery = async (id) => {
      if (
        !window.confirm(
          "Annuler cette livraison et remettre l'annonce sur le fil ?",
        )
      )
        return;
      try {
        const headers = { Authorization: `Bearer ${token}` };
        await api.patch(`/users/parcels/${id}/cancel`, {}, { headers });
        setParcels((prev) =>
          prev.map((p) =>
            p._id === id ? { ...p, status: "pending", delivererId: null } : p,
          ),
        );
      } catch {
        alert("Erreur lors de l'annulation");
      }
    };

    return (
      <div className="table-card">
        <div className="chart-title">
          Toutes les livraisons ({parcels.length})
        </div>
        {parcels.map((p, i) => (
          <div
            key={i}
            style={{
              background: "#1a2235",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "12px",
              border: "1px solid #1e2535",
            }}
          >
            {/* Header carte */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span className={`pill pill-${p.status}`}>
                  {statusLabel[p.status]}
                </span>
                <span style={{ fontSize: "11px", color: "#4a5568" }}>
                  {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#48bb78",
                  }}
                >
                  {p.price}€
                </span>
                {["assigned", "picked_up"].includes(p.status) && (
                  <button
                    onClick={() => cancelDelivery(p._id)}
                    style={{
                      padding: "3px 10px",
                      background: "#2d0f0f",
                      color: "#fc8181",
                      border: "1px solid #4a1515",
                      borderRadius: "6px",
                      fontSize: "11px",
                      cursor: "pointer",
                    }}
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>

            {/* Trajet */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  background: "#0f1117",
                  borderRadius: "8px",
                  padding: "10px",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    color: "#4a5568",
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                    marginBottom: "4px",
                  }}
                >
                  🔵 Expéditeur
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#e2e8f0",
                  }}
                >
                  {p.sender?.firstName} {p.sender?.lastName}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#718096",
                    marginTop: "2px",
                  }}
                >
                  📞 {p.sender?.phone}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#718096",
                    marginTop: "2px",
                  }}
                >
                  📍 {p.sender?.address?.street},{" "}
                  {p.sender?.address?.postalCode} {p.sender?.address?.city}
                </div>
              </div>
              <div
                style={{
                  background: "#0f1117",
                  borderRadius: "8px",
                  padding: "10px",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    color: "#4a5568",
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                    marginBottom: "4px",
                  }}
                >
                  🟢 Destinataire
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#e2e8f0",
                  }}
                >
                  {p.recipient?.firstName} {p.recipient?.lastName}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#718096",
                    marginTop: "2px",
                  }}
                >
                  📞 {p.recipient?.phone}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#718096",
                    marginTop: "2px",
                  }}
                >
                  📍 {p.recipient?.address?.street},{" "}
                  {p.recipient?.address?.postalCode}{" "}
                  {p.recipient?.address?.city}
                </div>
              </div>
            </div>

            {/* Livreur */}
            {p.delivererId && (
              <div
                style={{
                  background: "#0f1117",
                  borderRadius: "8px",
                  padding: "10px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    color: "#4a5568",
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                    marginBottom: "4px",
                  }}
                >
                  🚗 Livreur
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#e2e8f0",
                  }}
                >
                  {p.delivererId?.firstName} {p.delivererId?.lastName}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#718096",
                    marginTop: "2px",
                  }}
                >
                  📞 {p.delivererId?.phone}
                </div>
              </div>
            )}

            {/* Stats financières */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: "8px",
              }}
            >
              {[
                { label: "Taille", value: p.size?.toUpperCase() },
                {
                  label: "Distance",
                  value: p.distanceKm ? `${p.distanceKm} km` : "—",
                },
                { label: "Prix total", value: `${p.price}€`, color: "#63b3ed" },
                {
                  label: "Commission",
                  value: `${p.commission || Math.round(p.price * 0.2 * 100) / 100}€`,
                  color: "#f6ad55",
                },
              ].map((s, j) => (
                <div
                  key={j}
                  style={{
                    background: "#0f1117",
                    borderRadius: "8px",
                    padding: "8px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#4a5568",
                      marginBottom: "3px",
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: s.color || "#e2e8f0",
                    }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Poids et options */}
            <div
              style={{
                display: "flex",
                gap: "6px",
                marginTop: "8px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  padding: "2px 8px",
                  borderRadius: "99px",
                  background: "#1e2535",
                  color: "#a0aec0",
                }}
              >
                ⚖️ {p.weight} kg
              </span>
              {p.fragile && (
                <span
                  style={{
                    fontSize: "10px",
                    padding: "2px 8px",
                    borderRadius: "99px",
                    background: "#412402",
                    color: "#FAC775",
                  }}
                >
                  ⚠️ Fragile
                </span>
              )}
              {p.urgent && (
                <span
                  style={{
                    fontSize: "10px",
                    padding: "2px 8px",
                    borderRadius: "99px",
                    background: "#4A1B0C",
                    color: "#F5C4B3",
                  }}
                >
                  ⚡ Urgent
                </span>
              )}
              {p.description && (
                <span
                  style={{
                    fontSize: "10px",
                    padding: "2px 8px",
                    borderRadius: "99px",
                    background: "#1e2535",
                    color: "#a0aec0",
                  }}
                >
                  💬 {p.description}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ================================
  // Annonces (pending uniquement)
  // ================================
  const renderAnnouncements = () => {
    const pendingParcels = parcels.filter((p) => p.status === "pending");

    const deleteParcel = async (id) => {
      if (!window.confirm("Supprimer définitivement cette annonce ?")) return;
      try {
        const headers = { Authorization: `Bearer ${token}` };
        await api.delete(`/users/parcels/${id}`, { headers });
        setParcels((prev) => prev.filter((p) => p._id !== id));
      } catch {
        alert("Erreur lors de la suppression");
      }
    };

    return (
      <div className="table-card">
        <div className="chart-title">
          Annonces disponibles ({pendingParcels.length})
        </div>
        {pendingParcels.length === 0 ? (
          <div className="chart-empty">Aucune annonce en attente</div>
        ) : (
          pendingParcels.map((p, i) => (
            <div
              key={i}
              style={{
                background: "#1a2235",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "12px",
                border: "1px solid #1e2535",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      color: "#e2e8f0",
                    }}
                  >
                    {p.sender?.address?.city} → {p.recipient?.address?.city}
                  </span>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#4a5568",
                      marginTop: "2px",
                    }}
                  >
                    Publié le{" "}
                    {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "800",
                        color: "#48bb78",
                      }}
                    >
                      {p.delivererAmount ||
                        Math.round(p.price * 0.8 * 100) / 100}
                      €
                    </div>
                    <div style={{ fontSize: "10px", color: "#4a5568" }}>
                      pour le livreur
                    </div>
                  </div>
                </div>
                {/* Bouton supprimer */}
                <button
                  onClick={() => deleteParcel(p._id)}
                  style={{
                    padding: "5px 12px",
                    background: "#2d0f0f",
                    color: "#fc8181",
                    border: "1px solid #4a1515",
                    borderRadius: "6px",
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                >
                  🗑️ Supprimer
                </button>
              </div>
              <div></div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    background: "#0f1117",
                    borderRadius: "8px",
                    padding: "10px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#4a5568",
                      textTransform: "uppercase",
                      letterSpacing: ".05em",
                      marginBottom: "4px",
                    }}
                  >
                    🔵 Expéditeur
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#e2e8f0",
                    }}
                  >
                    {p.sender?.firstName} {p.sender?.lastName}
                  </div>
                  <div style={{ fontSize: "11px", color: "#718096" }}>
                    📞 {p.sender?.phone}
                  </div>
                  <div style={{ fontSize: "11px", color: "#718096" }}>
                    📍 {p.sender?.address?.street}, {p.sender?.address?.city}
                  </div>
                </div>
                <div
                  style={{
                    background: "#0f1117",
                    borderRadius: "8px",
                    padding: "10px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#4a5568",
                      textTransform: "uppercase",
                      letterSpacing: ".05em",
                      marginBottom: "4px",
                    }}
                  >
                    🟢 Destinataire
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#e2e8f0",
                    }}
                  >
                    {p.recipient?.firstName} {p.recipient?.lastName}
                  </div>
                  <div style={{ fontSize: "11px", color: "#718096" }}>
                    📞 {p.recipient?.phone}
                  </div>
                  <div style={{ fontSize: "11px", color: "#718096" }}>
                    📍 {p.recipient?.address?.street},{" "}
                    {p.recipient?.address?.city}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5,1fr)",
                  gap: "6px",
                }}
              >
                {[
                  { label: "Taille", value: p.size?.toUpperCase() },
                  { label: "Poids", value: `${p.weight} kg` },
                  {
                    label: "Distance",
                    value: p.distanceKm ? `${p.distanceKm} km` : "—",
                  },
                  {
                    label: "Prix total",
                    value: `${p.price}€`,
                    color: "#63b3ed",
                  },
                  {
                    label: "Commission",
                    value: `${p.commission || Math.round(p.price * 0.2 * 100) / 100}€`,
                    color: "#f6ad55",
                  },
                ].map((s, j) => (
                  <div
                    key={j}
                    style={{
                      background: "#0f1117",
                      borderRadius: "8px",
                      padding: "8px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#4a5568",
                        marginBottom: "3px",
                      }}
                    >
                      {s.label}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: s.color || "#e2e8f0",
                      }}
                    >
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                {p.fragile && (
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "2px 8px",
                      borderRadius: "99px",
                      background: "#412402",
                      color: "#FAC775",
                    }}
                  >
                    ⚠️ Fragile
                  </span>
                )}
                {p.urgent && (
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "2px 8px",
                      borderRadius: "99px",
                      background: "#4A1B0C",
                      color: "#F5C4B3",
                    }}
                  >
                    ⚡ Urgent
                  </span>
                )}
                {p.description && (
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "2px 8px",
                      borderRadius: "99px",
                      background: "#1e2535",
                      color: "#a0aec0",
                    }}
                  >
                    💬 {p.description}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  // ================================
  // Utilisateurs
  // ================================
  const renderUsers = () => (
    <div className="table-card">
      <div className="chart-title">Tous les utilisateurs ({users.length})</div>
      <div
        className="table-row table-head"
        style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}
      >
        <div>Nom</div>
        <div>Rôle</div>
        <div>Téléphone</div>
        <div>Inscrit le</div>
      </div>
      {users.map((u, i) => (
        <div
          key={i}
          className="table-row"
          style={{
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            borderBottom: i === users.length - 1 ? "none" : "1px solid #1e2535",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "#1e2d45",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                color: "#63b3ed",
                fontWeight: "600",
                flexShrink: 0,
              }}
            >
              {u.firstName?.[0]}
              {u.lastName?.[0]}
            </div>
            <div>
              <div style={{ color: "#e2e8f0", fontSize: "12px" }}>
                {u.firstName} {u.lastName}
              </div>
              <div style={{ color: "#4a5568", fontSize: "10px" }}>
                {u.email}
              </div>
            </div>
          </div>
          <div>
            <span
              className={`pill ${u.role === "admin" ? "pill-delivered" : u.role === "livreur" ? "pill-assigned" : "pill-pending"}`}
            >
              {u.role}
            </span>
          </div>
          <div style={{ color: "#718096" }}>{u.phone}</div>
          <div style={{ color: "#4a5568" }}>
            {new Date(u.createdAt).toLocaleDateString("fr-FR")}
          </div>
        </div>
      ))}
    </div>
  );

  // ================================
  // Revenus
  // ================================
  const renderRevenue = () => (
    <>
      <div
        className="kpi-grid"
        style={{ gridTemplateColumns: "repeat(3,1fr)" }}
      >
        {[
          {
            label: "Revenus totaux",
            value: `${revenue.reduce((s, r) => s + r.totalRevenue, 0).toFixed(2)}€`,
            color: "#63b3ed",
          },
          {
            label: "Commissions",
            value: `${revenue.reduce((s, r) => s + r.totalCommission, 0).toFixed(2)}€`,
            color: "#48bb78",
          },
          {
            label: "Transactions",
            value: revenue.reduce((s, r) => s + r.count, 0),
            color: "#f6ad55",
          },
        ].map((k, i) => (
          <div
            key={i}
            className="kpi-card"
            style={{ borderLeftColor: k.color }}
          >
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ color: k.color }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>
      <div className="chart-card">
        <div className="chart-title">
          Évolution des revenus — 30 derniers jours
        </div>
        {revenue.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenue}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e2535"
                vertical={false}
              />
              <XAxis
                dataKey="_id"
                tick={{ fill: "#4a5568", fontSize: 11 }}
                tickFormatter={(v) => v.slice(5)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#4a5568", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip {...tooltipStyle} formatter={(v) => `${v}€`} />
              <Line
                type="monotone"
                dataKey="totalRevenue"
                stroke="#63b3ed"
                strokeWidth={2}
                dot={false}
                name="Revenus"
              />
              <Line
                type="monotone"
                dataKey="totalCommission"
                stroke="#48bb78"
                strokeWidth={2}
                dot={false}
                name="Commission"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty" style={{ height: "280px" }}>
            Pas encore de données de revenus
          </div>
        )}
      </div>

      {/* Tableau détaillé revenus */}
      <div className="table-card">
        <div className="chart-title">Détail par jour</div>
        <div
          className="table-row table-head"
          style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}
        >
          <div>Date</div>
          <div>Transactions</div>
          <div>Revenus</div>
          <div>Commission</div>
        </div>
        {revenue
          .slice()
          .reverse()
          .map((r, i) => (
            <div
              key={i}
              className="table-row"
              style={{
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                borderBottom:
                  i === revenue.length - 1 ? "none" : "1px solid #1e2535",
              }}
            >
              <div style={{ color: "#e2e8f0" }}>{r._id}</div>
              <div style={{ color: "#718096" }}>{r.count}</div>
              <div style={{ color: "#63b3ed" }}>{r.totalRevenue}€</div>
              <div style={{ color: "#48bb78" }}>{r.totalCommission}€</div>
            </div>
          ))}
      </div>
    </>
  );

  // ================================
  // Analytique
  // ================================
  const renderAnalytics = () => (
    <>
      {distanceStats && (
        <div className="kpi-grid">
          {[
            {
              label: "Distance moyenne",
              value: `${distanceStats.avgDistance} km`,
              color: "#63b3ed",
            },
            {
              label: "Distance max",
              value: `${distanceStats.maxDistance} km`,
              color: "#fc8181",
            },
            {
              label: "Distance min",
              value: `${distanceStats.minDistance} km`,
              color: "#48bb78",
            },
            {
              label: "Distance totale",
              value: `${distanceStats.totalDistance} km`,
              color: "#f6ad55",
            },
          ].map((k, i) => (
            <div
              key={i}
              className="kpi-card"
              style={{ borderLeftColor: k.color }}
            >
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value" style={{ color: k.color }}>
                {k.value}
              </div>
              <div className="kpi-sub">
                {distanceStats.totalParcels} livraisons analysées
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-title">Livraisons par tranche de distance</div>
          {distanceStats?.byRange?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={distanceStats.byRange} barSize={32}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e2535"
                  vertical={false}
                />
                <XAxis
                  dataKey="range"
                  tick={{ fill: "#4a5568", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#4a5568", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip {...tooltipStyle} />
                <Bar
                  dataKey="count"
                  fill="#2a5298"
                  radius={[4, 4, 0, 0]}
                  name="Livraisons"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">Pas encore de données</div>
          )}
        </div>
        <div className="chart-card">
          <div className="chart-title">Prix moyen par tranche</div>
          {distanceStats?.byRange?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={distanceStats.byRange} barSize={32}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e2535"
                  vertical={false}
                />
                <XAxis
                  dataKey="range"
                  tick={{ fill: "#4a5568", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#4a5568", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip {...tooltipStyle} formatter={(v) => `${v}€`} />
                <Bar
                  dataKey="avgPrice"
                  fill="#7F77DD"
                  radius={[4, 4, 0, 0]}
                  name="Prix moyen"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">Pas encore de données</div>
          )}
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-title">Répartition par taille</div>
          {parcelsBySize.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart margin={{ top: 20, right: 20, bottom: 0, left: 20 }}>
                <Pie
                  data={parcelsBySize}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={{ stroke: "#1e2535" }}
                >
                  {parcelsBySize.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">Pas encore de données</div>
          )}
        </div>
        <div className="chart-card">
          <div className="chart-title">Top livreurs</div>
          {topDeliverers.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={topDeliverers.map((d) => ({
                  ...d,
                  shortName: d.name.split(" ")[0],
                }))}
                barSize={28}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e2535"
                  vertical={false}
                />
                <XAxis
                  dataKey="shortName"
                  tick={{ fill: "#4a5568", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#4a5568", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip {...tooltipStyle} />
                <Bar
                  dataKey="totalDeliveries"
                  fill="#2a5298"
                  radius={[4, 4, 0, 0]}
                  name="Livraisons"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">Pas encore de données</div>
          )}
        </div>
      </div>

      <div className="table-card">
        <div className="chart-title">Détail par tranche de distance</div>
        <div
          className="table-row table-head"
          style={{ gridTemplateColumns: "1fr 1fr 1fr" }}
        >
          <div>Tranche</div>
          <div>Livraisons</div>
          <div>Prix moyen</div>
        </div>
        {distanceStats?.byRange?.length > 0 ? (
          distanceStats.byRange.map((d, i) => (
            <div
              key={i}
              className="table-row"
              style={{
                gridTemplateColumns: "1fr 1fr 1fr",
                borderBottom:
                  i === distanceStats.byRange.length - 1
                    ? "none"
                    : "1px solid #1e2535",
              }}
            >
              <div style={{ color: "#e2e8f0" }}>{d.range}</div>
              <div style={{ color: "#63b3ed" }}>
                {d.count} livraison{d.count > 1 ? "s" : ""}
              </div>
              <div style={{ color: "#48bb78" }}>{d.avgPrice}€</div>
            </div>
          ))
        ) : (
          <div className="chart-empty" style={{ height: "80px" }}>
            Pas encore de données
          </div>
        )}
      </div>
    </>
  );

  const renderStars = (rating) => "★".repeat(rating) + "☆".repeat(5 - rating);

  const renderReviews = () => {
    const avgRating =
      reviews.length > 0
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(
            1,
          )
        : "—";
    const onTimeCount = reviews.filter((r) => r.onTime).length;
    const damagedCount = reviews.filter((r) => r.damaged).length;
    // const hadIssuesCount = reviews.filter((r) => r.hadIssues).length;

    return (
      <>
        {/* KPIs */}
        <div
          className="kpi-grid"
          style={{ gridTemplateColumns: "repeat(4,1fr)" }}
        >
          {[
            {
              label: "Évaluations totales",
              value: reviews.length,
              color: "#63b3ed",
            },
            {
              label: "Note moyenne",
              value: `${avgRating} / 5`,
              color: "#f6ad55",
            },
            {
              label: "Livraisons à temps",
              value: `${onTimeCount} / ${reviews.length}`,
              color: "#48bb78",
            },
            {
              label: "Colis endommagés",
              value: damagedCount,
              color: "#fc8181",
            },
          ].map((k, i) => (
            <div
              key={i}
              className="kpi-card"
              style={{ borderLeftColor: k.color }}
            >
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value" style={{ color: k.color }}>
                {k.value}
              </div>
            </div>
          ))}
        </div>

        {/* Liste des évaluations */}
        <div className="table-card">
          <div className="chart-title">
            Toutes les évaluations ({reviews.length})
          </div>
          {reviews.length === 0 ? (
            <div className="chart-empty">Aucune évaluation pour le moment</div>
          ) : (
            reviews.map((r, i) => (
              <div
                key={i}
                style={{
                  background: "#1a2235",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "12px",
                  border: "1px solid #1e2535",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "18px",
                        color: "#f6ad55",
                        letterSpacing: "2px",
                      }}
                    >
                      {renderStars(r.rating)}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#4a5568",
                        marginTop: "4px",
                      }}
                    >
                      {new Date(r.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: "800",
                      color: "#f6ad55",
                    }}
                  >
                    {r.rating}/5
                  </div>
                </div>

                {/* Client + Livreur */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      background: "#0f1117",
                      borderRadius: "8px",
                      padding: "10px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#4a5568",
                        textTransform: "uppercase",
                        letterSpacing: ".05em",
                        marginBottom: "4px",
                      }}
                    >
                      👤 Client
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#e2e8f0",
                      }}
                    >
                      {r.clientId?.firstName} {r.clientId?.lastName}
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#0f1117",
                      borderRadius: "8px",
                      padding: "10px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#4a5568",
                        textTransform: "uppercase",
                        letterSpacing: ".05em",
                        marginBottom: "4px",
                      }}
                    >
                      🚗 Livreur
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#e2e8f0",
                      }}
                    >
                      {r.delivererId?.firstName} {r.delivererId?.lastName}
                    </div>
                  </div>
                </div>

                {/* Questions */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4,1fr)",
                    gap: "8px",
                    marginBottom: "10px",
                  }}
                >
                  {[
                    { label: "✅ À temps", value: r.onTime },
                    { label: "📦 Endommagé", value: r.damaged },
                    { label: "🤝 Bien reçu", value: r.wellReceived },
                    { label: "⚠️ Soucis", value: r.hadIssues },
                  ].map((item, j) => (
                    <div
                      key={j}
                      style={{
                        background: "#0f1117",
                        borderRadius: "8px",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#4a5568",
                          marginBottom: "4px",
                        }}
                      >
                        {item.label}
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "600",
                          padding: "2px 8px",
                          borderRadius: "99px",
                          background: item.value ? "#1a3a1a" : "#2d0f0f",
                          color: item.value ? "#48bb78" : "#fc8181",
                        }}
                      >
                        {item.value ? "Oui" : "Non"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Commentaire */}
                {r.comment && (
                  <div
                    style={{
                      background: "#0f1117",
                      borderRadius: "8px",
                      padding: "10px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#4a5568",
                        marginBottom: "4px",
                      }}
                    >
                      💬 Commentaire
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#a0aec0",
                        fontStyle: "italic",
                      }}
                    >
                      "{r.comment}"
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </>
    );
  };

  const pages = {
    overview: renderOverview,
    deliveries: renderDeliveries,
    announcements: renderAnnouncements,
    users: renderUsers,
    revenue: renderRevenue,
    analytics: renderAnalytics,
    reviews: renderReviews,
  };

  return (
    <div className="app">
      <div className="sidebar">
        <div className="logo">
          <div className="logo-title">DeliverConnect</div>
          <div className="logo-sub">Dashboard Admin</div>
        </div>
        <nav className="nav">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${page === item.id ? "active" : ""}`}
              onClick={() => setPage(item.id)}
            >
              {item.icon}
              {item.label}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="avatar-wrap">
            <div className="avatar-circle">AD</div>
            <div>
              <div className="avatar-name">Admin</div>
              <div className="avatar-role">Administrateur</div>
            </div>
          </div>
        </div>
      </div>

      <div className="main">
        <div className="topbar">
          <div className="page-title">
            {NAV_ITEMS.find((n) => n.id === page)?.label}
          </div>
          <div className="topbar-right">
            <div className="badge">En direct</div>
            <button className="logout-btn" onClick={logout}>
              Déconnexion
            </button>
          </div>
        </div>
        {loading ? (
          <div className="loading">Chargement...</div>
        ) : (
          <div className="content">{pages[page]?.()}</div>
        )}
      </div>
    </div>
  );
}
