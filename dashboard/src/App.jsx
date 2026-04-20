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
  const [_deliveryStats, setDeliveryStats] = useState([]);
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

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [ov, rev, top, sizes, stats, usersRes, parcelsRes, distRes] =
          await Promise.all([
            api.get("/analytics/overview", { headers }),
            api.get("/analytics/revenue", { headers }),
            api.get("/analytics/top-deliverers", { headers }),
            api.get("/analytics/parcels-by-size", { headers }),
            api.get("/analytics/deliveries", { headers }),
            api.get("/users", { headers }),
            api.get("/users/parcels", { headers }),
            api.get("/analytics/distances", { headers }),
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
        setDeliveryStats(stats.data.data);
        setUsers(usersRes.data.users);
        setParcels(parcelsRes.data.parcels);
        setDistanceStats(distRes.data.data);
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

  const renderOverview = () => (
    <>
      {/* KPIs */}
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

      {/* Revenus + Analytique */}
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

      {/* Derniers utilisateurs */}
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

      {/* Top livreurs */}
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
            Top livreurs
          </div>
          <span
            onClick={() => setPage("analytics")}
            style={{ fontSize: "11px", color: "#63b3ed", cursor: "pointer" }}
          >
            Voir tout →
          </span>
        </div>
        {topDeliverers.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
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
    </>
  );

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
        <div
          className="table-row table-head"
          style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr" }}
        >
          <div>Expéditeur</div>
          <div>Destination</div>
          <div>Statut</div>
          <div>Prix</div>
          <div>Action</div>
        </div>
        {parcels.length > 0 ? (
          parcels.map((p, i) => (
            <div
              key={i}
              className="table-row"
              style={{
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                borderBottom:
                  i === parcels.length - 1 ? "none" : "1px solid #1e2535",
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
              <div>
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
          ))
        ) : (
          <div className="chart-empty">Aucune livraison</div>
        )}
      </div>
    );
  };

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
      {users.length > 0 ? (
        users.map((u, i) => (
          <div
            key={i}
            className="table-row"
            style={{
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              borderBottom:
                i === users.length - 1 ? "none" : "1px solid #1e2535",
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
        ))
      ) : (
        <div className="chart-empty">Aucun utilisateur</div>
      )}
    </div>
  );

  const renderRevenue = () => (
    <>
      <div
        className="kpi-grid"
        style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
      >
        {[
          {
            label: "Revenus totaux",
            value: `${revenue.reduce((s, r) => s + r.totalRevenue, 0)}€`,
            color: "#63b3ed",
          },
          {
            label: "Commissions",
            value: `${revenue.reduce((s, r) => s + r.totalCommission, 0)}€`,
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
    </>
  );

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
          <div className="chart-title">Prix moyen par tranche de distance</div>
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

      <div className="table-card">
        <div className="chart-title">Détail par tranche de distance</div>
        <div
          className="table-row table-head"
          style={{ gridTemplateColumns: "1fr 1fr 1fr" }}
        >
          <div>Tranche</div>
          <div>Nombre de livraisons</div>
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

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-title">Répartition des colis par taille</div>
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
    </>
  );

  const pages = {
    overview: renderOverview,
    deliveries: renderDeliveries,
    users: renderUsers,
    revenue: renderRevenue,
    analytics: renderAnalytics,
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
