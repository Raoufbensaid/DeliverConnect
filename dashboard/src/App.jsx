import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

const API = "https://deliverconnect-production.up.railway.app/api";
const api = axios.create({ baseURL: API });

const STATUS_LABEL = {
  pending: "En attente",
  assigned: "Assigné",
  picked_up: "En cours",
  delivered: "Livré",
  cancelled: "Annulé",
};

const COLORS_CHART = ["#63B3ED", "#48BB78", "#F6AD55", "#B794F4", "#FC8181"];

const tooltipStyle = {
  contentStyle: {
    background: "#0D1322",
    border: "1px solid #1A2235",
    borderRadius: "8px",
    color: "#E2E8F0",
    fontSize: "11px",
  },
};

// Données fixes pour les graphiques analytiques
const REGISTRATION_DATA = [
  { date: "01", inscrits: 3, actifs: 2 },
  { date: "02", inscrits: 5, actifs: 3 },
  { date: "03", inscrits: 2, actifs: 1 },
  { date: "04", inscrits: 8, actifs: 4 },
  { date: "05", inscrits: 6, actifs: 3 },
  { date: "06", inscrits: 4, actifs: 2 },
  { date: "07", inscrits: 9, actifs: 5 },
  { date: "08", inscrits: 7, actifs: 4 },
  { date: "09", inscrits: 3, actifs: 2 },
  { date: "10", inscrits: 6, actifs: 3 },
  { date: "11", inscrits: 8, actifs: 5 },
  { date: "12", inscrits: 5, actifs: 3 },
  { date: "13", inscrits: 10, actifs: 6 },
  { date: "14", inscrits: 7, actifs: 4 },
];

const NAV = [
  {
    id: "overview",
    label: "Vue d'ensemble",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "deliveries",
    label: "Livraisons",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
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
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    id: "users",
    label: "Utilisateurs",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
      </svg>
    ),
  },
  {
    id: "revenue",
    label: "Revenus",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    id: "analytics",
    label: "Analytique",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
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
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    badge: true,
  },
  {
    id: "messages",
    label: "Messages",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    badge: true,
  },
];

function Sparkline({ data, color }) {
  const max = Math.max(...data);
  return (
    <div className="sparkline">
      {data.map((v, i) => (
        <div
          key={i}
          className="sp"
          style={{
            height: `${(v / max) * 100}%`,
            background: color,
            opacity: i === data.length - 1 ? 1 : 0.4,
          }}
        />
      ))}
    </div>
  );
}

function HeatmapGrid({ data, theme }) {
  const colorsDark = ["#1A2235", "#1A2848", "#2A5298", "#378ADD", "#63B3ED"];
  const colorsLight = ["#F3F4F6", "#DBEAFE", "#BFDBFE", "#93C5FD", "#378ADD"];
  const colors = theme === "light" ? colorsLight : colorsDark;
  return (
    <div>
      <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: "9px",
              color: "var(--text3)",
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="heatmap-grid">
        {data.map((v, i) => (
          <div
            key={i}
            className="hmap-cell"
            style={{ background: colors[Math.min(v, 4)] }}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          marginTop: "6px",
        }}
      >
        <span style={{ fontSize: "9px", color: "var(--text3)" }}>Moins</span>
        {colors.map((c, i) => (
          <div
            key={i}
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "2px",
              background: c,
            }}
          />
        ))}
        <span style={{ fontSize: "9px", color: "var(--text3)" }}>Plus</span>
      </div>
    </div>
  );
}

function ScatterPlot({ dots }) {
  return (
    <div className="scatter-wrap">
      {dots.map((d, i) => (
        <div
          key={i}
          className="scatter-dot"
          style={{ left: `${d.x}%`, bottom: `${d.y}%`, background: d.c }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "1px",
          background: "var(--border)",
        }}
      />
    </div>
  );
}

function FunnelChart({ steps }) {
  const max = steps[0].value;
  return (
    <div>
      {steps.map((s, i) => (
        <div key={i} className="funnel-row">
          <div className="funnel-label">{s.label}</div>
          <div className="funnel-track">
            <div
              className="funnel-bar"
              style={{
                width: `${(s.value / max) * 100}%`,
                background: s.color,
              }}
            />
          </div>
          <div className="funnel-value">{s.value.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(
    localStorage.getItem("dashTheme") || "dark",
  );
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [topDeliverers, setTopDeliverers] = useState([]);
  const [parcelsBySize, setParcelsBySize] = useState([]);
  const [users, setUsers] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [distanceStats, setDistanceStats] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("dashTheme", next);
  };

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
    const fetchAll = async () => {
      setLoading(true);
      try {
        const h = { Authorization: `Bearer ${token}` };
        const [ov, rev, top, sizes, usersRes, parcelsRes, distRes, reviewsRes] =
          await Promise.all([
            api.get("/analytics/overview", { headers: h }),
            api.get("/analytics/revenue", { headers: h }),
            api.get("/analytics/top-deliverers", { headers: h }),
            api.get("/analytics/parcels-by-size", { headers: h }),
            api.get("/users", { headers: h }),
            api.get("/users/parcels", { headers: h }),
            api.get("/analytics/distances", { headers: h }),
            api.get("/reviews", { headers: h }),
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
    fetchAll();
  }, [token]);

  const heatmapData = [
    0, 1, 2, 3, 4, 3, 1, 2, 3, 4, 4, 3, 2, 1, 3, 4, 4, 3, 2, 1, 2, 3, 4, 4, 3,
    2, 1, 2, 3, 4, 4, 3, 2, 1, 2, 3, 4, 4, 3, 2, 1, 0,
  ];
  const scatterDots = [
    { x: 8, y: 20, c: "#63B3ED" },
    { x: 15, y: 30, c: "#63B3ED" },
    { x: 25, y: 45, c: "#48BB78" },
    { x: 35, y: 40, c: "#48BB78" },
    { x: 45, y: 55, c: "#F6AD55" },
    { x: 55, y: 50, c: "#F6AD55" },
    { x: 65, y: 70, c: "#B794F4" },
    { x: 75, y: 60, c: "#B794F4" },
    { x: 85, y: 75, c: "#FC8181" },
    { x: 12, y: 25, c: "#63B3ED" },
    { x: 30, y: 42, c: "#48BB78" },
    { x: 50, y: 55, c: "#F6AD55" },
    { x: 70, y: 65, c: "#B794F4" },
    { x: 90, y: 80, c: "#FC8181" },
    { x: 20, y: 35, c: "#63B3ED" },
  ];
  const funnelSteps = [
    { label: "Visites", value: 1240, color: "#63B3ED" },
    { label: "Inscriptions", value: 842, color: "#63B3ED" },
    { label: "1ère annonce", value: 521, color: "#48BB78" },
    { label: "Paiement", value: 372, color: "#B794F4" },
    { label: "Livré", value: 274, color: "#F6AD55" },
    { label: "Évaluation", value: 174, color: "#FC8181" },
  ];
  const sparkData = {
    inscrits: [3, 5, 2, 8, 6, 9, 12],
    sessions: [20, 35, 28, 45, 38, 52, 48],
    duree: [5, 8, 6, 9, 7, 8, 10],
    conversion: [18, 20, 17, 22, 21, 23, 25],
  };
  const roleData = [
    { name: "Clients", value: overview?.users?.clients || 0 },
    { name: "Livreurs", value: overview?.users?.livreurs || 0 },
    {
      name: "Admins",
      value: users.filter((u) => u.role === "admin").length || 1,
    },
  ];

  const registrationData = useMemo(() => {
    if (revenue.length > 0) {
      return revenue.map((r, i) => ({
        date: r._id?.slice(5),
        inscrits:
          REGISTRATION_DATA[i % REGISTRATION_DATA.length]?.inscrits || 3,
        actifs: REGISTRATION_DATA[i % REGISTRATION_DATA.length]?.actifs || 2,
      }));
    }
    return REGISTRATION_DATA;
  }, [revenue]);

  if (!token)
    return (
      <div className="login-wrap">
        <div className="login-card">
          <div className="login-title">DeliverConnect</div>
          <div className="login-sub">Dashboard Admin</div>
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

  // ════ PAGES ════

  const renderOverview = () => (
    <>
      <div className="kpi-grid">
        {[
          {
            label: "Utilisateurs",
            value: overview?.users?.total || 0,
            sub: `${overview?.users?.clients || 0} clients · ${overview?.users?.livreurs || 0} livreurs`,
            color: "#63B3ED",
            bg: "#1A2848",
            spark: sparkData.inscrits,
            icon: (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            ),
          },
          {
            label: "Colis total",
            value: overview?.parcels?.total || 0,
            sub: `${overview?.parcels?.delivered || 0} livrés · ${overview?.parcels?.pending || 0} en attente`,
            color: "#48BB78",
            bg: "#0F2A1A",
            spark: [4, 6, 5, 8, 7, 9, 11],
            icon: (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" />
                <rect x="9" y="11" width="14" height="10" rx="2" />
              </svg>
            ),
          },
          {
            label: "Taux de complétion",
            value: `${overview?.completionRate || 0}%`,
            sub: "Livraisons réussies",
            color: "#B794F4",
            bg: "#1E1A3A",
            spark: [70, 75, 72, 80, 78, 85, 87],
            icon: (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            ),
          },
          {
            label: "Revenus plateforme",
            value: `${overview?.totalRevenue || 0}€`,
            sub: "Commissions perçues",
            color: "#F6AD55",
            bg: "#2A1A08",
            spark: [120, 180, 150, 220, 190, 260, 240],
            icon: (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            ),
          },
        ].map((k, i) => (
          <div
            key={i}
            className="kpi-card"
            style={{ borderLeftColor: k.color }}
          >
            <div
              className="kpi-icon"
              style={{ background: k.bg, color: k.color }}
            >
              {k.icon}
            </div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ color: k.color }}>
              {k.value}
            </div>
            <Sparkline data={k.spark} color={k.color} />
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-title">Revenus & commissions — 30 jours</div>
          {revenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenue}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#63B3ED" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#63B3ED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="_id"
                  tick={{ fill: "var(--text3)", fontSize: 10 }}
                  tickFormatter={(v) => v.slice(5)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--text3)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip {...tooltipStyle} formatter={(v) => `${v}€`} />
                <Area
                  type="monotone"
                  dataKey="totalRevenue"
                  stroke="#63B3ED"
                  fill="url(#gRev)"
                  strokeWidth={2}
                  name="Revenus"
                />
                <Area
                  type="monotone"
                  dataKey="totalCommission"
                  stroke="#48BB78"
                  fill="none"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  name="Commission"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">Pas encore de données</div>
          )}
        </div>
        <div className="chart-card">
          <div className="chart-title">Répartition utilisateurs</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={roleData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={75}
                innerRadius={45}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={{ stroke: "var(--border)" }}
              >
                {roleData.map((_, i) => (
                  <Cell key={i} fill={COLORS_CHART[i]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="table-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <div className="chart-title" style={{ marginBottom: 0 }}>
            Dernières livraisons
          </div>
          <span
            onClick={() => setPage("deliveries")}
            style={{
              fontSize: "11px",
              color: "var(--primary)",
              cursor: "pointer",
            }}
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
            style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}
          >
            <div style={{ color: "var(--text)" }}>
              {p.sender?.firstName} {p.sender?.lastName}
            </div>
            <div>{p.recipient?.address?.city || "—"}</div>
            <div>
              <span className={`pill pill-${p.status}`}>
                {STATUS_LABEL[p.status]}
              </span>
            </div>
            <div style={{ color: "#48BB78" }}>{p.price}€</div>
          </div>
        ))}
      </div>

      <div className="table-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <div className="chart-title" style={{ marginBottom: 0 }}>
            Derniers inscrits
          </div>
          <span
            onClick={() => setPage("users")}
            style={{
              fontSize: "11px",
              color: "var(--primary)",
              cursor: "pointer",
            }}
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
            style={{ gridTemplateColumns: "2fr 1fr 1fr" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  background: "var(--bg3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  color: "var(--primary)",
                  fontWeight: "700",
                  flexShrink: 0,
                }}
              >
                {u.firstName?.[0]}
                {u.lastName?.[0]}
              </div>
              <div>
                <div style={{ color: "var(--text)", fontSize: "12px" }}>
                  {u.firstName} {u.lastName}
                </div>
                <div style={{ color: "var(--text3)", fontSize: "10px" }}>
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
            <div style={{ color: "var(--text3)" }}>
              {new Date(u.createdAt).toLocaleDateString("fr-FR")}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderAnalytics = () => (
    <>
      <div className="kpi-grid">
        {[
          {
            label: "Nouveaux inscrits",
            value: "+" + users.slice(0, 7).length,
            color: "#63B3ED",
            bg: "#1A2848",
            spark: sparkData.inscrits,
            trend: "↑ +18% cette semaine",
            trendColor: "#48BB78",
          },
          {
            label: "Sessions actives",
            value: users.length * 12,
            color: "#48BB78",
            bg: "#0F2A1A",
            spark: sparkData.sessions,
            trend: "↑ +6% aujourd'hui",
            trendColor: "#48BB78",
          },
          {
            label: "Durée moy. session",
            value: "8m 32s",
            color: "#B794F4",
            bg: "#1E1A3A",
            spark: sparkData.duree,
            trend: "↓ -2% vs hier",
            trendColor: "#FC8181",
          },
          {
            label: "Taux de conversion",
            value: `${overview?.completionRate || 23}%`,
            color: "#F6AD55",
            bg: "#2A1A08",
            spark: sparkData.conversion,
            trend: "↑ +4.2% ce mois",
            trendColor: "#48BB78",
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
            <Sparkline data={k.spark} color={k.color} />
            <div className="kpi-trend" style={{ color: k.trendColor }}>
              {k.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-title">Inscriptions — 30 derniers jours</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={registrationData} barSize={10}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--text3)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--text3)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip {...tooltipStyle} />
              <Bar
                dataKey="inscrits"
                fill="#63B3ED"
                radius={[3, 3, 0, 0]}
                name="Inscrits"
              />
              <Bar
                dataKey="actifs"
                fill="#48BB78"
                radius={[3, 3, 0, 0]}
                name="Actifs"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <div className="chart-title">Activité par jour de la semaine</div>
          <HeatmapGrid data={heatmapData} theme={theme} />
          <div style={{ marginTop: "14px" }}>
            <div className="chart-title" style={{ marginBottom: "8px" }}>
              Croissance hebdomadaire
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={registrationData.slice(0, 7)}>
                <Line
                  type="monotone"
                  dataKey="inscrits"
                  stroke="#63B3ED"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="actifs"
                  stroke="#48BB78"
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="4 2"
                />
                <Tooltip {...tooltipStyle} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="charts-row3">
        <div className="chart-card">
          <div className="chart-title">Entonnoir de conversion</div>
          <FunnelChart steps={funnelSteps} />
        </div>
        <div className="chart-card">
          <div className="chart-title">Distance vs Prix (scatter)</div>
          <ScatterPlot dots={scatterDots} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "9px",
              color: "var(--text3)",
              marginBottom: "12px",
            }}
          >
            <span>0 km</span>
            <span>50 km</span>
            <span>100 km</span>
          </div>
          <div className="chart-title" style={{ marginBottom: "8px" }}>
            Répartition par taille
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={parcelsBySize} barSize={18}>
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--text3)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {parcelsBySize.map((_, i) => (
                  <Cell key={i} fill={COLORS_CHART[i % COLORS_CHART.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <div className="chart-title">Distances — statistiques</div>
          {distanceStats ? (
            <>
              {[
                {
                  label: "Distance moy.",
                  value: `${distanceStats.avgDistance} km`,
                  color: "#63B3ED",
                },
                {
                  label: "Distance max.",
                  value: `${distanceStats.maxDistance} km`,
                  color: "#FC8181",
                },
                {
                  label: "Distance min.",
                  value: `${distanceStats.minDistance} km`,
                  color: "#48BB78",
                },
                {
                  label: "Distance totale",
                  value: `${distanceStats.totalDistance} km`,
                  color: "#F6AD55",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "7px 0",
                    borderBottom: "0.5px solid var(--border)",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "var(--text2)" }}>
                    {s.label}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      color: s.color,
                    }}
                  >
                    {s.value}
                  </span>
                </div>
              ))}
              <div style={{ marginTop: "12px" }}>
                <div className="chart-title" style={{ marginBottom: "8px" }}>
                  Top livreurs
                </div>
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart
                    data={topDeliverers.map((d) => ({
                      ...d,
                      shortName: d.name.split(" ")[0],
                    }))}
                    barSize={14}
                  >
                    <XAxis
                      dataKey="shortName"
                      tick={{ fill: "var(--text3)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide allowDecimals={false} />
                    <Tooltip {...tooltipStyle} />
                    <Bar
                      dataKey="totalDeliveries"
                      fill="#63B3ED"
                      radius={[3, 3, 0, 0]}
                      name="Livraisons"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="chart-empty">Pas encore de données</div>
          )}
        </div>
      </div>
    </>
  );

  const renderDeliveries = () => {
    const cancelDelivery = async (id) => {
      if (!window.confirm("Annuler cette livraison ?")) return;
      try {
        await api.patch(
          `/users/parcels/${id}/cancel`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );
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
          <div key={i} className="delivery-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span className={`pill pill-${p.status}`}>
                  {STATUS_LABEL[p.status]}
                </span>
                <span style={{ fontSize: "10px", color: "var(--text3)" }}>
                  {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "800",
                    color: "#48BB78",
                  }}
                >
                  {p.price}€
                </span>
                {["assigned", "picked_up"].includes(p.status) && (
                  <button
                    onClick={() => cancelDelivery(p._id)}
                    style={{
                      padding: "3px 10px",
                      background: "#1A0808",
                      color: "#FC8181",
                      border: "0.5px solid #4A1515",
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
            <div className="delivery-grid-2">
              <div className="info-block">
                <div className="info-block-label">🔵 Expéditeur</div>
                <div className="info-block-name">
                  {p.sender?.firstName} {p.sender?.lastName}
                </div>
                <div className="info-block-sub">📞 {p.sender?.phone}</div>
                <div className="info-block-sub">
                  📍 {p.sender?.address?.street},{" "}
                  {p.sender?.address?.postalCode} {p.sender?.address?.city}
                </div>
              </div>
              <div className="info-block">
                <div className="info-block-label">🟢 Destinataire</div>
                <div className="info-block-name">
                  {p.recipient?.firstName} {p.recipient?.lastName}
                </div>
                <div className="info-block-sub">📞 {p.recipient?.phone}</div>
                <div className="info-block-sub">
                  📍 {p.recipient?.address?.street},{" "}
                  {p.recipient?.address?.postalCode}{" "}
                  {p.recipient?.address?.city}
                </div>
              </div>
            </div>
            {p.delivererId && (
              <div className="info-block" style={{ marginBottom: "10px" }}>
                <div className="info-block-label">🚗 Livreur</div>
                <div className="info-block-name">
                  {p.delivererId?.firstName} {p.delivererId?.lastName}
                </div>
                <div className="info-block-sub">📞 {p.delivererId?.phone}</div>
              </div>
            )}
            <div className="delivery-grid-4">
              {[
                { label: "Taille", value: p.size?.toUpperCase() },
                {
                  label: "Distance",
                  value: p.distanceKm ? `${p.distanceKm} km` : "—",
                },
                { label: "Prix total", value: `${p.price}€`, color: "#63B3ED" },
                {
                  label: "Commission",
                  value: `${p.commission || Math.round(p.price * 0.2 * 100) / 100}€`,
                  color: "#F6AD55",
                },
              ].map((s, j) => (
                <div key={j} className="stat-chip">
                  <div className="stat-chip-label">{s.label}</div>
                  <div
                    className="stat-chip-value"
                    style={{ color: s.color || "var(--text)" }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
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
                  background: "var(--bg3)",
                  color: "var(--text2)",
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
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderAnnouncements = () => {
    const pending = parcels.filter((p) => p.status === "pending");
    const deleteParcel = async (id) => {
      if (!window.confirm("Supprimer cette annonce ?")) return;
      try {
        await api.delete(`/users/parcels/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setParcels((prev) => prev.filter((p) => p._id !== id));
      } catch {
        alert("Erreur lors de la suppression");
      }
    };
    return (
      <div className="table-card">
        <div className="chart-title">
          Annonces disponibles ({pending.length})
        </div>
        {pending.length === 0 ? (
          <div className="chart-empty">Aucune annonce en attente</div>
        ) : (
          pending.map((p, i) => (
            <div key={i} className="delivery-card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "700",
                      color: "var(--text)",
                    }}
                  >
                    {p.sender?.address?.city} → {p.recipient?.address?.city}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "var(--text3)",
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
                        fontSize: "18px",
                        fontWeight: "800",
                        color: "#48BB78",
                      }}
                    >
                      {p.delivererAmount ||
                        Math.round(p.price * 0.8 * 100) / 100}
                      €
                    </div>
                    <div style={{ fontSize: "9px", color: "var(--text3)" }}>
                      pour le livreur
                    </div>
                  </div>
                  <button
                    onClick={() => deleteParcel(p._id)}
                    style={{
                      padding: "4px 10px",
                      background: "#1A0808",
                      color: "#FC8181",
                      border: "0.5px solid #4A1515",
                      borderRadius: "6px",
                      fontSize: "11px",
                      cursor: "pointer",
                    }}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
              <div className="delivery-grid-2">
                <div className="info-block">
                  <div className="info-block-label">🔵 Expéditeur</div>
                  <div className="info-block-name">
                    {p.sender?.firstName} {p.sender?.lastName}
                  </div>
                  <div className="info-block-sub">📞 {p.sender?.phone}</div>
                  <div className="info-block-sub">
                    📍 {p.sender?.address?.street}, {p.sender?.address?.city}
                  </div>
                </div>
                <div className="info-block">
                  <div className="info-block-label">🟢 Destinataire</div>
                  <div className="info-block-name">
                    {p.recipient?.firstName} {p.recipient?.lastName}
                  </div>
                  <div className="info-block-sub">📞 {p.recipient?.phone}</div>
                  <div className="info-block-sub">
                    📍 {p.recipient?.address?.street},{" "}
                    {p.recipient?.address?.city}
                  </div>
                </div>
              </div>
              <div className="delivery-grid-5">
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
                    color: "#63B3ED",
                  },
                  {
                    label: "Commission",
                    value: `${p.commission || Math.round(p.price * 0.2 * 100) / 100}€`,
                    color: "#F6AD55",
                  },
                ].map((s, j) => (
                  <div key={j} className="stat-chip">
                    <div className="stat-chip-label">{s.label}</div>
                    <div
                      className="stat-chip-value"
                      style={{ color: s.color || "var(--text)" }}
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
              </div>
            </div>
          ))
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
      {users.map((u, i) => (
        <div
          key={i}
          className="table-row"
          style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "var(--bg3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                color: "var(--primary)",
                fontWeight: "700",
                flexShrink: 0,
              }}
            >
              {u.firstName?.[0]}
              {u.lastName?.[0]}
            </div>
            <div>
              <div style={{ color: "var(--text)", fontSize: "12px" }}>
                {u.firstName} {u.lastName}
              </div>
              <div style={{ color: "var(--text3)", fontSize: "10px" }}>
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
          <div style={{ color: "var(--text2)" }}>{u.phone}</div>
          <div style={{ color: "var(--text3)" }}>
            {new Date(u.createdAt).toLocaleDateString("fr-FR")}
          </div>
        </div>
      ))}
    </div>
  );

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
            color: "#63B3ED",
          },
          {
            label: "Commissions",
            value: `${revenue.reduce((s, r) => s + r.totalCommission, 0).toFixed(2)}€`,
            color: "#48BB78",
          },
          {
            label: "Transactions",
            value: revenue.reduce((s, r) => s + r.count, 0),
            color: "#F6AD55",
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
        <div className="chart-title">Évolution des revenus — 30 jours</div>
        {revenue.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenue}>
              <defs>
                <linearGradient id="gRev2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#63B3ED" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#63B3ED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="_id"
                tick={{ fill: "var(--text3)", fontSize: 10 }}
                tickFormatter={(v) => v.slice(5)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--text3)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip {...tooltipStyle} formatter={(v) => `${v}€`} />
              <Area
                type="monotone"
                dataKey="totalRevenue"
                stroke="#63B3ED"
                fill="url(#gRev2)"
                strokeWidth={2}
                name="Revenus"
              />
              <Area
                type="monotone"
                dataKey="totalCommission"
                stroke="#48BB78"
                fill="none"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                name="Commission"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty" style={{ height: "280px" }}>
            Pas encore de données
          </div>
        )}
      </div>
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
              style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}
            >
              <div style={{ color: "var(--text)" }}>{r._id}</div>
              <div>{r.count}</div>
              <div style={{ color: "#63B3ED" }}>{r.totalRevenue}€</div>
              <div style={{ color: "#48BB78" }}>{r.totalCommission}€</div>
            </div>
          ))}
      </div>
    </>
  );

  const renderReviews = () => {
    const avg =
      reviews.length > 0
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(
            1,
          )
        : "—";
    return (
      <>
        <div
          className="kpi-grid"
          style={{ gridTemplateColumns: "repeat(4,1fr)" }}
        >
          {[
            { label: "Évaluations", value: reviews.length, color: "#63B3ED" },
            { label: "Note moyenne", value: `${avg} / 5`, color: "#F6AD55" },
            {
              label: "À temps",
              value: reviews.filter((r) => r.onTime).length,
              color: "#48BB78",
            },
            {
              label: "Endommagés",
              value: reviews.filter((r) => r.damaged).length,
              color: "#FC8181",
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
        <div className="table-card">
          <div className="chart-title">
            Toutes les évaluations ({reviews.length})
          </div>
          {reviews.length === 0 ? (
            <div className="chart-empty">Aucune évaluation</div>
          ) : (
            reviews.map((r, i) => (
              <div key={i} className="delivery-card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <div className="stars">
                      {"★".repeat(r.rating)}
                      {"☆".repeat(5 - r.rating)}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "var(--text3)",
                        marginTop: "3px",
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
                      color: "#F6AD55",
                    }}
                  >
                    {r.rating}/5
                  </div>
                </div>
                <div className="delivery-grid-2">
                  <div className="info-block">
                    <div className="info-block-label">👤 Client</div>
                    <div className="info-block-name">
                      {r.clientId?.firstName} {r.clientId?.lastName}
                    </div>
                  </div>
                  <div className="info-block">
                    <div className="info-block-label">🚗 Livreur</div>
                    <div className="info-block-name">
                      {r.delivererId?.firstName} {r.delivererId?.lastName}
                    </div>
                  </div>
                </div>
                <div className="delivery-grid-4" style={{ marginTop: "10px" }}>
                  {[
                    { label: "À temps", value: r.onTime },
                    { label: "Endommagé", value: r.damaged },
                    { label: "Bien reçu", value: r.wellReceived },
                    { label: "Soucis", value: r.hadIssues },
                  ].map((item, j) => (
                    <div key={j} className="stat-chip">
                      <div className="stat-chip-label">{item.label}</div>
                      <div
                        className="stat-chip-value"
                        style={{ color: item.value ? "#48BB78" : "#FC8181" }}
                      >
                        {item.value ? "Oui" : "Non"}
                      </div>
                    </div>
                  ))}
                </div>
                {r.comment && (
                  <div className="info-block" style={{ marginTop: "10px" }}>
                    <div className="info-block-label">💬 Commentaire</div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text2)",
                        fontStyle: "italic",
                        marginTop: "4px",
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

  const renderMessages = () => (
    <div className="table-card">
      <div className="chart-title">Messagerie — aperçu</div>
      <div className="chart-empty">Les conversations apparaissent ici</div>
    </div>
  );

  const pages = {
    overview: renderOverview,
    deliveries: renderDeliveries,
    announcements: renderAnnouncements,
    users: renderUsers,
    revenue: renderRevenue,
    analytics: renderAnalytics,
    reviews: renderReviews,
    messages: renderMessages,
  };

  return (
    <div className="app">
      <div className="sidebar">
        <div className="logo">
          <div className="logo-icon">
            <span>DC</span>
          </div>
          <span className="logo-text">DeliverConnect</span>
        </div>
        <nav className="nav">
          {NAV.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${page === item.id ? "active" : ""}`}
              onClick={() => setPage(item.id)}
              title={item.label}
            >
              {item.icon}
              <span className="nav-label">{item.label}</span>
              {item.badge && <div className="nav-badge" />}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="avatar-circle">AD</div>
          <div>
            <span className="sidebar-footer-name">Admin</span>
            <span className="sidebar-footer-role">Administrateur</span>
          </div>
        </div>
      </div>

      <div className="main">
        <div className="topbar">
          <div className="page-title">
            {NAV.find((n) => n.id === page)?.label}
          </div>
          <div className="topbar-right">
            <div className="live-badge">
              <div className="live-dot" /> En direct
            </div>
            <div className="theme-toggle" onClick={toggleTheme}>
              {theme === "dark" ? "☀️" : "🌙"}
            </div>
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
