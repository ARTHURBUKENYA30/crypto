import React, { useEffect, useMemo, useState } from "react";
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

const ASSET_OPTIONS = [
  { id: "usdt", label: "USDT (Tether)", mark: "₮", color: "#26A17B", type: "crypto" },
  { id: "bitcoin", label: "Bitcoin (BTC)", mark: "₿", color: "#F7931A", type: "crypto" },
  { id: "ethereum", label: "Ethereum (ETH)", mark: "Ξ", color: "#6877DE", type: "crypto" },
  { id: "mobile", label: "Mobile Money", mark: "▣", color: "#1FA97A", type: "mobile" },
];

const COUNTRIES = ["United States", "Uganda", "United Kingdom", "Kenya", "Nigeria", "Ghana", "Tanzania", "Rwanda", "South Africa", "Canada", "India", "Other"];

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
  const points = values.length ? values : [14, 18, 15, 22, 19, 25, 23, 30];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const coords = points.map((v, i) => (i * (width - 4)) / (points.length - 1) + 2 + "," + (height - 3 - ((v - min) / span) * (height - 7))).join(" ");
  const area = "2," + (height - 1) + " " + coords + " " + (width - 2) + "," + (height - 1);
  return <svg className="sparkline" viewBox={"0 0 " + width + " " + height} role="img" aria-label="Price trend illustration">
    {fill && <polygon points={area} fill={color} opacity=".10" />}
    <polyline points={coords} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

function PriceChange({ value }) {
  return <span className={"change " + (value >= 0 ? "positive" : "negative")}>{value >= 0 ? "↗" : "↘"} {changeText(value)}</span>;
}

function TradingChart({ values = [], color = "#159B71" }) {
  const width = 940, height = 260, top = 12, bottom = 24;
  const data = values.length > 2 ? values : [12,13,12,17,16,20,18,23,21,25,24,29];
  const min = Math.min(...data), max = Math.max(...data), span = max-min || 1;
  const pts = data.map((v,i)=>({x:8+i*((width-16)/Math.max(1,data.length-1)),y:top+(1-(v-min)/span)*(height-top-bottom)}));
  const line = pts.map(p=>p.x.toFixed(1)+","+p.y.toFixed(1)).join(" ");
  const area = "M "+pts[0].x+" "+(height-bottom)+" L "+pts.map(p=>p.x+" "+p.y).join(" L ")+" L "+pts[pts.length-1].x+" "+(height-bottom)+" Z";
  return <svg className="trading-chart-svg" viewBox={"0 0 "+width+" "+height} preserveAspectRatio="none" role="img" aria-label="Seven-day crypto price trend">
    <defs><linearGradient id="tradeChartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".22"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
    {[0,1,2,3,4].map(i=><line key={i} x1="0" x2={width} y1={top+i*((height-top-bottom)/4)} y2={top+i*((height-top-bottom)/4)} stroke="#e9eef4" strokeDasharray="4 6"/>)}
    <path d={area} fill="url(#tradeChartFill)"/><polyline points={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
    <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="5" fill={color} stroke="white" strokeWidth="2"/>
    <g fill="#91a0b1" fontSize="11"><text x="8" y={height-5}>7 days ago</text><text x={width/2} y={height-5} textAnchor="middle">Market trend</text><text x={width-8} y={height-5} textAnchor="end">Latest</text></g>
  </svg>;
}

function App() {
  const [view, setView] = useState("home");
  const [authUser, setAuthUser] = useState(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [walletBalances, setWalletBalances] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [investmentPlans, setInvestmentPlans] = useState([]);
  const [mfaFactors, setMfaFactors] = useState([]);
  const [mfaSetup, setMfaSetup] = useState(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaLogin, setMfaLogin] = useState(null);
  const [mfaBusy, setMfaBusy] = useState(false);
  const [adminRequests, setAdminRequests] = useState([]);
  const [adminUserCount, setAdminUserCount] = useState(null);
  const [legalPage, setLegalPage] = useState(null);
  const [tab, setTab] = useState("Overview");
  const [market, setMarket] = useState([]);
  const [marketStatus, setMarketStatus] = useState("unavailable");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [tradePair, setTradePair] = useState("bitcoin");
  const [tradeSide, setTradeSide] = useState("buy");
  const [tradeAmount, setTradeAmount] = useState("250");
  const [tradeOrderType, setTradeOrderType] = useState("Market");
  const [showBalances, setShowBalances] = useState(true);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [watchlist, setWatchlist] = useState(["bitcoin", "ethereum", "solana"]);
  const [transactions, setTransactions] = useState([]);
  const [request, setRequest] = useState({ direction: "deposit", asset: "usdt", amount: "", network: "TRC20", country: "United States", provider: "MTN Mobile Money", phone: "", destination: "", acknowledged: false });
  const [profile, setProfile] = useState({ name: "", email: "", country: "", phone: "", kycStatus: "not_started" });

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
          return { ...base, price: item.current_price, change: Number(item.price_change_percentage_24h ?? 0), marketCap: Number(item.market_cap ?? 0), volume24h: Number(item.total_volume ?? 0), high24h: Number(item.high_24h ?? item.current_price), low24h: Number(item.low_24h ?? item.current_price), spark };
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
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 4200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const coinById = useMemo(() => Object.fromEntries(market.map(c => [c.id, c])), [market]);
  const portfolioRows = useMemo(() => market.map(coin => {
    const units = Number(walletBalances[coin.symbol] || 0);
    const value = coin.price * units;
    const divisor = 1 + (Number.isFinite(coin.change) ? coin.change : 0) / 100;
    const previousValue = divisor > 0 ? value / divisor : value;
    return { ...coin, units, value, previousValue };
  }), [market, walletBalances]);
  const portfolioValue = portfolioRows.reduce((sum, coin) => sum + (Number.isFinite(coin.value) ? coin.value : 0), 0);
  const previousValue = portfolioRows.reduce((sum, coin) => sum + (Number.isFinite(coin.previousValue) ? coin.previousValue : 0), 0);
  const dailyChange = portfolioValue - previousValue;
  const dailyChangePct = previousValue ? (dailyChange / previousValue) * 100 : 0;
  const isAdmin = authUser?.app_metadata?.role === "admin";
  const memberName = profile.name || authUser?.user_metadata?.display_name || authUser?.email?.split("@")[0] || "Account holder";
  const memberInitials = memberName.split(/\s+/).slice(0,2).map(s=>s[0] || "").join("").toUpperCase() || "GX";

  function notify(text) { setToast(text); }
  function openAuth(which) { setView(which); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function startDemo() {
    notify("Sign in or create an account to access your personal dashboard.");
    openAuth("signin");
  }
  async function signIn(e) {
    e.preventDefault();
    if (!supabaseConfigured) { notify("Account service configuration is missing."); return; }
    const form = e.currentTarget;
    setAuthBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.elements.email.value.trim(),
      password: form.elements.password.value,
    });
    setAuthBusy(false);
    if (error) { notify(error.message); return; }
    setAuthUser(data.user);
    setProfile(p => ({ ...p, email: data.user.email || "", name: data.user.user_metadata?.display_name || "", country: data.user.user_metadata?.country || "" }));
    const factors = await supabase.auth.mfa.listFactors();
    const verifiedTotp = factors.data?.totp?.find(factor => factor.status === "verified");
    if (verifiedTotp) {
      const challenge = await supabase.auth.mfa.challenge({ factorId: verifiedTotp.id });
      if (challenge.error) { notify(challenge.error.message); return; }
      setMfaLogin({ factorId: verifiedTotp.id, challengeId: challenge.data.id });
      setMfaCode("");
      setView("mfaChallenge");
      notify("Enter the code from your authenticator app.");
      return;
    }
    setView("dashboard");
    setTab("Overview");
    notify("You are signed in.");
  }
  async function signUp(e) {
    e.preventDefault();
    if (!supabaseConfigured) { notify("Account service configuration is missing."); return; }
    const form = e.currentTarget;
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;
    const displayName = form.elements.fullName.value.trim();
    const country = form.elements.country.value;
    setAuthBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: displayName, country } }
    });
    setAuthBusy(false);
    if (error) { notify(error.message); return; }
    setProfile(p => ({ ...p, name: displayName, email, country }));
    if (data.session && data.user) {
      setAuthUser(data.user);
      setView("dashboard");
      setTab("Overview");
      notify("Your account has been created.");
    } else {
      setView("signin");
      notify("Account created. Check your email for the verification link before signing in.");
    }
  }
  async function verifyMfaLogin(e) {
    e.preventDefault();
    if (!mfaLogin) return;
    setMfaBusy(true);
    const { error } = await supabase.auth.mfa.verify({ factorId: mfaLogin.factorId, challengeId: mfaLogin.challengeId, code: mfaCode.trim() });
    setMfaBusy(false);
    if (error) { notify("Authenticator verification failed. Check the code and try again."); return; }
    setMfaLogin(null);
    setMfaCode("");
    setView("dashboard");
    setTab("Overview");
    notify("Two-factor verification complete.");
  }
  async function beginMfaEnrollment() {
    setMfaBusy(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "GROEarnX authenticator" });
    setMfaBusy(false);
    if (error) { notify(error.message); return; }
    setMfaSetup({ id: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret, uri: data.totp.uri });
    setMfaCode("");
    notify("Scan the QR code with an authenticator app, then verify a code.");
  }
  async function verifyMfaEnrollment(e) {
    e.preventDefault();
    if (!mfaSetup) return;
    setMfaBusy(true);
    const challenge = await supabase.auth.mfa.challenge({ factorId: mfaSetup.id });
    if (challenge.error) { setMfaBusy(false); notify(challenge.error.message); return; }
    const { error } = await supabase.auth.mfa.verify({ factorId: mfaSetup.id, challengeId: challenge.data.id, code: mfaCode.trim() });
    setMfaBusy(false);
    if (error) { notify("That code could not be verified. Check your device clock and try again."); return; }
    setMfaSetup(null); setMfaCode("");
    const factors = await supabase.auth.mfa.listFactors();
    setMfaFactors([...(factors.data?.totp || []), ...(factors.data?.phone || [])]);
    notify("Two-factor authentication has been enabled for your account.");
  }
  async function removeMfaFactor(factorId) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) { notify(error.message); return; }
    const factors = await supabase.auth.mfa.listFactors();
    setMfaFactors([...(factors.data?.totp || []), ...(factors.data?.phone || [])]);
    notify("Authenticator factor removed.");
  }
  async function markNotificationRead(notificationId) {
    const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", notificationId).eq("user_id", authUser.id);
    if (error) { notify(error.message); return; }
    setNotifications(items => items.map(item => item.id === notificationId ? { ...item, read_at: new Date().toISOString() } : item));
  }
  async function saveProfile(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const updates = { display_name: form.elements.displayName.value.trim(), country: form.elements.country.value, phone: form.elements.phone.value.trim() };
    const { error } = await supabase.from("profiles").update(updates).eq("id", authUser.id);
    if (error) { notify(error.message); return; }
    setProfile(p => ({ ...p, name: updates.display_name, country: updates.country, phone: updates.phone }));
    notify("Profile updated.");
  }
  async function resetPassword() {
    const email = profile.email.trim();
    if (!email) { notify("Enter your email address first, then select Forgot password."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    notify(error ? error.message : "If that account exists, a password reset email has been sent.");
  }
  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) { notify(error.message); return; }
    setAuthUser(null);
    setWalletBalances({});
    setNotifications([]);
    setTransactions([]);
    setView("home");
    setTab("Overview");
    notify("You have signed out.");
  }
  useEffect(() => {
    if (!supabaseConfigured) return;
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active || error || !data.session?.user) return;
      const user = data.session.user;
      setAuthUser(user);
      setProfile(p => ({ ...p, email: user.email || "", name: user.user_metadata?.display_name || "", country: user.user_metadata?.country || "" }));
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setAuthUser(session?.user || null);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!supabaseConfigured || !authUser) return;
    let active = true;
    async function loadAccountData() {
      const [p, tx, balance, notif, plans, factors] = await Promise.all([
        supabase.from("profiles").select("display_name,country,phone,kyc_status").eq("id", authUser.id).maybeSingle(),
        supabase.from("transaction_requests").select("id,request_type,asset_code,amount,status,created_at").eq("user_id", authUser.id).order("created_at", { ascending: false }).limit(100),
        supabase.rpc("get_my_asset_balances"),
        supabase.from("notifications").select("id,category,title,body,read_at,created_at").eq("user_id", authUser.id).order("created_at", { ascending: false }).limit(50),
        supabase.from("investment_plans").select("id,name,description,asset_code,minimum_amount,maximum_amount,term_days,target_return_apr,return_type,fees_disclosure,risk_disclosure,terms_url").eq("status","active").eq("legally_reviewed",true),
        supabase.auth.mfa.listFactors(),
      ]);
      if (!active) return;
      if (p.data) setProfile(prev => ({ ...prev, name: p.data.display_name || prev.name, country: p.data.country || prev.country, phone: p.data.phone || "", kycStatus: p.data.kyc_status || "not_started" }));
      if (tx.data) setTransactions(tx.data.map(t => ({ id:t.id, type:t.request_type.replaceAll("_"," "), asset:t.asset_code, amount:Number(t.amount), unit:t.asset_code, date:new Date(t.created_at).toLocaleDateString("en-US",{month:"short",day:"2-digit",year:"numeric"}), status:t.status })));
      if (balance.data) setWalletBalances(Object.fromEntries(balance.data.map(b => [b.asset_code, Number(b.balance)])));
      if (notif.data) setNotifications(notif.data);
      if (plans.data) setInvestmentPlans(plans.data);
      if (factors.data) setMfaFactors([...(factors.data.totp || []), ...(factors.data.phone || [])]);
    }
    loadAccountData().catch(() => { if (active) notify("Some account information could not be loaded. Refresh the page or contact support."); });
    return () => { active = false; };
  }, [authUser]);
  useEffect(() => {
    if (!supabaseConfigured || !authUser || !isAdmin || tab !== "Admin") return;
    let active = true;
    Promise.all([
      supabase.from("transaction_requests").select("id,user_id,request_type,asset_code,amount,status,created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]).then(([requestResult, userResult]) => {
      if (!active) return;
      if (requestResult.data) setAdminRequests(requestResult.data);
      if (!userResult.error) setAdminUserCount(userResult.count ?? null);
    }).catch(() => { if (active) notify("The admin queue could not be loaded. Check the assigned admin role and database policies."); });
    return () => { active = false; };
  }, [authUser, isAdmin, tab]);

  function changeRequest(key, value) { setRequest(r => ({ ...r, [key]: value })); }
  function changeRequest(key, value) { setRequest(r => ({ ...r, [key]: value })); }
  function openRequest(direction, asset = "usdt") {
    setRequest({ direction, asset, amount: "", network: asset === "bitcoin" ? "Bitcoin network" : asset === "ethereum" ? "Ethereum mainnet" : "TRC20", country: profile.country || "United States", provider: "MTN Mobile Money", phone: "", destination: "", acknowledged: false });
    setModal(direction);
  }
  function submitRequest(e) {
    e.preventDefault();
    setModal(null);
    notify("Deposits and withdrawals are not enabled until the custody and payment providers complete integration and verification.");
  }

  function dashboardNav(nextTab) {
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
      <div className="market-ticker-bar"><div className="market-ticker-label"><span className="status-dot" /> MARKET WATCH</div><div className="market-ticker-items">{market.slice(0, 5).map(coin => <button key={coin.id} onClick={() => { setTradePair(coin.id); setView("dashboard"); setTab("Trade"); }}><span className="ticker-symbol">{coin.symbol}</span><b>{coin.price > 10 ? money(coin.price, 2) : money(coin.price, 4)}</b><PriceChange value={coin.change} /></button>)}</div></div>
      <main>
        <section className="hero-section">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="eyebrow"><span className="eyebrow-dot" /> CRYPTO, WITH CLARITY</span>
              <h1>Build your crypto<br className="desktop-br" /> outlook with <span>confidence.</span></h1>
              <p className="hero-subtitle">Track digital assets, understand market moves, and keep your portfolio activity in one clear view.</p>
              <div className="hero-actions"><button className="btn btn-primary btn-lg" onClick={() => openAuth("signup")}>Create your account <Icon name="arrowRight" size={16} /></button><button className="btn btn-outline btn-lg" onClick={() => document.getElementById("markets")?.scrollIntoView({behavior:"smooth"})}>View markets <Icon name="chart" size={16} /></button></div>
              <div className="hero-trust"><span><Icon name="shield" size={15} /> Security-first design</span><span><Icon name="globe" size={15} /> Built for global access</span></div>
            </div>
            <div className="hero-visual">
              <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
              <div className="float-pill pill-top"><span className="status-dot" /> Markets move. Stay informed.</div>
              <div className="hero-card">
                <div className="hero-card-head"><div><small>MARKET SNAPSHOT</small><span className="mini-live">{marketStatus === "live" ? "LIVE DATA" : "SAMPLE DATA"}</span></div><span className="round-icon"><Icon name="chart" size={17} /></span></div>
                <div className="hero-total-label">Combined market cap · top 5 assets</div>
                <div className="hero-total">{marketStatus === "live" ? compactMoney(market.reduce((sum, c) => sum + c.marketCap, 0)) : "Market feed status"}</div>
                <div className="hero-total-meta"><span className="muted-cell">{marketStatus === "live" ? "Market data feed connected" : "Waiting for public market feed"}</span><span className="data-safe"><Icon name="shield" size={13} /> Data status shown</span></div>
                <div className="hero-chart"><Sparkline values={market[0]?.spark} color="#1CA77D" width={470} height={108} fill /></div>
                <div className="hero-chart-foot"><span>Recent market trend</span><span>{marketStatus === "live" ? "CoinGecko feed" : "Illustrative fallback"}</span></div>
                <div className="mini-assets">{market.slice(0, 3).map(coin => <div className="mini-asset" key={coin.id}><CoinMark coin={coin} size="sm" /><div><small>{coin.symbol}</small><b>{coin.price > 10 ? money(coin.price, 0) : money(coin.price, 4)}</b></div><PriceChange value={coin.change} /></div>)}</div>
              </div>
              <div className="float-pill pill-bottom"><span className="tiny-spark">↗</span> A clearer view of every move</div>
            </div>
          </div>
        </section>

        <section className="trust-strip" id="features">
          <div><span className="trust-icon"><Icon name="chart" /></span><div><b>Market visibility</b><small>Prices and daily movement</small></div></div>
          <div><span className="trust-icon"><Icon name="wallet" /></span><div><b>Portfolio tools</b><small>Track assets in one place</small></div></div>
          <div><span className="trust-icon"><Icon name="shield" /></span><div><b>Risk-aware by design</b><small>No guaranteed-profit claims</small></div></div>
          <div><span className="trust-icon"><Icon name="activity" /></span><div><b>Activity overview</b><small>Clear transaction status</small></div></div>
        </section>

        <section className="market-section section-shell" id="markets">
          <div className="section-heading"><div><span className="section-kicker">THE MARKET, AT A GLANCE</span><h2>Explore digital assets</h2><p>Market prices update when the public data feed is available.</p></div><button className="text-link" onClick={() => { setView("dashboard"); setTab("Markets"); }}>Open market dashboard <Icon name="arrowRight" size={15} /></button></div>
          <div className="market-card"><div className="market-card-top"><div><b>Top cryptocurrencies</b><span className={"feed-state " + (marketStatus === "live" ? "feed-live" : "")}><i />{marketStatus === "live" ? "Live quotes" : "Illustrative sample quotes"}</span></div><span className="as-of">{lastUpdated ? "Updated " + lastUpdated.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "Connects to public market data"}</span></div><MarketTable rows={market} /></div>
          {marketStatus !== "live" && <p className="data-note"><Icon name="info" size={14} /> Prices are unavailable while the public market feed is disconnected.</p>}
        </section>

        <section className="learn-section" id="learn">
          <div className="learn-inner"><div><span className="section-kicker">LEARN BEFORE YOU MOVE</span><h2>Better information.<br /><span>More thoughtful decisions.</span></h2><p>Understand wallets, blockchain networks, volatility, and transaction fees before making a move.</p><button className="btn btn-dark" onClick={() => notify("Learning center is planned for the next build.")}>Explore learning center <Icon name="arrowRight" size={15} /></button></div><div className="learn-list"><div><span>01</span><div><b>Start with the basics</b><small>Crypto, wallets, and the blockchain in plain English.</small></div><Icon name="arrowRight" /></div><div><span>02</span><div><b>Understand risk</b><small>Volatility, fees, scams, and common warning signs.</small></div><Icon name="arrowRight" /></div><div><span>03</span><div><b>Know the network</b><small>Choose the right network and verify every address.</small></div><Icon name="arrowRight" /></div></div></div>
        </section>
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
          <form className="auth-form" onSubmit={verifyMfaLogin}><label>Authentication code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={mfaCode} onChange={e=>setMfaCode(e.target.value.replace(/\\D/g,"").slice(0,6))} placeholder="000000" required/></label><button className="btn btn-primary auth-submit" type="submit" disabled={mfaBusy || mfaCode.length!==6}>{mfaBusy ? "Verifying…" : "Verify and continue"} <Icon name="arrowRight" size={16}/></button></form>
          <div className="auth-legal">Keep your authenticator device secure. If you lose it, use the verified account-recovery process.</div>
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
          {!supabaseConfigured && <div className="preview-warning"><Icon name="info" size={17} /><span><b>Account setup required.</b> Authentication is not configured on this deployment yet.</span></div>}
          <form onSubmit={isSignup ? signUp : signIn} className="auth-form">
            {isSignup && <>
              <label>Full name<input name="fullName" autoComplete="name" placeholder="Your full name" required /></label>
              <label>Country / region<select name="country" value={profile.country} onChange={e => setProfile(p => ({ ...p, country: e.target.value }))} required><option value="">Choose your country</option>{COUNTRIES.map(country => <option key={country}>{country}</option>)}</select></label>
            </>}
            <label>Email address<input type="email" name="email" autoComplete="email" placeholder="you@example.com" required onChange={e => !isSignup && setProfile(p => ({ ...p, email: e.target.value }))} /></label>
            <label>Password<div className="password-wrap"><input type="password" name="password" autoComplete={isSignup ? "new-password" : "current-password"} minLength={8} placeholder={isSignup ? "At least 8 characters" : "Enter password"} required /><Icon name="lock" size={16} /></div></label>
            {isSignup && <div className="identity-preview"><div className="identity-preview-heading"><span><Icon name="shield" size={16} /></span><div><b>Identity verification</b><small>Verification after account creation</small></div><span className="badge-muted">Required later</span></div><p>For your protection, identity documents and ID numbers are collected only through an approved secure verification provider. Do not enter them into this form.</p></div>}
            {!isSignup && <div className="auth-options"><label className="check-row"><input type="checkbox" /> <span>Remember this device</span></label><button type="button" className="text-link" onClick={resetPassword}>Forgot password?</button></div>}
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


  function recordTradePreview(e) {
    e.preventDefault();
    notify("Live exchange execution is not connected. No order was sent or asset balance changed.");
  }

  function renderTrade() {
    if (!market.length) return <section className="panel-card route-panel"><div className="panel-heading"><div><h2>Market data unavailable</h2><p>Live public quotes could not be loaded. Trading remains unavailable until market data and an execution provider are configured.</p></div></div></section>;
    const coin = market.find(c=>c.id===tradePair) || market[0];
    const priceText = coin.price>10 ? money(coin.price,2) : money(coin.price,4);
    const amount = Number(tradeAmount || 0);
    const qty = Number.isFinite(amount) && amount>0 ? amount/coin.price : 0;
    const high = coin.high24h ?? coin.price*1.024, low = coin.low24h ?? coin.price*.976;
    const volume = coin.volume24h ?? coin.marketCap*.035;
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
          <div className="trade-chart-legend"><span><i style={{background:coin.change>=0?"#17996C":"#D65E70"}}/>{coin.symbol}/USD trend</span><span>{marketStatus==="live"?"CoinGecko market feed":"Illustrative fallback"}</span></div>
        </section>
        <section className="panel-card trade-order-panel">
          <div className="panel-heading"><div><h2>Place an order</h2><p>Order entry</p></div><span className="metric-badge">UNAVAILABLE</span></div>
          <div className="trade-side-tabs"><button className={tradeSide==="buy"?"side-buy active":""} onClick={()=>setTradeSide("buy")}>Buy {coin.symbol}</button><button className={tradeSide==="sell"?"side-sell active":""} onClick={()=>setTradeSide("sell")}>Sell {coin.symbol}</button></div>
          <div className="trade-type-tabs">{["Market","Limit"].map(type=><button type="button" key={type} className={tradeOrderType===type?"active":""} onClick={()=>setTradeOrderType(type)}>{type}</button>)}</div>
          {tradeOrderType==="Limit" && <div className="trade-limit-note"><Icon name="info" size={13}/> Limit execution is not connected.</div>}
          <form className="trade-order-form" onSubmit={recordTradePreview}>
            <label>Order value<div className="amount-input-wrap"><input type="number" min="0.01" max="1000000" step="0.01" value={tradeAmount} onChange={e=>setTradeAmount(e.target.value)} required/><span>USD</span></div></label>
            <div className="quick-amounts">{["50","100","250","500"].map(v=><button type="button" className={tradeAmount===v?"selected":""} key={v} onClick={()=>setTradeAmount(v)}>{"$"}{v}</button>)}</div>
            <div className="order-estimate"><span>Estimated {tradeSide==="buy"?"receive":"sell"} amount</span><b>{shortNumber(qty,8)} {coin.symbol}</b></div>
            <div className="order-estimate"><span>Indicative price</span><b>{priceText}</b></div>
            <div className="order-estimate"><span>Trading fee</span><b>Not calculated</b></div>
            <button className={"btn auth-submit "+(tradeSide==="buy"?"btn-primary":"trade-sell-button")} type="submit">Preview {tradeSide} order <Icon name="arrowRight" size={15}/></button>
            <p className="order-footnote">No order is transmitted, no assets are bought or sold, and balances remain unchanged.</p>
          </form>
        </section>
      </div>
      <div className="trade-lower-grid">
        <section className="panel-card depth-panel"><div className="panel-heading"><div><h2>Market depth</h2><p>Illustrative levels — not a live order book</p></div><span className="metric-badge">NOT CONNECTED</span></div>
          <div className="depth-cols"><span>Price (USD)</span><span>Amount ({coin.symbol})</span><span>Total</span></div>
          <div className="depth-half asks">{[3,2,1].map(i=>{const p=coin.price*(1+i*.0018),q=.25/i;return <div key={i} className="depth-row"><i style={{width:(28+i*17)+"%"}}/><b>{money(p,coin.price<1?4:2)}</b><span>{shortNumber(q,4)}</span><span>{money(p*q)}</span></div>})}</div>
          <div className="depth-mid"><b>{priceText}</b><PriceChange value={coin.change}/><small>Last market quote</small></div>
          <div className="depth-half bids">{[1,2,3].map(i=>{const p=coin.price*(1-i*.0018),q=.31/i;return <div key={i} className="depth-row"><i style={{width:(27+i*16)+"%"}}/><b>{money(p,coin.price<1?4:2)}</b><span>{shortNumber(q,4)}</span><span>{money(p*q)}</span></div>})}</div>
        </section>
        <section className="panel-card pair-watch-panel"><div className="panel-heading"><div><h2>Market watch</h2><p>Choose a pair to explore</p></div><span className={"feed-state "+(marketStatus==="live"?"feed-live":"")}><i/>{marketStatus==="live"?"Live":"Sample"}</span></div>
          <div className="pair-watch-list">{market.map(c=><button key={c.id} className={tradePair===c.id?"selected":""} onClick={()=>setTradePair(c.id)}><CoinMark coin={c} size="sm"/><span><b>{c.symbol}/USD</b><small>{c.name}</small></span><span className="pair-watch-price"><b>{c.price>10?money(c.price,2):money(c.price,4)}</b><PriceChange value={c.change}/></span></button>)}</div>
        </section>
      </div>
    </div>;
  }

  function renderDashboard() {
    const nav = [{ label: "Overview", icon: "grid" }, { label: "Trade", icon: "chart" }, { label: "Portfolio", icon: "wallet" }, { label: "Markets", icon: "chart" }, { label: "Activity", icon: "activity" }, { label: "Investment Plans", icon: "chart" }, { label: "Notifications", icon: "bell" }, { label: "Verification", icon: "shield" }, { label: "Security", icon: "lock" }, { label: "Profile", icon: "user" }, ...(isAdmin ? [{ label: "Admin", icon: "settings" }] : [])];
    return <div className="dashboard-layout">
      <aside className={"sidebar " + (menuOpen ? "sidebar-open" : "")}><div className="sidebar-brand"><Brand onClick={() => setView("home")} /></div><div className="sidebar-caption">WORKSPACE</div><nav className="sidebar-nav">{nav.map(item => <button className={tab === item.label ? "selected" : ""} key={item.label} onClick={() => dashboardNav(item.label)}><Icon name={item.icon} size={18} />{item.label}{item.label === "Verification" && profile.kycStatus !== "verified" && <span className="nav-count">!</span>}{item.label === "Notifications" && notifications.some(n=>!n.read_at) && <span className="nav-count">{notifications.filter(n=>!n.read_at).length}</span>}</button>)}</nav><div className="sidebar-bottom"><div className="support-card"><span className="support-icon"><Icon name="shield" /></span><b>Need a hand?</b><small>Talk to the GROEarnX support team.</small><a href={WHATSAPP_URL} target="_blank" rel="noreferrer">Contact support <Icon name="arrowRight" size={13} /></a></div><button className="sidebar-home" onClick={() => setView("home")}><Icon name="arrowRight" size={15} /> Back to website</button><div className="sidebar-member"><span className="member-avatar">{memberInitials}</span><span><b>{memberName}</b><small>{authUser?.email || "Verified account"}</small></span><button title="Sign out" onClick={signOut}><Icon name="external" size={14}/></button></div></div></aside>
      <main className="dashboard-main"><header className="dashboard-topbar"><button className="mobile-menu dash-menu" onClick={() => setMenuOpen(v => !v)} aria-label="Toggle dashboard menu"><Icon name="menu" /></button><div className="breadcrumbs">Workspace <span>/</span> <b>{tab}</b></div><div className="dashboard-top-actions"><span className="demo-chip"><span className="status-dot" /> ACCOUNT ACTIVE</span><button className="icon-button" aria-label="Notifications" onClick={() => setTab("Notifications")}><Icon name="bell" /></button><span className="top-avatar">{memberInitials}</span></div></header>
        <div className="dashboard-content"><div className="dashboard-welcome"><div><span className="section-kicker">YOUR WORKSPACE</span><h1>{tab === "Overview" ? `Welcome back, ${memberName}.` : tab}</h1><p>{tab === "Overview" ? "Here is your portfolio, settled activity and current market information." : dashboardDescription(tab)}</p></div><div className="dashboard-welcome-actions"><button className="btn btn-outline" onClick={() => openRequest("withdraw")}> <Icon name="arrowDown" size={15} /> Withdraw</button><button className="btn btn-primary" onClick={() => openRequest("deposit")}> <Icon name="plus" size={15} /> Deposit</button></div></div>
          <div className="dashboard-demo-banner"><span><Icon name="info" size={17} /></span><div><b>Your account overview</b><p>Only posted ledger balances are shown here. Market-price changes can increase or decrease the value of your holdings. Deposits, withdrawals and trading require verified service integrations.</p></div><button onClick={() => notify("Real balances should come from a server-side ledger reconciled with trusted wallet/payment providers.")}>How balances work <Icon name="arrowRight" size={13} /></button></div>
          {tab === "Overview" && <>
            <div className="dashboard-metric-grid">
              <section className="metric-card primary-metric"><div className="metric-label"><span>Portfolio value</span><button className="eye-toggle" aria-label="Toggle sample balance visibility" onClick={() => setShowBalances(v => !v)}><Icon name="eye" size={16} /></button></div><div className="metric-number">{showBalances ? money(portfolioValue) : "••••••••"}</div><div className="metric-foot"><span className={"metric-change " + (dailyChange >= 0 ? "positive" : "negative")}>{dailyChange >= 0 ? "+" : "−"}{money(Math.abs(dailyChange))} ({changeText(dailyChangePct)})</span><span>24h portfolio change</span></div><div className="metric-chart"><Sparkline values={market.find(c => c.id === "bitcoin")?.spark} color="#FFFFFF" width={350} height={77} fill /></div><small className="metric-period">{marketStatus === "live" ? "Calculated from posted units × live prices" : "Portfolio value updates when settled units and current market quotes are available"}</small></section>
              <section className="metric-card"><div className="metric-card-top"><span className="metric-icon"><Icon name="wallet" /></span><span className="metric-badge">ACCOUNT</span></div><div className="metric-label">Assets tracked</div><div className="metric-number small-number">{portfolioRows.filter(c => c.units > 0).length}</div><p className="metric-caption">Assets with posted balances</p><button className="metric-link" onClick={() => setTab("Portfolio")}>View portfolio <Icon name="arrowRight" size={14} /></button></section>
              <section className="metric-card"><div className="metric-card-top"><span className="metric-icon purple"><Icon name="activity" /></span><span className="metric-badge">SESSION</span></div><div className="metric-label">Activity requests</div><div className="metric-number small-number">{transactions.length}</div><p className="metric-caption">Account activity loaded from your records</p><button className="metric-link" onClick={() => setTab("Activity")}>View activity <Icon name="arrowRight" size={14} /></button></section>
            </div>
            <div className="content-grid-main">
              <section className="panel-card portfolio-panel"><div className="panel-heading"><div><h2>Portfolio allocation</h2><p>Posted asset balances valued in USD</p></div><button className="text-link" onClick={() => setTab("Portfolio")}>View details <Icon name="arrowRight" size={14} /></button></div>
                <div className="allocation-body"><div className="donut-wrap"><div className="donut-chart" style={{ background: donutGradient(portfolioRows) }}><div><strong>{showBalances ? compactMoney(portfolioValue) : "••••"}</strong><small>Portfolio total</small></div></div></div><div className="allocation-list">{portfolioRows.filter(c => c.value > 0).sort((a,b) => b.value-a.value).slice(0,5).map(c => <div className="allocation-item" key={c.id}><span className="allocation-dot" style={{ background: c.color }} /><span className="allocation-name">{c.name}</span><b>{portfolioValue ? (c.value / portfolioValue * 100).toFixed(1) : "0.0"}%</b></div>)}</div></div>
              </section>
              <section className="panel-card quick-actions-panel"><div className="panel-heading"><div><h2>Quick actions</h2><p>Deposit and withdrawal availability</p></div></div><button className="action-tile" onClick={() => openRequest("deposit")}><span className="action-tile-icon deposit"><Icon name="arrowDown" /></span><span><b>Make a deposit request</b><small>Crypto or mobile money · provider required</small></span><Icon name="arrowRight" size={16} /></button><button className="action-tile" onClick={() => openRequest("withdraw")}><span className="action-tile-icon withdraw"><Icon name="arrowUp" /></span><span><b>Make a withdrawal request</b><small>Payout provider required</small></span><Icon name="arrowRight" size={16} /></button><button className="action-tile" onClick={() => setTab("Markets")}><span className="action-tile-icon market"><Icon name="chart" /></span><span><b>Explore the market</b><small>Check price movements</small></span><Icon name="arrowRight" size={16} /></button></section>
            </div>
            <section className="panel-card dashboard-market-panel"><div className="panel-heading"><div><h2>Market watch</h2><p>{marketStatus === "live" ? "Public market quotes · USD" : "Illustrative sample quotes · USD"}</p></div><button className="text-link" onClick={() => setTab("Markets")}>All markets <Icon name="arrowRight" size={14} /></button></div><MarketTable rows={market.slice(0,4)} /></section>
            <section className="panel-card activity-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Recent activity from your account.</p></div><button className="text-link" onClick={() => setTab("Activity")}>View activity <Icon name="arrowRight" size={14} /></button></div><ActivityTable items={transactions.slice(0,3)} /></section>
          </>}
          {tab === "Trade" && renderTrade()}
          {tab === "Portfolio" && <section className="panel-card route-panel"><div className="panel-heading"><div><h2>Your assets</h2><p>Quantity × public market quote. Only posted ledger balances are included.</p></div><button className="btn btn-primary btn-sm" onClick={() => openRequest("deposit")}><Icon name="plus" size={14}/> Deposit request</button></div><div className="portfolio-summary-strip"><span>Portfolio value</span><strong>{showBalances ? money(portfolioValue) : "••••••"}</strong><button className="eye-toggle" onClick={() => setShowBalances(v => !v)}><Icon name="eye" size={15}/></button></div><div className="table-wrap"><table className="market-table portfolio-table"><thead><tr><th>Asset</th><th>Units</th><th>Price</th><th>Value</th><th>24h</th></tr></thead><tbody>{portfolioRows.map(c=><tr key={c.id}><td><div className="asset-cell"><CoinMark coin={c}/><div><b>{c.name}</b><small>{c.symbol}</small></div></div></td><td>{shortNumber(c.units,8)} {c.symbol}</td><td>{c.price > 10 ? money(c.price) : money(c.price,4)}</td><td><b>{showBalances ? money(c.value) : "••••"}</b></td><td><PriceChange value={c.change}/></td></tr>)}</tbody></table></div></section>}
          {tab === "Markets" && <section className="panel-card route-panel"><div className="panel-heading"><div><h2>Crypto markets</h2><p>{marketStatus === "live" ? "Current public market data and price changes." : "Live quote feed unavailable. Prices are not displayed until a fresh quote is received."}</p></div><span className={"feed-state " + (marketStatus === "live" ? "feed-live" : "")}><i />{marketStatus === "live" ? "Live quotes" : "Unavailable"}</span></div><MarketTable rows={market}/><p className="data-note"><Icon name="info" size={14}/> Market prices change frequently. This page is informational and does not execute trades.</p></section>}
          {tab === "Activity" && <section className="panel-card route-panel"><div className="panel-heading"><div><h2>Transaction activity</h2><p>Requests and status updates recorded for your account.</p></div><div className="inline-buttons"><button className="btn btn-outline btn-sm" onClick={() => openRequest("withdraw")}>Withdraw</button><button className="btn btn-primary btn-sm" onClick={() => openRequest("deposit")}>Deposit</button></div></div><ActivityTable items={transactions}/><div className="activity-note"><Icon name="info" size={16}/> A real ledger must only mark a deposit settled after provider or blockchain confirmation.</div></section>}
          {tab === "Investment Plans" && <section className="panel-card route-panel plans-page"><div className="panel-heading"><div><h2>Investment plans</h2><p>Only legally reviewed plans approved by the operator are shown here.</p></div><span className="status-label status-pending">Availability subject to authorization</span></div>
            {investmentPlans.length===0 ? <div className="empty-state"><Icon name="info" size={25}/><b>No investment plans are currently available.</b><span>Plans will appear only after their terms, fees, risks, eligibility and regulatory approvals have been reviewed and activated.</span></div> : <div className="plan-grid">{investmentPlans.map(plan=><article className="plan-card" key={plan.id}><div className="plan-card-head"><span className="plan-asset">{plan.asset_code}</span><span className="status-label status-ok">Available</span></div><h3>{plan.name}</h3><p>{plan.description}</p><div className="plan-stats"><span>Minimum<b>{shortNumber(Number(plan.minimum_amount),8)} {plan.asset_code}</b></span><span>Term<b>{plan.term_days ? plan.term_days+" days" : "Flexible"}</b></span><span>Return disclosure<b>{plan.return_type==="none"?"No return offered":plan.return_type==="variable"?"Variable; not guaranteed":"See full plan terms"}</b></span></div><details><summary>Fees and risk disclosures</summary><p>{plan.fees_disclosure}</p><p>{plan.risk_disclosure}</p>{plan.terms_url && <a href={plan.terms_url} target="_blank" rel="noreferrer">Plan terms <Icon name="external" size={12}/></a>}</details></article>)}</div>}
          </section>}
          {tab === "Notifications" && <section className="panel-card route-panel notifications-page"><div className="panel-heading"><div><h2>Notifications</h2><p>Account, security and transaction notices delivered to your account.</p></div><span className="status-label status-demo">{notifications.filter(n=>!n.read_at).length} unread</span></div>
            {notifications.length===0 ? <div className="empty-state"><Icon name="bell" size={25}/><b>No notifications yet.</b><span>Security and transaction notifications will appear here when generated by the account service.</span></div> : <div className="notification-list">{notifications.map(n=><article className={"notification-item "+(!n.read_at?"unread":"")} key={n.id}><span className="notification-icon"><Icon name={n.category==="security"?"shield":n.category==="transaction"?"activity":"bell"} size={17}/></span><div className="notification-body"><div className="notification-title-row"><b>{n.title}</b><time>{new Date(n.created_at).toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short"})}</time></div><p>{n.body}</p><small>{n.category}</small></div>{!n.read_at && <button className="text-link" onClick={()=>markNotificationRead(n.id)}>Mark read</button>}</article>)}</div>}
          </section>}
          {tab === "Security" && <section className="panel-card route-panel security-page"><div className="panel-heading"><div><h2>Security settings</h2><p>Use a unique password and enable an authenticator app for stronger sign-in security.</p></div><span className={"status-label "+(mfaFactors.some(f=>f.status==="verified")?"status-ok":"status-pending")}>{mfaFactors.some(f=>f.status==="verified")?"MFA enabled":"MFA not enabled"}</span></div>
            <div className="security-summary"><span className="security-summary-icon"><Icon name="shield" size={25}/></span><div><b>Authenticator-based two-factor authentication</b><p>When enabled, sign-in requires both your password and a current code from your authenticator app. Keep recovery options secure.</p></div></div>
            {mfaSetup ? <div className="mfa-enroll-box"><h3>Set up your authenticator</h3><p>Scan the QR code with an authenticator app. If scanning is unavailable, enter the setup key manually.</p>{mfaSetup.qrCode && <img className="mfa-qr" src={mfaSetup.qrCode} alt="Authenticator setup QR code"/>}<label>Manual setup key <code>{mfaSetup.secret}</code></label><form className="mfa-code-form" onSubmit={verifyMfaEnrollment}><label>Six-digit code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={mfaCode} onChange={e=>setMfaCode(e.target.value.replace(/\D/g,"").slice(0,6))} required/></label><button className="btn btn-primary" type="submit" disabled={mfaBusy||mfaCode.length!==6}>{mfaBusy?"Verifying…":"Verify and enable MFA"}</button></form><button className="text-link" onClick={()=>{setMfaSetup(null);setMfaCode("");}}>Cancel setup</button></div>
            : <div className="security-actions">{mfaFactors.length>0 && <div className="security-factor-list">{mfaFactors.map(f=><div key={f.id}><span><Icon name="lock" size={15}/></span><div><b>{f.friendly_name||"Authenticator"}</b><small>{f.factor_type.toUpperCase()} · {f.status}</small></div>{f.status==="verified" && <button className="btn btn-outline btn-sm" onClick={()=>removeMfaFactor(f.id)}>Remove</button>}</div>)}</div>}<button className="btn btn-primary" disabled={mfaBusy||mfaFactors.some(f=>f.factor_type==="totp"&&f.status==="verified")} onClick={beginMfaEnrollment}>{mfaBusy?"Preparing…":mfaFactors.some(f=>f.status==="verified")?"Authenticator enabled":"Set up authenticator MFA"} <Icon name="arrowRight" size={14}/></button></div>}
            <div className="activity-note"><Icon name="info" size={16}/> If you lose your authenticator, account recovery must verify your identity. Never share one-time codes or recovery phrases with support.</div>
          </section>}
          {tab === "Verification" && <section className="panel-card route-panel verification-page"><div className="panel-heading"><div><h2>Identity verification</h2><p>Secure verification must be completed through an approved KYC provider when required.</p></div><span className={"status-label "+(profile.kycStatus==="verified"?"status-ok":"status-pending")}><i/>{profile.kycStatus==="verified"?"Verified":profile.kycStatus==="pending"?"In review":"Not verified"}</span></div><div className="verification-steps"><div className="verification-step"><span>01</span><div><b>Country / region</b><p>{profile.country || "Add your country in profile settings."}</p></div><span className="status-label status-ok">{profile.country?"Provided":"Required"}</span></div><div className="verification-step"><span>02</span><div><b>National ID or driving permit</b><p>Submit documents only through the secure identity provider when that integration is available. Do not send ID images over chat.</p></div><span className="status-label status-pending">Provider required</span></div><div className="verification-step"><span>03</span><div><b>Review and approval</b><p>Account limits and regulated features depend on the verified result.</p></div><span className={"status-label "+(profile.kycStatus==="verified"?"status-ok":"status-pending")}>{profile.kycStatus.replaceAll("_"," ")}</span></div></div><button className="btn btn-outline" onClick={() => setTab("Profile")}>Review profile <Icon name="arrowRight" size={14}/></button></section>}
          {tab === "Profile" && <section className="panel-card route-panel profile-page"><div className="panel-heading"><div><h2>Profile &amp; preferences</h2><p>Update your contact and region information.</p></div><span className="status-label status-ok">Authenticated</span></div><form className="profile-edit-form" onSubmit={saveProfile}><label>Display name<input name="displayName" value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))} required maxLength={100}/></label><label>Email address<input value={profile.email} readOnly disabled/></label><label>Country / region<select name="country" value={profile.country} onChange={e=>setProfile(p=>({...p,country:e.target.value}))} required><option value="">Choose your country</option>{COUNTRIES.map(country=><option key={country}>{country}</option>)}</select></label><label>Phone number<input name="phone" value={profile.phone||""} onChange={e=>setProfile(p=>({...p,phone:e.target.value}))} autoComplete="tel" maxLength={40} placeholder="+1…"/></label><button className="btn btn-primary" type="submit">Save profile <Icon name="check" size={15}/></button></form><div className="profile-grid"><div className="profile-field"><span>Identity verification</span><b>{profile.kycStatus==="verified"?"Verified":"Not verified"}</b></div><div className="profile-field"><span>Account status</span><b>Authenticated</b></div></div><div className="activity-note"><Icon name="shield" size={16}/> National ID and driving-permit details belong in the secure KYC provider flow, not ordinary profile fields.</div></section>}
          {tab === "Admin" && isAdmin && <section className="panel-card route-panel admin-page"><div className="panel-heading"><div><h2>Administration</h2><p>Read-only operational view. Use server-side admin functions for approvals and provider actions.</p></div><span className="status-label status-ok">Restricted access</span></div><div className="admin-summary-grid"><div><small>Registered profiles</small><b>{adminUserCount===null?"—":adminUserCount}</b></div><div><small>Requests listed</small><b>{adminRequests.length}</b></div><div><small>Needs review</small><b>{adminRequests.filter(x=>["submitted","under_review","awaiting_payment"].includes(x.status)).length}</b></div></div><div className="table-wrap"><table className="market-table"><thead><tr><th>Request ID</th><th>User</th><th>Type</th><th>Asset</th><th>Amount</th><th>Status</th><th>Created</th></tr></thead><tbody>{adminRequests.map(r=><tr key={r.id}><td>{r.id.slice(0,8)}</td><td>{r.user_id.slice(0,8)}…</td><td>{r.request_type.replaceAll("_"," ")}</td><td>{r.asset_code}</td><td>{shortNumber(Number(r.amount),8)}</td><td><span className="status-label status-pending">{r.status.replaceAll("_"," ")}</span></td><td>{new Date(r.created_at).toLocaleDateString("en-US")}</td></tr>)}</tbody></table>{adminRequests.length===0 && <div className="empty-state"><b>No transaction requests found.</b></div>}</div><div className="activity-note"><Icon name="shield" size={16}/> Admin role must be granted by a trusted server/admin operator in Supabase app metadata. Never set admin access from a public signup form or user-editable metadata.</div></section>}
          <div className="dashboard-disclaimer">GROEarnX financial services become available only after the relevant custody, exchange and payment providers are configured.</div>
        </div>
      </main>
      {renderRequestModal()}
    </div>;
  }

  function renderRequestModal() {
    if (!modal) return null;
    const deposit = modal === "deposit";
    const asset = ASSET_OPTIONS.find(a => a.id === request.asset) || ASSET_OPTIONS[0];
    return <div className="modal-scrim" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setModal(null); }}><section className="request-modal" role="dialog" aria-modal="true" aria-labelledby="request-heading"><div className="modal-head"><div><span className="section-kicker">{deposit ? "ADD TO YOUR ACCOUNT" : "MOVE ASSETS OUT"}</span><h2 id="request-heading">{deposit ? "Deposit request" : "Withdrawal request"}</h2><p>Provider integration required</p></div><button className="icon-button" aria-label="Close" onClick={() => setModal(null)}><Icon name="close" /></button></div>
      <div className="modal-asset-grid">{ASSET_OPTIONS.map(a=><button key={a.id} className={"asset-select " + (request.asset === a.id ? "asset-selected" : "")} onClick={() => { changeRequest("asset",a.id); changeRequest("network",a.id === "bitcoin" ? "Bitcoin network" : a.id === "ethereum" ? "Ethereum mainnet" : "TRC20"); }}><span className="coin-mark sm" style={{"--coin":a.color}}>{a.mark}</span><span>{a.label}</span>{request.asset === a.id && <Icon name="check" size={14}/>}</button>)}</div>
      <form className="request-form" onSubmit={submitRequest}><label>Amount {asset.type === "mobile" ? (request.country === "Uganda" ? "(UGX)" : "(USD)") : "(" + (asset.id === "bitcoin" ? "BTC" : asset.id === "ethereum" ? "ETH" : "USDT") + ")"}
        <div className="amount-input-wrap"><input type="number" min="0.000001" step="any" value={request.amount} onChange={e => changeRequest("amount",e.target.value)} placeholder="0.00" required/><span>{asset.type === "mobile" ? (request.country === "Uganda" ? "UGX" : "USD") : asset.id === "bitcoin" ? "BTC" : asset.id === "ethereum" ? "ETH" : "USDT"}</span></div></label>
        {asset.type === "crypto" ? <label>Network<select value={request.network} onChange={e=>changeRequest("network",e.target.value)}>{(asset.id === "bitcoin" ? ["Bitcoin network"] : asset.id === "ethereum" ? ["Ethereum mainnet"] : ["TRC20","ERC20"]).map(n=><option key={n}>{n}</option>)}</select><small className="field-help">Only choose a real network after wallet infrastructure and the matching deposit/withdrawal address are configured.</small></label> : <><label>Country / region<select value={request.country} onChange={e=>changeRequest("country",e.target.value)}>{COUNTRIES.map(c=><option key={c}>{c}</option>)}</select></label><label>Mobile money provider<select value={request.provider} onChange={e=>changeRequest("provider",e.target.value)}>{["MTN Mobile Money","Airtel Money","M-Pesa","Other provider"].map(p=><option key={p}>{p}</option>)}</select></label><label>Mobile money phone number<input type="tel" value={request.phone} onChange={e=>changeRequest("phone",e.target.value)} placeholder="+256 … / country code" required/><small className="field-help">A payment provider must be connected before this can initiate a payment.</small></label></>}
        {!deposit && asset.type === "crypto" && <label>Destination wallet address<input value={request.destination} onChange={e=>changeRequest("destination",e.target.value)} placeholder="Destination address (not sent in preview)" required/><small className="field-help">Never send to an address until the network and recipient have been independently verified.</small></label>}
        <div className="request-warning"><Icon name="info" size={17}/><span><b>Service unavailable.</b> {deposit ? "A verified custody wallet or mobile-money collection provider is not connected." : "Withdrawals are disabled until a verified custody wallet or payout provider is connected."} Do not send funds to this platform yet.</span></div>
        <label className="check-row request-check"><input type="checkbox" required checked={request.acknowledged} onChange={e=>changeRequest("acknowledged",e.target.checked)}/><span>I understand the requested service is currently unavailable and this form will not move funds.</span></label>
        <button className="btn btn-primary auth-submit" type="submit" disabled>{deposit ? "Deposits unavailable" : "Withdrawals unavailable"}</button>
      </form>
    </section></div>;
  }

  function ActivityTable({ items }) {
    return <div className="table-wrap"><table className="market-table activity-table"><thead><tr><th>Activity</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td><div className="activity-name"><span className={"activity-badge " + (item.type.toLowerCase().includes("withdraw") ? "activity-out" : item.type.toLowerCase().includes("deposit") ? "activity-in" : "")}>{item.type.toLowerCase().includes("withdraw") ? <Icon name="arrowUp" size={15}/> : item.type.toLowerCase().includes("deposit") ? <Icon name="arrowDown" size={15}/> : <Icon name="activity" size={15}/>}</span><div><b>{item.type}</b><small>{item.id} · {item.asset}</small></div></div></td><td><b>{shortNumber(item.amount,8)} {item.unit}</b></td><td className="muted-cell">{item.date}</td><td><span className={"status-label " + (item.status === "Confirmed" ? "status-ok" : item.status === "Illustrative" ? "status-demo" : "status-pending")}>{item.status}</span></td></tr>)}</tbody></table></div>;
  }

  function dashboardDescription(activeTab) {
    return ({
      "Portfolio": "Review the sample asset quantities and their current estimated market value.",
      "Markets": "Track public market quotes; sample fallback values are clearly marked.",
      "Activity": "Review requests in this browser session. They are not completed financial transactions.",
      "Verification": "Understand the secure identity checks required before a real account can be enabled.",
      "Profile": "Review the information fields planned for a future authenticated account.",
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
    <div className="preview-ribbon"><span className="status-dot" /> GROEarnX <span>— crypto markets, portfolio information and account management</span></div>
    {view === "home" && renderHome()}
    {(view === "signin" || view === "signup") && renderAuth(view === "signup")}
    {view === "mfaChallenge" && renderMfaChallenge()}
    {view === "dashboard" && (authUser ? renderDashboard() : renderAuth(false))}
    <a className="whatsapp-float" href={WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label="Chat with GROEarnX support on WhatsApp"><span className="whatsapp-glyph">◉</span><span className="whatsapp-label">Chat with us</span></a>
    {legalPage && renderLegalModal()}
    {toast && <div className="toast" role="status"><span><Icon name="info" size={18}/></span><p>{toast}</p><button aria-label="Dismiss notification" onClick={()=>setToast("")}><Icon name="close" size={15}/></button></div>}
  </div>;
}

export default App;
