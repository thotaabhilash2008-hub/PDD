// frontend/src/App.tsx
import React, { useState, useEffect } from "react";
import {
  Activity, AlertCircle, Award, Bell, Brain, CheckCircle,
  Droplet, Heart, MapPin, QrCode, Search, Globe,
  RefreshCw, User, LogOut, ChevronDown, BookOpen, Calendar, HelpCircle, Navigation, Database
} from "lucide-react";
import AdminPanel from "./components/AdminPanel";

const API_BASE = "http://localhost:4000";

// Types
interface BloodRequest {
  id: string;
  patientName: string;
  bloodGroup: string;
  volumeMl: number;
  urgency: "Normal" | "Priority" | "Emergency";
  status: "PENDING" | "MATCHING" | "ALLOCATED" | "IN_TRANSIT" | "DELIVERED";
  location: string;
  hospitalName: string;
  createdAt: string;
}

export default function App() {
  // Synchronize route with URL pathname for /admin routing
  const getInitialRoute = ():
    | "dashboard" | "request" | "donate" | "inbox" | "map" | "health" | "emergency"
    | "history" | "impact" | "rewards" | "stories" | "volunteer" | "events" | "landing" | "auth" | "admin" => {
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
      return "admin";
    }
    return "landing";
  };

  const [currentRoute, setCurrentRouteState] = useState<
    "dashboard" | "request" | "donate" | "inbox" | "map" | "health" | "emergency" |
    "history" | "impact" | "rewards" | "stories" | "volunteer" | "events" | "landing" | "auth" | "admin"
  >(getInitialRoute);

  const setCurrentRoute = (route: typeof currentRoute) => {
    setCurrentRouteState(route);
    if (typeof window !== "undefined") {
      if (route === "admin") {
        if (!window.location.pathname.startsWith("/admin")) {
          window.history.pushState({}, "", "/admin");
        }
      } else {
        if (window.location.pathname.startsWith("/admin")) {
          window.history.pushState({}, "", "/");
        }
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith("/admin")) {
        setCurrentRouteState("admin");
      } else {
        setCurrentRouteState((prev) => (prev === "admin" ? "dashboard" : prev));
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Auth roles
  const [authRole, setAuthRole] = useState<"donor" | "agency">("donor");
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; city: string } | null>(null);

  // Global UI states
  const [userLocation, setUserLocation] = useState<string>("Select Location");
  const [showLocationMenu, setShowLocationMenu] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<string[]>([
    "Welcome to Hemo Connect. Set your location to filter alerts.",
    "Notification: Live drone dispatcher operational in Hyderabad Zone."
  ]);

  // Vitals simulation
  const [wearableData, setWearableData] = useState({
    heartRate: 72,
    bloodPressure: "120/80",
    bodyTemp: 36.6
  });

  // Requests queue
  const [requests, setRequests] = useState<BloodRequest[]>([
    {
      id: "req-201",
      patientName: "Alice Smith",
      bloodGroup: "O+",
      volumeMl: 450,
      urgency: "Emergency",
      status: "PENDING",
      location: "Bengaluru",
      hospitalName: "Fortis Hospital, Bannerghatta Road",
      createdAt: new Date(Date.now() - 300000).toISOString()
    },
    {
      id: "req-202",
      patientName: "Ramesh Kumar",
      bloodGroup: "O-",
      volumeMl: 900,
      urgency: "Emergency",
      status: "PENDING",
      location: "Hyderabad",
      hospitalName: "Apollo Hospital, Jubilee Hills",
      createdAt: new Date(Date.now() - 600000).toISOString()
    }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWearableData({
        heartRate: Math.floor(Math.random() * (82 - 68 + 1)) + 68,
        bloodPressure: "120/80",
        bodyTemp: parseFloat((Math.random() * (36.8 - 36.4) + 36.4).toFixed(1))
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const addNotification = (msg: string) => {
    setNotifications(prev => [msg, ...prev]);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setUserProfile({
      name: authRole === "donor" ? "John Doe" : "City General Hospital",
      email: emailInput || "user@example.com",
      city: "Bengaluru"
    });
    setUserLocation("Bengaluru");
    setCurrentRoute("dashboard");
    addNotification(`Logged in successfully as ${authRole === "donor" ? "Donor" : "Agency"}`);
  };

  const handleLogout = () => {
    setUserProfile(null);
    setCurrentRoute("landing");
  };

  // Check layout types: is it landing or auth page?
  const isFullScreenPage = currentRoute === "landing" || currentRoute === "auth";

  // Sidebar navigation options list
  const navItems = [
    { id: "dashboard", label: "Dashboard", category: "Terminals", icon: Activity },
    { id: "request", label: "Request Terminal", category: "Terminals", icon: Search },
    { id: "donate", label: "Donor Hub", category: "Terminals", icon: Heart },
    { id: "map", label: "Live GIS Map", category: "Terminals", icon: Globe },
    { id: "inbox", label: "Alert Inbox", category: "Terminals", icon: Bell },
    { id: "emergency", label: "Emergency Chatbot", category: "Terminals", icon: HelpCircle },
    { id: "admin", label: "Database Admin", category: "Administration", icon: Database },
    { id: "impact", label: "Shortage Forecast", category: "Insights & Community", icon: Brain },
    { id: "history", label: "Donation History", category: "Insights & Community", icon: BookOpen },
    { id: "rewards", label: "Rewards & Rank", category: "Insights & Community", icon: Award },
    { id: "stories", label: "Success Stories", category: "Insights & Community", icon: Award },
    { id: "volunteer", label: "Volunteer Node", category: "Insights & Community", icon: User },
    { id: "events", label: "Events Calendar", category: "Insights & Community", icon: Calendar },
    { id: "health", label: "Health Guides", category: "Insights & Community", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen relative font-sans text-slate-200 flex flex-col">
      {/* Background animated blobs */}
      <div className="background-animation">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {currentRoute === "admin" ? (
        // Dedicated Full-Page /admin route
        <div className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto animate-fadeIn">
          <AdminPanel
            onBackToApp={() => {
              setCurrentRoute("dashboard");
            }}
          />
        </div>
      ) : isFullScreenPage ? (
        // Full screen presentation pages (Landing & Auth)
        <main className="flex-1 flex items-center justify-center p-6 min-h-screen">
          {currentRoute === "landing" && (
            <div className="text-center max-w-lg mx-auto glass-panel-premium p-8 py-14 space-y-8 animate-fadeIn relative overflow-hidden border border-white/5 shadow-2xl">
              <div className="logo-neon justify-center">
                <Droplet className="w-16 h-16 text-blood-600 fill-blood-600 heartbeat-icon" />
                <div className="text-left font-sans">
                  <h2 className="text-4xl font-black tracking-wider leading-none">
                    <span className="hemo">HEMO</span><span className="connect">CONNECT</span>
                  </h2>
                  <p className="text-[10px] text-slate-500 tracking-widest font-mono font-bold mt-1 uppercase">INTELLIGENT BLOOD LOGISTICS</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
                Autonomous real-time logistics, smart donor compatibility matching, and predictive deficiency forecasts.
              </p>
              <button
                onClick={() => setCurrentRoute("auth")}
                className="w-full max-w-xs py-4 btn-premium text-xs cursor-pointer tracking-widest font-bold uppercase"
              >
                Enter Ops Terminal
              </button>
            </div>
          )}

          {currentRoute === "auth" && (
            <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-2xl overflow-hidden glass-panel-premium border border-white/5 shadow-2xl min-h-[500px]">
              {/* Left Column - Real-time network telemetry */}
              <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 to-slate-900 border-r border-slate-900/60 p-8 flex flex-col justify-between hidden lg:flex font-mono relative scanline-overlay">
                <div className="space-y-4">
                  <div className="logo-neon">
                    <Droplet className="w-6 h-6 text-blood-600 fill-blood-600 heartbeat-icon" />
                    <span className="text-sm font-extrabold tracking-wider"><span className="hemo text-white">HEMO</span><span className="connect text-blood-500">CONNECT</span></span>
                  </div>
                  <div className="space-y-2 text-[10px] text-slate-500 leading-normal">
                    <p className="text-cyan-400 font-bold">[NODE STATUS: ONLINE]</p>
                    <p>SYSTEM CORE: DIJKSTRA v4.2</p>
                    <p>MATCH FORECASTER: RIDGE REGRESSION</p>
                    <p>ACTIVE LOGISTICS DISPATCHERS: 18</p>
                    <p>NETWORK INTEGRITY SECURE: 100%</p>
                  </div>
                </div>

                {/* Animated HUD graphic */}
                <div className="w-full h-32 border border-slate-900 bg-slate-950/80 rounded-xl relative overflow-hidden flex items-center justify-center font-mono text-[9px] text-slate-600 uppercase tracking-widest hud-grid">
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
                    <div className="w-8 h-8 rounded-full border border-dashed border-blood-500/40 animate-spin flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-blood-500 animate-ping"></div>
                    </div>
                    <span>RADAR SCAN</span>
                  </div>
                </div>

                <span className="text-[9px] text-slate-600 uppercase">HEMO CONNECT OPS CENTRE</span>
              </div>

              {/* Right Column - Login Forms */}
              <div className="lg:col-span-7 p-8 flex flex-col justify-center space-y-6 bg-slate-950/20 backdrop-blur-xl">
                <div className="logo-neon lg:hidden justify-center mb-2">
                  <Droplet className="w-8 h-8 text-blood-600 fill-blood-600 heartbeat-icon" />
                  <span className="text-xl font-extrabold"><span className="hemo">HEMO</span><span className="connect">CONNECT</span></span>
                </div>

                {/* Role Tabs */}
                <div className="flex border border-slate-800 rounded-xl p-1 bg-slate-950/80">
                  <button
                    onClick={() => setAuthRole("donor")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      authRole === "donor" ? "bg-gradient-to-r from-blood-700 to-rose-600 text-white shadow-md shadow-blood-700/20" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Donor Portal
                  </button>
                  <button
                    onClick={() => setAuthRole("agency")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      authRole === "agency" ? "bg-gradient-to-r from-blood-700 to-rose-600 text-white shadow-md shadow-blood-700/20" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Hospital / Node
                  </button>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white tracking-wide">
                    {isSignUp ? "Initialize Coordinator Pool" : "Access System Terminal"}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {authRole === "donor" ? "Manage live status pool and trace active alerts." : "Request matches, logs, and trace optimized routes."}
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  {isSignUp && (
                    <div>
                      <label className="text-[9px] text-slate-500 font-mono block mb-1 tracking-wider uppercase">FULL CO-ORDINATOR NAME</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter full name"
                        className="input-premium py-2.5 text-xs"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-[9px] text-slate-500 font-mono block mb-1 tracking-wider uppercase">SECURE EMAIL IDENTIFICATION</label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="credentials@hemoconnect.org"
                      className="input-premium py-2.5 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 font-mono block mb-1 tracking-wider uppercase">ACCESS PASS KEY</label>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="input-premium py-2.5 text-xs"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 btn-premium text-xs tracking-widest font-bold uppercase cursor-pointer"
                  >
                    {isSignUp ? "Create Node" : "Validate Credentials"}
                  </button>
                </form>

                <div className="flex flex-col gap-3 text-center text-xs border-t border-slate-900 pt-4">
                  <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {isSignUp ? "Already registered? Login to terminal" : "Create new coordinator node profile"}
                  </button>
                  <button
                    onClick={() => {
                      setUserProfile({ name: "Guest Coordinator", email: "guest@hemoconnect.org", city: "Bengaluru" });
                      setUserLocation("Bengaluru");
                      setCurrentRoute("dashboard");
                      addNotification("Entered terminal in Guest Mode");
                    }}
                    className="text-cyan-400 hover:underline font-mono font-bold uppercase tracking-wider text-[10px]"
                  >
                    Bypass Authentication (Guest Mode)
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      ) : (
        // Logged-in structure: Left Navigation Sidebar & Main Command Deck
        <div className="flex-1 flex flex-col md:flex-row min-h-screen">
          {/* Persistent Left Sidebar Navigation */}
          <aside className="w-full md:w-64 bg-slate-950/80 border-r border-slate-900 flex flex-col justify-between shrink-0 z-40 backdrop-blur-xl relative">
            <div className="p-5 flex flex-col space-y-6">
              {/* Branding Droplet */}
              <div className="logo-neon cursor-pointer flex items-center gap-2" onClick={() => setCurrentRoute("dashboard")}>
                <Droplet className="w-8 h-8 text-blood-600 fill-blood-600 heartbeat-icon" />
                <div className="logo-text">
                  <div className="logo-main text-base tracking-widest font-black leading-none">
                    <span className="hemo">HEMO</span><span className="connect">CONNECT</span>
                  </div>
                  <p className="text-[8px] text-slate-500 tracking-widest font-mono font-bold mt-1 uppercase">OPERATIONS CONSOLE</p>
                </div>
              </div>

              {/* Navigation Group items */}
              <nav className="space-y-4">
                {/* Terminals Group */}
                <div>
                  <h4 className="text-[9px] font-mono text-slate-500 tracking-wider font-bold mb-2 uppercase">CORE TERMINALS</h4>
                  <ul className="space-y-1">
                    {navItems
                      .filter(item => item.category === "Terminals")
                      .map(item => {
                        const Icon = item.icon;
                        const isActive = currentRoute === item.id;
                        return (
                          <li key={item.id}>
                            <button
                              onClick={() => setCurrentRoute(item.id as any)}
                              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer border ${
                                isActive
                                  ? "bg-gradient-to-r from-blood-700/20 to-rose-650/10 border-blood-800/80 text-white shadow-md shadow-blood-900/10 glow-cyan"
                                  : "bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40"
                              }`}
                            >
                              <Icon className={`w-4 h-4 ${isActive ? "text-blood-500" : "text-slate-400"}`} />
                              <span>{item.label}</span>
                            </button>
                          </li>
                        );
                      })}
                  </ul>
                </div>

                {/* Administration Group */}
                <div>
                  <h4 className="text-[9px] font-mono text-blood-400 tracking-wider font-bold mb-2 uppercase flex items-center justify-between">
                    <span>ADMINISTRATION</span>
                    <span className="text-[7px] px-1.5 py-0.5 bg-blood-950/90 border border-blood-800/80 rounded text-blood-300 font-bold">ROOT</span>
                  </h4>
                  <ul className="space-y-1">
                    {navItems
                      .filter(item => item.category === "Administration")
                      .map(item => {
                        const Icon = item.icon;
                        const isActive = currentRoute === item.id;
                        return (
                          <li key={item.id}>
                            <button
                              onClick={() => setCurrentRoute(item.id as any)}
                              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer border ${
                                isActive
                                  ? "bg-gradient-to-r from-blood-700/30 to-rose-650/20 border-blood-600/80 text-white shadow-md shadow-blood-900/30 glow-red"
                                  : "bg-slate-950/40 border-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-900/60 hover:border-slate-800"
                              }`}
                            >
                              <Icon className={`w-4 h-4 ${isActive ? "text-blood-400" : "text-blood-500"}`} />
                              <span>{item.label}</span>
                            </button>
                          </li>
                        );
                      })}
                  </ul>
                </div>

                {/* Insights Group */}
                <div>
                  <h4 className="text-[9px] font-mono text-slate-500 tracking-wider font-bold mb-2 uppercase">INSIGHTS & DATA</h4>
                  <ul className="space-y-1 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                    {navItems
                      .filter(item => item.category === "Insights & Community")
                      .map(item => {
                        const Icon = item.icon;
                        const isActive = currentRoute === item.id;
                        return (
                          <li key={item.id}>
                            <button
                              onClick={() => setCurrentRoute(item.id as any)}
                              className={`w-full flex items-center gap-3 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer border ${
                                isActive
                                  ? "bg-gradient-to-r from-blood-700/20 to-rose-650/10 border-blood-800/80 text-white shadow-md shadow-blood-900/10 glow-cyan"
                                  : "bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40"
                              }`}
                            >
                              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blood-500" : "text-slate-400"}`} />
                              <span>{item.label}</span>
                            </button>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              </nav>
            </div>

            {/* User status info badge */}
            <div className="p-4 border-t border-slate-900 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blood-700 to-rose-650 flex items-center justify-center text-xs font-bold text-white shadow-[0_0_10px_rgba(229,57,53,0.3)]">
                  {userProfile?.name ? userProfile.name.charAt(0) : "G"}
                </div>
                <div className="overflow-hidden">
                  <span className="text-xs font-bold text-white block truncate max-w-[110px]">{userProfile?.name || "Guest User"}</span>
                  <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-wider block">ID: {authRole.toUpperCase()}_NODE</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 border border-slate-900 hover:border-red-900/40 bg-slate-950/40 rounded-xl text-slate-400 hover:text-red-400 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </aside>

          {/* Right Hand Workspace Section */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Unified Top Header Bar */}
            <header className="border-b border-slate-900 bg-cyber-card/75 backdrop-blur-xl px-6 py-4 flex items-center justify-between z-30 sticky top-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold uppercase text-white tracking-widest font-mono">
                  {navItems.find(item => item.id === currentRoute)?.label || "OPS DECK"}
                </h1>
                <span className="hidden sm:inline px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[8px] font-mono font-bold text-slate-500 uppercase">SYS_OK</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Manual Location Selector Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowLocationMenu(!showLocationMenu)}
                    className="px-3 py-1.5 border border-slate-900 bg-slate-950/80 hover:bg-slate-900/50 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all text-slate-300 hover:text-white cursor-pointer"
                  >
                    <MapPin className="w-3 h-3 text-blood-500" />
                    <span>{userLocation}</span>
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>
                  {showLocationMenu && (
                    <div className="absolute right-0 mt-2 w-52 bg-slate-950 border border-slate-900 rounded-xl p-2 shadow-2xl z-50 max-h-60 overflow-y-auto">
                      <button
                        onClick={() => {
                          setUserLocation("Bengaluru");
                          setShowLocationMenu(false);
                          addNotification("Location set to Bengaluru (GPS Autodetect)");
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-[10px] text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-all border-b border-slate-900/60 pb-1.5 mb-1.5 font-mono font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Navigation className="w-3 h-3 text-cyan-400" /> Live GPS Match
                      </button>
                      <p className="text-[8px] text-slate-500 font-mono font-bold px-2 mb-1 uppercase tracking-wider">Select Hub Node</p>
                      {["Bengaluru", "Hyderabad", "Mumbai", "Delhi", "Chennai"].map(city => (
                        <button
                          key={city}
                          onClick={() => {
                            setUserLocation(city);
                            setShowLocationMenu(false);
                            addNotification(`Location set manually to ${city}`);
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-[10px] text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
                        >
                          {city} Hub
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* DB Admin Quick Access Button */}
                <button
                  onClick={() => setCurrentRoute("admin")}
                  className="px-3 py-1.5 border border-slate-900 bg-slate-950/80 hover:bg-slate-900/50 text-slate-300 hover:text-white rounded-xl text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Database Admin Console (/admin)"
                >
                  <Database className="w-3.5 h-3.5 text-blood-500" />
                  <span className="hidden sm:inline">DB Admin</span>
                </button>

                {/* System Notifications Drawer */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-1.5 border border-slate-900 rounded-xl bg-slate-950/80 hover:bg-slate-900/50 text-slate-400 hover:text-white transition-all relative cursor-pointer"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blood-600 rounded-full animate-pulse"></span>
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-72 bg-slate-950 border border-slate-900 rounded-xl p-3 shadow-2xl z-50">
                      <h4 className="text-[9px] font-mono text-slate-500 border-b border-slate-900 pb-1.5 mb-2 uppercase tracking-wider">OPERATIONAL ALERTS LOG</h4>
                      <div className="space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar">
                        {notifications.map((n, i) => (
                          <div key={i} className="flex gap-2 text-[10px] border-b border-slate-900/40 pb-2 last:border-0 last:pb-0 leading-normal">
                            <AlertCircle className="w-3.5 h-3.5 text-blood-500 shrink-0 mt-0.5" />
                            <span className="text-slate-300 font-mono">{n}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Main view router area */}
            <main className="flex-1 p-6 overflow-y-auto max-w-6xl w-full mx-auto">
              
              {/* Dashboard operational deck */}
              {currentRoute === "dashboard" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Title card HUD */}
                  <div className="glass-panel-premium p-6 bg-gradient-to-r from-slate-950 to-blood-950/10 border border-white/5 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blood-500 heartbeat-icon" /> CONTROL_NODE: ACTIVE_DISPATCH_DECK
                      </h2>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">Operations telemetry feed for {userLocation} zone hubs.</p>
                    </div>
                    <div className="flex gap-2 text-[9px] font-mono text-slate-400">
                      <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded">GPS: ONLINE</span>
                      <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-emerald-400 animate-pulse">VITAL: TELEMETRY_OK</span>
                    </div>
                  </div>

                  {/* Operational metrics widgets */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <HUDCard title="Active Alerts" value={requests.filter(r => r.status === "PENDING" && r.location === userLocation).length.toString()} color="text-blood-500 shadow-blood-500/10" desc="Pending compatibility routing" icon={AlertCircle} />
                    <HUDCard title="Operational Hubs" value="18 Nodes" color="text-cyan-400 shadow-cyan-400/10" desc="Dijkstra routing online" icon={Globe} />
                    <HUDCard title="Safety trust index" value="100/100" color="text-emerald-400 shadow-emerald-400/10" desc="AI fraud check security score" icon={CheckCircle} />
                    <HUDCard title="Active Transports" value={requests.filter(r => r.status === "IN_TRANSIT").length.toString()} color="text-yellow-500 shadow-yellow-500/10" desc="Drones in flight coordinates" icon={Navigation} />
                  </div>

                  {/* Grid details */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Live vital monitor + forecast simulation on Dashboard */}
                    <div className="lg:col-span-4 space-y-6">
                      
                      {/* Wearable widget */}
                      <div className="glass-panel-premium p-4 space-y-3 border border-white/5">
                        <h3 className="font-bold text-white text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-1.5">
                          <Activity className="w-3.5 h-3.5 text-cyan-400 heartbeat-icon" /> Wearable Status Check
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-center font-mono">
                          <div className="p-2 border border-slate-900 bg-slate-950/60 rounded-xl space-y-1">
                            <span className="text-[8px] text-slate-500 block">HEART RATE</span>
                            <span className="text-xs font-bold text-white flex items-center justify-center gap-1">
                              <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" /> {wearableData.heartRate} bpm
                            </span>
                          </div>
                          <div className="p-2 border border-slate-900 bg-slate-950/60 rounded-xl space-y-1">
                            <span className="text-[8px] text-slate-500 block">BODY TEMP</span>
                            <span className="text-xs font-bold text-slate-200">{wearableData.bodyTemp} °C</span>
                          </div>
                        </div>

                        {/* Scrolling EKG wave graphic */}
                        <div className="h-12 border border-slate-900 bg-slate-950/80 rounded-xl overflow-hidden flex items-center relative">
                          <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                            <path
                              d="M 0,15 L 15,15 L 20,15 L 23,2 L 27,28 L 30,15 L 45,15 L 60,15 L 63,2 L 67,28 L 70,15 L 85,15 L 100,15"
                              fill="none"
                              stroke="#00d2ff"
                              strokeWidth="1.5"
                              className="signal-path"
                              style={{ animationDuration: '2.5s' }}
                            />
                          </svg>
                          <span className="absolute right-2 bottom-1 text-[7px] font-mono text-slate-600">LIVE FEED</span>
                        </div>
                      </div>

                      {/* AI Integrity Audit Level */}
                      <div className="glass-panel-premium p-4 space-y-3 border border-white/5">
                        <h3 className="font-bold text-white text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-1.5">
                          🛡️ AI SECURITY INTEGRITY GAUGE
                        </h3>
                        <div className="relative pt-1 font-mono">
                          <div className="flex mb-1.5 items-center justify-between text-[9px]">
                            <span className="font-semibold py-0.5 px-2 rounded-full text-emerald-400 bg-emerald-950/30 border border-emerald-900/30 font-mono">
                              VERIFIED SECURE
                            </span>
                            <span className="text-sm font-bold text-emerald-400 font-mono">100%</span>
                          </div>
                          <div className="overflow-hidden h-2.5 mb-2 text-xs flex rounded bg-slate-900 border border-slate-900">
                            <div style={{ width: "100%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
                          </div>
                          <p className="text-[7px] text-slate-500 leading-normal font-mono">IP AND TELEMETRY VERIFICATION STABLE. NO HOAX SIGNALS DETECTED IN LOG RANGE.</p>
                        </div>
                      </div>
                    </div>

                    {/* Operational telemetry log feed */}
                    <div className="lg:col-span-8 glass-panel-premium p-5 flex flex-col justify-between min-h-[300px] border border-white/5 scanline-overlay">
                      <div>
                        <h3 className="font-bold text-white border-b border-slate-900 pb-3 mb-4 text-[10px] font-mono uppercase tracking-wider flex items-center justify-between">
                          <span>SYSTEM LOGS STREAM (TERMINAL FEED)</span>
                          <span className="text-cyan-400 font-mono text-[9px] animate-pulse">● LIVE_FEED</span>
                        </h3>
                        
                        <div className="space-y-2.5 font-mono text-[10px] text-slate-400 max-h-56 overflow-y-auto custom-scrollbar pr-2 leading-relaxed">
                          <p className="text-slate-500">[2026-06-07T21:55:00] Initializing logistics dispatcher modules...</p>
                          <p className="text-slate-500">[2026-06-07T21:55:02] Loading Ridge Regression predictive deficit models...</p>
                          <p className="text-slate-500">[2026-06-07T21:55:05] Dijkstra spatial route optimizer active...</p>
                          <p className="text-emerald-400 font-semibold">[2026-06-07T21:56:12] GPS Link connected: autodetect location set to Bengaluru Hub.</p>
                          {notifications.map((n, i) => (
                            <p key={i} className="text-slate-300">[{new Date().toISOString().slice(0, 19)}] {n}</p>
                          ))}
                        </div>
                      </div>

                      {/* Shortcut buttons */}
                      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-900/60 text-center font-mono">
                        <button
                          onClick={() => setCurrentRoute("request")}
                          className="px-4 py-2.5 bg-slate-950/80 border border-slate-900 hover:border-slate-800 rounded-xl text-[10px] font-bold text-white hover:bg-slate-900 transition-all cursor-pointer"
                        >
                          🩸 REQUEST EMERGENCY DISPATCH
                        </button>
                        <button
                          onClick={() => setCurrentRoute("map")}
                          className="px-4 py-2.5 bg-slate-950/80 border border-slate-900 hover:border-slate-800 rounded-xl text-[10px] font-bold text-cyan-400 hover:bg-slate-900 transition-all cursor-pointer"
                        >
                          🗺️ VIEW DOCK GIS RADAR
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 12 Sub-routes mapping */}
              {currentRoute === "request" && (
                <RequestFlow setRequests={setRequests} addNotification={addNotification} userLocation={userLocation} />
              )}

              {currentRoute === "donate" && (
                <DonateFlow wearableData={wearableData} addNotification={addNotification} />
              )}

              {currentRoute === "inbox" && (
                <DonorInbox requests={requests} setRequests={setRequests} addNotification={addNotification} userLocation={userLocation} />
              )}

              {currentRoute === "map" && <LiveNetworkMap />}
              {currentRoute === "health" && <HealthTips />}
              {currentRoute === "emergency" && <EmergencyChat />}
              {currentRoute === "history" && <DonationHistory />}
              {currentRoute === "impact" && <ImpactDashboard />}
              {currentRoute === "rewards" && <RewardsPage />}
              {currentRoute === "stories" && <SuccessStories />}
              {currentRoute === "volunteer" && <VolunteerForm addNotification={addNotification} />}
              {currentRoute === "events" && <EventsCalendar />}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}

// HUDCard component for statistics dashboard widgets
function HUDCard({ title, value, color, desc, icon: Icon }: { title: string; value: string; color: string; desc: string; icon: any }) {
  return (
    <div className="glass-panel-premium p-4 border border-white/5 flex items-center justify-between shadow-md relative overflow-hidden select-none hover:shadow-2xl transition-all">
      <div className="space-y-1">
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block font-bold">{title}</span>
        <span className={`text-2xl font-black font-mono tracking-tight block ${color.split(" ")[0]}`}>{value}</span>
        <span className="text-[8px] font-mono text-slate-500 leading-none block">{desc}</span>
      </div>
      <div className={`p-2 border border-slate-900/60 rounded-xl bg-slate-950/80 ${color.split(" ")[1]} z-10 shrink-0`}>
        <Icon className={`w-5 h-5 ${color.split(" ")[0]}`} />
      </div>
    </div>
  );
}

/* ========================================================
   1. REQUEST BLOOD FLOW
   ======================================================== */
function RequestFlow({
  setRequests,
  addNotification,
  userLocation
}: {
  setRequests: React.Dispatch<React.SetStateAction<BloodRequest[]>>;
  addNotification: (msg: string) => void;
  userLocation: string;
}) {
  const [flowTab, setFlowTab] = useState<"hospitals" | "donors">("hospitals");
  const [bloodGroup, setBloodGroup] = useState("");
  const [urgency, setUrgency] = useState<"Normal" | "Priority" | "Emergency">("Normal");
  const [loading, setLoading] = useState(false);
  const [resultsDonors, setResultsDonors] = useState<any[]>([]);
  const [resultsBanks, setResultsBanks] = useState<any[]>([]);
  const [fraudScore, setFraudScore] = useState<any | null>(null);

  const handleSearch = async () => {
    if (!bloodGroup) {
      alert("Please select a blood group");
      return;
    }
    setLoading(true);
    setFraudScore(null);
    
    try {
      const coords = { lat: 17.3850, lng: 78.4867 };
      if (userLocation === "Bengaluru") { coords.lat = 12.9716; coords.lng = 77.5946; }
      else if (userLocation === "Hyderabad") { coords.lat = 17.3850; coords.lng = 78.4867; }
      else if (userLocation === "Mumbai") { coords.lat = 19.0760; coords.lng = 72.8777; }
      else if (userLocation === "Delhi") { coords.lat = 28.7041; coords.lng = 77.1025; }
      else if (userLocation === "Chennai") { coords.lat = 13.0827; coords.lng = 80.2707; }

      // 1. Run fraud check
      const fraudRes = await fetch(`${API_BASE}/api/fraud-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: "+91 98765 43210",
          locationText: `${userLocation} Hub`,
          patientCondition: `Emergency request for ${bloodGroup} units`
        })
      });
      const fraudData = await fraudRes.json();
      setFraudScore(fraudData);

      // 2. Fetch matched donors
      const res = await fetch(`${API_BASE}/api/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bloodGroup: bloodGroup.replace("+", "_POSITIVE").replace("-", "_NEGATIVE"),
          latitude: coords.lat,
          longitude: coords.lng
        })
      });
      const data = await res.json();
      
      if (flowTab === "donors" && data.matchedDonors) {
        setResultsDonors(data.matchedDonors.map((d: any) => ({
          name: d.name,
          blood: d.bloodGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-"),
          distance: `${d.distanceKm} km`,
          eta: `${d.estTravelTimeMin} mins`,
          score: d.matchScore,
          likelihood: d.responseLikelihoodPct
        })));
        setResultsBanks([]);
      } else if (flowTab === "hospitals" && data.matchedBloodBanks) {
        setResultsBanks(data.matchedBloodBanks.map((b: any) => ({
          name: b.name,
          stock: b.stockAvailable,
          distance: `${b.distanceKm} km`,
          eta: `${b.estimatedArrivalMin} mins`,
          score: b.confidenceScore
        })));
        setResultsDonors([]);
      }

      // 3. Create request
      const reqRes = await fetch(`${API_BASE}/api/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientCondition: `Emergency request for ${bloodGroup} units`,
          bloodGroup: bloodGroup.replace("+", "_POSITIVE").replace("-", "_NEGATIVE"),
          volumeMl: 450,
          priority: urgency === "Emergency" ? "CRITICAL" : (urgency === "Priority" ? "HIGH" : "MEDIUM"),
          hospitalName: `${userLocation} General Hospital`,
          latitude: coords.lat,
          longitude: coords.lng
        })
      });
      const reqData = await reqRes.json();

      const newReq: BloodRequest = {
        id: reqData.id || `req-${Date.now()}`,
        patientName: `Patient Alert (${bloodGroup})`,
        bloodGroup: bloodGroup,
        volumeMl: 450,
        urgency,
        status: "PENDING",
        location: userLocation,
        hospitalName: `${userLocation} General Hospital`,
        createdAt: new Date().toISOString()
      };
      setRequests(prev => [newReq, ...prev]);
      addNotification(`Blood Search: ${bloodGroup} compatibility matched on radar`);
    } catch (e: any) {
      console.error(e);
      alert("Error matching donors. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Brain className="w-4 h-4 text-blood-500" /> Request Blood Terminal
        </h2>
        <span className="text-[9px] font-mono text-slate-500">Intelligent Logistics Matcher</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel-premium p-5 space-y-4 h-fit border border-white/5 shadow-md">
          {/* Tabs */}
          <div className="flex border border-slate-900 rounded-xl p-1 bg-slate-950/80">
            <button
              onClick={() => { setFlowTab("hospitals"); setResultsDonors([]); setResultsBanks([]); }}
              className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                flowTab === "hospitals" ? "bg-gradient-to-r from-blood-700 to-rose-600 text-white shadow-md shadow-blood-700/20" : "text-slate-400 hover:text-white"
              }`}
            >
              🏥 Nearby Hospitals
            </button>
            <button
              onClick={() => { setFlowTab("donors"); setResultsDonors([]); setResultsBanks([]); }}
              className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                flowTab === "donors" ? "bg-gradient-to-r from-blood-700 to-rose-600 text-white shadow-md shadow-blood-700/20" : "text-slate-400 hover:text-white"
              }`}
            >
              🩸 Request Donors
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[9px] text-slate-500 font-mono block mb-1">BLOOD GROUP NEEDED</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="select-premium text-[11px]"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] text-slate-500 font-mono block mb-1">URGENCY LEVEL</label>
              <div className="grid grid-cols-3 gap-2">
                {(["Normal", "Priority", "Emergency"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setUrgency(level)}
                    className={`py-2 text-[9px] font-bold rounded-lg border transition-all cursor-pointer ${
                      urgency === level
                        ? "bg-gradient-to-r from-blood-700 to-rose-600 border-blood-500/30 text-white shadow-md"
                        : "bg-slate-950 border-slate-900 text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleSearch}
            className="w-full py-3 btn-premium text-xs tracking-wider cursor-pointer font-bold uppercase"
          >
            {flowTab === "hospitals" ? "🏥 Find Nearby Hospitals" : "🩸 Find Donors"}
          </button>

          {/* AI Integrity Check Results */}
          {fraudScore && (
            <div className={`p-4 border rounded-xl font-mono text-[9px] space-y-2 leading-relaxed ${fraudScore.isSuspicious ? 'bg-red-950/20 border-red-900/40 text-red-200 shadow-[0_0_15px_rgba(229,57,53,0.1)]' : 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.1)]'}`}>
              <span className="font-bold block uppercase tracking-wider">
                🛡️ AI Integrity: {fraudScore.isSuspicious ? 'Suspicious Request' : 'Verified Secure'}
              </span>
              <p>Trust Score Index: <span className="font-bold">{fraudScore.trustScore}/100</span></p>
              <ul className="list-disc pl-4 space-y-1">
                {fraudScore.reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="lg:col-span-2 glass-panel-premium p-6 min-h-[350px] border border-white/5 shadow-md">
          <h3 className="font-bold text-white border-b border-slate-900 pb-3 mb-4 text-xs font-mono uppercase tracking-wider">
            {flowTab === "hospitals" ? "🏥 Nearby Hospitals & Blood Banks" : "🩸 Available Donors"}
          </h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-60 space-y-4">
              <RefreshCw className="w-8 h-8 text-blood-500 animate-spin" />
              <p className="text-xs text-slate-500 font-mono">Running RF compatibility searches...</p>
            </div>
          ) : resultsDonors.length > 0 ? (
            <div className="space-y-4">
              {resultsDonors.map((donor, idx) => (
                <div key={idx} className="p-4 border border-slate-900 bg-slate-950/30 rounded-xl flex items-center justify-between hover:border-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blood-600/10 border border-blood-500/20 flex items-center justify-center text-xs font-bold text-white shadow-[0_0_10px_rgba(229,57,53,0.1)]">
                      {donor.blood}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-white">{donor.name}</span>
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">Distance: {donor.distance} | ETA: {donor.eta} | Likelihood: {donor.likelihood}%</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400 border border-cyan-800/20 px-2 py-0.5 rounded bg-cyan-950/20">{donor.score}% match</span>
                </div>
              ))}
            </div>
          ) : resultsBanks.length > 0 ? (
            <div className="space-y-4">
              {resultsBanks.map((bank, idx) => (
                <div key={idx} className="p-4 border border-slate-900 bg-slate-950/30 rounded-xl flex items-center justify-between hover:border-slate-800 transition-colors">
                  <div>
                    <span className="font-bold text-sm text-white">{bank.name}</span>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">Available Stock: {bank.stock} Units | Distance: {bank.distance} | ETA: {bank.eta}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400 border border-cyan-800/20 px-2 py-0.5 rounded bg-cyan-950/20">{bank.score}% match</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-52 text-slate-500">
              <Search className="w-10 h-10 text-slate-900 mb-2" />
              <p className="text-xs font-mono">Input parameters to search node reserves.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================================================
   2. DONATE BLOOD FLOW
   ======================================================== */
function DonateFlow({
  wearableData,
  addNotification
}: {
  wearableData: any;
  addNotification: (msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O_POSITIVE");
  const [availability, setAvailability] = useState("Available");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    addNotification(`DONOR REGISTER: Active node updated for ${name} (${bloodGroup})`);
    setName("");
    setEmail("");
    alert("Donor registered successfully!");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-slate-900 pb-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Heart className="w-4 h-4 text-blood-500 animate-pulse" /> Register as a Donor
        </h2>
        <p className="text-xs text-slate-400 mt-0.5 font-mono">Register dispatch pools and coordinate availability nodes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel-premium p-5 space-y-4 h-fit border border-white/5 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[9px] text-slate-500 font-mono block mb-1">DONOR CO-ORDINATOR NAME</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="input-premium py-2.5 text-xs"
                required
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-500 font-mono block mb-1">SECURE EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                className="input-premium py-2.5 text-xs"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] text-slate-500 font-mono block mb-1">BLOOD GROUP</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="select-premium text-[11px]"
                >
                  <option value="O_POSITIVE">O+</option>
                  <option value="O_NEGATIVE">O-</option>
                  <option value="A_POSITIVE">A+</option>
                  <option value="A_NEGATIVE">A-</option>
                  <option value="B_POSITIVE">B+</option>
                  <option value="B_NEGATIVE">B-</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] text-slate-500 font-mono block mb-1">DISPATCH STATE</label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="select-premium text-[11px]"
                >
                  <option>Available</option>
                  <option>Busy</option>
                  <option>Offline</option>
                </select>
              </div>
            </div>

            <button type="submit" className="w-full py-3 btn-premium text-xs tracking-wider cursor-pointer font-bold uppercase">
              Register Donor
            </button>
          </form>
        </div>

        {/* Center: Live Wearables */}
        <div className="glass-panel-premium p-6 space-y-4 border border-white/5 shadow-md">
          <h3 className="font-bold text-white text-[10px] font-mono uppercase tracking-wider flex items-center gap-2 border-b border-slate-900 pb-2">
            <Activity className="w-4 h-4 text-cyan-400 heartbeat-icon" /> Wearable Status Check
          </h3>
          <div className="grid grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-3 border border-slate-900 bg-slate-950/60 rounded-xl text-center space-y-1">
              <span className="text-[9px] text-slate-500 block">HEART RATE</span>
              <span className="text-sm font-bold text-white flex items-center justify-center gap-1">
                <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" /> {wearableData.heartRate} bpm
              </span>
            </div>
            <div className="p-3 border border-slate-900 bg-slate-950/60 rounded-xl text-center space-y-1">
              <span className="text-[9px] text-slate-500 block">BODY TEMP</span>
              <span className="text-sm font-bold text-slate-200">{wearableData.bodyTemp} °C</span>
            </div>
          </div>

          {/* EKG heartbeat line */}
          <div className="h-16 border border-slate-900 bg-slate-950/80 rounded-xl overflow-hidden flex items-center relative">
            <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path
                d="M 0,15 L 15,15 L 20,15 L 23,2 L 27,28 L 30,15 L 45,15 L 60,15 L 63,2 L 67,28 L 70,15 L 85,15 L 100,15"
                fill="none"
                stroke="#00d2ff"
                strokeWidth="1.5"
                className="signal-path"
                style={{ animationDuration: '2s' }}
              />
            </svg>
          </div>
        </div>

        {/* Right: Digital Passport */}
        <div className="glass-panel-premium p-6 space-y-4 border border-white/5 shadow-md">
          <h3 className="font-bold text-white text-[10px] font-mono uppercase tracking-wider border-b border-slate-900 pb-2">Digital Passport</h3>
          <div className="bg-gradient-to-br from-blood-900/10 to-slate-950 border border-slate-900 rounded-xl p-4 flex items-center justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] hover:border-slate-800 transition-colors">
            <div className="space-y-1 font-mono text-[10px]">
              <span className="text-xs font-bold text-white block">PASS CODE: HC-99</span>
              <span className="text-[9px] text-cyan-400 block uppercase font-bold">Bronze Level Donor</span>
            </div>
            <QrCode className="w-9 h-9 text-slate-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================
   3. DONOR INBOX FLOW
   ======================================================== */
function DonorInbox({
  requests,
  setRequests,
  addNotification,
  userLocation
}: {
  requests: BloodRequest[];
  setRequests: React.Dispatch<React.SetStateAction<BloodRequest[]>>;
  addNotification: (msg: string) => void;
  userLocation: string;
}) {
  const filtered = requests.filter(r => r.location.toLowerCase() === userLocation.toLowerCase() && r.status === "PENDING");

  const handleAccept = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "IN_TRANSIT" } : r));
    addNotification(`ALERT ACCEPTED: Drone coordinate logistics dispatched for case ${id}`);
    alert("Dispatched blood logistics transport drone!");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-blood-500" /> Donor Inbox Alert Queue
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">Incoming priority requests in the {userLocation} zone.</p>
        </div>
        <span className="text-[8px] font-mono text-cyan-400 border border-cyan-800/30 px-2 py-0.5 rounded">GPS SYNCED</span>
      </div>

      <div className="glass-panel-premium p-6 min-h-[350px] border border-white/5 shadow-md">
        {filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map(req => (
              <div key={req.id} className="p-4 border border-slate-900 bg-slate-950/20 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-800 transition-colors">
                <div>
                  <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-[8px] text-slate-400 font-mono rounded font-bold">CASE: {req.id}</span>
                  <h4 className="text-sm font-bold text-white mt-2 flex items-center gap-2">
                    {req.patientName} ({req.bloodGroup})
                    {req.urgency === "Emergency" && (
                      <span className="px-2 py-0.5 bg-blood-950/40 text-blood-400 border border-blood-800/40 text-[8px] rounded font-mono font-bold animate-pulse">EMERGENCY DISPATCH</span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">{req.hospitalName}</p>
                </div>
                <button
                  onClick={() => handleAccept(req.id)}
                  className="px-4 py-2.5 bg-blood-600 hover:bg-blood-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-blood-600/25"
                >
                  Accept Dispatch Alert
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-52 text-slate-500">
            <CheckCircle className="w-10 h-10 text-emerald-400 mb-2" />
            <p className="text-xs font-mono">No active alerts pending in {userLocation} Hub.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ========================================================
   4. LIVE GIS RADAR MAP (SVG INTERACTIVE VERSION)
   ======================================================== */
function LiveNetworkMap() {
  const [startNode, setStartNode] = useState("N1");
  const [endNode, setEndNode] = useState("N4");
  const [trafficBegumpet, setTrafficBegumpet] = useState(false);
  const [roadClosureHitech, setRoadClosureHitech] = useState(false);
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<any | null>(null);

  const calculateRoute = async () => {
    setLoading(true);
    setRouteResult(null);
    try {
      const traffic: Record<string, number> = {};
      if (trafficBegumpet) {
        traffic["N2->N3"] = 3.2; 
      }
      const closures: string[] = [];
      if (roadClosureHitech) {
        closures.push("N8->N4");
      }

      const res = await fetch(`${API_BASE}/api/ai/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startNode, endNode, traffic, closures })
      });
      const data = await res.json();
      setRouteResult(data);
    } catch (e) {
      console.error(e);
      alert("Error generating route from AI Gateway. Ensure backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  const nodeNames: Record<string, string> = {
    'N1': "Secunderabad Hub (N1)",
    'N2': "Begumpet Junction (N2)",
    'N3': "Jubilee Hills Checkpost (N3)",
    'N4': "Gachibowli Ring (N4)",
    'N5': "Banjara Hills Rd 1 (N5)",
    'N6': "Nampally Station (N6)",
    'N7': "Charminar Area (N7)",
    'N8': "Hitech City Gate (N8)"
  };

  const nodeCoords: Record<string, {x: number, y: number, type: "hub" | "junction"}> = {
    N1: { x: 80, y: 80, type: "hub" },
    N2: { x: 180, y: 70, type: "junction" },
    N3: { x: 280, y: 90, type: "junction" },
    N4: { x: 420, y: 150, type: "hub" },
    N5: { x: 220, y: 170, type: "junction" },
    N6: { x: 140, y: 250, type: "junction" },
    N7: { x: 80, y: 300, type: "hub" },
    N8: { x: 360, y: 90, type: "junction" }
  };

  const edges = [
    { from: "N1", to: "N2" },
    { from: "N2", to: "N3" },
    { from: "N3", to: "N8" },
    { from: "N8", to: "N4" },
    { from: "N2", to: "N5" },
    { from: "N5", to: "N3" },
    { from: "N5", to: "N6" },
    { from: "N6", to: "N7" },
    { from: "N1", to: "N6" },
    { from: "N4", to: "N6" }
  ];

  const getPathSvgD = (path: string[]) => {
    return path.map((node, i) => {
      const coord = nodeCoords[node];
      if (!coord) return "";
      return `${i === 0 ? "M" : "L"} ${coord.x} ${coord.y}`;
    }).join(" ");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-blood-500 animate-pulse-slow" /> Live GIS Donor Network
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">Dijkstra routing optimization map.</p>
        </div>
        <span className="text-[8px] font-mono text-cyan-400 border border-cyan-800/30 px-2 py-0.5 rounded">Dijkstra Engine</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 glass-panel-premium p-5 space-y-4 border border-white/5 shadow-md h-fit">
          <h3 className="font-bold text-white text-[10px] font-mono uppercase tracking-wider">Logistics Modifiers</h3>
          
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[9px] text-slate-500 font-mono block mb-1">START DISPATCH HUB</label>
              <select value={startNode} onChange={e => setStartNode(e.target.value)} className="select-premium text-[11px]">
                {Object.entries(nodeNames).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-[9px] text-slate-500 font-mono block mb-1">DESTINATION NODE</label>
              <select value={endNode} onChange={e => setEndNode(e.target.value)} className="select-premium text-[11px]">
                {Object.entries(nodeNames).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>

            <div className="border-t border-slate-900 pt-3 space-y-2 font-mono text-[10px]">
              <label className="text-[9px] text-slate-500 block mb-1">ROAD TRAFFIC OVERRIDES</label>
              <label className="flex items-center gap-2.5 cursor-pointer py-1 text-slate-400 hover:text-white transition-colors">
                <input type="checkbox" checked={trafficBegumpet} onChange={e => setTrafficBegumpet(e.target.checked)} className="rounded border-slate-900 accent-blood-600 bg-slate-950" />
                <span>Heavy Traffic (Begumpet N2)</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer py-1 text-slate-400 hover:text-white transition-colors">
                <input type="checkbox" checked={roadClosureHitech} onChange={e => setRoadClosureHitech(e.target.checked)} className="rounded border-slate-900 accent-blood-600 bg-slate-950" />
                <span className="text-red-400">Road Closure (Hitech City N8)</span>
              </label>
            </div>
          </div>

          <button onClick={calculateRoute} className="w-full py-3 btn-premium text-xs tracking-wider cursor-pointer font-bold uppercase">
            {loading ? "Calculating Path..." : "⚡ Calculate AI Route"}
          </button>
        </div>

        <div className="lg:col-span-8 glass-panel-premium p-5 flex flex-col justify-between min-h-[400px] border border-white/5 shadow-md">
          <div className="space-y-4">
            <h3 className="font-bold text-white border-b border-slate-900 pb-3 text-[10px] font-mono uppercase tracking-wider flex items-center justify-between">
              <span>Interactive GIS Map Visualization</span>
              {routeResult && <span className="text-cyan-400 font-mono text-[9px] border border-cyan-800/30 px-2 py-0.5 rounded">ETA: {routeResult.travel_time_minutes} MINS</span>}
            </h3>

            {/* SVG Interactive Node Map Graph */}
            <div className="w-full h-64 border border-slate-900 bg-slate-950/90 rounded-xl relative overflow-hidden flex items-center justify-center hud-grid">
              <svg className="w-full h-full p-4" viewBox="0 0 500 350" preserveAspectRatio="xMidYMid meet">
                {/* Draw static edges */}
                {edges.map((edge, i) => {
                  const fromCoord = nodeCoords[edge.from];
                  const toCoord = nodeCoords[edge.to];
                  if (!fromCoord || !toCoord) return null;
                  return (
                    <line
                      key={`edge-${i}`}
                      x1={fromCoord.x}
                      y1={fromCoord.y}
                      x2={toCoord.x}
                      y2={toCoord.y}
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeWidth="1.5"
                    />
                  );
                })}

                {/* Draw active Dijkstra route path if calculated */}
                {routeResult && routeResult.path_details && (
                  <path
                    d={getPathSvgD(routeResult.path_details)}
                    fill="none"
                    stroke="#00d2ff"
                    strokeWidth="3.5"
                    className="signal-path"
                  />
                )}

                {/* Draw active nodes */}
                {Object.entries(nodeCoords).map(([id, coord]) => {
                  const isStart = id === startNode;
                  const isEnd = id === endNode;
                  const isInRoute = routeResult?.path_details?.includes(id);

                  let circleFill = "#0f172a";
                  let circleStroke = "#475569";
                  if (isStart) {
                    circleFill = "#b71c1c";
                    circleStroke = "#f44336";
                  } else if (isEnd) {
                    circleFill = "#006064";
                    circleStroke = "#00e5ff";
                  } else if (isInRoute) {
                    circleFill = "#111827";
                    circleStroke = "#10b981";
                  }

                  return (
                    <g key={`node-${id}`}>
                      {/* Flashing beacons */}
                      {(isStart || isEnd) && (
                        <circle
                          cx={coord.x}
                          cy={coord.y}
                          r="15"
                          fill="none"
                          stroke={isStart ? "#f44336" : "#00e5ff"}
                          strokeWidth="1"
                          className="animate-ping"
                          style={{ animationDuration: '2.5s' }}
                        />
                      )}
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r={coord.type === "hub" ? "9" : "6.5"}
                        fill={circleFill}
                        stroke={circleStroke}
                        strokeWidth="2"
                        className="transition-all duration-300"
                      />
                      {/* Node Label Text */}
                      <text
                        x={coord.x}
                        y={coord.y + 18}
                        fill={isStart || isEnd || isInRoute ? "#f8fafc" : "#64748b"}
                        fontSize="8.5"
                        fontWeight={isStart || isEnd || isInRoute ? "bold" : "normal"}
                        textAnchor="middle"
                        className="font-mono tracking-wider transition-colors duration-300 pointer-events-none"
                      >
                        {id}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* List of intersections */}
            {routeResult && (
              <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl space-y-1.5 font-mono text-[9px] leading-relaxed">
                <span className="text-slate-500 uppercase font-bold block">DISPATCH ROUTE PATH INTERSECTIONS:</span>
                <p className="text-slate-200 text-xs font-bold flex flex-wrap items-center gap-1.5">
                  {routeResult.path_details.map((node: string, index: number) => (
                    <span key={index} className="flex items-center gap-1">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] ${node === startNode ? 'bg-red-950 text-red-400 border border-red-900/40' : (node === endNode ? 'bg-cyan-950 text-cyan-400 border border-cyan-900/40' : 'bg-slate-900 border border-slate-800 text-slate-300')}`}>
                        {nodeNames[node] || node}
                      </span>
                      {index < routeResult.path_details.length - 1 && <span className="text-slate-600">→</span>}
                    </span>
                  ))}
                </p>
              </div>
            )}
          </div>
          
          <div className="w-full text-center py-2.5 font-mono text-[8px] text-slate-600 uppercase tracking-widest mt-4">
            HEMO CONNECT DISPATCH RADAR MAP v4.0
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================
   5. HEALTH & NUTRITION
   ======================================================== */
function HealthTips() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-slate-905 pb-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blood-500" /> Health & Nutrition Guides
        </h2>
        <p className="text-xs text-slate-400 mt-0.5 font-mono">Pre & post donation protocols for donor recovery.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel-premium p-5 space-y-3 border border-white/5 shadow-md">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <Droplet className="w-4 h-4 text-cyan-400" /> Pre-Donation Protocols
          </h3>
          <ul className="text-[11px] text-slate-400 space-y-2.5 list-disc pl-4 leading-relaxed font-mono">
            <li>Drink 500 mL of clean water directly before your extraction.</li>
            <li>Maintain iron-rich meals (beets, spinach, grains) 3 days prior.</li>
            <li>Verify 7–8 hours of restful sleep cycles on your vital tracker.</li>
          </ul>
        </div>

        <div className="glass-panel-premium p-5 space-y-3 border border-white/5 shadow-md">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" /> Post-Donation Recovery
          </h3>
          <ul className="text-[11px] text-slate-400 space-y-2.5 list-disc pl-4 leading-relaxed font-mono">
            <li>Avoid high strenuous weight lift activities for 24 hours.</li>
            <li>Hydrate heavily and consume electrolyte items post recovery.</li>
            <li>Keep the bandaging layer sealed on extraction spot for 5 hours.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ========================================================
   6. EMERGENCY AI CHAT ASSISTANT
   ======================================================== */
function EmergencyChat() {
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Autonomous Medical NLP Parser connected. Dictate voice commands (mic) or input text case alerts below." }
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);

  const startVoiceDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition API is not supported in this browser. Use Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onerror = (e: any) => {
      console.error(e);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = async (event: any) => {
      const speechText = event.results[0][0].transcript;
      setInput(speechText);
      setIsListening(false);
      handleSendText(speechText);
    };

    recognition.start();
  };

  const handleSendText = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query) return;

    setMessages(prev => [...prev, { sender: "user", text: query }]);
    if (!textToSend) setInput("");

    try {
      const res = await fetch(`${API_BASE}/api/voice-assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: query })
      });
      const data = await res.json();
      
      if (data.success && data.parsed) {
        const { bloodGroup, urgency, location, confidence } = data.parsed;
        let reply = `🤖 [AI Emergency NLP Parser]
Target parameters parsed:
• Target Blood Group: ${bloodGroup.replace("_", " ")}
• Urgency level: ${urgency}
• Destination hub: ${location}
• NLP confidence factor: ${Math.round(confidence * 100)}%

System recommends triggering dispatch routes inside live map command terminal.`;
        setMessages(prev => [...prev, { sender: "ai", text: reply }]);
      } else {
        setMessages(prev => [...prev, { sender: "ai", text: "Parser rejected message input. Specify blood group (O-Negative) and target hospital node." }]);
      }
    } catch (e: any) {
      console.error(e);
      setMessages(prev => [...prev, { sender: "ai", text: "System gateway communication failure. Verify backend server logs." }]);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blood-500" /> Emergency voice NLP console
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">Speech-to-text semantic parsing terminal.</p>
        </div>
        <span className="text-[8px] font-mono text-cyan-400 border border-cyan-800/30 px-2 py-0.5 rounded">NLP Parser</span>
      </div>

      <div className="glass-panel-premium p-6 h-[420px] flex flex-col justify-between border border-white/5 shadow-md scanline-overlay">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] p-3 rounded-xl text-xs space-y-1 font-mono ${
                m.sender === "user" ? "bg-blood-900/40 border border-blood-800/40 text-slate-200" : "bg-slate-950 border border-slate-900 text-slate-300"
              }`}>
                <span className="text-[8px] text-slate-500 block uppercase font-bold">{m.sender === "user" ? "USER" : "CO-PILOT"}</span>
                <div className="whitespace-pre-line leading-relaxed text-[11px]">{m.text}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 border-t border-slate-900 pt-4 mt-4 font-mono">
          <button 
            onClick={startVoiceDictation} 
            className={`px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${isListening ? 'bg-red-700 animate-pulse text-white' : 'bg-slate-950 border border-slate-900 text-slate-400 hover:text-white hover:bg-slate-900'}`}
          >
            🎤 {isListening ? "Listening..." : "Dictate"}
          </button>
          <input
            type="text"
            placeholder="Type your emergency query or command..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendText()}
            className="input-premium py-2 text-xs"
          />
          <button onClick={() => handleSendText()} className="px-5 py-3 btn-premium text-xs cursor-pointer font-bold uppercase tracking-wider">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========================================================
   DROPDOWN PAGE: DONATION HISTORY
   ======================================================== */
function DonationHistory() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-slate-905 pb-3">
        <h2 className="text-base font-bold text-white">📋 Donation History</h2>
        <p className="text-xs text-slate-400 mt-0.5 font-mono">Logged logs of past node donation events.</p>
      </div>

      <div className="glass-panel-premium p-6 border border-white/5 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] text-slate-450 font-mono">
            <thead>
              <tr className="border-b border-slate-900 text-slate-500">
                <th className="py-3">DATE</th>
                <th className="py-3">LOCATION ZONE</th>
                <th className="py-3">BLOOD TYPE</th>
                <th className="py-3">VOLUME</th>
                <th className="py-3">STATUS CODE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60">
              <tr className="hover:bg-slate-900/20 transition-colors">
                <td className="py-3.5">2026-02-10</td>
                <td className="py-3.5">Bengaluru Central Campus</td>
                <td className="py-3.5 font-bold text-white">O-</td>
                <td className="py-3.5">450 mL</td>
                <td className="py-3.5 text-emerald-400 font-bold">TRANSFUSED</td>
              </tr>
              <tr className="hover:bg-slate-900/20 transition-colors">
                <td className="py-3.5">2025-11-12</td>
                <td className="py-3.5">Hyderabad Gachibowli Hub</td>
                <td className="py-3.5 font-bold text-white">O-</td>
                <td className="py-3.5">450 mL</td>
                <td className="py-3.5 text-emerald-400 font-bold">TRANSFUSED</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ========================================================
   DROPDOWN PAGE: IMPACT STATS
   ======================================================== */
function ImpactDashboard() {
  const [month, setMonth] = useState(6);
  const [outbreakSeverity, setOutbreakSeverity] = useState(0.0);
  const [festivalSeason, setFestivalSeason] = useState(0);
  const [accidentsLogged, setAccidentsLogged] = useState(45);
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<any | null>(null);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/forecast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          outbreakSeverity,
          festivalSeason,
          accidentsLogged,
          demandLag1: 350.0,
          demandLag2: 350.0,
          supplyLag1: 360.0
        })
      });
      const data = await res.json();
      setForecast(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [month, outbreakSeverity, festivalSeason, accidentsLogged]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-white">📊 Ridge Forecast shortage Simulator</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">Predictive shortages using seasonal lag coefficients.</p>
        </div>
        <span className="text-[8px] font-mono text-cyan-400 border border-cyan-800/30 px-2 py-0.5 rounded">Ridge ML Model</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 glass-panel-premium p-5 space-y-4 border border-white/5 shadow-md h-fit">
          <h3 className="font-bold text-white text-[10px] font-mono uppercase tracking-wider">Lag Modifiers</h3>
          
          <div className="space-y-4 text-[10px] font-mono">
            <div>
              <label className="text-[9px] text-slate-500 block mb-1">MONTH INDEX</label>
              <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="select-premium text-[11px]">
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, idx) => (
                  <option key={idx} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[9px] text-slate-500 block mb-1">MALARIA/DENGUE OUTBREAK FACTOR</label>
              <div className="flex items-center gap-3">
                <input type="range" min="0" max="1" step="0.1" value={outbreakSeverity} onChange={e => setOutbreakSeverity(parseFloat(e.target.value))} className="flex-1 accent-blood-600 bg-slate-950 border border-slate-900 rounded" />
                <span className="text-white text-xs w-6 text-right font-bold">{outbreakSeverity}</span>
              </div>
            </div>

            <div>
              <label className="text-[9px] text-slate-500 block mb-1">ACCIDENTS REPORTED WEEKLY</label>
              <div className="flex items-center gap-3">
                <input type="range" min="20" max="100" step="5" value={accidentsLogged} onChange={e => setAccidentsLogged(parseInt(e.target.value))} className="flex-1 accent-blood-600 bg-slate-950 border border-slate-900 rounded" />
                <span className="text-white text-xs w-6 text-right font-bold">{accidentsLogged}</span>
              </div>
            </div>

            <div className="border-t border-slate-900 pt-3">
              <label className="flex items-center gap-2.5 cursor-pointer py-1 text-slate-400 hover:text-white transition-colors">
                <input type="checkbox" checked={festivalSeason === 1} onChange={e => setFestivalSeason(e.target.checked ? 1 : 0)} className="rounded border-slate-900 accent-blood-600 bg-slate-950" />
                <span>Festival Season (decreased turnout)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 glass-panel-premium p-6 space-y-6 border border-white/5 shadow-md">
          <h3 className="font-bold text-white border-b border-slate-900 pb-3 text-[10px] font-mono uppercase tracking-wider">Shortage Model Outputs</h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <RefreshCw className="w-8 h-8 text-blood-500 animate-spin" />
            </div>
          ) : forecast ? (
            <div className="space-y-6 font-mono text-[10px]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="p-4 border border-slate-900 rounded-xl bg-slate-950/20 space-y-1">
                  <span className="text-[8px] text-slate-500 uppercase block font-bold">Predicted Demand</span>
                  <span className="text-lg font-bold text-white block">{forecast.predictedDemand} units</span>
                </div>
                <div className="p-4 border border-slate-900 rounded-xl bg-slate-950/20 space-y-1">
                  <span className="text-[8px] text-slate-500 uppercase block font-bold">Predicted Supply</span>
                  <span className="text-lg font-bold text-white block">{forecast.predictedSupply} units</span>
                </div>
                <div className={`p-4 border rounded-xl space-y-1 ${forecast.predictedDeficit < 0 ? 'bg-red-950/20 border-red-900/40 shadow-[0_0_15px_rgba(229,57,53,0.1)]' : 'bg-emerald-950/20 border-emerald-900/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]'}`}>
                  <span className="text-[8px] text-slate-500 uppercase block font-bold">Net Margin deficit</span>
                  <span className={`text-lg font-bold block ${forecast.predictedDeficit < 0 ? 'text-red-500 font-bold' : 'text-emerald-400'}`}>
                    {forecast.predictedDeficit} units
                  </span>
                </div>
              </div>

              {forecast.predictedDeficit < 0 ? (
                <div className="p-4 bg-red-950/20 border border-red-900/40 text-red-200 rounded-xl flex gap-3 text-[11px] leading-relaxed">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white uppercase block text-xs">CRITICAL REGRESSION SHORTAGE WARNING</span>
                    <p className="mt-1">Ridge model forecasts a net deficiency of {Math.abs(forecast.predictedDeficit)} units in the next operational loop. Recommended: Initiate local blood camps dispatcher alert.</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 text-emerald-200 rounded-xl flex gap-3 text-[11px] leading-relaxed">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white uppercase block text-xs">STABLE RESERVES CONFIRMED</span>
                    <p className="mt-1">Predicted surplus (+{forecast.predictedDeficit} units). Normal routing dispatches are validated to proceed.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <p className="text-xs font-mono">Forecasting logs loading...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================================================
   DROPDOWN PAGE: REWARDS PAGE
   ======================================================== */
function RewardsPage() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-slate-905 pb-3">
        <h2 className="text-base font-bold text-white">🏆 Rewards & Recognition</h2>
        <p className="text-xs text-slate-400 mt-0.5 font-mono">Coordinate nodes ranking levels.</p>
      </div>

      <div className="glass-panel-premium p-6 border border-white/5 shadow-md space-y-4">
        <div className="p-4 border border-emerald-500/20 bg-emerald-950/5 rounded-xl flex gap-3 hover:border-emerald-500/30 transition-colors">
          <Award className="w-8 h-8 text-emerald-400 shrink-0" />
          <div className="font-mono text-[10px]">
            <span className="font-bold text-white block text-xs">Rare Blood Guardian</span>
            <p className="text-slate-400 mt-1 leading-normal">Awarded to node coordinators logging rare group O-Negative dispatches during critical outage alarms.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================
   DROPDOWN PAGE: SUCCESS STORIES
   ======================================================== */
function SuccessStories() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-slate-905 pb-3">
        <h2 className="text-base font-bold text-white">🌟 Success Stories</h2>
        <p className="text-xs text-slate-400 mt-0.5 font-mono">Archived dispatcher reports detailing successful drone deliveries.</p>
      </div>

      <div className="glass-panel-premium p-6 border border-white/5 shadow-md space-y-4 leading-relaxed font-mono text-[11px] text-slate-400">
        <div className="border-b border-slate-900 pb-4">
          <h4 className="font-bold text-white text-xs mb-1">Trauma Dispatch Apollo Hospital (Hyderabad N4)</h4>
          <p className="mt-1">Trauma team requested O-Negative units immediately. Dijkstra path tracedSecunderabad Hub (N1) to Apollo (N4) under peak traffic. Drone completed delivery in 17.8 minutes, matching RF donor logs accurately.</p>
        </div>
      </div>
    </div>
  );
}

/* ========================================================
   DROPDOWN PAGE: VOLUNTEER REGISTER FORM
   ======================================================== */
function VolunteerForm({ addNotification }: { addNotification: (msg: string) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    addNotification(`VOLUNTEER NODE: Registered new coordinator node ${name}`);
    setName("");
    setPhone("");
    alert("Node coordinator profile initialized successfully!");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-slate-900 pb-3">
        <h2 className="text-base font-bold text-white">🤝 Join Volunteer Coordination Network</h2>
        <p className="text-xs text-slate-400 mt-0.5 font-mono">Establish new regional volunteer dispatch nodes.</p>
      </div>

      <div className="glass-panel-premium p-6 max-w-md mx-auto border border-white/5 shadow-md">
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-[9px] text-slate-500 font-mono block mb-1">CO-ORDINATOR NAME</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              className="input-premium py-2.5 text-xs"
              required
            />
          </div>
          <div>
            <label className="text-[9px] text-slate-500 font-mono block mb-1">SECURE CONTACT PHONE</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              className="input-premium py-2.5 text-xs"
              required
            />
          </div>
          <button type="submit" className="w-full py-3 btn-premium text-xs tracking-wider cursor-pointer font-bold uppercase">
            Initialize Node Location
          </button>
        </form>
      </div>
    </div>
  );
}

/* ========================================================
   DROPDOWN PAGE: EVENTS & DRIVE CALENDAR
   ======================================================== */
function EventsCalendar() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-slate-900 pb-3">
        <h2 className="text-base font-bold text-white">📅 Events & Camps Calendar</h2>
        <p className="text-xs text-slate-400 mt-0.5 font-mono">Scheduled regional donation camps.</p>
      </div>

      <div className="glass-panel-premium p-6 space-y-4 border border-white/5 shadow-md text-xs font-mono">
        <div className="p-3.5 border border-slate-900 bg-slate-950/40 rounded-xl flex items-center justify-between hover:border-slate-800 transition-colors">
          <div>
            <span className="text-blood-500 font-bold block">[CAMP] Secunderabad Drive</span>
            <span className="text-slate-500 text-[10px] mt-1 block">Scheduled Date: 2026-06-15 | Dispatch Hub: Secunderabad N1</span>
          </div>
          <span className="text-emerald-400 font-bold border border-emerald-900/30 px-2 py-0.5 rounded bg-emerald-950/20 text-[10px]">Active</span>
        </div>
      </div>
    </div>
  );
}
