import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase, supabaseConfigured } from "./lib/supabase.js";

const CONTACT_PHONE = "+447404517328";
const WHATSAPP_URL = "https://wa.me/447404517328";

const ASSET_META = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", mark: "₿", color: "#F7931A" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", mark: "Ξ", color: "#6877DE" },
  { id: "tether", symbol: "USDT", name: "Tether", mark: "₮", color: "#26A17B" },
  { id: "solana", symbol: "SOL", name: "Solana", mark: "◎", color: "#8A72E8" },
  { id: "ripple", symbol: "XRP", name: "XRP", mark: "✕", color: "#8292A6" },
];

const COUNTRIES = ["United States", "Uganda", "United Kingdom", "Kenya", "Nigeria", "Ghana", "Tanzania", "Rwanda", "South Africa", "Canada", "India", "Other"];
const US_STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","District of Columbia","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"];

function money(value, digits = 2) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}
function compactMoney(value) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 }).format(value);
}
function shortNumber(value, max = 6) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: max }).format(value);
}
function changeText(value) {
  if (!Number.isFinite(value)) return "—";
  return (value > 0 ? "+" : "") + value.toFixed(2) + "%";
}

function authErrorMessage(error, fallback) {
  const message = String(error?.message || "").trim();
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "Email or password is incorrect. If you just registered, confirm your email address before signing in.";
  }
  if (lower.includes("email not confirmed") || lower.includes("email address not confirmed")) {
    return "Please open the email confirmation link we sent you, then return here to sign in.";
  }
  if (lower.includes("user already registered")) {
    return "An account with this email already exists. Sign in instead, or use Forgot password to recover access.";
  }
  if (lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("fetch failed") || lower.includes("network request failed") || lower.includes("load failed")) {
    return "GROEarnX could not reach its account server. Check the production Supabase URL/key and allowed redirect URLs, then retry. No account change was confirmed.";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Too many attempts were made. Wait a little before trying again.";
  }
  return message || fallback;
}

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
    chart: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="m6 15 4-4 3 2 5-7" /></>,
    wallet: <><rect x="3" y="6" width="18" height="14" rx="2.4" /><path d="M3 9V5a2 2 0 0 1 2-2h13" /><path d="M16 13h5v4h-5a2 2 0 0 1 0-4Z" /></>,
    activity: <><path d="M3 12h4l3-7 4 14 3-7h4" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19 13.5 1.4 1.1-1.4 2.4-1.7-.6a7 7 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a7 7 0 0 1-1.6-.9l-1.7.6-1.4-2.4L5 13.5a7 7 0 0 1 0-1.9l-1.4-1.1L5 8.1l1.7.6a7 7 0 0 1 1.6-.9l.3-1.8h2.8l.3 1.8a7 7 0 0 1 1.6.9l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.9Z" /></>,
    arrowUp: <><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></>,
    arrowDown: <><path d="M12 5v14" /><path d="m5 12 7 7 7-7" /></>,
    arrowRight: <><path d="M4 12h15" /><path d="m13 5 7 7-7 7" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    lock: <><rect x="4.5" y="10" width="15" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    eye: <><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    close: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
    refresh: <><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M5.4 9A7 7 0 0 1 17 5l3 7" /><path d="M4 12l3 7a7 7 0 0 0 11.6-4" /></>,
    menu: <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" /></>,
    external: <><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></>,
  };
  return <svg {...common}>{paths[name] || paths.grid}</svg>;
}

function Brand({ compact = false, onClick }) {
  return <button className={"brand" + (compact ? " brand-compact" : "")} onClick={onClick} aria-label="GROEarnX home">
    <span className="brand-mark"><span className="brand-g">G</span><i /></span>
    {!compact && <span className="brand-word">GRO<span>EarnX</span><small>CRYPTO &amp; DIGITAL ASSETS</small></span>}
  </button>;
}

function CoinMark({ coin, size = "md" }) {
  return <span className={"coin-mark coin-" + coin.symbol.toLowerCase() + " " + size} style={{ "--coin": coin.color }}>{coin.mark}</span>;
}

function Sparkline({ values = [], color = "#159B71", width = 112, height = 42, fill = false }) {
  if (!Array.isArray(values) || values.length < 2) return <div className="sparkline-empty" aria-label="Price history unavailable">—</div>;
  const points = values;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const coords = points.map((v, i) => (i * (width - 4)) / (points.length - 1) + 2 + "," + (height - 3 - ((v - min) / span) * (height - 7))).join(" ");
  const area = "2," + (height - 1) + " " + coords + " " + (width - 2) + "," + (height - 1);
  return <svg className="sparkline" viewBox={"0 0 " + width + " " + height} role="img" aria-label="Historical crypto price trend">
    {fill && <polygon points={area} fill={color} opacity=".10" />}
    <polyline points={coords} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

function PriceChange({ value }) {
  if (!Number.isFinite(value)) return <span className="change unavailable">—</span>;
  return <span className={"change " + (value >= 0 ? "positive" : "negative")}>{value >= 0 ? "↗" : "↘"} {changeText(value)}</span>;
}

function TradingChart({ values = [], color = "#159B71" }) {
  if (!Array.isArray(values) || values.length < 3) return <div className="chart-unavailable">Price history is unavailable for this asset.</div>;
  const width = 940, height = 260, top = 12, bottom = 24;
  const data = values;
  const min = Math.min(...data), max = Math.max(...data), span = max-min || 1;
  const pts = data.map((v,i)=>({x:8+i*((width-16)/Math.max(1,data.length-1)),y:top+(1-(v-min)/span)*(height-top-bottom)}));
  const line = pts.map(p=>p.x.toFixed(1)+","+p.y.toFixed(1)).join(" ");
  const area = "M "+pts[0].x+" "+(height-bottom)+" L "+pts.map(p=>p.x+" "+p.y).join(" L ")+" L "+pts[pts.length-1].x+" "+(height-bottom)+" Z";
  return <svg className="trading-chart-svg" viewBox={"0 0 "+width+" "+height} preserveAspectRatio="none" role="img" aria-label="Historical crypto price trend">
    <defs><linearGradient id="tradeChartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".22"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
    {[0,1,2,3,4].map(i=><line key={i} x1="0" x2={width} y1={top+i*((height-top-bottom)/4)} y2={top+i*((height-top-bottom)/4)} stroke="#e9eef4" strokeDasharray="4 6"/>)}
    <path d={area} fill="url(#tradeChartFill)"/><polyline points={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
    <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="5" fill={color} stroke="white" strokeWidth="2"/>
    <g fill="#91a0b1" fontSize="11"><text x="8" y={height-5}>7 days ago</text><text x={width/2} y={height-5} textAnchor="middle">Price history</text><text x={width-8} y={height-5} textAnchor="end">Latest</text></g>
  </svg>;
}

function App() {
  const [view, setView] = useState("home");
  const [authUser, setAuthUser] = useState(null);
  const [mfaAccessGranted, setMfaAccessGranted] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [walletBalances, setWalletBalances] = useState({});
  const [balancesStatus, setBalancesStatus] = useState("idle");
  const [feesLoadError, setFeesLoadError] = useState("");
  const [wallets, setWallets] = useState([]);
  const [portfolioHistory, setPortfolioHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [investmentPlans, setInvestmentPlans] = useState([]);
  const [feeSchedules, setFeeSchedules] = useState([]);
  const [mfaFactors, setMfaFactors] = useState([]);
  const [mfaSetup, setMfaSetup] = useState(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaLogin, setMfaLogin] = useState(null);
  const [passwordRecoveryActive, setPasswordRecoveryActive] = useState(false);
  const explicitAuthFlowRef = useRef(false);
  const [mfaBusy, setMfaBusy] = useState(false);
  const [adminRequests, setAdminRequests] = useState([]);
  const [adminProfiles, setAdminProfiles] = useState([]);
  const [verificationQueue, setVerificationQueue] = useState([]);
  const [adminUserCount, setAdminUserCount] = useState(null);
  const [adminDataWarning, setAdminDataWarning] = useState("");
  const [financialReadiness, setFinancialReadiness] = useState(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [readinessRefresh, setReadinessRefresh] = useState(0);
  const [legalPage, setLegalPage] = useState(null);
  const [tab, setTab] = useState("Overview");
  const [market, setMarket] = useState([]);
  const [marketStatus, setMarketStatus] = useState("unavailable");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [marketRefresh, setMarketRefresh] = useState(0);
  const [dashboardRefresh, setDashboardRefresh] = useState(0);
  const [accountDataLoading, setAccountDataLoading] = useState(false);
  const [accountDataUpdatedAt, setAccountDataUpdatedAt] = useState(null);
  const [accountDataWarning, setAccountDataWarning] = useState("");
  const [tradePair, setTradePair] = useState("bitcoin");
  const [showBalances, setShowBalances] = useState(true);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = window.localStorage.getItem("groearnx-watchlist");
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed.filter(id => ASSET_META.some(asset => asset.id === id)) : ["bitcoin", "ethereum", "solana"];
    } catch {
      return ["bitcoin", "ethereum", "solana"];
    }
  });
  const [transactions, setTransactions] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [supportBusy, setSupportBusy] = useState(false);
  const [profile, setProfile] = useState({ name: "", email: "", country: "", stateRegion: "", phone: "", kycStatus: "not_started" });

  useEffect(() => {
    let alive = true;
    async function loadMarket() {
      try {
        const ids = "bitcoin,ethereum,tether,solana,ripple";
        const response = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=" + ids + "&order=market_cap_desc&per_page=5&page=1&sparkline=true&price_change_percentage=24h", { headers: { accept: "application/json" } });
        if (!response.ok) throw new Error("Market feed unavailable");
        const data = await response.json();
        const meta = Object.fromEntries(ASSET_META.map(c => [c.id, { ...c, spark: [] }]));
        const rows = data.map(item => {
          const base = meta[item.id];
          if (!base || !Number.isFinite(item.current_price)) return null;
          const raw = item.sparkline_in_7d && item.sparkline_in_7d.price;
          const spark = Array.isArray(raw) && raw.length > 1 ? raw.filter((_, i) => i % Math.max(1, Math.floor(raw.length / 24)) === 0).slice(-24) : [];
          return { ...base, price: item.current_price, change: Number.isFinite(item.price_change_percentage_24h) ? item.price_change_percentage_24h : null, marketCap: Number.isFinite(item.market_cap) ? item.market_cap : null, volume24h: Number.isFinite(item.total_volume) ? item.total_volume : null, high24h: Number.isFinite(item.high_24h) ? item.high_24h : null, low24h: Number.isFinite(item.low_24h) ? item.low_24h : null, spark };
        }).filter(Boolean);
        if (alive && rows.length >= 3) {
          setMarket(rows);
          setMarketStatus("live");
          setLastUpdated(new Date());
        } else if (alive) { setMarket([]); setMarketStatus("unavailable"); }
      } catch {
        if (alive) { setMarket([]); setMarketStatus("unavailable"); }
      }
    }
    loadMarket();
    const interval = window.setInterval(loadMarket, 60000);
    return () => { alive = false; window.clearInterval(interval); };
  }, [marketRefresh]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 4200);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    try {
      window.localStorage.setItem("groearnx-watchlist", JSON.stringify(watchlist));
    } catch {
      // Browser storage can be unavailable in private or restricted contexts.
    }
  }, [watchlist]);

  const coinById = useMemo(() => Object.fromEntries(market.map(c => [c.id, c])), [market]);
  const portfolioRows = useMemo(() => ASSET_META.map(asset => {
    const quote = market.find(coin => coin.id === asset.id);
    const units = balancesStatus === "available" ? Number(walletBalances[asset.symbol] || walletBalances[asset.id] || 0) : NaN;
    const price = Number.isFinite(quote?.price) ? quote.price : null;
    const change = Number.isFinite(quote?.change) ? quote.change : null;
    const value = price === null || !Number.isFinite(units) ? null : price * units;
    const divisor = change === null ? null : 1 + change / 100;
    const previousValue = value === null || divisor === null || divisor <= 0 ? null : value / divisor;
    return { ...asset, ...(quote || {}), price, change, units, value, previousValue };
  }), [market, walletBalances, balancesStatus]);
  const knownBalanceCodes = useMemo(() => new Set(ASSET_META.flatMap(asset => [asset.symbol.toUpperCase(), asset.id.toUpperCase()])), []);
  const unpricedBalanceRows = useMemo(() => Object.entries(walletBalances)
    .filter(([assetCode, units]) => Number.isFinite(Number(units)) && Number(units) > 0 && !knownBalanceCodes.has(assetCode.toUpperCase()))
    .map(([assetCode, units]) => ({ assetCode, units: Number(units) })), [walletBalances, knownBalanceCodes]);
  const completeValuation = balancesStatus === "available" && unpricedBalanceRows.length === 0 && portfolioRows.length > 0 && portfolioRows.every(coin => Number.isFinite(coin.value));
  const portfolioValue = completeValuation ? portfolioRows.reduce((sum, coin) => sum + coin.value, 0) : NaN;
  const completePreviousValuation = portfolioRows.length > 0 && portfolioRows.every(coin => Number.isFinite(coin.previousValue));
  const previousValue = completePreviousValuation ? portfolioRows.reduce((sum, coin) => sum + coin.previousValue, 0) : NaN;
  const dailyChange = Number.isFinite(portfolioValue) && Number.isFinite(previousValue) ? portfolioValue - previousValue : NaN;
  const dailyChangePct = Number.isFinite(previousValue) && previousValue !== 0 && Number.isFinite(dailyChange) ? (dailyChange / previousValue) * 100 : NaN;
  const isAdmin = authUser?.app_metadata?.role === "admin";
  const memberName = profile.name || authUser?.user_metadata?.display_name || authUser?.email?.split("@")[0] || "Account holder";
  const memberInitials = memberName.split(/\s+/).slice(0,2).map(s=>s[0] || "").join("").toUpperCase() || "GX";

  function notify(text) { setToast(text); }
  function openAuth(which) { setView(which); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function requireSignIn() {
    notify("Sign in or create an account to access your personal dashboard.");
    openAuth("signin");
  }
  async function signIn(e) {
    e.preventDefault();
    if (!supabaseConfigured) {
      notify("Account service configuration is missing. The site owner must configure the production Supabase URL and publishable key.");
      return;
    }
    const form = e.currentTarget;
    explicitAuthFlowRef.current = true;
    setAuthBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.elements.email.value.trim(),
        password: form.elements.password.value,
      });
      if (error) {
        notify(authErrorMessage(error, "Sign-in failed. Please try again."));
        return;
      }
      if (!data?.user) {
        notify("The account server did not return a signed-in user. Please retry.");
        return;
      }
      setAuthUser(data.user);
      setMfaAccessGranted(false);
      setProfile(p => ({ ...p, email: data.user.email || "", name: data.user.user_metadata?.display_name || "", country: data.user.user_metadata?.country || "", stateRegion: data.user.user_metadata?.state_region || "" }));

      const { data: factorData, error: factorError } = await supabase.auth.mfa.listFactors();
      if (factorError) {
        setView("dashboard");
        setTab("Security");
        notify("You signed in, but the account security status could not be checked. Refresh and try again before opening private account data.");
        return;
      }
      const factors = [...(factorData?.totp || []), ...(factorData?.phone || [])];
      setMfaFactors(factors);
      const verifiedTotp = factorData?.totp?.find(factor => factor.status === "verified");
      if (verifiedTotp) {
        const challenge = await supabase.auth.mfa.challenge({ factorId: verifiedTotp.id });
        if (challenge.error || !challenge.data?.id) {
          setView("dashboard");
          setTab("Security");
          notify("You signed in, but the authenticator challenge could not be started. Open Security and retry.");
          return;
        }
        setMfaLogin({ factorId: verifiedTotp.id, challengeId: challenge.data.id });
        setMfaCode("");
        setView("mfaChallenge");
        notify("Enter the current code from your authenticator app.");
        return;
      }
      setView("dashboard");
      setTab("Security");
      notify("Sign-in successful. Set up and verify an authenticator to unlock private account information.");
    } catch (error) {
      notify(authErrorMessage(error, "Sign-in could not be completed. Check your connection and try again."));
    } finally {
      explicitAuthFlowRef.current = false;
      setAuthBusy(false);
    }
  }

  async function signUp(e) {
    e.preventDefault();
    if (!supabaseConfigured) {
      notify("Account service configuration is missing. The site owner must configure the production Supabase URL and publishable key.");
      return;
    }
    const form = e.currentTarget;
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;
    const displayName = form.elements.fullName.value.trim();
    const country = form.elements.country.value;
    const stateRegion = country === "United States" ? (form.elements.stateRegion?.value || "") : "";
    explicitAuthFlowRef.current = true;
    setAuthBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: displayName, country, state_region: stateRegion },
        },
      });
      if (error) {
        notify(authErrorMessage(error, "Account creation failed. Please check your details and retry."));
        return;
      }
      if (!data?.user) {
        notify("The account server did not confirm account creation. Please retry before signing in.");
        return;
      }
      setProfile(p => ({ ...p, name: displayName, email, country, stateRegion }));
      if (data.session && data.user) {
        setAuthUser(data.user);
        setMfaAccessGranted(false);
        setView("dashboard");
        setTab("Security");
        notify("Account created. Set up and verify an authenticator before accessing private account information.");
      } else {
        setView("signin");
        notify("Account created. Check your inbox (and spam folder) for the confirmation link. Then return to sign in.");
      }
    } catch (error) {
      notify(authErrorMessage(error, "Account creation could not be completed. Check your connection and try again."));
    } finally {
      explicitAuthFlowRef.current = false;
      setAuthBusy(false);
    }
  }
  async function verifyMfaLogin(e) {
    e.preventDefault();
    if (!mfaLogin) return;
    setMfaBusy(true);
    try {
      const { error } = await supabase.auth.mfa.verify({ factorId: mfaLogin.factorId, challengeId: mfaLogin.challengeId, code: mfaCode.trim() });
      if (error) {
        notify("Authenticator verification failed. Check that the code is current and try again.");
        return;
      }
      setMfaLogin(null);
      setMfaCode("");
      setMfaAccessGranted(true);
      setView("dashboard");
      setTab("Overview");
      notify("Two-factor verification complete.");
    } catch (error) {
      notify(authErrorMessage(error, "The authenticator service could not be reached. Check your connection and try again."));
    } finally {
      setMfaBusy(false);
    }
  }

  async function beginMfaEnrollment() {
    setMfaBusy(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "GROEarnX authenticator" });
      if (error) {
        notify(authErrorMessage(error, "Authenticator setup could not be started."));
        return;
      }
      if (!data?.id || !data?.totp?.qr_code || !data?.totp?.secret) {
        notify("The account server did not return the authenticator setup details. Please retry.");
        return;
      }
      setMfaSetup({ id: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret, uri: data.totp.uri });
      setMfaCode("");
      notify("Scan the QR code with an authenticator app, then verify a current code.");
    } catch (error) {
      notify(authErrorMessage(error, "Authenticator setup could not be started. Check the connection and retry."));
    } finally {
      setMfaBusy(false);
    }
  }

  async function verifyMfaEnrollment(e) {
    e.preventDefault();
    if (!mfaSetup) return;
    setMfaBusy(true);
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId: mfaSetup.id });
      if (challenge.error || !challenge.data?.id) {
        notify(authErrorMessage(challenge.error, "The authenticator verification challenge could not be created."));
        return;
      }
      const { error } = await supabase.auth.mfa.verify({ factorId: mfaSetup.id, challengeId: challenge.data.id, code: mfaCode.trim() });
      if (error) {
        notify("That code could not be verified. Check your device clock and try again.");
        return;
      }
      setMfaSetup(null);
      setMfaCode("");
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.error) {
        setMfaAccessGranted(false);
        setTab("Security");
        notify("Authenticator verification succeeded, but the factor list could not refresh. Reload Security before continuing.");
        return;
      }
      setMfaFactors([...(factors.data?.totp || []), ...(factors.data?.phone || [])]);
      const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assuranceError) {
        setMfaAccessGranted(false);
        setTab("Security");
        notify("Authenticator enrolled. Refresh the security status before accessing account data.");
        return;
      }
      if (assurance?.currentLevel === "aal2") {
        setMfaAccessGranted(true);
        setView("dashboard");
        setTab("Overview");
        notify("Two-factor authentication is enabled and verified.");
      } else {
        setMfaAccessGranted(false);
        setTab("Security");
        notify("Authenticator enrolled. Complete MFA verification to unlock account information.");
      }
    } catch (error) {
      notify(authErrorMessage(error, "Authenticator verification could not be completed. Refresh Security and try again."));
    } finally {
      setMfaBusy(false);
    }
  }
  async function removeMfaFactor(factorId) {
    setMfaBusy(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) {
        notify(authErrorMessage(error, "The authenticator could not be removed."));
        return;
      }
      setMfaAccessGranted(false);
      const { error: refreshError } = await supabase.auth.refreshSession();
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.error) {
        setMfaFactors([]);
        notify("Authenticator was removed, but the factor list could not refresh. Reload Security and verify the current status.");
        return;
      }
      const refreshedFactors = [...(factors.data?.totp || []), ...(factors.data?.phone || [])];
      setMfaFactors(refreshedFactors);
      if (refreshError) {
        await supabase.auth.signOut();
        setAuthUser(null);
        setMfaAccessGranted(false);
        setView("home");
        notify("Authenticator removed. Sign in again to establish a fresh secure session.");
        return;
      }
      const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assuranceError) {
        setTab("Security");
        notify("Authenticator was removed. Refresh Security before accessing private account information.");
        return;
      }
      const verifiedRemaining = refreshedFactors.some(f=>f.status==="verified");
      setMfaAccessGranted(assurance?.currentLevel==="aal2" && verifiedRemaining);
      setTab("Security");
      notify(verifiedRemaining ? "Authenticator updated. Verify MFA again to access account information." : "Authenticator removed. Set up and verify MFA before accessing account information.");
    } catch (error) {
      notify(authErrorMessage(error, "The authenticator could not be removed. Check your connection and retry."));
    } finally {
      setMfaBusy(false);
    }
  }
  async function markNotificationRead(notificationId) {
    if (!authUser || !mfaAccessGranted) {
      notify("Verify your authenticator before changing private account notifications.");
      return;
    }
    try {
      const readAt = new Date().toISOString();
      const { error } = await supabase.from("notifications").update({ read_at: readAt }).eq("id", notificationId).eq("user_id", authUser.id);
      if (error) {
        notify(authErrorMessage(error, "The notification could not be marked as read."));
        return;
      }
      setNotifications(items => items.map(item => item.id === notificationId ? { ...item, read_at: readAt } : item));
    } catch (error) {
      notify(authErrorMessage(error, "The notification could not be marked as read. Please retry."));
    }
  }
  async function submitSupportTicket(e) {
    e.preventDefault();
    if (!authUser || !mfaAccessGranted) {
      notify("Verify your authenticator before contacting account support.");
      return;
    }
    const form = e.currentTarget;
    const payload = {
      user_id: authUser.id,
      category: form.elements.category.value,
      subject: form.elements.subject.value.trim(),
      message: form.elements.message.value.trim(),
    };
    if (payload.subject.length < 4 || payload.message.length < 10) {
      notify("Enter a subject of at least 4 characters and a message of at least 10 characters.");
      return;
    }
    setSupportBusy(true);
    try {
      const { data, error } = await supabase.from("support_tickets")
        .insert(payload)
        .select("id,user_id,category,subject,message,status,admin_response,created_at,updated_at")
        .single();
      if (error) {
        notify(authErrorMessage(error, "Your support request could not be saved. Please retry."));
        return;
      }
      if (data) setSupportTickets(items => [data, ...items.filter(item => item.id !== data.id)].slice(0, 100));
      form.reset();
      notify("Support request saved. You can track its status below.");
    } catch (error) {
      notify(authErrorMessage(error, "Your support request could not be saved. Please retry."));
    } finally {
      setSupportBusy(false);
    }
  }

  async function updateSupportTicket(ticketId, e) {
    e.preventDefault();
    if (!isAdmin || !mfaAccessGranted) {
      notify("Administrator access with verified MFA is required.");
      return;
    }
    const form = e.currentTarget;
    const status = form.elements.status.value;
    const adminResponse = form.elements.adminResponse.value.trim();
    setSupportBusy(true);
    try {
      const { data, error } = await supabase.from("support_tickets")
        .update({ status, admin_response: adminResponse || null, resolved_at: ["resolved", "closed"].includes(status) ? new Date().toISOString() : null })
        .eq("id", ticketId)
        .select("id,user_id,category,subject,message,status,admin_response,created_at,updated_at")
        .single();
      if (error) {
        notify(authErrorMessage(error, "The support ticket could not be updated."));
        return;
      }
      setSupportTickets(items => items.map(item => item.id === ticketId ? data : item));
      notify("Support ticket updated.");
    } catch (error) {
      notify(authErrorMessage(error, "The support ticket could not be updated."));
    } finally {
      setSupportBusy(false);
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    if (!authUser || !mfaAccessGranted) {
      notify("Verify your authenticator before updating profile details.");
      return;
    }
    const form = e.currentTarget;
    const updates = {
      display_name: form.elements.displayName.value.trim(),
      country: form.elements.country.value,
      state_region: form.elements.country.value === "United States" ? (form.elements.stateRegion?.value || "") : "",
      phone: form.elements.phone.value.trim(),
    };
    if (!updates.display_name || updates.display_name.length > 100) {
      notify("Enter a display name between 1 and 100 characters.");
      return;
    }
    const stateRegion = updates.country === "United States" ? (form.elements.stateRegion?.value || "") : "";
    setAuthBusy(true);
    try {
      const { error } = await supabase.from("profiles").update(updates).eq("id", authUser.id);
      if (error) {
        notify(authErrorMessage(error, "Profile changes could not be saved."));
        return;
      }
      const { error: metadataError } = await supabase.auth.updateUser({ data: { display_name: updates.display_name, country: updates.country, state_region: stateRegion } });
      if (metadataError) {
        notify("Profile fields were saved, but Auth metadata did not sync. Refresh the page before changing these fields again.");
        return;
      }
      setProfile(p => ({ ...p, name: updates.display_name, country: updates.country, stateRegion, phone: updates.phone }));
      notify("Profile updated.");
    } catch (error) {
      notify(authErrorMessage(error, "Profile changes could not be saved. Please retry."));
    } finally {
      setAuthBusy(false);
    }
  }
  async function resetPassword() {
    const email = profile.email.trim();
    if (!email) { notify("Enter your email address first, then select Forgot password."); return; }
    setAuthBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      notify(error ? authErrorMessage(error, "Password reset could not be requested.") : "If that account exists, a password reset email has been sent. Open it on this same site to choose a new password.");
    } catch (error) {
      notify(authErrorMessage(error, "Password reset could not be requested. Check your connection and try again."));
    } finally {
      setAuthBusy(false);
    }
  }

  async function completePasswordReset(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const newPassword = form.elements.newPassword.value;
    const confirmPassword = form.elements.confirmPassword.value;
    if (newPassword.length < 8) {
      notify("Choose a password with at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      notify("The two passwords do not match.");
      return;
    }
    setAuthBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        notify(authErrorMessage(error, "The password could not be updated. Reopen the latest reset link and try again."));
        return;
      }
      await supabase.auth.signOut();
      setPasswordRecoveryActive(false);
      setAuthUser(null);
      setMfaAccessGranted(false);
      setView("signin");
      setTab("Overview");
      notify("Password updated successfully. Sign in using your new password.");
    } catch (error) {
      notify(authErrorMessage(error, "The password could not be updated. Reopen the latest reset link and try again."));
    } finally {
      setAuthBusy(false);
    }
  }
  async function signOut() {
    setAuthBusy(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        notify(authErrorMessage(error, "Sign out could not be completed."));
        return;
      }
      setAuthUser(null);
      setMfaAccessGranted(false);
      setWalletBalances({});
      setBalancesStatus("idle");
      setFeesLoadError("");
      setWallets([]);
      setPortfolioHistory([]);
      setNotifications([]);
      setTransactions([]);
      setSupportTickets([]);
      setView("home");
      setTab("Overview");
      notify("You have signed out.");
    } catch (error) {
      notify(authErrorMessage(error, "Sign out could not be completed. Check your connection and retry."));
    } finally {
      setAuthBusy(false);
    }
  }
  useEffect(() => {
    if (!supabaseConfigured) return;
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active || error || !data.session?.user) return;
      const user = data.session.user;
      setAuthUser(user);
      setProfile(p => ({ ...p, email: user.email || "", name: user.user_metadata?.display_name || "", country: user.user_metadata?.country || "", stateRegion: user.user_metadata?.state_region || "" }));
      window.setTimeout(async () => {
        try {
          const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (!active) return;
          if (assuranceError) throw assuranceError;
          if (assurance?.currentLevel === "aal2") {
            setMfaAccessGranted(true);
            setView("dashboard");
            setTab("Overview");
          } else {
            setMfaAccessGranted(false);
            const factors = await supabase.auth.mfa.listFactors();
            if (!active) return;
            if (factors.error) throw factors.error;
            setMfaFactors([...(factors.data?.totp || []), ...(factors.data?.phone || [])]);
            setView("dashboard");
            setTab("Security");
          }
        } catch (error) {
          if (!active) return;
          setMfaAccessGranted(false);
          setView("dashboard");
          setTab("Security");
          notify(authErrorMessage(error, "The account security status could not be checked. Reopen Security and retry."));
        }
      }, 0);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      setAuthUser(session?.user || null);
      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecoveryActive(true);
        setMfaAccessGranted(false);
        return;
      }
      // Email-confirmation links can create a session without a sign-in form submission.
      // Route those sessions to the dashboard, while keeping the explicit MFA challenge flow intact.
      if (event === "SIGNED_IN" && !explicitAuthFlowRef.current) {
        setView("dashboard");
        setTab("Security");
      }
      if (!session?.user) {
        setMfaAccessGranted(false);
        return;
      }
      // Defer Auth API calls out of onAuthStateChange to avoid session-lock contention.
      window.setTimeout(async () => {
        try {
          const { data: assurance, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (!active) return;
          if (error) throw error;
          const allowed = assurance?.currentLevel === "aal2";
          setMfaAccessGranted(allowed);
          if (!allowed && event !== "SIGNED_IN") {
            setTab("Security");
          }
        } catch (error) {
          if (!active) return;
          setMfaAccessGranted(false);
          setTab("Security");
          notify(authErrorMessage(error, "The security level could not be checked. Refresh Security before opening private account data."));
        }
      }, 0);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!supabaseConfigured || !authUser || !mfaAccessGranted) {
      setAccountDataLoading(false);
      return;
    }
    let active = true;
    let inFlight = false;
    async function loadAccountData() {
      if (inFlight) return;
      inFlight = true;
      if (active) {
        setAccountDataLoading(true);
        setBalancesStatus(current => current === "available" ? current : "loading");
      }
      try {
        setFeesLoadError("");
        const [p, tx, balance, walletResult, history, notif, plans, factors, fees] = await Promise.all([
          supabase.from("profiles").select("display_name,country,state_region,phone,kyc_status").eq("id", authUser.id).maybeSingle(),
          supabase.from("transaction_requests").select("id,request_type,asset_code,amount,status,created_at").eq("user_id", authUser.id).order("created_at", { ascending: false }).limit(100),
          supabase.rpc("get_my_asset_balances"),
          supabase.from("wallets").select("id,asset_code,network,deposit_address,provider_name,address_status,created_at").eq("user_id",authUser.id).order("created_at",{ascending:false}).limit(50),
          supabase.from("portfolio_snapshots").select("id,total_value_usd,captured_at,source").eq("user_id",authUser.id).order("captured_at",{ascending:false}).limit(90),
          supabase.from("notifications").select("id,category,title,body,read_at,created_at").eq("user_id", authUser.id).order("created_at", { ascending: false }).limit(50),
          supabase.from("investment_plans").select("id,name,description,asset_code,minimum_amount,maximum_amount,term_days,target_return_apr,return_type,fees_disclosure,risk_disclosure,terms_url").eq("active",true).eq("legally_reviewed",true),
          supabase.auth.mfa.listFactors(),
          supabase.from("fee_schedules").select("id,service_code,display_name,asset_code,network,country_code,fee_currency,fixed_fee,fee_percentage,minimum_amount,maximum_amount,daily_limit,monthly_limit,terms,active,legally_reviewed,effective_from").eq("active",true).eq("legally_reviewed",true).or("effective_from.is.null,effective_from.lte."+new Date().toISOString()).order("service_code"),
        ]);
        const ticketResult = await supabase.from("support_tickets").select("id,user_id,category,subject,message,status,admin_response,created_at,updated_at").eq("user_id", authUser.id).order("created_at", { ascending: false }).limit(50);
        if (!active) return;
        const queryResults = [p, tx, balance, walletResult, history, notif, plans, factors, fees, ticketResult];
        const partialFailure = queryResults.some(result => result?.error);
        setAccountDataWarning(partialFailure
          ? "One or more account sections did not update. Previously loaded records are kept where possible; use Refresh to retry."
          : "");
        if (balance.error) {
          setBalancesStatus("error");
          setWalletBalances({});
        } else if (Array.isArray(balance.data)) {
          setWalletBalances(Object.fromEntries(balance.data.filter(b => b?.asset_code).map(b => [b.asset_code.toUpperCase(), Number(b.balance)])));
          setBalancesStatus("available");
        } else {
          setBalancesStatus("error");
          setWalletBalances({});
        }
        if (fees.error) setFeesLoadError("The fee schedule could not be loaded. Do not assume any fees or limits are zero.");
        if (ticketResult.data) setSupportTickets(ticketResult.data);
        if (p.data) setProfile(prev => ({ ...prev, name: p.data.display_name || prev.name, country: p.data.country || prev.country, stateRegion: p.data.state_region || prev.stateRegion, phone: p.data.phone || "", kycStatus: p.data.kyc_status || "not_started" }));
        if (tx.data) setTransactions(tx.data.map(t => ({ id:t.id, type:t.request_type.replaceAll("_"," "), asset:t.asset_code, amount:Number(t.amount), unit:t.asset_code, date:new Date(t.created_at).toLocaleDateString("en-US",{month:"short",day:"2-digit",year:"numeric"}), status:t.status })));
        if (walletResult.data) setWallets(walletResult.data);
        if (history.data) setPortfolioHistory(history.data.slice().reverse());
        if (notif.data) setNotifications(notif.data);
        if (plans.data) setInvestmentPlans(plans.data);
        if (fees.data) setFeeSchedules(fees.data);
        if (factors.data) setMfaFactors([...(factors.data.totp || []), ...(factors.data.phone || [])]);
      } catch {
        if (active) {
          setBalancesStatus("error");
          setWalletBalances({});
          setFeesLoadError("The fee schedule could not be loaded. Do not assume any fees or limits are zero.");
          setAccountDataWarning("The dashboard could not refresh from the account service. Check your connection and use Refresh to retry.");
        }
      } finally {
        inFlight = false;
        if (active) {
          setAccountDataLoading(false);
          setAccountDataUpdatedAt(new Date());
        }
      }
    }
    loadAccountData();
    const interval = window.setInterval(loadAccountData, 30000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [authUser, mfaAccessGranted, dashboardRefresh]);
  useEffect(() => {
    if (!supabaseConfigured || !authUser || !mfaAccessGranted || !isAdmin || tab !== "Admin") return;
    let active = true;
    Promise.all([
      supabase.from("transaction_requests").select("id,user_id,request_type,asset_code,amount,status,created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("support_tickets").select("id,user_id,category,subject,message,status,admin_response,created_at,updated_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("profiles").select("id,display_name,country,state_region,kyc_status,created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("user_verifications").select("id,user_id,provider_name,provider_reference,status,created_at,updated_at").order("created_at", { ascending: false }).limit(100),
    ]).then(([requestResult, userResult, ticketResult, profilesResult, verificationResult]) => {
      if (!active) return;
      const failedSections = [
        requestResult.error && "transaction requests",
        userResult.error && "customer count",
        ticketResult.error && "support inbox",
        profilesResult.error && "customer list",
        verificationResult.error && "verification queue",
      ].filter(Boolean);
      setAdminDataWarning(failedSections.length
        ? "Some admin data could not be loaded (" + failedSections.join(", ") + "). The corresponding section may be incomplete; refresh and check admin permissions."
        : "");
      if (requestResult.data) setAdminRequests(requestResult.data);
      if (!userResult.error) setAdminUserCount(userResult.count ?? null);
      if (ticketResult.data) setSupportTickets(ticketResult.data);
      if (profilesResult.data) setAdminProfiles(profilesResult.data);
      if (verificationResult.data) setVerificationQueue(verificationResult.data);
    }).catch(() => {
      if (active) {
        setAdminDataWarning("The admin queues could not be loaded. Check the assigned admin role, MFA status, and database policies.");
        notify("The admin queue could not be loaded. Check the assigned admin role and database policies.");
      }
    });
    return () => { active = false; };
  }, [authUser, mfaAccessGranted, isAdmin, tab, dashboardRefresh]);

  useEffect(() => {
    if (!authUser || !mfaAccessGranted || !isAdmin || tab !== "Admin") return;
    let active = true;
    setReadinessLoading(true);
    setFinancialReadiness(current => ({ ...current, loading: true, error: null }));
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("financial-service-status");
        if (error) throw error;
        if (active) setFinancialReadiness(data);
      } catch (error) {
        if (active) setFinancialReadiness({ error: authErrorMessage(error, "Provider readiness could not be loaded.") });
      } finally {
        if (active) setReadinessLoading(false);
      }
    })();
    return () => { active = false; };
  }, [authUser, mfaAccessGranted, isAdmin, tab, readinessRefresh, dashboardRefresh]);

  function openRequest(direction) {
    setModal(direction === "withdraw" ? "withdraw" : "deposit");
  }

    function dashboardNav(nextTab) {
    if (!mfaAccessGranted && nextTab !== "Security") {
      setTab("Security");
      notify("Set up and verify an authenticator before accessing private account information.");
      setMenuOpen(false);
      return;
    }
    setTab(nextTab);
    setMenuOpen(false);
  }

  function renderHeader() {
    return <header className="site-header">
      <div className="header-inner">
        <Brand onClick={() => { setView("home"); setMenuOpen(false); }} />
        <nav className={"top-nav " + (menuOpen ? "show" : "")} aria-label="Main navigation">
          <button onClick={() => { setView("home"); setMenuOpen(false); }}>Markets</button>
          <button onClick={() => { setView("home"); setMenuOpen(false); document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }); }}>Platform</button>
          <button onClick={() => { setView("home"); setMenuOpen(false); document.getElementById("learn")?.scrollIntoView({ behavior: "smooth" }); }}>Learn</button>
        </nav>
        <div className="header-actions">
          <button className="btn btn-quiet header-login" onClick={() => openAuth("signin")}>Log in</button>
          <button className="btn btn-primary header-start" onClick={() => openAuth("signup")}>Get started <Icon name="arrowRight" size={15} /></button>
        </div>
        <button className="mobile-menu" aria-label="Toggle navigation" onClick={() => setMenuOpen(v => !v)}><Icon name="menu" /></button>
      </div>
    </header>;
  }

  function renderFooter() {
    return <footer className="site-footer">
      <div className="footer-main">
        <Brand onClick={() => { setView("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        <div className="footer-copy">Clearer crypto decisions start with better information.</div>
        <div className="footer-contact"><span>Support</span><a href={"tel:" + CONTACT_PHONE}>{CONTACT_PHONE}</a><a href={WHATSAPP_URL} target="_blank" rel="noreferrer">WhatsApp support <Icon name="external" size={13} /></a></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} GROEarnX. Digital assets involve risk.</span><span>Returns are not guaranteed.</span><span className="footer-legal"><a href="#terms" onClick={e=>{e.preventDefault();setLegalPage("Terms of Service");}}>Terms</a><a href="#privacy" onClick={e=>{e.preventDefault();setLegalPage("Privacy Policy");}}>Privacy</a><a href="#fees" onClick={e=>{e.preventDefault();setLegalPage("Fees");}}>Fees</a><a href="#risk" onClick={e=>{e.preventDefault();setLegalPage("Risk Disclosure");}}>Risk disclosure</a></span></div>
    </footer>;
  }

  function MarketTable({ rows }) {
    if (!Array.isArray(rows) || rows.length === 0) return <div className="empty-state"><Icon name="chart" size={24}/><b>Market prices are unavailable</b><span>The public market feed did not return fresh quotes. No substitute prices or synthetic trend lines are shown.</span></div>;
    return <div className="table-wrap"><table className="market-table">
      <thead><tr><th>Asset</th><th>Price</th><th>24h change</th><th>Market cap</th><th>7d trend</th><th /></tr></thead>
      <tbody>{rows.map(coin => <tr key={coin.id}>
        <td><div className="asset-cell"><CoinMark coin={coin} /><div><b>{coin.name}</b><small>{coin.symbol}</small></div></div></td>
        <td className="price-cell">{coin.price > 10 ? money(coin.price) : money(coin.price, 4)}</td>
        <td><PriceChange value={coin.change} /></td>
        <td className="muted-cell">{compactMoney(coin.marketCap)}</td>
        <td><Sparkline values={coin.spark} color={coin.change >= 0 ? "#159B71" : "#D65E70"} width={90} height={31} /></td>
        <td><button className={"watch-btn " + (watchlist.includes(coin.id) ? "active" : "")} title={watchlist.includes(coin.id) ? "Remove from watchlist" : "Add to watchlist"} onClick={() => setWatchlist(current => current.includes(coin.id) ? current.filter(id => id !== coin.id) : [...current, coin.id])}>{watchlist.includes(coin.id) ? "★" : "☆"}</button></td>
      </tr>)}</tbody>
    </table></div>;
  }

  function renderHome() {
    return <>{renderHeader()}
      <div className="market-ticker-bar"><div className="market-ticker-label"><span className="status-dot" /> MARKET WATCH</div><div className="market-ticker-items">{market.slice(0, 5).map(coin => <button key={coin.id} onClick={() => { setTradePair(coin.id); if (authUser) { setView("dashboard"); setTab("Trade"); } else openAuth("signin"); }}><span className="ticker-symbol">{coin.symbol}</span><b>{coin.price > 10 ? money(coin.price, 2) : money(coin.price, 4)}</b><PriceChange value={coin.change} /></button>)}</div></div>
      <main>
        <section className="hero-section">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="eyebrow"><span className="eyebrow-dot" /> CRYPTO, WITH CLARITY</span>
              <h1>Build your crypto<br className="desktop-br" /> outlook with <span>confidence.</span></h1>
              <p className="hero-subtitle">Track digital-asset prices and review your account information in one clear workspace.</p>
              <div className="hero-actions"><button className="btn btn-primary btn-lg" onClick={() => openAuth("signup")}>Create your account <Icon name="arrowRight" size={16} /></button><button className="btn btn-outline btn-lg" onClick={() => document.getElementById("markets")?.scrollIntoView({behavior:"smooth"})}>View markets <Icon name="chart" size={16} /></button></div>
              <div className="hero-trust"><span><Icon name="shield" size={15} /> Account security controls</span><span><Icon name="chart" size={15} /> Public market data</span></div>
            </div>
            <div className="hero-visual">
              <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
              <div className="float-pill pill-top"><span className="status-dot" /> Markets move. Stay informed.</div>
              <div className="hero-card">
                <div className="hero-card-head"><div><small>MARKET SNAPSHOT</small><span className="mini-live">{marketStatus === "live" ? "LIVE DATA" : "FEED UNAVAILABLE"}</span></div><span className="round-icon"><Icon name="chart" size={17} /></span></div>
                <div className="hero-total-label">Combined market cap · top 5 assets</div>
                <div className="hero-total">{marketStatus === "live" ? compactMoney(market.reduce((sum, c) => sum + c.marketCap, 0)) : "Market feed status"}</div>
                <div className="hero-total-meta"><span className="muted-cell">{marketStatus === "live" ? "Market data feed connected" : "Waiting for public market feed"}</span><span className="data-safe"><Icon name="shield" size={13} /> Data status shown</span></div>
                <div className="hero-chart"><Sparkline values={market[0]?.spark} color="#1CA77D" width={470} height={108} fill /></div>
                <div className="hero-chart-foot"><span>Recent market trend</span><span>{marketStatus === "live" ? "CoinGecko feed" : "Market data unavailable"}</span></div>
                <div className="mini-assets">{market.slice(0, 3).map(coin => <div className="mini-asset" key={coin.id}><CoinMark coin={coin} size="sm" /><div><small>{coin.symbol}</small><b>{coin.price > 10 ? money(coin.price, 0) : money(coin.price, 4)}</b></div><PriceChange value={coin.change} /></div>)}</div>
              </div>
              <div className="float-pill pill-bottom"><span className="tiny-spark">↗</span> A clearer view of every move</div>
            </div>
          </div>
        </section>

        <section className="trust-strip" id="features">
          <div><span className="trust-icon"><Icon name="chart" /></span><div><b>Market visibility</b><small>Prices and daily movement</small></div></div>
          <div><span className="trust-icon"><Icon name="wallet" /></span><div><b>Portfolio reporting</b><small>Only posted ledger balances</small></div></div>
          <div><span className="trust-icon"><Icon name="shield" /></span><div><b>Risk-aware by design</b><small>No guaranteed-profit claims</small></div></div>
          <div><span className="trust-icon"><Icon name="activity" /></span><div><b>Activity records</b><small>Provider-confirmed status only</small></div></div>
        </section>

        <section className="market-section section-shell" id="markets">
          <div className="section-heading"><div><span className="section-kicker">THE MARKET, AT A GLANCE</span><h2>Explore digital assets</h2><p>Market prices update when the public data feed is available.</p></div><button className="text-link" onClick={() => { if (authUser) { setView("dashboard"); setTab("Markets"); } else openAuth("signin"); }}>Open market dashboard <Icon name="arrowRight" size={15} /></button></div>
          <div className="market-card"><div className="market-card-top"><div><b>Top cryptocurrencies</b><span className={"feed-state " + (marketStatus === "live" ? "feed-live" : "")}><i />{marketStatus === "live" ? "Live quotes" : "Quotes unavailable"}</span></div><span className="as-of">{lastUpdated ? "Updated " + lastUpdated.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "Connects to public market data"}</span></div><MarketTable rows={market} /></div>
          {marketStatus !== "live" && <p className="data-note"><Icon name="info" size={14} /> Prices are unavailable while the public market feed is disconnected.</p>}
        </section>

        <section className="learn-section" id="learn">
          <div className="learn-inner"><div><span className="section-kicker">LEARN BEFORE YOU MOVE</span><h2>Better information.<br /><span>More thoughtful decisions.</span></h2><p>Understand wallets, blockchain networks, volatility, and transaction fees before making a move.</p><button className="btn btn-dark" onClick={() => document.querySelector(".learn-list")?.scrollIntoView({ behavior: "smooth", block: "center" })}>Explore learning topics <Icon name="arrowRight" size={15} /></button></div><div className="learn-list"><div><span>01</span><div><b>Start with the basics</b><small>Crypto, wallets, and the blockchain in plain English.</small></div><Icon name="arrowRight" /></div><div><span>02</span><div><b>Understand risk</b><small>Volatility, fees, scams, and common warning signs.</small></div><Icon name="arrowRight" /></div><div><span>03</span><div><b>Know the network</b><small>Choose the right network and verify every address.</small></div><Icon name="arrowRight" /></div></div></div>
        </section>
        <section className="faq-section" id="faq"><div className="faq-inner"><div className="faq-intro"><span className="section-kicker">HELP CENTER</span><h2>Questions, answered.</h2><p>Key information about GROEarnX, digital-asset risks and supported services.</p><div className="faq-contact"><b>Need help with your account?</b><a href={WHATSAPP_URL} target="_blank" rel="noreferrer">WhatsApp support <Icon name="external" size={13}/></a><a href={"tel:"+CONTACT_PHONE}>Call {CONTACT_PHONE}</a></div></div><div className="faq-list">
          <details><summary>Which digital assets are supported?</summary><p>The website provides market information for Bitcoin (BTC), Ethereum (ETH), Tether (USDT), and additional assets when returned by the public market-data feed. Financial transfers are not enabled until the required custody and payment providers are connected.</p></details>
          <details><summary>Can U.S. customers deposit using ACH or a card?</summary><p>ACH and card are planned funding options for eligible U.S. customers. They require a contracted payment provider, compliance approval and secure checkout before payments can be accepted.</p></details>
          <details><summary>Can I deposit BTC, ETH or USDT now?</summary><p>Do not send crypto unless a verified wallet address and exact network are displayed inside your signed-in account. Addresses will only be displayed after a custody provider provisions them; no address is currently preloaded.</p></details>
          <details><summary>Are investment returns guaranteed?</summary><p>No. Crypto prices can rise or fall and you may lose money. Any future investment product needs its own approved terms, fees and risk disclosures. GROEarnX does not promise a fixed profit.</p></details>
          <details><summary>Why might a U.S. state be unavailable?</summary><p>Financial services may be restricted by state, provider coverage, licensing and verification requirements. Availability must be confirmed server-side; selecting a state in a form is not an approval.</p></details>
          <details><summary>How should I send identity documents?</summary><p>Only submit documents through the approved secure identity-verification provider when one is connected. Do not send passwords, authenticator codes, recovery phrases or full identity documents by WhatsApp or ordinary email.</p></details>
        </div></div></section>
        <section className="cta-section"><div><span className="section-kicker">YOUR NEXT STEP</span><h2>Make the market<br />easier to understand.</h2><p>Create a secure account to manage your profile and follow live market information.</p></div><div className="cta-actions"><button className="btn btn-primary btn-lg" onClick={() => openAuth("signup")}>Get started <Icon name="arrowRight" size={15} /></button><button className="btn btn-quiet btn-lg" onClick={() => openAuth("signin")}>Sign in to your account</button><small>Deposits and withdrawals require verified provider integrations.</small></div></section>
      </main>{renderFooter()}</>;
  }

  function renderMfaChallenge() {
    return <div className="auth-page">
      <div className="auth-brand-rail"><div className="auth-rail-top"><Brand onClick={() => setView("home")} /><span className="auth-rail-pill"><span className="status-dot" /> ACCOUNT SECURITY</span></div>
        <div className="auth-promo"><span className="eyebrow"><span className="eyebrow-dot" /> TWO-FACTOR AUTHENTICATION</span><h1>One more step<br />to keep your account <em>secure.</em></h1><p>Enter the current one-time code from the authenticator app enrolled with your account.</p></div>
        <div className="auth-rail-footer"><span className="rail-seal"><Icon name="shield" size={17}/></span><span>Never share your one-time code.<br/><b>GROEarnX support will not ask for it.</b></span></div>
      </div>
      <div className="auth-main"><div className="auth-mobile-brand"><Brand onClick={() => setView("home")}/></div><button className="auth-back" onClick={() => { setMfaLogin(null); setView("signin"); }}>← Back to sign in</button>
        <div className="auth-form-wrap"><div className="auth-form-heading"><span className="section-kicker">VERIFY YOUR IDENTITY</span><h2>Enter authenticator code</h2><p>Use the six-digit code from your authenticator app.</p></div>
          <form className="auth-form" onSubmit={verifyMfaLogin}><label>Authentication code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={mfaCode} onChange={e=>setMfaCode(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="000000" required/></label><button className="btn btn-primary auth-submit" type="submit" disabled={mfaBusy || mfaCode.length!==6}>{mfaBusy ? "Verifying…" : "Verify and continue"} <Icon name="arrowRight" size={16}/></button></form>
          <div className="auth-legal">Keep your authenticator device secure. If you lose it, use the verified account-recovery process.</div>
        </div>
        <div className="auth-bottom-line"><span>© {new Date().getFullYear()} GROEarnX</span><a href={WHATSAPP_URL} target="_blank" rel="noreferrer">Support <Icon name="external" size={12}/></a></div>
      </div>
    </div>;
  }

  function renderPasswordRecovery() {
    return <div className="auth-page">
      <div className="auth-brand-rail"><div className="auth-rail-top"><Brand onClick={() => { setPasswordRecoveryActive(false); setView("home"); }} /><span className="auth-rail-pill"><span className="status-dot" /> ACCOUNT RECOVERY</span></div>
        <div className="auth-promo"><span className="eyebrow"><span className="eyebrow-dot" /> PASSWORD RESET</span><h1>Secure your account<br />with a new <em>password.</em></h1><p>Choose a new password for this account. GROEarnX will not ask you to share your password or recovery link with support.</p></div>
        <div className="auth-rail-footer"><span className="rail-seal"><Icon name="shield" size={17}/></span><span>Protect your account.<br/><b>Never share reset links.</b></span></div>
      </div>
      <div className="auth-main"><div className="auth-mobile-brand"><Brand onClick={() => { setPasswordRecoveryActive(false); setView("home"); }}/></div>
        <div className="auth-form-wrap"><div className="auth-form-heading"><span className="section-kicker">ACCOUNT RECOVERY</span><h2>Set a new password</h2><p>Use at least eight characters and enter the same password twice.</p></div>
          <form className="auth-form" onSubmit={completePasswordReset}>
            <label>New password<div className="password-wrap"><input type="password" name="newPassword" autoComplete="new-password" minLength={8} placeholder="At least 8 characters" required/><Icon name="lock" size={16}/></div></label>
            <label>Confirm new password<div className="password-wrap"><input type="password" name="confirmPassword" autoComplete="new-password" minLength={8} placeholder="Enter it again" required/><Icon name="lock" size={16}/></div></label>
            <button className="btn btn-primary auth-submit" type="submit" disabled={authBusy}>{authBusy ? "Updating password…" : "Update password"} <Icon name="arrowRight" size={16}/></button>
          </form>
          <div className="auth-legal">If this link has expired, return to sign in and request another reset email.</div>
        </div>
        <div className="auth-bottom-line"><span>© {new Date().getFullYear()} GROEarnX</span><a href={WHATSAPP_URL} target="_blank" rel="noreferrer">Support <Icon name="external" size={12}/></a></div>
      </div>
    </div>;
  }

  function renderLegalModal() {
    if (!legalPage) return null;
    const content = {
      "Terms of Service": [
        "GROEarnX account and market-information terms",
        "Account creation is subject to email verification, eligibility checks, sanctions screening and any identity verification required for the services offered in your location. Keep your credentials and authenticator codes private.",
        "Market prices can be delayed, incomplete or unavailable. Displayed market data is informational and is not an offer to buy or sell an asset. A trade is only accepted when a connected execution provider confirms it.",
        "A deposit request is not a completed deposit. A withdrawal is not complete until the relevant provider or blockchain confirms settlement. Network transfers can be irreversible, and sending assets over the wrong network can cause permanent loss.",
        "Crypto assets are volatile. No investment return is promised. Any future product must have separate terms describing eligibility, fees, risks, return calculations and withdrawal restrictions.",
        "Before U.S. customer onboarding, the operator must publish its legal entity name, business address, regulator and licence disclosures where applicable, complaints procedure, privacy contact and state-by-state eligibility. U.S. counsel should review these terms before they are treated as final."
      ],
      "Privacy Policy": [
        "Account information and privacy",
        "GROEarnX uses account information such as your email address, display name, country and contact details to operate account features and provide support. Authentication is handled by the connected Supabase Auth service.",
        "The regular registration form does not collect national-ID or driving-permit numbers. Where verification is legally required, those documents should be submitted directly to an approved identity-verification provider. GROEarnX should retain only the minimum provider status and reference required.",
        "Account records may be processed by contracted infrastructure providers. Confirm the actual hosting region, subprocessors, retention periods, deletion process, incident response and any cross-border transfers before onboarding customers.",
        "Do not send passwords, recovery phrases, one-time authentication codes or full identity documents through WhatsApp or ordinary email. Contact support to request help with account-data access or correction.",
        "This policy must be completed by the operator with the final legal entity, state privacy obligations, formal privacy contact, retention schedule and counsel-approved disclosures before public launch."
      ],
      "Fees": [
        "Fees and charges",
        "The final schedule must disclose every applicable trading fee, spread, deposit fee, withdrawal fee, network fee, mobile-money or bank fee, FX conversion charge, custody fee and any plan management or early-exit fee.",
        "Network fees can vary with congestion and provider pricing. Third-party fees may change and must be shown before a customer confirms a transaction.",
        "No fee schedule or provider pricing has been configured in the application yet. Do not accept customer payments or advertise a fee-free service until actual prices and the customer confirmation screens have been approved."
      ],
      "Risk Disclosure": [
        "Digital-asset risk disclosure",
        "Crypto assets are highly volatile and customers can lose some or all of the value they commit. Stablecoins can lose their peg, blockchain transactions can be irreversible, networks can halt or congest, and custody or payment providers can fail.",
        "Market prices, token liquidity and execution prices may differ across providers. Past performance is not a reliable indicator of future results. Estimated portfolio values can rise or fall and are not guaranteed returns.",
        "Never transfer assets until the recipient address, token contract and network are verified. GROEarnX should not hold or move client assets until its custody design, controls, provider contracts and applicable authorizations are complete.",
        "Do not send additional money to unlock an advertised profit, release a withdrawal, or pay an unexpected tax demanded by a stranger. Seek independent professional advice before investing."
      ]
    }[""+legalPage];
    return <div className="modal-scrim" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setLegalPage(null);}}><section className="legal-modal" role="dialog" aria-modal="true" aria-labelledby="legal-heading"><div className="modal-head"><div><span className="section-kicker">GROEarnX POLICY CENTER</span><h2 id="legal-heading">{legalPage}</h2><p>Draft disclosure — review and complete before offering regulated services.</p></div><button className="icon-button" onClick={()=>setLegalPage(null)} aria-label="Close policy"><Icon name="close"/></button></div><div className="legal-content">{content?.slice(1).map((paragraph,i)=><p key={i}>{paragraph}</p>)}</div><button className="btn btn-outline" onClick={()=>setLegalPage(null)}>Close</button></section></div>;
  }

  function renderAuth(isSignup) {
    return <div className="auth-page">
      <div className="auth-brand-rail"><div className="auth-rail-top"><Brand onClick={() => setView("home")} /><span className="auth-rail-pill"><span className="status-dot" /> SECURE ACCOUNT ACCESS</span></div>
        <div className="auth-promo"><span className="eyebrow"><span className="eyebrow-dot" /> GROEarnX ACCOUNT</span><h1>{isSignup ? <>A clearer start<br />to your crypto <em>journey.</em></> : <>Your crypto view,<br />right where you <em>left it.</em></>}</h1><p>{isSignup ? "Create your account to access your profile, balances, notifications and security settings." : "Return to your dashboard, watchlist, and market overview with a cleaner perspective."}</p>
          <div className="auth-benefits"><div><span><Icon name="chart" /></span><div><b>Useful market context</b><small>Track price changes and market trends.</small></div></div><div><span><Icon name="wallet" /></span><div><b>Portfolio in one view</b><small>Keep your asset activity organized.</small></div></div><div><span><Icon name="shield" /></span><div><b>Safety before speed</b><small>Clear status and no guaranteed returns.</small></div></div></div>
        </div>
        <div className="auth-rail-footer"><span className="rail-seal"><Icon name="shield" size={17} /></span><span>Professional by design.<br /><b>Transparent by default.</b></span></div>
      </div>
      <div className="auth-main"><div className="auth-mobile-brand"><Brand onClick={() => setView("home")} /></div><button className="auth-back" onClick={() => setView("home")}>← Back to home</button>
        <div className="auth-form-wrap"><div className="auth-form-heading"><span className="section-kicker">{isSignup ? "CREATE YOUR PROFILE" : "WELCOME BACK"}</span><h2>{isSignup ? "Create your account" : "Sign in to GROEarnX"}</h2><p>{isSignup ? "A few details to set up your profile." : "Your market view is just a step away."}</p></div>
          {!supabaseConfigured && <div className="account-configuration-notice"><Icon name="info" size={17} /><span><b>Account setup required.</b> Authentication is not configured on this deployment yet.</span></div>}
          <form onSubmit={isSignup ? signUp : signIn} className="auth-form">
            {isSignup && <>
              <label>Full name<input name="fullName" autoComplete="name" placeholder="Your full name" required /></label>
              <label>Country / region<select name="country" value={profile.country} onChange={e => setProfile(p => ({ ...p, country: e.target.value, stateRegion: e.target.value === "United States" ? p.stateRegion : "" }))} required><option value="">Choose your country</option>{COUNTRIES.map(country => <option key={country}>{country}</option>)}</select></label>
              {profile.country === "United States" && <label>State / territory<select name="stateRegion" value={profile.stateRegion} onChange={e=>setProfile(p=>({...p,stateRegion:e.target.value}))} required><option value="">Choose your state</option>{US_STATES.map(state=><option key={state}>{state}</option>)}</select><small className="field-help">State eligibility must be checked by the service provider and compliance system.</small></label>}
            </>}
            <label>Email address<input type="email" name="email" autoComplete="email" placeholder="you@example.com" required onChange={e => !isSignup && setProfile(p => ({ ...p, email: e.target.value }))} /></label>
            <label>Password<div className="password-wrap"><input type="password" name="password" autoComplete={isSignup ? "new-password" : "current-password"} minLength={8} placeholder={isSignup ? "At least 8 characters" : "Enter password"} required /><Icon name="lock" size={16} /></div></label>
            {isSignup && <div className="identity-verification-notice"><div className="identity-notice-heading"><span><Icon name="shield" size={16} /></span><div><b>Identity verification</b><small>Verification after account creation</small></div><span className="badge-muted">Required later</span></div><p>For your protection, identity documents and ID numbers are collected only through an approved secure verification provider. Do not enter them into this form.</p></div>}
            {!isSignup && <div className="auth-options"><span className="auth-session-note">Your session stays on this browser until you sign out.</span><button type="button" className="text-link" onClick={resetPassword}>Forgot password?</button></div>}
            {isSignup && <label className="check-row terms-check"><input type="checkbox" required /> <span>I agree to the Terms of Service, Privacy Policy and Risk Disclosure.</span></label>}
            <button className="btn btn-primary auth-submit" type="submit" disabled={authBusy || !supabaseConfigured}>{authBusy ? "Please wait…" : isSignup ? "Create account" : "Sign in"} <Icon name="arrowRight" size={16} /></button>
          </form>
          <div className="auth-switch">{isSignup ? "Already have a profile?" : "New to GROEarnX?"} <button onClick={() => openAuth(isSignup ? "signin" : "signup")}>{isSignup ? "Sign in" : "Create account"}</button></div>
          <div className="auth-legal">Your account is protected by the configured authentication service. Wallet and payment services become available only after their providers are verified and connected.</div>
        </div>
        <div className="auth-bottom-line"><span>© {new Date().getFullYear()} GROEarnX</span><a href={WHATSAPP_URL} target="_blank" rel="noreferrer">Need help? WhatsApp support <Icon name="external" size={12} /></a></div>
      </div>
    </div>;
  }


  function renderTrade() {
    if (!market.length) return <section className="panel-card route-panel"><div className="panel-heading"><div><h2>Market data unavailable</h2><p>Live public quotes could not be loaded. Trading remains unavailable until market data and an execution provider are configured.</p></div></div></section>;
    const coin = market.find(c=>c.id===tradePair) || market[0];
    const priceText = coin.price>10 ? money(coin.price,2) : money(coin.price,4);
    const high = coin.high24h, low = coin.low24h;
    const volume = coin.volume24h;
    return <div className="trade-terminal">
      <section className="trade-pair-bar">
        <div className="trade-pair-main"><CoinMark coin={coin}/><div><div className="trade-pair-picker"><select aria-label="Select trading pair" value={tradePair} onChange={e=>setTradePair(e.target.value)}>{market.map(c=><option value={c.id} key={c.id}>{c.symbol} / USD</option>)}</select><span className="pair-badge">SPOT</span></div><small>{coin.name} / US Dollar</small></div></div>
        <div className="trade-pair-price"><b>{priceText}</b><PriceChange value={coin.change}/></div>
        <div className="trade-pair-stat"><small>24H HIGH</small><b>{money(high,high<1?4:2)}</b></div>
        <div className="trade-pair-stat"><small>24H LOW</small><b>{money(low,low<1?4:2)}</b></div>
        <div className="trade-pair-stat"><small>24H VOLUME</small><b>{compactMoney(volume)}</b></div>
      </section>
      <div className="trade-disclaimer"><Icon name="info" size={15}/><span><b>Market information only.</b> Public quotes do not mean GROEarnX is connected to an exchange. Buy/sell execution is unavailable until a trading provider is integrated.</span><span className={"feed-state "+(marketStatus==="live"?"feed-live":"")}><i/>{marketStatus==="live"?"Quotes live":"Feed unavailable"}</span></div>
      <div className="trade-workspace">
        <section className="panel-card trade-chart-panel">
          <div className="trade-panel-title"><div><h2>{coin.name} price chart</h2><p>Public 7-day price sparkline · USD</p></div><span className="chart-range-chip">7D</span></div>
          <div className="trade-chart-summary"><span>{priceText}</span><PriceChange value={coin.change}/><small>Latest quote</small></div>
          <div className="trade-chart-wrap"><TradingChart values={coin.spark} color={coin.change>=0?"#17996C":"#D65E70"}/></div>
          <div className="trade-chart-legend"><span><i style={{background:coin.change>=0?"#17996C":"#D65E70"}}/>{coin.symbol}/USD trend</span><span>{marketStatus==="live"?"CoinGecko market feed":"Market data unavailable"}</span></div>
        </section>
        <section className="panel-card trade-order-panel">
          <div className="panel-heading"><div><h2>Trade execution</h2><p>Live order placement is not enabled on this platform yet.</p></div><span className="metric-badge">NOT CONNECTED</span></div>
          <div className="service-disabled-panel">
            <span className="service-disabled-icon"><Icon name="lock" size={22}/></span>
            <div><span className="service-state-badge">QUOTES ONLY</span><h3>{coin.symbol}/USD is view-only</h3><p>These prices come from public market data. GROEarnX has no connected exchange account to accept orders, calculate actual execution fees, reserve funds, or confirm a fill.</p></div>
          </div>
          <div className="service-readiness-list"><div><Icon name="check" size={16}/><span>Public market quote and price history</span></div><div><Icon name="lock" size={16}/><span>Order submission and settlement not available</span></div><div><Icon name="lock" size={16}/><span>Balances will not change from this screen</span></div></div>
          <a className="btn btn-outline service-support-link" href={WHATSAPP_URL} target="_blank" rel="noreferrer">Contact support <Icon name="external" size={14}/></a>
        </section>
      </div>
      <div className="trade-lower-grid">
        <section className="panel-card depth-panel"><div className="panel-heading"><div><h2>Market depth</h2><p>Order book data requires a live exchange connection.</p></div><span className="metric-badge">NOT CONNECTED</span></div><div className="empty-state"><Icon name="info" size={24}/><b>Order book unavailable</b><span>Live bid/ask depth will appear after a supported exchange provider is connected. No synthetic market depth is displayed.</span></div></section>
        <section className="panel-card pair-watch-panel"><div className="panel-heading"><div><h2>Market watch</h2><p>Choose a pair to explore</p></div><span className={"feed-state "+(marketStatus==="live"?"feed-live":"")}><i/>{marketStatus==="live"?"Live":"Unavailable"}</span></div>
          <div className="pair-watch-list">{market.map(c=><button key={c.id} className={tradePair===c.id?"selected":""} onClick={()=>setTradePair(c.id)}><CoinMark coin={c} size="sm"/><span><b>{c.symbol}/USD</b><small>{c.name}</small></span><span className="pair-watch-price"><b>{c.price>10?money(c.price,2):money(c.price,4)}</b><PriceChange value={c.change}/></span></button>)}</div>
        </section>
      </div>
    </div>;
  }

  function renderDashboard() {
    const nav = [{ label: "Overview", icon: "grid" }, { label: "Wallets", icon: "wallet" }, { label: "Trade", icon: "chart" }, { label: "Portfolio", icon: "wallet" }, { label: "Markets", icon: "chart" }, { label: "Activity", icon: "activity" }, { label: "Investment Plans", icon: "chart" }, { label: "Fees & Limits", icon: "info" }, { label: "Notifications", icon: "bell" }, { label: "Support", icon: "info" }, { label: "Verification", icon: "shield" }, { label: "Security", icon: "lock" }, { label: "Profile", icon: "user" }, ...(isAdmin ? [{ label: "Admin", icon: "settings" }] : [])];
    return <div className="dashboard-layout">
      <aside className={"sidebar " + (menuOpen ? "sidebar-open" : "")}><div className="sidebar-brand"><Brand onClick={() => setView("home")} /></div><div className="sidebar-caption">WORKSPACE</div><nav className="sidebar-nav">{nav.map(item => <button className={tab === item.label ? "selected" : ""} key={item.label} onClick={() => dashboardNav(item.label)}><Icon name={item.icon} size={18} />{item.label}{item.label === "Verification" && profile.kycStatus !== "verified" && <span className="nav-count">!</span>}{item.label === "Notifications" && notifications.some(n=>!n.read_at) && <span className="nav-count">{notifications.filter(n=>!n.read_at).length}</span>}</button>)}</nav><div className="sidebar-bottom"><div className="support-card"><span className="support-icon"><Icon name="shield" /></span><b>Need a hand?</b><small>Talk to the GROEarnX support team.</small><a href={WHATSAPP_URL} target="_blank" rel="noreferrer">Contact support <Icon name="arrowRight" size={13} /></a></div><button className="sidebar-home" onClick={() => setView("home")}><Icon name="arrowRight" size={15} /> Back to website</button><div className="sidebar-member"><span className="member-avatar">{memberInitials}</span><span><b>{memberName}</b><small>{authUser?.email || "Verified account"}</small></span><button title="Sign out" onClick={signOut}><Icon name="external" size={14}/></button></div></div></aside>
      <main className="dashboard-main"><header className="dashboard-topbar"><button className="mobile-menu dash-menu" onClick={() => setMenuOpen(v => !v)} aria-label="Toggle dashboard menu"><Icon name="menu" /></button><div className="breadcrumbs">Workspace <span>/</span> <b>{tab}</b></div><div className="dashboard-top-actions"><span className="account-status-chip"><span className="status-dot" /> {mfaAccessGranted ? "SECURE ACCESS" : "SECURITY SETUP REQUIRED"}</span><span className="dashboard-data-sync" role="status" aria-live="polite">{!mfaAccessGranted ? "Private data locked" : accountDataLoading ? "Syncing account…" : accountDataUpdatedAt ? "Checked " + accountDataUpdatedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "Loading account data"}</span><button className="icon-button dashboard-refresh-button" aria-label="Refresh market and account data" title="Refresh market and account data" onClick={() => { setDashboardRefresh(v => v + 1); setMarketRefresh(v => v + 1); }} disabled={mfaAccessGranted && accountDataLoading}><Icon name="refresh" /></button><button className="icon-button" aria-label="Notifications" onClick={() => dashboardNav("Notifications")}><Icon name="bell" /></button><span className="top-avatar">{memberInitials}</span></div></header>
        <div className="dashboard-content">{!mfaAccessGranted && <div className="dashboard-ledger-notice"><span><Icon name="shield" size={17}/></span><div><b>Verify two-factor authentication</b><p>Account information is hidden until your authenticator is enrolled and verified. Open Security in the sidebar to continue.</p></div></div>}{accountDataWarning && mfaAccessGranted && <div className="dashboard-ledger-notice dashboard-data-warning"><span><Icon name="info" size={17}/></span><div><b>Some dashboard data needs attention</b><p>{accountDataWarning}</p></div></div>}<div className="dashboard-welcome"><div><span className="section-kicker">YOUR WORKSPACE</span><h1>{tab === "Overview" ? `Welcome back, ${memberName}.` : tab}</h1><p>{tab === "Overview" ? "Here is your portfolio, settled activity and current market information." : dashboardDescription(tab)}</p></div><div className="dashboard-welcome-actions"><button className="btn btn-outline" onClick={() => openRequest("withdraw")}> <Icon name="arrowDown" size={15} /> Withdraw</button><button className="btn btn-primary" onClick={() => openRequest("deposit")}> <Icon name="plus" size={15} /> Deposit</button></div></div>
          <div className="dashboard-ledger-notice"><span><Icon name="info" size={17} /></span><div><b>Your account overview</b><p>Only posted ledger balances are shown here. Market-price changes can increase or decrease the value of your holdings. Deposits, withdrawals and trading require verified service integrations.</p></div><button onClick={() => notify("Real balances should come from a server-side ledger reconciled with trusted wallet/payment providers.")}>How balances work <Icon name="arrowRight" size={13} /></button></div>
          {tab === "Overview" && <>
            <div className="dashboard-metric-grid">
              <section className="metric-card primary-metric"><div className="metric-label"><span>Portfolio value</span><button className="eye-toggle" aria-label="Toggle balance visibility" onClick={() => setShowBalances(v => !v)}><Icon name="eye" size={16} /></button></div><div className="metric-number">{showBalances ? money(portfolioValue) : "••••••••"}</div><div className="metric-foot">{Number.isFinite(dailyChange) ? <><span className={"metric-change " + (dailyChange >= 0 ? "positive" : "negative")}>{dailyChange >= 0 ? "+" : "−"}{money(Math.abs(dailyChange))} ({changeText(dailyChangePct)})</span><span>estimated from current posted holdings</span></> : <><span className="metric-change">Unavailable</span><span>{balancesStatus === "error" ? "The ledger could not be read; no balance estimate is shown" : balancesStatus === "loading" ? "Checking the posted ledger" : unpricedBalanceRows.length ? "One or more asset balances lack supported market quotes" : "Fresh quotes needed to value posted assets"}</span></>}</div><div className="metric-chart">{portfolioHistory.length > 1 ? <Sparkline values={portfolioHistory.map(point=>Number(point.total_value_usd))} color="#FFFFFF" width={350} height={77} fill/> : <span className="chart-note">Portfolio history appears after valuation snapshots are recorded.</span>}</div><small className="metric-period">{marketStatus === "live" ? "Calculated from posted units × live prices" : "Portfolio value updates when settled units and current market quotes are available"}</small></section>
              <section className="metric-card"><div className="metric-card-top"><span className="metric-icon"><Icon name="wallet" /></span><span className="metric-badge">ACCOUNT</span></div><div className="metric-label">Assets tracked</div><div className="metric-number small-number">{balancesStatus === "available" ? portfolioRows.filter(c => c.units > 0).length + unpricedBalanceRows.length : "—"}</div><p className="metric-caption">{balancesStatus === "available" ? "Assets with posted balances" : "Ledger balance unavailable"}</p><button className="metric-link" onClick={() => setTab("Portfolio")}>View portfolio <Icon name="arrowRight" size={14} /></button></section>
              <section className="metric-card"><div className="metric-card-top"><span className="metric-icon purple"><Icon name="activity" /></span><span className="metric-badge">SESSION</span></div><div className="metric-label">Activity requests</div><div className="metric-number small-number">{transactions.length}</div><p className="metric-caption">Account activity loaded from your records</p><button className="metric-link" onClick={() => setTab("Activity")}>View activity <Icon name="arrowRight" size={14} /></button></section>
            </div>
            <div className="content-grid-main">
              <section className="panel-card portfolio-panel"><div className="panel-heading"><div><h2>Portfolio allocation</h2><p>Posted asset balances valued in USD</p></div><button className="text-link" onClick={() => setTab("Portfolio")}>View details <Icon name="arrowRight" size={14} /></button></div>
                <div className="allocation-body"><div className="donut-wrap"><div className="donut-chart" style={{ background: donutGradient(portfolioRows) }}><div><strong>{showBalances ? compactMoney(portfolioValue) : "••••"}</strong><small>Portfolio total</small></div></div></div><div className="allocation-list">{portfolioRows.filter(c => c.value > 0).sort((a,b) => b.value-a.value).slice(0,5).map(c => <div className="allocation-item" key={c.id}><span className="allocation-dot" style={{ background: c.color }} /><span className="allocation-name">{c.name}</span><b>{portfolioValue ? (c.value / portfolioValue * 100).toFixed(1) : "0.0"}%</b></div>)}</div></div>
              </section>
              <section className="panel-card quick-actions-panel"><div className="panel-heading"><div><h2>Quick actions</h2><p>Deposit and withdrawal availability</p></div></div><button className="action-tile" onClick={() => openRequest("deposit")}><span className="action-tile-icon deposit"><Icon name="arrowDown" /></span><span><b>Make a deposit request</b><small>Crypto or mobile money · provider required</small></span><Icon name="arrowRight" size={16} /></button><button className="action-tile" onClick={() => openRequest("withdraw")}><span className="action-tile-icon withdraw"><Icon name="arrowUp" /></span><span><b>Make a withdrawal request</b><small>Payout provider required</small></span><Icon name="arrowRight" size={16} /></button><button className="action-tile" onClick={() => setTab("Markets")}><span className="action-tile-icon market"><Icon name="chart" /></span><span><b>Explore the market</b><small>Check price movements</small></span><Icon name="arrowRight" size={16} /></button></section>
            </div>
            <section className="panel-card dashboard-market-panel"><div className="panel-heading"><div><h2>Market watch</h2><p>{marketStatus === "live" ? "Public market quotes · USD" : "Market quote unavailable · USD"}</p></div><button className="text-link" onClick={() => setTab("Markets")}>All markets <Icon name="arrowRight" size={14} /></button></div><MarketTable rows={market.slice(0,4)} /></section>
            <section className="panel-card activity-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Recent activity from your account.</p></div><button className="text-link" onClick={() => setTab("Activity")}>View activity <Icon name="arrowRight" size={14} /></button></div><ActivityTable items={transactions.slice(0,3)} /></section>
          </>}
          {tab === "Trade" && renderTrade()}
          {tab === "Wallets" && <section className="panel-card route-panel wallets-page"><div className="panel-heading"><div><h2>Crypto wallets</h2><p>Only addresses provisioned by the connected custody provider are displayed.</p></div><span className="status-label status-pending">{wallets.filter(w=>w.address_status==="active" && w.deposit_address).length} active addresses</span></div>
            <div className="wallet-safety-note"><Icon name="shield" size={17}/><span><b>Verify before sending.</b> Check the asset, token contract and network. Never transfer funds to an address copied from an unverified message.</span></div>
            {wallets.length===0 ? <div className="empty-state"><Icon name="wallet" size={26}/><b>No wallet addresses are available yet.</b><span>BTC, ETH and USDT wallet addresses will appear here only after the selected custody provider has provisioned and verified them for your account. Do not send assets to GROEarnX until a verified address is shown.</span></div> : <div className="table-wrap"><table className="market-table wallets-table"><thead><tr><th>Asset</th><th>Network</th><th>Address</th><th>Provider</th><th>Status</th></tr></thead><tbody>{wallets.map(w=><tr key={w.id}><td><b>{w.asset_code}</b></td><td>{w.network}</td><td>{w.address_status==="active" && w.deposit_address ? <div className="wallet-address-cell"><code>{w.deposit_address}</code><button className="btn btn-outline btn-sm" onClick={async()=>{try{await navigator.clipboard.writeText(w.deposit_address);notify("Wallet address copied. Verify the network before sending.");}catch{notify("Could not copy address. Select and copy it manually.");}}}>Copy</button></div> : <span className="muted-cell">Not available</span>}</td><td>{w.provider_name || "—"}</td><td><span className={"status-label "+(w.address_status==="active" && w.deposit_address?"status-ok":"status-pending")}>{String(w.address_status).replaceAll("_"," ")}</span></td></tr>)}</tbody></table></div>}
            <div className="activity-note"><Icon name="info" size={16}/> Wallet records are read-only for customers. Address creation, withdrawals and transaction signing must be performed by the secure server-side custody integration.</div>
          </section>}
          {tab === "Portfolio" && <section className="panel-card route-panel"><div className="panel-heading"><div><h2>Your assets</h2><p>Quantity × public market quote. Only posted ledger balances are included.</p></div><button className="btn btn-primary btn-sm" onClick={() => openRequest("deposit")}><Icon name="plus" size={14}/> Deposit request</button></div><div className="portfolio-summary-strip"><span>Portfolio value</span><strong>{showBalances ? money(portfolioValue) : "••••••"}</strong><button className="eye-toggle" onClick={() => setShowBalances(v => !v)}><Icon name="eye" size={15}/></button></div><div className="table-wrap"><table className="market-table portfolio-table"><thead><tr><th>Asset</th><th>Units</th><th>Price</th><th>Value</th><th>24h</th></tr></thead><tbody>{portfolioRows.map(c=><tr key={c.id}><td><div className="asset-cell"><CoinMark coin={c}/><div><b>{c.name}</b><small>{c.symbol}</small></div></div></td><td>{Number.isFinite(c.units) ? shortNumber(c.units,8)+" "+c.symbol : "—"}</td><td>{Number.isFinite(c.price) ? (c.price > 10 ? money(c.price) : money(c.price,4)) : "—"}</td><td><b>{showBalances ? (Number.isFinite(c.value) ? money(c.value) : "—") : "••••"}</b></td><td><PriceChange value={c.change}/></td></tr>)}</tbody></table></div>{unpricedBalanceRows.length>0 && <div className="activity-note"><Icon name="info" size={16}/> These posted asset balances are not included in the total because GROEarnX does not have verified current market quotes for them: {unpricedBalanceRows.map(row=>row.assetCode+" ("+shortNumber(row.units,8)+")").join(", ")}.</div>}{balancesStatus==="error" && <div className="activity-note"><Icon name="info" size={16}/> The ledger balance could not be loaded. Unit quantities and values are unavailable until the query succeeds.</div>}</section>}
          {tab === "Markets" && <section className="panel-card route-panel"><div className="panel-heading"><div><h2>Crypto markets</h2><p>{marketStatus === "live" ? "Current public market data and price changes." : "Live quote feed unavailable. Prices are not displayed until a fresh quote is received."}</p></div><span className={"feed-state " + (marketStatus === "live" ? "feed-live" : "")}><i />{marketStatus === "live" ? "Live quotes" : "Unavailable"}</span></div><MarketTable rows={market}/><p className="data-note"><Icon name="info" size={14}/> Market prices change frequently. This page is informational and does not execute trades.</p></section>}
          {tab === "Activity" && <section className="panel-card route-panel"><div className="panel-heading"><div><h2>Transaction activity</h2><p>Requests and status updates recorded for your account.</p></div><div className="inline-buttons"><button className="btn btn-outline btn-sm" onClick={() => openRequest("withdraw")}>Withdraw</button><button className="btn btn-primary btn-sm" onClick={() => openRequest("deposit")}>Deposit</button></div></div><ActivityTable items={transactions}/><div className="activity-note"><Icon name="info" size={16}/> A real ledger must only mark a deposit settled after provider or blockchain confirmation.</div></section>}
          {tab === "Fees & Limits" && <section className="panel-card route-panel fees-limits-page">
            <div className="panel-heading"><div><h2>Fees &amp; transaction limits</h2><p>Only operator-reviewed fee schedules currently effective for the service are shown here. We do not invent or estimate fees.</p></div><span className={"status-label "+(feeSchedules.length?"status-ok":"status-pending")}>{feeSchedules.length ? feeSchedules.length+" published schedules" : "No schedules published"}</span></div>
            {feesLoadError && <div className="dashboard-ledger-notice dashboard-data-warning"><span><Icon name="info" size={17}/></span><div><b>Fee schedule unavailable</b><p>{feesLoadError}</p></div></div>}<div className="fees-service-notice"><span className="service-disabled-icon"><Icon name="info" size={20}/></span><div><b>Charges must be confirmed before a transaction is submitted.</b><p>Displayed schedules are informational. The connected provider must return and confirm the final quote, network fees, applicable limits and total cost before a customer accepts a real transaction.</p></div></div>
            {feeSchedules.length===0 ? <div className="empty-state"><Icon name="info" size={25}/><b>No verified fee schedule is published.</b><span>GROEarnX currently has no active, reviewed fee-and-limit records. Deposits, withdrawals and trade execution remain disabled until contracted providers, fee schedules, limits, legal approvals and settlement tests are in place.</span></div> : <div className="table-wrap"><table className="market-table fees-table"><thead><tr><th>Service</th><th>Coverage</th><th>Published fee</th><th>Transaction limits</th><th>Terms</th></tr></thead><tbody>{feeSchedules.map(fee=>{
              const fixed=fee.fixed_fee===null || fee.fixed_fee===undefined ? null : Number(fee.fixed_fee);
              const percentage=fee.fee_percentage===null || fee.fee_percentage===undefined ? null : Number(fee.fee_percentage);
              const amount=(value)=>value===null||value===undefined?"Not set":shortNumber(Number(value),8);
              return <tr key={fee.id}><td><b>{fee.display_name}</b><small>{String(fee.service_code).replaceAll("_"," ")}</small>{fee.asset_code && <small>Asset: {fee.asset_code}{fee.network?" · "+fee.network:""}</small>}</td><td>{fee.country_code||"All configured regions"}</td><td>{fixed!==null ? "Fixed "+amount(fixed)+" "+fee.fee_currency : ""}{fixed!==null&&percentage!==null ? " + " : ""}{percentage!==null ? percentage.toFixed(4).replace(/0+$/,"").replace(/\.$/,"")+"%" : ""}{fixed===null&&percentage===null?"Not configured":""}</td><td><small>Per transaction: {amount(fee.minimum_amount)} – {amount(fee.maximum_amount)} {fee.asset_code||fee.fee_currency}</small><small>Daily: {amount(fee.daily_limit)} · Monthly: {amount(fee.monthly_limit)}</small></td><td>{fee.terms||"No additional terms published"}</td></tr>;
            })}</tbody></table></div>}
            <div className="activity-note"><Icon name="shield" size={16}/> Fees, network charges, spreads, conversion costs and transaction limits must be shown before customer confirmation. Support staff must not ask customers to pay an additional fee to unlock a withdrawal.</div>
          </section>}
          {tab === "Investment Plans" && <section className="panel-card route-panel plans-page"><div className="panel-heading"><div><h2>Investment plans</h2><p>Only legally reviewed plans approved by the operator are shown here.</p></div><span className="status-label status-pending">Availability subject to authorization</span></div>
            {investmentPlans.length===0 ? <div className="empty-state"><Icon name="info" size={25}/><b>No investment plans are currently available.</b><span>Plans will appear only after their terms, fees, risks, eligibility and regulatory approvals have been reviewed and activated.</span></div> : <div className="plan-grid">{investmentPlans.map(plan=><article className="plan-card" key={plan.id}><div className="plan-card-head"><span className="plan-asset">{plan.asset_code}</span><span className="status-label status-ok">Available</span></div><h3>{plan.name}</h3><p>{plan.description}</p><div className="plan-stats"><span>Minimum<b>{shortNumber(Number(plan.minimum_amount),8)} {plan.asset_code}</b></span><span>Term<b>{plan.term_days ? plan.term_days+" days" : "Flexible"}</b></span><span>Return disclosure<b>{plan.return_type==="none"?"No return offered":plan.return_type==="variable"?"Variable; not guaranteed":"See full plan terms"}</b></span></div><details><summary>Fees and risk disclosures</summary><p>{plan.fees_disclosure}</p><p>{plan.risk_disclosure}</p>{plan.terms_url && <a href={plan.terms_url} target="_blank" rel="noreferrer">Plan terms <Icon name="external" size={12}/></a>}</details></article>)}</div>}
          </section>}
          {tab === "Support" && <section className="panel-card route-panel support-page">
            <div className="panel-heading"><div><h2>Support centre</h2><p>Send an account support request and track its status from this page.</p></div><span className="status-label status-neutral">{supportTickets.length} saved tickets</span></div>
            <div className="support-page-grid">
              <form className="support-ticket-form" onSubmit={submitSupportTicket}>
                <div className="support-form-heading"><span className="metric-icon"><Icon name="info" /></span><div><h3>New support request</h3><p>Do not include passwords, recovery phrases, one-time codes or full identity documents.</p></div></div>
                <label>Request category<select name="category" defaultValue="general" required><option value="general">General question</option><option value="account">Account / login</option><option value="security">Security</option><option value="deposit">Deposit</option><option value="withdrawal">Withdrawal</option><option value="trading">Trading</option><option value="verification">Identity verification</option></select></label>
                <label>Subject<input name="subject" minLength={4} maxLength={160} placeholder="What do you need help with?" required /></label>
                <label>Message<textarea name="message" minLength={10} maxLength={5000} rows={5} placeholder="Describe the issue and what you have already tried." required /></label>
                <button className="btn btn-primary auth-submit" type="submit" disabled={supportBusy || !mfaAccessGranted}>{supportBusy ? "Saving request…" : "Submit support request"} <Icon name="arrowRight" size={15}/></button>
                <small className="field-help">Requests are stored against your signed-in account. Status changes only come from administrator actions.</small>
              </form>
              <div className="support-ticket-list">
                <div className="support-list-heading"><div><h3>Your support requests</h3><p>Most recent first</p></div><a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="text-link">WhatsApp support <Icon name="external" size={12}/></a></div>
                {supportTickets.filter(t => t.user_id === authUser?.id).length === 0 ? <div className="empty-state"><Icon name="info" size={23}/><b>No support requests yet.</b><span>Submit a request on the left. Your saved messages and support responses will appear here.</span></div> : supportTickets.filter(t => t.user_id === authUser?.id).map(ticket => <article className="support-ticket-card" key={ticket.id}>
                  <div className="support-ticket-meta"><span className="support-ticket-category">{ticket.category.replaceAll("_"," ")}</span><span className={"status-label "+(["resolved","closed"].includes(ticket.status)?"status-ok":"status-pending")}>{ticket.status.replaceAll("_"," ")}</span></div>
                  <h4>{ticket.subject}</h4><p>{ticket.message}</p><small>Opened {new Date(ticket.created_at).toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short"})}</small>
                  {ticket.admin_response && <div className="support-response"><b>GROEarnX response</b><p>{ticket.admin_response}</p></div>}
                </article>)}
              </div>
            </div>
          </section>}
          {tab === "Notifications" && <section className="panel-card route-panel notifications-page"><div className="panel-heading"><div><h2>Notifications</h2><p>Account, security and transaction notices delivered to your account.</p></div><span className="status-label status-neutral">{notifications.filter(n=>!n.read_at).length} unread</span></div>
            {notifications.length===0 ? <div className="empty-state"><Icon name="bell" size={25}/><b>No notifications yet.</b><span>Security and transaction notifications will appear here when generated by the account service.</span></div> : <div className="notification-list">{notifications.map(n=><article className={"notification-item "+(!n.read_at?"unread":"")} key={n.id}><span className="notification-icon"><Icon name={n.category==="security"?"shield":n.category==="transaction"?"activity":"bell"} size={17}/></span><div className="notification-body"><div className="notification-title-row"><b>{n.title}</b><time>{new Date(n.created_at).toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short"})}</time></div><p>{n.body}</p><small>{n.category}</small></div>{!n.read_at && <button className="text-link" onClick={()=>markNotificationRead(n.id)}>Mark read</button>}</article>)}</div>}
          </section>}
          {tab === "Security" && <section className="panel-card route-panel security-page"><div className="panel-heading"><div><h2>Security settings</h2><p>Use a unique password and enable an authenticator app for stronger sign-in security.</p></div><span className={"status-label "+(mfaFactors.some(f=>f.status==="verified")?"status-ok":"status-pending")}>{mfaFactors.some(f=>f.status==="verified")?"MFA enabled":"MFA not enabled"}</span></div>
            <div className="security-summary"><span className="security-summary-icon"><Icon name="shield" size={25}/></span><div><b>Authenticator-based two-factor authentication</b><p>When enabled, sign-in requires both your password and a current code from your authenticator app. Keep recovery options secure.</p></div></div>
            {mfaSetup ? <div className="mfa-enroll-box"><h3>Set up your authenticator</h3><p>Scan the QR code with an authenticator app. If scanning is unavailable, enter the setup key manually.</p>{mfaSetup.qrCode && <img className="mfa-qr" src={mfaSetup.qrCode} alt="Authenticator setup QR code"/>}<label>Manual setup key <code>{mfaSetup.secret}</code></label><form className="mfa-code-form" onSubmit={verifyMfaEnrollment}><label>Six-digit code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={mfaCode} onChange={e=>setMfaCode(e.target.value.replace(/\D/g,"").slice(0,6))} required/></label><button className="btn btn-primary" type="submit" disabled={mfaBusy||mfaCode.length!==6}>{mfaBusy?"Verifying…":"Verify and enable MFA"}</button></form><button className="text-link" onClick={()=>{setMfaSetup(null);setMfaCode("");}}>Cancel setup</button></div>
            : <div className="security-actions">{mfaFactors.length>0 && <div className="security-factor-list">{mfaFactors.map(f=><div key={f.id}><span><Icon name="lock" size={15}/></span><div><b>{f.friendly_name||"Authenticator"}</b><small>{f.factor_type.toUpperCase()} · {f.status}</small></div>{f.status==="verified" && <button className="btn btn-outline btn-sm" onClick={()=>removeMfaFactor(f.id)}>Remove</button>}</div>)}</div>}<button className="btn btn-primary" disabled={mfaBusy||mfaFactors.some(f=>f.factor_type==="totp"&&f.status==="verified")} onClick={beginMfaEnrollment}>{mfaBusy?"Preparing…":mfaFactors.some(f=>f.status==="verified")?"Authenticator enabled":"Set up authenticator MFA"} <Icon name="arrowRight" size={14}/></button></div>}
            <div className="activity-note"><Icon name="info" size={16}/> If you lose your authenticator, account recovery must verify your identity. Never share one-time codes or recovery phrases with support.</div>
          </section>}
          {tab === "Verification" && <section className="panel-card route-panel verification-page"><div className="panel-heading"><div><h2>Identity verification</h2><p>Secure verification must be completed through an approved KYC provider when required.</p></div><span className={"status-label "+(profile.kycStatus==="verified"?"status-ok":"status-pending")}><i/>{profile.kycStatus==="verified"?"Verified":profile.kycStatus==="pending"?"In review":"Not verified"}</span></div><div className="verification-steps"><div className="verification-step"><span>01</span><div><b>Country / region</b><p>{profile.country || "Add your country in profile settings."}</p></div><span className="status-label status-ok">{profile.country?"Provided":"Required"}</span></div><div className="verification-step"><span>02</span><div><b>National ID or driving permit</b><p>Submit documents only through the secure identity provider when that integration is available. Do not send ID images over chat.</p></div><span className="status-label status-pending">Provider required</span></div><div className="verification-step"><span>03</span><div><b>Review and approval</b><p>Account limits and regulated features depend on the verified result.</p></div><span className={"status-label "+(profile.kycStatus==="verified"?"status-ok":"status-pending")}>{profile.kycStatus.replaceAll("_"," ")}</span></div></div><button className="btn btn-outline" onClick={() => setTab("Profile")}>Review profile <Icon name="arrowRight" size={14}/></button></section>}
          {tab === "Profile" && <section className="panel-card route-panel profile-page"><div className="panel-heading"><div><h2>Profile &amp; preferences</h2><p>Update your contact and region information.</p></div><span className="status-label status-ok">Authenticated</span></div><form className="profile-edit-form" onSubmit={saveProfile}><label>Display name<input name="displayName" value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))} required maxLength={100}/></label><label>Email address<input value={profile.email} readOnly disabled/></label><label>Country / region<select name="country" value={profile.country} onChange={e=>setProfile(p=>({...p,country:e.target.value,stateRegion:e.target.value==="United States"?p.stateRegion:""}))} required><option value="">Choose your country</option>{COUNTRIES.map(country=><option key={country}>{country}</option>)}</select></label>{profile.country==="United States" && <label>State / territory<select name="stateRegion" value={profile.stateRegion||""} onChange={e=>setProfile(p=>({...p,stateRegion:e.target.value}))} required><option value="">Choose your state</option>{US_STATES.map(state=><option key={state}>{state}</option>)}</select></label>}<label>Phone number<input name="phone" value={profile.phone||""} onChange={e=>setProfile(p=>({...p,phone:e.target.value}))} autoComplete="tel" maxLength={40} placeholder="+1…"/></label><button className="btn btn-primary" type="submit" disabled={authBusy}>{authBusy ? "Saving profile…" : "Save profile"} <Icon name="check" size={15}/></button></form><div className="profile-grid"><div className="profile-field"><span>Identity verification</span><b>{profile.kycStatus==="verified"?"Verified":"Not verified"}</b></div><div className="profile-field"><span>Account status</span><b>Authenticated</b></div></div><div className="activity-note"><Icon name="shield" size={16}/> National ID and driving-permit details belong in the secure KYC provider flow, not ordinary profile fields.</div></section>}
          {tab === "Admin" && isAdmin && <section className="panel-card route-panel admin-page"><div className="panel-heading"><div><h2>Administration</h2><p>Read-only operational view. Use server-side admin functions for approvals and provider actions.</p></div><span className="status-label status-ok">Restricted access</span></div>{adminDataWarning && <div className="dashboard-ledger-notice dashboard-data-warning"><span><Icon name="info" size={17}/></span><div><b>Admin data needs attention</b><p>{adminDataWarning}</p></div></div>}<section className="provider-readiness-panel">
            <div className="provider-readiness-header"><div><span className="section-kicker">PRODUCTION CHECKS</span><h3>Financial service readiness</h3><p>Configuration presence is not the same as a successful provider test. Services remain disabled until each prerequisite is verified.</p></div><div className="provider-readiness-actions"><span className={"status-label "+(financialReadiness?.realMoneyReady?"status-ok":"status-pending")}>{readinessLoading?"Checking…":financialReadiness?.realMoneyReady?"Ready checks passed":"Not ready for real funds"}</span><button className="btn btn-outline btn-sm" onClick={()=>setReadinessRefresh(v=>v+1)} disabled={readinessLoading}>{readinessLoading?"Checking…":"Refresh checks"}</button></div></div>
            {financialReadiness?.error && <div className="readiness-error"><Icon name="info" size={16}/><span>{financialReadiness.error}</span></div>}
            {financialReadiness?.services && <>
              <div className="readiness-control-grid">
                <div className={financialReadiness.controls?.legalApproved?"readiness-control ready":"readiness-control"}><span>{financialReadiness.controls?.legalApproved?<Icon name="check" size={15}/>:<Icon name="lock" size={15}/>}</span><div><b>Compliance approval</b><small>{financialReadiness.controls?.legalApproved?"Operator sign-off recorded":"Not signed off"}</small></div></div>
                <div className={financialReadiness.controls?.sandboxValidated?"readiness-control ready":"readiness-control"}><span>{financialReadiness.controls?.sandboxValidated?<Icon name="check" size={15}/>:<Icon name="lock" size={15}/>}</span><div><b>Sandbox tests</b><small>{financialReadiness.controls?.sandboxValidated?"Testing sign-off recorded":"Not signed off"}</small></div></div>
                <div className={financialReadiness.controls?.liveValidated?"readiness-control ready":"readiness-control"}><span>{financialReadiness.controls?.liveValidated?<Icon name="check" size={15}/>:<Icon name="lock" size={15}/>}</span><div><b>Live reconciliation</b><small>{financialReadiness.controls?.liveValidated?"Live tests signed off":"Not signed off"}</small></div></div>
                <div className={financialReadiness.controls?.operatorEnabled?"readiness-control ready":"readiness-control"}><span>{financialReadiness.controls?.operatorEnabled?<Icon name="check" size={15}/>:<Icon name="lock" size={15}/>}</span><div><b>Global financial switch</b><small>{financialReadiness.controls?.operatorEnabled?"Enabled":"Off"}</small></div></div>
              </div>
              <div className="provider-readiness-list">{financialReadiness.services.map(service=><article className="provider-readiness-item" key={service.id}>
                <div className="provider-readiness-item-head"><div><h4>{service.title}</h4><small>{service.providerConfigurationPresent?"Provider configuration values found":"Provider configuration missing"}</small></div><span className={"status-label "+(service.readyForRealMoney?"status-ok":"status-pending")}>{service.readyForRealMoney?"Ready checks passed":"Blocked"}</span></div>
                {service.blockers?.length>0 && <ul>{service.blockers.map((blocker,index)=><li key={index}>{blocker}</li>)}</ul>}
              </article>)}</div>
              <p className="provider-readiness-footnote">Checked {financialReadiness.checkedAt ? new Date(financialReadiness.checkedAt).toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short"}) : "just now"}. This reports environment flags only; do not enable customer funds until the provider has passed actual end-to-end transactions and reconciliation.</p>
            </>}
          </section>
          <div className="admin-summary-grid"><div><small>Registered profiles</small><b>{adminUserCount===null?"—":adminUserCount}</b></div><div><small>Requests listed</small><b>{adminRequests.length}</b></div><div><small>Needs review</small><b>{adminRequests.filter(x=>["pending","under_review","processing"].includes(x.status)).length}</b></div></div><div className="table-wrap"><table className="market-table"><thead><tr><th>Request ID</th><th>User</th><th>Type</th><th>Asset</th><th>Amount</th><th>Status</th><th>Created</th></tr></thead><tbody>{adminRequests.map(r=><tr key={r.id}><td>{r.id.slice(0,8)}</td><td>{r.user_id.slice(0,8)}…</td><td>{r.request_type.replaceAll("_"," ")}</td><td>{r.asset_code}</td><td>{shortNumber(Number(r.amount),8)}</td><td><span className="status-label status-pending">{r.status.replaceAll("_"," ")}</span></td><td>{new Date(r.created_at).toLocaleDateString("en-US")}</td></tr>)}</tbody></table>{adminRequests.length===0 && <div className="empty-state"><b>No transaction requests found.</b></div>}</div><section className="admin-customer-management"><div className="panel-heading"><div><h3>Customer accounts</h3><p>Read-only profile and eligibility information. Customer-editable profile fields are not proof of identity or location.</p></div><span className="status-label status-neutral">{adminProfiles.length} shown</span></div>
            {adminProfiles.length===0 ? <div className="empty-state"><Icon name="user" size={23}/><b>No customer profiles yet.</b><span>New registrations will appear here after email confirmation and profile provisioning.</span></div> : <div className="table-wrap"><table className="market-table"><thead><tr><th>Customer</th><th>Country / state</th><th>Verification status</th><th>Registered</th></tr></thead><tbody>{adminProfiles.map(p=><tr key={p.id}><td><div><b>{p.display_name || "Unnamed customer"}</b><small>{p.id.slice(0,8)}…</small></div></td><td>{[p.country,p.state_region].filter(Boolean).join(" · ") || "Not provided"}</td><td><span className={"status-label "+(p.kyc_status==="verified"?"status-ok":"status-pending")}>{String(p.kyc_status||"not_started").replaceAll("_"," ")}</span></td><td>{new Date(p.created_at).toLocaleDateString("en-US")}</td></tr>)}</tbody></table></div>}
          </section>
          <section className="admin-verification-queue"><div className="panel-heading"><div><h3>Identity verification records</h3><p>Provider-backed results only. This admin screen cannot manually mark a customer verified.</p></div><span className="status-label status-neutral">{verificationQueue.length} records</span></div>
            {verificationQueue.length===0 ? <div className="empty-state"><Icon name="shield" size={23}/><b>No verification-provider records yet.</b><span>Connect the approved KYC provider before requesting or accepting identity-verification decisions.</span></div> : <div className="table-wrap"><table className="market-table"><thead><tr><th>Customer</th><th>Provider</th><th>Reference</th><th>Status</th><th>Updated</th></tr></thead><tbody>{verificationQueue.map(v=><tr key={v.id}><td>{v.user_id.slice(0,8)}…</td><td>{v.provider_name||"—"}</td><td>{v.provider_reference||"—"}</td><td><span className={"status-label "+(v.status==="verified"?"status-ok":"status-pending")}>{String(v.status).replaceAll("_"," ")}</span></td><td>{new Date(v.updated_at).toLocaleDateString("en-US")}</td></tr>)}</tbody></table></div>}
          </section>
          <section className="admin-support-inbox"><div className="panel-heading"><div><h3>Customer support inbox</h3><p>Review customer tickets and record an auditable response/status.</p></div><span className="status-label status-neutral">{supportTickets.length} tickets</span></div>
            {supportTickets.length===0 ? <div className="empty-state"><Icon name="info" size={23}/><b>No customer support tickets yet.</b><span>Tickets submitted by authenticated customers will appear here.</span></div> : <div className="admin-support-list">{supportTickets.map(ticket=><form className="admin-ticket-card" key={ticket.id} onSubmit={e=>updateSupportTicket(ticket.id,e)}>
              <div className="admin-ticket-head"><div><span className="support-ticket-category">{ticket.category.replaceAll("_"," ")}</span><h4>{ticket.subject}</h4><small>User {ticket.user_id.slice(0,8)}… · {new Date(ticket.created_at).toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short"})}</small></div><span className={"status-label "+(["resolved","closed"].includes(ticket.status)?"status-ok":"status-pending")}>{ticket.status.replaceAll("_"," ")}</span></div>
              <p className="admin-ticket-message">{ticket.message}</p>
              <label>Response<textarea name="adminResponse" defaultValue={ticket.admin_response || ""} maxLength={5000} rows={3} placeholder="Write a response for the customer…" /></label>
              <div className="admin-ticket-actions"><label>Status<select name="status" defaultValue={ticket.status}><option value="open">Open</option><option value="in_progress">In progress</option><option value="waiting_on_customer">Waiting on customer</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></label><button className="btn btn-primary btn-sm" type="submit" disabled={supportBusy}>{supportBusy?"Saving…":"Save response"}</button></div>
            </form>)}</div>}
          </section><div className="activity-note"><Icon name="shield" size={16}/> Admin role must be granted by a trusted server/admin operator in Supabase app metadata. Never set admin access from a public signup form or user-editable metadata.</div></section>}
          <div className="dashboard-disclaimer">GROEarnX financial services become available only after the relevant custody, exchange and payment providers are configured.</div>
        </div>
      </main>
      {renderRequestModal()}
    </div>;
  }

  function renderRequestModal() {
    if (!modal) return null;
    const deposit = modal === "deposit";
    return <div className="modal-scrim" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setModal(null); }}>
      <section className="request-modal service-status-modal" role="dialog" aria-modal="true" aria-labelledby="request-heading">
        <div className="modal-head"><div><span className="section-kicker">{deposit ? "ADD TO YOUR ACCOUNT" : "MOVE ASSETS OUT"}</span><h2 id="request-heading">{deposit ? "Deposits are unavailable" : "Withdrawals are unavailable"}</h2><p>Required provider integrations are not active.</p></div><button className="icon-button" aria-label="Close" onClick={() => setModal(null)}><Icon name="close" /></button></div>
        <div className="service-disabled-panel">
          <span className="service-disabled-icon"><Icon name="lock" size={22}/></span>
          <div><span className="service-state-badge">NOT ENABLED</span><h3>{deposit ? "No payment or custody provider is connected" : "No withdrawal/payout provider is connected"}</h3>
            <p>{deposit ? "GROEarnX cannot accept ACH, card, mobile-money or crypto deposits yet. This screen does not accept payment details and no deposit address has been created." : "GROEarnX cannot submit or process a crypto transfer or cash payout yet. No assets will be sent from this screen."}</p>
          </div>
        </div>
        <div className="service-readiness-list">
          <div><Icon name="check" size={16}/><span>Your account and existing transaction history remain available subject to security checks.</span></div>
          <div><Icon name="lock" size={16}/><span>{deposit ? "Funding checkout and verified deposit addresses will appear only after a contracted provider is activated." : "A withdrawal can only be requested after custody, identity checks, approvals and settlement controls are connected."}</span></div>
          <div><Icon name="info" size={16}/><span>Do not send funds to wallet addresses shared through chat or support messages.</span></div>
        </div>
        <div className="service-modal-actions"><a className="btn btn-outline service-support-link" href={WHATSAPP_URL} target="_blank" rel="noreferrer">Contact support <Icon name="external" size={14}/></a><button className="btn btn-primary" onClick={() => setModal(null)}>Close</button></div>
      </section>
    </div>;
  }

  function ActivityTable({ items }) {
    if (!Array.isArray(items) || items.length === 0) return <div className="empty-state"><Icon name="activity" size={24}/><b>No transaction activity yet.</b><span>Confirmed payments and requests will appear here when recorded by the connected services.</span></div>;
    return <div className="table-wrap"><table className="market-table activity-table"><thead><tr><th>Activity</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td><div className="activity-name"><span className={"activity-badge " + (item.type.toLowerCase().includes("withdraw") ? "activity-out" : item.type.toLowerCase().includes("deposit") ? "activity-in" : "")}>{item.type.toLowerCase().includes("withdraw") ? <Icon name="arrowUp" size={15}/> : item.type.toLowerCase().includes("deposit") ? <Icon name="arrowDown" size={15}/> : <Icon name="activity" size={15}/>}</span><div><b>{item.type}</b><small>{item.id} · {item.asset}</small></div></div></td><td><b>{shortNumber(item.amount,8)} {item.unit}</b></td><td className="muted-cell">{item.date}</td><td><span className={"status-label " + (["completed","confirmed","posted"].includes(String(item.status).toLowerCase()) ? "status-ok" : "status-pending")}>{item.status}</span></td></tr>)}</tbody></table></div>;
  }

  function dashboardDescription(activeTab) {
    return ({
      "Wallets": "View wallet records and verified deposit addresses made available by the connected custody service.",
      "Portfolio": "Review posted asset balances and their current USD value.",
      "Markets": "Track public quotes when the market-data feed is available.",
      "Activity": "Review transaction requests and settlement status from your account.",
      "Investment Plans": "Review active plans and their risk and fee disclosures.",
      "Fees & Limits": "Review the published fee schedule, transaction limits and service availability.",
      "Notifications": "Review account, security and transaction notices.",
      "Support": "Create a support ticket and track responses from the GROEarnX team.",
      "Security": "Manage authenticator-based two-factor authentication.",
      "Verification": "Check the current status of identity verification.",
      "Profile": "Update your name, country and contact information.",
      "Admin": "Review account and transaction requests as an authorized administrator.",
    })[activeTab] || "Your GROEarnX workspace.";
  }
  function donutGradient(rows) {
    const total = rows.reduce((s,c)=>s+Math.max(0,c.value),0);
    if (!total) return "conic-gradient(#e8edf2 0 100%)";
    let cursor = 0;
    const parts = rows.filter(c=>c.value>0).map(c => {
      const start = cursor; cursor += (c.value/total)*100;
      return c.color+" "+start.toFixed(2)+"% "+cursor.toFixed(2)+"%";
    });
    return "conic-gradient("+parts.join(",")+")";
  }

  return <div className="app-root">
    <div className="brand-info-ribbon"><span className="status-dot" /> GROEarnX <span>— crypto markets, portfolio information and account management</span></div>
    {passwordRecoveryActive ? renderPasswordRecovery() : <>
      {view === "home" && renderHome()}
      {(view === "signin" || view === "signup") && renderAuth(view === "signup")}
      {view === "mfaChallenge" && renderMfaChallenge()}
      {view === "dashboard" && (authUser ? renderDashboard() : renderAuth(false))}
    </>}
    <a className="whatsapp-float" href={WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label="Chat with GROEarnX support on WhatsApp"><span className="whatsapp-glyph">◉</span><span className="whatsapp-label">Chat with us</span></a>
    {legalPage && renderLegalModal()}
    {toast && <div className="toast" role="status"><span><Icon name="info" size={18}/></span><p>{toast}</p><button aria-label="Dismiss notification" onClick={()=>setToast("")}><Icon name="close" size={15}/></button></div>}
  </div>;
}

export default App;
