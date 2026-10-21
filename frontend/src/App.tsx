// frontend/src/App.tsx
// HemoConnect — Premium Deep Burgundy Healthcare Technology UI
import React, { useState, useEffect } from "react";
import {
  Activity, AlertCircle, Award, Bell, Brain, CheckCircle,
  Droplet, Heart, MapPin, QrCode, Search, Globe,
  RefreshCw, User, Users, LogOut, ChevronDown, BookOpen, Calendar, HelpCircle,
  Navigation, Database, Siren, ShieldCheck, CheckCircle2,
  Sparkles, Layers, AlertTriangle, ArrowRight, Sun, Moon,
  Building, Radio
} from "lucide-react";
import AdminPanel from "./components/AdminPanel";
import Landing3DStory from "./components/Landing3DStory";
import ThreeBloodDropHero from "./components/ThreeBloodDropHero";

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

  // Theme state: Burgundy (Default) vs Midnight Plum
  const [themeMode, setThemeMode] = useState<"burgundy" | "midnight">("burgundy");

  // Auth state
  const [authRole, setAuthRole] = useState<"donor" | "agency">("donor");
  const [authTab, setAuthTab] = useState<"email" | "phone" | "google">("email");
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; city: string } | null>(null);

  // Global UI states
  const [userLocation, setUserLocation] = useState<string>("Bengaluru");
  const [showLocationMenu, setShowLocationMenu] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<string[]>([
    "System Initialized: All blood bank cold storage telemetry verified.",
    "Notification: Live drone dispatch corridor operational in Bengaluru Hub.",
    "Hospital Notice: O-Negative units in high demand across South Zone."
  ]);

  // Emergency SOS Modal State
  const [showSosModal, setShowSosModal] = useState<boolean>(false);
  const [sosBloodGroup, setSosBloodGroup] = useState<string>("O-");
  const [sosHospital, setSosHospital] = useState<string>("Fortis Hospital, Bannerghatta Road");
  const [sosUnits, setSosUnits] = useState<number>(2);
  const [sosPhone, setSosPhone] = useState<string>("+91 98765 43210");
  const [sosLoading, setSosLoading] = useState<boolean>(false);
  const [sosSuccess, setSosSuccess] = useState<boolean>(false);

  // Vitals simulation
  const [wearableData, setWearableData] = useState({
    heartRate: 72,
    bloodPressure: "120/80",
    bodyTemp: 36.6
  });

  // Requests queue
  const [requests, setRequests] = useState<BloodRequest[]>([
    {
      id: "REQ-901",
      patientName: "Alice Smith (Trauma Case)",
      bloodGroup: "O+",
      volumeMl: 450,
      urgency: "Emergency",
      status: "PENDING",
      location: "Bengaluru",
      hospitalName: "Fortis Hospital, Bannerghatta Road",
      createdAt: new Date(Date.now() - 300000).toISOString()
    },
    {
      id: "REQ-902",
      patientName: "Ramesh Kumar (Emergency Surgical)",
      bloodGroup: "O-",
      volumeMl: 900,
      urgency: "Emergency",
      status: "PENDING",
      location: "Hyderabad",
      hospitalName: "Apollo Hospital, Jubilee Hills",
      createdAt: new Date(Date.now() - 600000).toISOString()
    },
    {
      id: "REQ-903",
      patientName: "Sunita Rao (Scheduled Oncology)",
      bloodGroup: "B+",
      volumeMl: 450,
      urgency: "Normal",
      status: "PENDING",
      location: "Bengaluru",
      hospitalName: "Manipal Hospital, Old Airport Road",
      createdAt: new Date(Date.now() - 1200000).toISOString()
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
      name: authRole === "donor" ? "Dr. Evelyn Vance" : "City Central Medical Node",
      email: emailInput || "coordinator@hemoconnect.org",
      city: userLocation
    });
    setCurrentRoute("dashboard");
    addNotification(`Authentication verified: Logged in as ${authRole === "donor" ? "Donor" : "Hospital Node"}`);
  };

  const handlePhoneVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      if (!phoneInput) {
        alert("Please enter a valid phone number");
        return;
      }
      setOtpSent(true);
      addNotification(`One-Time Password (OTP) dispatched to ${phoneInput}`);
    } else {
      setUserProfile({
        name: "Verified Phone User",
        email: `${phoneInput}@phone.hemoconnect.org`,
        city: userLocation
      });
      setCurrentRoute("dashboard");
      addNotification("Phone OTP validated successfully. Access granted.");
    }
  };

  const handleGoogleSignIn = () => {
    setUserProfile({
      name: "Dr. Evelyn Vance (Google Auth)",
      email: "evelyn.vance@gmail.com",
      city: userLocation
    });
    setCurrentRoute("dashboard");
    addNotification("Authenticated with Google Identity Services.");
  };

  const handleGuestAccess = () => {
    setUserProfile({
      name: "Guest Coordinator",
      email: "guest@hemoconnect.org",
      city: userLocation
    });
    setCurrentRoute("dashboard");
    addNotification("Bypassed authentication: Logged in under Guest Operations Mode.");
  };

  const handleLogout = () => {
    setUserProfile(null);
    setCurrentRoute("landing");
  };

  // Submit Emergency SOS
  const handleTriggerSos = async (e: React.FormEvent) => {
    e.preventDefault();
    setSosLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientCondition: `CRITICAL SOS: Immediate transfusion needed for ${sosUnits} units of ${sosBloodGroup}`,
          bloodGroup: sosBloodGroup.replace("+", "_POSITIVE").replace("-", "_NEGATIVE"),
          volumeMl: sosUnits * 450,
          priority: "CRITICAL",
          hospitalName: sosHospital,
          latitude: 12.9716,
          longitude: 77.5946
        })
      });

      const data = await res.json();
      const newReq: BloodRequest = {
        id: data.id || `SOS-${Date.now().toString().slice(-4)}`,
        patientName: `CRITICAL TRAUMA ALERT (${sosBloodGroup})`,
        bloodGroup: sosBloodGroup,
        volumeMl: sosUnits * 450,
        urgency: "Emergency",
        status: "PENDING",
        location: userLocation,
        hospitalName: sosHospital,
        createdAt: new Date().toISOString()
      };

      setRequests(prev => [newReq, ...prev]);
      addNotification(`CRITICAL SOS DISPATCHED: ${sosBloodGroup} broadcasted to all active donor nodes`);
      setSosSuccess(true);
      setTimeout(() => {
        setSosSuccess(false);
        setShowSosModal(false);
      }, 2000);
    } catch {
      // Offline fallback
      const newReq: BloodRequest = {
        id: `SOS-${Date.now().toString().slice(-4)}`,
        patientName: `CRITICAL TRAUMA ALERT (${sosBloodGroup})`,
        bloodGroup: sosBloodGroup,
        volumeMl: sosUnits * 450,
        urgency: "Emergency",
        status: "PENDING",
        location: userLocation,
        hospitalName: sosHospital,
        createdAt: new Date().toISOString()
      };
      setRequests(prev => [newReq, ...prev]);
      addNotification(`CRITICAL SOS: Broadcasted offline to emergency queue (${sosBloodGroup})`);
      setSosSuccess(true);
      setTimeout(() => {
        setSosSuccess(false);
        setShowSosModal(false);
      }, 2000);
    } finally {
      setSosLoading(false);
    }
  };


  // Sidebar navigation options list
  const navItems = [
    { id: "dashboard", label: "Dashboard", category: "Core Operations", icon: Activity },
    { id: "map", label: "GIS Radar", category: "Core Operations", icon: Globe },
    { id: "donate", label: "Donor Network", category: "Core Operations", icon: Heart },
    { id: "request", label: "Request Portal", category: "Core Operations", icon: Search },
    { id: "inbox", label: "Matching Engine", category: "Core Operations", icon: Brain },
    { id: "emergency", label: "Emergency Chat", category: "Core Operations", icon: HelpCircle },
    { id: "admin", label: "Database Admin", category: "Administration", icon: Database },
    { id: "impact", label: "Shortage Forecast", category: "Intelligence", icon: Layers },
    { id: "history", label: "Donation History", category: "Intelligence", icon: BookOpen },
    { id: "rewards", label: "Rewards & Rank", category: "Community", icon: Award },
    { id: "stories", label: "Success Stories", category: "Community", icon: Sparkles },
    { id: "volunteer", label: "Volunteer Node", category: "Community", icon: User },
    { id: "events", label: "Events Calendar", category: "Community", icon: Calendar },
    { id: "health", label: "Health Guides", category: "Community", icon: Droplet },
  ];

  return (
    <div className={`min-h-screen relative flex flex-col font-sans transition-colors duration-300 ${
      themeMode === "midnight" ? "bg-[#140A0F] text-[#FFF7F5]" : "bg-[#190D13] text-[#FFF7F5]"
    }`}>
      {/* Background Ambient Lighting & Subtle Grid */}
      <div className="background-animation">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      <div className="subtle-network-lines absolute inset-0 pointer-events-none opacity-40"></div>

      {/* Emergency SOS Modal (High Visibility, Accessible Anywhere) */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg p-6 bg-[#211018] border border-[#FF334F]/40 rounded-2xl shadow-2xl shadow-[#FF334F]/10 space-y-5 overflow-hidden">
            {/* Top red header */}
            <div className="flex items-center justify-between border-b border-[#49303A] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FF334F]/20 border border-[#FF334F]/50 flex items-center justify-center text-[#FF334F] shadow-lg shadow-[#FF334F]/20">
                  <Siren className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-extrabold text-[#FFF7F5] flex items-center gap-2">
                    EMERGENCY SOS REQUEST
                  </h3>
                  <p className="text-xs text-[#E8A0AA]">Immediate live alert broadcast to all nearby verified donors</p>
                </div>
              </div>
              <button
                onClick={() => setShowSosModal(false)}
                className="w-8 h-8 rounded-lg border border-[#49303A] bg-[#321923] text-[#C3AEB4] hover:text-[#FFF7F5] flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {sosSuccess ? (
              <div className="py-8 text-center space-y-3 animate-fadeIn">
                <div className="w-14 h-14 mx-auto rounded-full bg-[#22C55E]/20 border border-[#22C55E]/50 flex items-center justify-center text-[#22C55E]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-[#FFF7F5] font-heading">SOS Broadcast Confirmed!</h4>
                <p className="text-xs text-[#C3AEB4] max-w-sm mx-auto">
                  Priority emergency beacon active. Registered O-Negative and matching donors within 15 km have received mobile notifications.
                </p>
              </div>
            ) : (
              <form onSubmit={handleTriggerSos} className="space-y-4">
                {/* Blood Group Quick Select */}
                <div>
                  <label className="text-xs font-semibold text-[#C3AEB4] block mb-1.5 uppercase tracking-wider font-mono">
                    REQUIRED BLOOD GROUP <span className="text-[#FF334F]">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].map((grp) => (
                      <button
                        key={grp}
                        type="button"
                        onClick={() => setSosBloodGroup(grp)}
                        className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer font-mono ${
                          sosBloodGroup === grp
                            ? "bg-[#C72C41] border-[#E05263] text-[#FFF7F5] shadow-md shadow-[#C72C41]/30"
                            : "bg-[#24151D] border-[#563441] text-[#C3AEB4] hover:text-[#FFF7F5] hover:border-[#C72C41]"
                        }`}
                      >
                        {grp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location / Hospital & Units */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#C3AEB4] block mb-1 uppercase tracking-wider font-mono">
                      DESTINATION HOSPITAL
                    </label>
                    <input
                      type="text"
                      value={sosHospital}
                      onChange={(e) => setSosHospital(e.target.value)}
                      required
                      placeholder="Hospital name & ward"
                      className="w-full px-3 py-2 bg-[#24151D] border border-[#563441] focus:border-[#C72C41] focus:outline-none rounded-xl text-xs text-[#FFF7F5]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#C3AEB4] block mb-1 uppercase tracking-wider font-mono">
                      UNITS REQUIRED
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={sosUnits}
                      onChange={(e) => setSosUnits(parseInt(e.target.value) || 1)}
                      required
                      className="w-full px-3 py-2 bg-[#24151D] border border-[#563441] focus:border-[#C72C41] focus:outline-none rounded-xl text-xs text-[#FFF7F5] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#C3AEB4] block mb-1 uppercase tracking-wider font-mono">
                    EMERGENCY CONTACT PHONE
                  </label>
                  <input
                    type="tel"
                    value={sosPhone}
                    onChange={(e) => setSosPhone(e.target.value)}
                    required
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-3 py-2 bg-[#24151D] border border-[#563441] focus:border-[#C72C41] focus:outline-none rounded-xl text-xs text-[#FFF7F5] font-mono"
                  />
                </div>

                <div className="p-3 bg-[#321923] border border-[#49303A] rounded-xl text-[11px] text-[#C3AEB4] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#FF334F] font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>PRIORITY CODE RED DISPATCH</span>
                  </div>
                  <p>
                    By activating this SOS, you confirm an active clinical emergency requiring immediate blood logistics.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={sosLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#FF334F] to-[#C72C41] hover:brightness-110 text-white font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-[#FF334F]/30 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase font-mono"
                >
                  {sosLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Broadcasting Emergency Beacon...
                    </>
                  ) : (
                    <>
                      <Siren className="w-4 h-4" />
                      DISPATCH EMERGENCY SOS NOW
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {currentRoute === "admin" ? (
        // Dedicated Full-Page /admin route
        <div className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto animate-fadeIn z-10">
          <AdminPanel
            onBackToApp={() => {
              setCurrentRoute("dashboard");
            }}
          />
        </div>
      ) : currentRoute === "landing" ? (
        // Full Cinematic 3D Storytelling Experience (5 Interactive Sections)
        <Landing3DStory
          onEnterApp={() => setCurrentRoute("dashboard")}
          onGuestAccess={handleGuestAccess}
          onOpenSosModal={() => setShowSosModal(true)}
          onGoToRoute={(route) => setCurrentRoute(route)}
        />
      ) : currentRoute === "auth" ? (
        // Full screen presentation pages (Auth)
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 min-h-screen z-10">
            <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden burgundy-card border border-[#49303A] shadow-2xl min-h-[560px]">
              {/* Left Panel: Healthcare Tech Branding & Glowing Illustration */}
              <div className="lg:col-span-5 bg-gradient-to-br from-[#190D13] via-[#27121B] to-[#211018] border-r border-[#49303A] p-8 flex flex-col justify-between hidden lg:flex relative overflow-hidden">
                {/* Soft ambient lighting glow behind illustration */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#C72C41]/15 rounded-full blur-3xl pointer-events-none"></div>

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#C72C41]/20 border border-[#C72C41]/40 flex items-center justify-center">
                      <Droplet className="w-4 h-4 text-[#C72C41] fill-[#C72C41] heartbeat-icon" />
                    </div>
                    <div>
                      <span className="text-base font-extrabold tracking-wider font-heading">
                        <span className="text-[#FFF7F5]">HEMO</span>
                        <span className="text-[#C72C41]">CONNECT</span>
                      </span>
                    </div>
                  </div>

                  <div className="pt-6 space-y-2">
                    <span className="text-[10px] font-mono tracking-widest text-[#E8A0AA] font-bold uppercase">
                      INTELLIGENT BLOOD LOGISTICS
                    </span>
                    <h2 className="font-heading text-2xl font-black text-[#FFF7F5] leading-snug">
                      Every Connection <br />Can Save a Life.
                    </h2>
                    <p className="text-xs text-[#C3AEB4] leading-relaxed">
                      Bridging donors, hospitals, and patients through intelligent matching and location-aware emergency coordination.
                    </p>
                  </div>
                </div>

                {/* Minimal Donor Network Constellation Illustration */}
                <div className="relative z-10 my-6 p-4 rounded-xl bg-[#321923]/60 border border-[#49303A]/70">
                  <div className="flex items-center justify-between mb-3 text-[10px] font-mono text-[#E8A0AA] font-bold">
                    <span>DISPATCH NETWORK CONSTELLATION</span>
                    <span className="text-[#22C55E]">● LIVE</span>
                  </div>
                  <div className="w-full h-28 relative flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 200 100">
                      {/* Network Lines */}
                      <line x1="30" y1="50" x2="100" y2="30" stroke="#49303A" strokeWidth="1.5" />
                      <line x1="100" y1="30" x2="170" y2="50" stroke="#49303A" strokeWidth="1.5" />
                      <line x1="100" y1="30" x2="100" y2="85" stroke="#C72C41" strokeWidth="1.5" strokeDasharray="3,3" />
                      <line x1="30" y1="50" x2="100" y2="85" stroke="#49303A" strokeWidth="1.5" />
                      <line x1="170" y1="50" x2="100" y2="85" stroke="#49303A" strokeWidth="1.5" />

                      {/* Network Nodes */}
                      <circle cx="30" cy="50" r="6" fill="#321923" stroke="#22C55E" strokeWidth="2" />
                      <circle cx="170" cy="50" r="6" fill="#321923" stroke="#38BDF8" strokeWidth="2" />
                      <circle cx="100" cy="85" r="7" fill="#321923" stroke="#E05263" strokeWidth="2" />

                      {/* Center Glowing Hub Node */}
                      <circle cx="100" cy="30" r="10" fill="#C72C41" className="animate-pulse" />
                      <circle cx="100" cy="30" r="15" fill="none" stroke="#C72C41" strokeWidth="1" opacity="0.4" />
                    </svg>
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-[#9C858D] mt-2 pt-2 border-t border-[#49303A]/40">
                    <span>Donors: 1,428</span>
                    <span>Hospitals: 42</span>
                    <span>Drones: 18</span>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-[#9C858D] flex items-center justify-between relative z-10">
                  <span>HEMO-CONNECT PLATFORM</span>
                  <span className="text-[#C72C41] font-bold">AES-256 ENCRYPTED</span>
                </div>
              </div>

              {/* Right Panel: Premium Authentication Card */}
              <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center space-y-5 bg-[#211018]">
                {/* Mobile Header Branding */}
                <div className="lg:hidden flex items-center gap-2 justify-center mb-2">
                  <Droplet className="w-6 h-6 text-[#C72C41] fill-[#C72C41] heartbeat-icon" />
                  <span className="text-lg font-extrabold font-heading text-[#FFF7F5]">
                    HEMO<span className="text-[#C72C41]">CONNECT</span>
                  </span>
                </div>

                {/* Role Tabs */}
                <div className="flex border border-[#49303A] rounded-xl p-1 bg-[#24151D]">
                  <button
                    onClick={() => setAuthRole("donor")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer font-heading ${
                      authRole === "donor"
                        ? "bg-gradient-to-r from-[#D93A50] to-[#A91F36] text-[#FFF7F5] shadow-md shadow-[#C72C41]/30"
                        : "text-[#C3AEB4] hover:text-[#FFF7F5]"
                    }`}
                  >
                    Donor Portal
                  </button>
                  <button
                    onClick={() => setAuthRole("agency")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer font-heading ${
                      authRole === "agency"
                        ? "bg-gradient-to-r from-[#D93A50] to-[#A91F36] text-[#FFF7F5] shadow-md shadow-[#C72C41]/30"
                        : "text-[#C3AEB4] hover:text-[#FFF7F5]"
                    }`}
                  >
                    Hospital / Clinical Node
                  </button>
                </div>

                {/* Auth Mode Tabs (Google, Phone OTP, Email/Pass) */}
                <div className="flex border-b border-[#49303A] pb-2 gap-4 text-xs font-mono">
                  <button
                    onClick={() => setAuthTab("email")}
                    className={`pb-1 font-bold transition-all cursor-pointer ${
                      authTab === "email" ? "text-[#E05263] border-b-2 border-[#C72C41]" : "text-[#9C858D] hover:text-[#C3AEB4]"
                    }`}
                  >
                    Email Login
                  </button>
                  <button
                    onClick={() => setAuthTab("phone")}
                    className={`pb-1 font-bold transition-all cursor-pointer ${
                      authTab === "phone" ? "text-[#E05263] border-b-2 border-[#C72C41]" : "text-[#9C858D] hover:text-[#C3AEB4]"
                    }`}
                  >
                    Phone OTP
                  </button>
                  <button
                    onClick={() => setAuthTab("google")}
                    className={`pb-1 font-bold transition-all cursor-pointer ${
                      authTab === "google" ? "text-[#E05263] border-b-2 border-[#C72C41]" : "text-[#9C858D] hover:text-[#C3AEB4]"
                    }`}
                  >
                    Google Single Sign-On
                  </button>
                </div>

                {/* Subheading */}
                <div className="space-y-0.5">
                  <h3 className="font-heading text-lg font-bold text-[#FFF7F5]">
                    {authTab === "google"
                      ? "Enterprise Healthcare Identity"
                      : authTab === "phone"
                      ? "Direct Mobile Verification"
                      : isSignUp
                      ? "Register Operations Coordinator"
                      : "Welcome Back"}
                  </h3>
                  <p className="text-xs text-[#C3AEB4]">
                    {authRole === "donor"
                      ? "Manage donor profile, wearable telemetry, and active regional alerts."
                      : "Access hospital emergency requests and route optimizations."}
                  </p>
                </div>

                {/* Google Sign-in View */}
                {authTab === "google" && (
                  <div className="py-6 space-y-4">
                    <button
                      onClick={handleGoogleSignIn}
                      className="w-full py-3.5 px-4 rounded-xl border border-[#49303A] bg-[#24151D] hover:bg-[#321923] text-[#FFF7F5] font-semibold text-xs transition-all flex items-center justify-center gap-3 cursor-pointer shadow-lg"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                        />
                      </svg>
                      <span>Continue with Google Workspace</span>
                    </button>
                    <p className="text-[11px] text-center text-[#9C858D] font-mono">
                      Fast 1-click federated authentication for registered doctors & blood bank staff.
                    </p>
                  </div>
                )}

                {/* Phone OTP View */}
                {authTab === "phone" && (
                  <form onSubmit={handlePhoneVerification} className="space-y-3.5">
                    <div>
                      <label className="text-[11px] text-[#C3AEB4] font-mono block mb-1 uppercase tracking-wider font-semibold">
                        MOBILE PHONE NUMBER
                      </label>
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="input-premium py-2.5 text-xs font-mono"
                        required
                      />
                    </div>

                    {otpSent && (
                      <div className="animate-fadeIn">
                        <label className="text-[11px] text-[#C3AEB4] font-mono block mb-1 uppercase tracking-wider font-semibold">
                          6-DIGIT VERIFICATION CODE
                        </label>
                        <input
                          type="text"
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                          placeholder="123456"
                          maxLength={6}
                          className="input-premium py-2.5 text-xs font-mono tracking-widest text-center"
                          required
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 btn-premium text-xs tracking-wider font-bold uppercase font-mono cursor-pointer"
                    >
                      {otpSent ? "Verify OTP & Access" : "Send One-Time Password"}
                    </button>
                  </form>
                )}

                {/* Email / Password View */}
                {authTab === "email" && (
                  <form onSubmit={handleLogin} className="space-y-3.5">
                    {isSignUp && (
                      <div>
                        <label className="text-[11px] text-[#C3AEB4] font-mono block mb-1 uppercase tracking-wider font-semibold">
                          FULL NAME / CLINICAL NODE TITLE
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Dr. Evelyn Vance"
                          className="input-premium py-2.5 text-xs"
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-[11px] text-[#C3AEB4] font-mono block mb-1 uppercase tracking-wider font-semibold">
                        AUTHORIZED EMAIL ADDRESS
                      </label>
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="coordinator@hemoconnect.org"
                        className="input-premium py-2.5 text-xs font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#C3AEB4] font-mono block mb-1 uppercase tracking-wider font-semibold">
                        PASSWORD CREDENTIAL
                      </label>
                      <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="••••••••••••"
                        className="input-premium py-2.5 text-xs"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 btn-premium text-xs tracking-wider font-bold uppercase font-mono cursor-pointer"
                    >
                      {isSignUp ? "Register Operations Node" : "Authenticate Terminal"}
                    </button>
                  </form>
                )}

                {/* Bottom Actions: Toggle SignUp & Guest Mode */}
                <div className="flex flex-col gap-2.5 text-center text-xs border-t border-[#49303A] pt-4">
                  <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-[#C3AEB4] hover:text-[#FFF7F5] transition-colors"
                  >
                    {isSignUp ? "Already registered? Login with credentials" : "Need coordinator access? Create new account"}
                  </button>
                  <button
                    onClick={handleGuestAccess}
                    className="text-[#E05263] hover:text-[#E8A0AA] font-mono font-bold uppercase tracking-wider text-[11px] cursor-pointer"
                  >
                    Bypass Authentication (Guest Mode)
                  </button>
                </div>
              </div>
            </div>
        </main>
      ) : (
        // Logged-in Structure: Left Navigation Sidebar & Main Command Deck
        <div className="flex-1 flex flex-col md:flex-row min-h-screen z-10">
          {/* Persistent Left Sidebar Navigation (Deep Burgundy) */}
          <aside className="w-full md:w-64 bg-[#211018] border-r border-[#49303A] flex flex-col justify-between shrink-0 z-40 backdrop-blur-xl relative">
            <div className="p-5 flex flex-col space-y-6">
              {/* Branding Droplet */}
              <div
                className="cursor-pointer flex items-center gap-2.5"
                onClick={() => setCurrentRoute("dashboard")}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3A202B] to-[#211018] border border-[#C72C41]/50 flex items-center justify-center shadow-md">
                  <Droplet className="w-5 h-5 text-[#C72C41] fill-[#C72C41] heartbeat-icon" />
                </div>
                <div>
                  <div className="text-base tracking-wider font-extrabold font-heading text-[#FFF7F5] leading-none">
                    HEMO<span className="text-[#C72C41]">CONNECT</span>
                  </div>
                  <p className="text-[9px] text-[#9C858D] tracking-widest font-mono font-bold mt-1 uppercase">
                    OPERATIONS CONSOLE
                  </p>
                </div>
              </div>

              {/* Navigation Group items */}
              <nav className="space-y-4">
                {/* Core Operations Group */}
                <div>
                  <h4 className="text-[10px] font-mono text-[#9C858D] tracking-wider font-bold mb-2 uppercase">
                    CORE TERMINALS
                  </h4>
                  <ul className="space-y-1">
                    {navItems
                      .filter(item => item.category === "Core Operations")
                      .map(item => {
                        const Icon = item.icon;
                        const isActive = currentRoute === item.id;
                        return (
                          <li key={item.id}>
                            <button
                              onClick={() => setCurrentRoute(item.id as any)}
                              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer border ${
                                isActive
                                  ? "bg-[#C72C41]/15 border-[#C72C41]/40 text-[#FFF7F5] shadow-sm shadow-[#C72C41]/10"
                                  : "bg-transparent border-transparent text-[#C3AEB4] hover:text-[#FFF7F5] hover:bg-[#321923]/60"
                              }`}
                            >
                              <Icon className={`w-4 h-4 ${isActive ? "text-[#C72C41]" : "text-[#9C858D]"}`} />
                              <span>{item.label}</span>
                            </button>
                          </li>
                        );
                      })}
                  </ul>
                </div>

                {/* Administration Group */}
                <div>
                  <h4 className="text-[10px] font-mono text-[#E05263] tracking-wider font-bold mb-2 uppercase flex items-center justify-between">
                    <span>ADMINISTRATION</span>
                    <span className="text-[8px] px-1.5 py-0.5 bg-[#321923] border border-[#49303A] rounded text-[#E8A0AA] font-bold">
                      ROOT
                    </span>
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
                                  ? "bg-[#C72C41]/25 border-[#C72C41] text-[#FFF7F5] shadow-md shadow-[#C72C41]/20"
                                  : "bg-[#24151D] border-[#49303A] text-[#C3AEB4] hover:text-[#FFF7F5] hover:bg-[#321923]"
                              }`}
                            >
                              <Icon className="w-4 h-4 text-[#C72C41]" />
                              <span>{item.label}</span>
                            </button>
                          </li>
                        );
                      })}
                  </ul>
                </div>

                {/* Intelligence & Community Group */}
                <div>
                  <h4 className="text-[10px] font-mono text-[#9C858D] tracking-wider font-bold mb-2 uppercase">
                    INTELLIGENCE & DATA
                  </h4>
                  <ul className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {navItems
                      .filter(item => item.category === "Intelligence" || item.category === "Community")
                      .map(item => {
                        const Icon = item.icon;
                        const isActive = currentRoute === item.id;
                        return (
                          <li key={item.id}>
                            <button
                              onClick={() => setCurrentRoute(item.id as any)}
                              className={`w-full flex items-center gap-3 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer border ${
                                isActive
                                  ? "bg-[#C72C41]/15 border-[#C72C41]/40 text-[#FFF7F5]"
                                  : "bg-transparent border-transparent text-[#9C858D] hover:text-[#FFF7F5] hover:bg-[#321923]/60"
                              }`}
                            >
                              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#C72C41]" : "text-[#9C858D]"}`} />
                              <span>{item.label}</span>
                            </button>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              </nav>
            </div>

            {/* User Status Info Badge & Logout */}
            <div className="p-4 border-t border-[#49303A] bg-[#190D13]/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D93A50] to-[#A91F36] flex items-center justify-center text-xs font-bold text-white shadow-md">
                  {userProfile?.name ? userProfile.name.charAt(0) : "G"}
                </div>
                <div className="overflow-hidden">
                  <span className="text-xs font-bold text-[#FFF7F5] block truncate max-w-[110px]">
                    {userProfile?.name || "Dr. Evelyn Vance"}
                  </span>
                  <span className="text-[9px] font-mono text-[#E8A0AA] uppercase tracking-wider block">
                    ID: {authRole.toUpperCase()}_NODE
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 border border-[#49303A] hover:border-[#FF334F]/40 bg-[#24151D] rounded-xl text-[#9C858D] hover:text-[#FF334F] transition-all cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </aside>

          {/* Right Hand Workspace Section */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Unified Top Navigation Bar (Section 5) */}
            <header className="border-b border-[#49303A] bg-[#211018]/90 backdrop-blur-xl px-4 sm:px-6 py-3.5 flex items-center justify-between z-30 sticky top-0">
              <div className="flex items-center gap-3">
                <h1 className="text-base font-extrabold uppercase text-[#FFF7F5] tracking-wider font-heading">
                  {navItems.find(item => item.id === currentRoute)?.label || "OPERATIONS DECK"}
                </h1>
                <span className="hidden sm:inline px-2 py-0.5 rounded-md bg-[#321923] border border-[#49303A] text-[9px] font-mono font-bold text-[#22C55E] uppercase">
                  ● SYSTEM_ONLINE
                </span>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3">
                {/* Emergency SOS Button in Navbar */}
                <button
                  onClick={() => setShowSosModal(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-[#FF334F] to-[#C72C41] hover:brightness-110 text-white rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-[#FF334F]/25 animate-pulse"
                  title="Dispatch Emergency SOS Broadcast"
                >
                  <Siren className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">EMERGENCY SOS</span>
                </button>

                {/* Manual Location Selector Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowLocationMenu(!showLocationMenu)}
                    className="px-3 py-1.5 border border-[#49303A] bg-[#24151D] hover:bg-[#321923] rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all text-[#C3AEB4] hover:text-[#FFF7F5] cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#C72C41]" />
                    <span>{userLocation}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showLocationMenu && (
                    <div className="absolute right-0 mt-2 w-52 bg-[#211018] border border-[#49303A] rounded-xl p-2 shadow-2xl z-50 max-h-60 overflow-y-auto">
                      <button
                        onClick={() => {
                          setUserLocation("Bengaluru");
                          setShowLocationMenu(false);
                          addNotification("Location set to Bengaluru (GPS Autodetect)");
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-[#C3AEB4] hover:text-[#FFF7F5] hover:bg-[#321923] rounded-lg transition-all border-b border-[#49303A] pb-1.5 mb-1.5 font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Navigation className="w-3 h-3 text-[#38BDF8]" /> Live GPS Match
                      </button>
                      <p className="text-[9px] text-[#9C858D] font-mono font-bold px-2 mb-1 uppercase tracking-wider">
                        Select Hub Node
                      </p>
                      {["Bengaluru", "Hyderabad", "Mumbai", "Delhi", "Chennai"].map(city => (
                        <button
                          key={city}
                          onClick={() => {
                            setUserLocation(city);
                            setShowLocationMenu(false);
                            addNotification(`Location set manually to ${city} Hub`);
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs text-[#C3AEB4] hover:text-[#FFF7F5] hover:bg-[#321923] rounded-lg transition-all cursor-pointer font-mono"
                        >
                          {city} Hub
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Theme Toggle (Burgundy / Midnight) */}
                <button
                  onClick={() => setThemeMode(themeMode === "burgundy" ? "midnight" : "burgundy")}
                  className="p-2 border border-[#49303A] bg-[#24151D] hover:bg-[#321923] rounded-xl text-[#C3AEB4] hover:text-[#FFF7F5] transition-all cursor-pointer"
                  title={`Switch to ${themeMode === "burgundy" ? "Midnight Plum" : "Deep Burgundy"} Mode`}
                >
                  {themeMode === "burgundy" ? <Moon className="w-4 h-4 text-[#E8A0AA]" /> : <Sun className="w-4 h-4 text-[#F59E0B]" />}
                </button>

                {/* DB Admin Quick Link Button */}
                <button
                  onClick={() => setCurrentRoute("admin")}
                  className="px-3 py-1.5 border border-[#49303A] bg-[#24151D] hover:bg-[#321923] text-[#C3AEB4] hover:text-[#FFF7F5] rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Database Admin Console (/admin)"
                >
                  <Database className="w-3.5 h-3.5 text-[#C72C41]" />
                  <span className="hidden sm:inline">DB Admin</span>
                </button>

                {/* System Notifications Drawer */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 border border-[#49303A] rounded-xl bg-[#24151D] hover:bg-[#321923] text-[#C3AEB4] hover:text-[#FFF7F5] transition-all relative cursor-pointer"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF334F] rounded-full animate-pulse"></span>
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-[#211018] border border-[#49303A] rounded-xl p-3 shadow-2xl z-50">
                      <h4 className="text-[10px] font-mono text-[#9C858D] border-b border-[#49303A] pb-1.5 mb-2 uppercase tracking-wider font-bold">
                        OPERATIONAL ALERTS LOG
                      </h4>
                      <div className="space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar">
                        {notifications.map((n, i) => (
                          <div key={i} className="flex gap-2 text-xs border-b border-[#49303A]/40 pb-2 last:border-0 last:pb-0 leading-normal">
                            <AlertCircle className="w-3.5 h-3.5 text-[#C72C41] shrink-0 mt-0.5" />
                            <span className="text-[#C3AEB4] font-mono text-[11px]">{n}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Main View Router Area */}
            <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-6xl w-full mx-auto">
              
              {/* Dashboard Operational Deck (Section 6 & 7) */}
              {currentRoute === "dashboard" && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Hero Section (Section 6) */}
                  <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8 bg-gradient-to-r from-[#190D13] via-[#27121B] to-[#211018] border border-[#49303A] shadow-xl">
                    <div className="relative z-10 max-w-2xl space-y-3">
                      <span className="inline-block text-[10px] font-mono tracking-widest text-[#E8A0AA] font-bold uppercase bg-[#3A202B] px-3 py-0.5 rounded-full border border-[#49303A]">
                        INTELLIGENT BLOOD LOGISTICS
                      </span>
                      <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-[#FFF7F5] tracking-tight leading-tight">
                        Every Connection <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFF7F5] via-[#E8A0AA] to-[#E05263]">
                          Can Save a Life.
                        </span>
                      </h2>
                      <p className="text-xs sm:text-sm text-[#C3AEB4] leading-relaxed">
                        Connecting blood donors, patients, and hospitals through intelligent matching and location-aware emergency coordination.
                      </p>

                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => setShowSosModal(true)}
                          className="px-5 py-2.5 btn-premium text-xs font-bold uppercase font-mono tracking-wider cursor-pointer shadow-lg shadow-[#C72C41]/20 flex items-center gap-2"
                        >
                          <Siren className="w-4 h-4" />
                          <span>Emergency Blood Request</span>
                        </button>
                        <button
                          onClick={() => setCurrentRoute("donate")}
                          className="px-5 py-2.5 btn-secondary text-xs font-bold uppercase font-mono tracking-wider cursor-pointer flex items-center gap-2"
                        >
                          <Heart className="w-4 h-4 text-[#C72C41]" />
                          <span>Become a Donor</span>
                        </button>
                        <button
                          onClick={() => setCurrentRoute("map")}
                          className="px-4 py-2.5 text-xs text-[#E8A0AA] hover:text-white font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <span>Explore Live Radar</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Subtle ambient lighting blob inside hero */}
                    <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-[#C72C41]/10 to-transparent pointer-events-none"></div>

                    {/* Interactive 3D Blood Drop floating inside Hero Deck */}
                    <div className="absolute -right-4 -top-6 -bottom-6 w-72 md:w-88 lg:w-96 pointer-events-none opacity-90 hidden sm:block">
                      <ThreeBloodDropHero currentSection={0} />
                    </div>
                  </div>

                  {/* Dashboard Metric Cards (Section 7) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                    <HUDCard
                      title="Registered Donors"
                      value="1,428"
                      color="text-[#FFF7F5]"
                      desc="Active clinical registry"
                      icon={Users}
                      badge="Active"
                    />
                    <HUDCard
                      title="Available Donors"
                      value="864"
                      color="text-[#22C55E]"
                      desc="Ready for immediate dispatch"
                      icon={Heart}
                      badge="Online"
                    />
                    <HUDCard
                      title="Active Requests"
                      value={requests.filter(r => r.status === "PENDING").length.toString()}
                      color="text-[#F59E0B]"
                      desc="In queue for hospital triage"
                      icon={AlertCircle}
                      badge="Pending"
                    />
                    <HUDCard
                      title="Critical SOS Alerts"
                      value={requests.filter(r => r.urgency === "Emergency").length.toString()}
                      color="text-[#FF334F]"
                      desc="Immediate trauma alerts"
                      icon={Siren}
                      badge="Priority"
                    />
                    <HUDCard
                      title="Units Fulfilled"
                      value="1,280"
                      color="text-[#E05263]"
                      desc="Transfused past 30 days"
                      icon={CheckCircle}
                      badge="Logged"
                    />
                  </div>

                  {/* Operational Telemetry & Vital Status */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Wearable Live Check & AI Security */}
                    <div className="lg:col-span-4 space-y-6">
                      {/* Wearable widget */}
                      <div className="burgundy-card p-4 space-y-3 border border-[#49303A]">
                        <h3 className="font-bold text-[#FFF7F5] text-xs font-mono uppercase tracking-wider flex items-center gap-2 border-b border-[#49303A] pb-2">
                          <Activity className="w-4 h-4 text-[#C72C41] heartbeat-icon" /> Live Wearable Telemetry
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-center font-mono">
                          <div className="p-3 border border-[#49303A] bg-[#24151D] rounded-xl space-y-1">
                            <span className="text-[9px] text-[#9C858D] block font-bold">HEART RATE</span>
                            <span className="text-base font-extrabold text-[#FFF7F5] flex items-center justify-center gap-1">
                              <Heart className="w-3.5 h-3.5 text-[#C72C41] fill-[#C72C41] animate-pulse" /> {wearableData.heartRate} bpm
                            </span>
                          </div>
                          <div className="p-3 border border-[#49303A] bg-[#24151D] rounded-xl space-y-1">
                            <span className="text-[9px] text-[#9C858D] block font-bold">BODY TEMP</span>
                            <span className="text-base font-extrabold text-[#FFF7F5]">{wearableData.bodyTemp} °C</span>
                          </div>
                        </div>

                        {/* Scrolling EKG wave graphic */}
                        <div className="h-12 border border-[#49303A] bg-[#24151D] rounded-xl overflow-hidden flex items-center relative">
                          <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                            <path
                              d="M 0,15 L 15,15 L 20,15 L 23,2 L 27,28 L 30,15 L 45,15 L 60,15 L 63,2 L 67,28 L 70,15 L 85,15 L 100,15"
                              fill="none"
                              stroke="#C72C41"
                              strokeWidth="1.5"
                              className="signal-path"
                              style={{ animationDuration: '2.5s' }}
                            />
                          </svg>
                          <span className="absolute right-2 bottom-1 text-[8px] font-mono text-[#9C858D]">LIVE SIGNAL</span>
                        </div>
                      </div>

                      {/* AI Integrity Trust Gauge */}
                      <div className="burgundy-card p-4 space-y-3 border border-[#49303A]">
                        <h3 className="font-bold text-[#FFF7F5] text-xs font-mono uppercase tracking-wider flex items-center gap-2 border-b border-[#49303A] pb-2">
                          <ShieldCheck className="w-4 h-4 text-[#22C55E]" /> AI Fraud Verification Guard
                        </h3>
                        <div className="relative pt-1 font-mono space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold py-0.5 px-2 rounded-full text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/30 text-[10px]">
                              VERIFIED TRUSTWORTHY
                            </span>
                            <span className="text-sm font-bold text-[#22C55E]">100%</span>
                          </div>
                          <div className="overflow-hidden h-2 rounded-full bg-[#24151D] border border-[#49303A]">
                            <div style={{ width: "100%" }} className="h-full bg-gradient-to-r from-[#22C55E] to-[#38BDF8]"></div>
                          </div>
                          <p className="text-[10px] text-[#9C858D] leading-normal">
                            All incoming requests undergo RF-IP signature matching & hospital registration verification.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Operational Alert Feed */}
                    <div className="lg:col-span-8 burgundy-card p-5 border border-[#49303A] space-y-4">
                      <div className="flex items-center justify-between border-b border-[#49303A] pb-3">
                        <h3 className="font-bold text-[#FFF7F5] text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                          <Radio className="w-4 h-4 text-[#C72C41]" /> Active Dispatch Alert Stream ({userLocation} Hub)
                        </h3>
                        <span className="text-[10px] font-mono text-[#9C858D]">Auto-refreshing</span>
                      </div>

                      <div className="space-y-3">
                        {requests.slice(0, 4).map(req => (
                          <div
                            key={req.id}
                            className="p-3.5 border border-[#49303A] bg-[#24151D] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#563441] transition-all"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#FFF7F5]">{req.patientName}</span>
                                <span className="px-2 py-0.5 bg-[#C72C41]/20 border border-[#C72C41]/40 rounded text-[10px] font-mono font-bold text-[#E8A0AA]">
                                  {req.bloodGroup}
                                </span>
                                {req.urgency === "Emergency" && (
                                  <span className="px-2 py-0.5 bg-[#FF334F]/20 text-[#FF334F] border border-[#FF334F]/40 text-[9px] rounded font-mono font-bold">
                                    CRITICAL
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#C3AEB4] font-mono flex items-center gap-1.5">
                                <Building className="w-3.5 h-3.5 text-[#9C858D]" />
                                <span>{req.hospitalName}</span>
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setCurrentRoute("inbox");
                                addNotification(`Inspecting matches for case ${req.id}`);
                              }}
                              className="px-3.5 py-1.5 bg-[#321923] hover:bg-[#3A202B] border border-[#49303A] text-xs font-mono font-bold rounded-lg text-[#FFF7F5] transition-all cursor-pointer shrink-0"
                            >
                              Inspect Matches
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Request Blood Flow (Section 10) */}
              {currentRoute === "request" && (
                <RequestFlow
                  setRequests={setRequests}
                  addNotification={addNotification}
                  userLocation={userLocation}
                />
              )}

              {/* Donor Registration Hub (Section 9) */}
              {currentRoute === "donate" && (
                <DonateFlow
                  wearableData={wearableData}
                  addNotification={addNotification}
                />
              )}

              {/* Matching Engine & Alert Inbox (Section 11) */}
              {currentRoute === "inbox" && (
                <DonorInbox
                  requests={requests}
                  setRequests={setRequests}
                  addNotification={addNotification}
                  userLocation={userLocation}
                />
              )}

              {/* Live GIS Radar Map (Section 8) */}
              {currentRoute === "map" && <LiveNetworkMap />}

              {/* Secondary Supporting Terminals */}
              {currentRoute === "emergency" && <EmergencyChat />}
              {currentRoute === "health" && <HealthTips />}
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

// Reusable Metric Card HUD (Section 7)
function HUDCard({
  title,
  value,
  color,
  desc,
  icon: Icon,
  badge
}: {
  title: string;
  value: string;
  color: string;
  desc: string;
  icon: any;
  badge?: string;
}) {
  return (
    <div className="burgundy-card p-4 border border-[#49303A] flex flex-col justify-between shadow-md relative overflow-hidden select-none hover:-translate-y-1 transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-[#9C858D] uppercase tracking-wider font-bold">
          {title}
        </span>
        <div className="p-1.5 rounded-lg bg-[#24151D] border border-[#49303A] text-[#C72C41]">
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div>
        <span className={`text-2xl font-black font-mono tracking-tight block ${color}`}>
          {value}
        </span>
        <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#49303A]/40">
          <span className="text-[10px] font-mono text-[#9C858D] leading-none block truncate">
            {desc}
          </span>
          {badge && (
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[#24151D] border border-[#49303A] text-[#E8A0AA]">
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================================================
   SECTION 10: HOSPITAL REQUEST PORTAL (7 CLEAR SECTIONS)
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
  const [patientName, setPatientName] = useState("");
  const [contactPhone, setContactPhone] = useState("+91 98765 43210");
  const [coordinatorEmail, setCoordinatorEmail] = useState("doctor@hospital.org");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [units, setUnits] = useState(2);
  const [hospitalName, setHospitalName] = useState(`${userLocation} General Hospital`);
  const [cityHub, setCityHub] = useState(userLocation);
  const [urgency, setUrgency] = useState<"Normal" | "Priority" | "Emergency">("Normal");
  
  const [loading, setLoading] = useState(false);
  const [resultsDonors, setResultsDonors] = useState<any[]>([]);
  const [resultsBanks, setResultsBanks] = useState<any[]>([]);
  const [fraudScore, setFraudScore] = useState<any | null>(null);

  const handleSearchAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bloodGroup) {
      alert("Please select a blood group");
      return;
    }
    setLoading(true);
    setFraudScore(null);
    
    try {
      const coords = { lat: 12.9716, lng: 77.5946 };
      if (cityHub === "Hyderabad") { coords.lat = 17.3850; coords.lng = 78.4867; }
      else if (cityHub === "Mumbai") { coords.lat = 19.0760; coords.lng = 72.8777; }
      else if (cityHub === "Delhi") { coords.lat = 28.7041; coords.lng = 77.1025; }
      else if (cityHub === "Chennai") { coords.lat = 13.0827; coords.lng = 80.2707; }

      // 1. Run AI fraud check
      try {
        const fraudRes = await fetch(`${API_BASE}/api/fraud-check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: contactPhone,
            locationText: `${cityHub} Hub - ${hospitalName}`,
            patientCondition: `Clinical request for ${units} units of ${bloodGroup} for ${patientName || 'emergency case'}`
          })
        });
        if (fraudRes.ok) {
          const fraudData = await fraudRes.json();
          setFraudScore(fraudData);
        }
      } catch (err) {
        console.warn("Fraud check server skipped", err);
      }

      // 2. Fetch matched donors & blood banks from intelligent engine
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
      
      if (data.matchedDonors) {
        setResultsDonors(data.matchedDonors.map((d: any) => ({
          name: d.name,
          blood: d.bloodGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-"),
          distance: `${d.distanceKm} km`,
          eta: `${d.estTravelTimeMin} mins`,
          score: d.matchScore,
          likelihood: d.responseLikelihoodPct
        })));
      }
      if (data.matchedBloodBanks) {
        setResultsBanks(data.matchedBloodBanks.map((b: any) => ({
          name: b.name,
          stock: b.stockAvailable,
          distance: `${b.distanceKm} km`,
          eta: `${b.estimatedArrivalMin} mins`,
          score: b.confidenceScore
        })));
      }

      // 3. Create request on backend
      const reqRes = await fetch(`${API_BASE}/api/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientCondition: `Hospital Request for ${patientName || 'Patient'}: ${units} units of ${bloodGroup}`,
          bloodGroup: bloodGroup.replace("+", "_POSITIVE").replace("-", "_NEGATIVE"),
          volumeMl: units * 450,
          priority: urgency === "Emergency" ? "CRITICAL" : (urgency === "Priority" ? "HIGH" : "MEDIUM"),
          hospitalName: hospitalName,
          latitude: coords.lat,
          longitude: coords.lng
        })
      });
      const reqData = await reqRes.json();

      const newReq: BloodRequest = {
        id: reqData.id || `REQ-${Date.now().toString().slice(-4)}`,
        patientName: patientName || `Patient Alert (${bloodGroup})`,
        bloodGroup: bloodGroup,
        volumeMl: units * 450,
        urgency,
        status: "PENDING",
        location: cityHub,
        hospitalName: hospitalName,
        createdAt: new Date().toISOString()
      };
      setRequests(prev => [newReq, ...prev]);
      addNotification(`Hospital Request Created: ${units} units ${bloodGroup} allocated to ${hospitalName}`);
    } catch (e: any) {
      console.error(e);
      // Offline graceful fallback
      const newReq: BloodRequest = {
        id: `REQ-${Date.now().toString().slice(-4)}`,
        patientName: patientName || `Patient Alert (${bloodGroup})`,
        bloodGroup: bloodGroup,
        volumeMl: units * 450,
        urgency,
        status: "PENDING",
        location: cityHub,
        hospitalName: hospitalName,
        createdAt: new Date().toISOString()
      };
      setRequests(prev => [newReq, ...prev]);
      addNotification(`Hospital Request Logged: ${bloodGroup} for ${hospitalName}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-[#49303A] pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-[#FFF7F5] font-heading flex items-center gap-2">
            <Search className="w-4 h-4 text-[#C72C41]" /> Hospital Blood Request Portal
          </h2>
          <p className="text-xs text-[#C3AEB4] mt-0.5">
            Structured 7-step clinical triage and intelligent donor matching protocol.
          </p>
        </div>
        <span className="text-[10px] font-mono text-[#E8A0AA] px-2 py-0.5 bg-[#321923] border border-[#49303A] rounded">
          Zone: {userLocation}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 7 Organized Form Sections */}
        <div className="lg:col-span-6 burgundy-card p-6 border border-[#49303A] shadow-xl">
          <form onSubmit={handleSearchAndCreate} className="space-y-5">
            
            {/* Section 1: Receiver Information */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FFF7F5]">
                <span className="w-5 h-5 rounded-full bg-[#C72C41] text-white flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>RECEIVER & PATIENT INFORMATION</span>
              </div>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
                placeholder="Patient Full Name / Case Code (e.g. Alice Smith)"
                className="input-premium py-2 text-xs"
              />
            </div>

            {/* Section 2: Contact Information */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FFF7F5]">
                <span className="w-5 h-5 rounded-full bg-[#C72C41] text-white flex items-center justify-center text-[10px]">
                  2
                </span>
                <span>CONTACT INFORMATION</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  required
                  placeholder="+91 98765 43210"
                  className="input-premium py-2 text-xs font-mono"
                />
                <input
                  type="email"
                  value={coordinatorEmail}
                  onChange={(e) => setCoordinatorEmail(e.target.value)}
                  required
                  placeholder="doctor@hospital.org"
                  className="input-premium py-2 text-xs font-mono"
                />
              </div>
            </div>

            {/* Section 3: Required Blood Group */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FFF7F5]">
                <span className="w-5 h-5 rounded-full bg-[#C72C41] text-white flex items-center justify-center text-[10px]">
                  3
                </span>
                <span>REQUIRED BLOOD GROUP</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setBloodGroup(grp)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer font-mono ${
                      bloodGroup === grp
                        ? "bg-[#C72C41] border-[#E05263] text-[#FFF7F5] shadow-md shadow-[#C72C41]/25"
                        : "bg-[#24151D] border-[#563441] text-[#C3AEB4] hover:text-[#FFF7F5] hover:border-[#C72C41]"
                    }`}
                  >
                    {grp}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 4: Number of Units */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FFF7F5]">
                <span className="w-5 h-5 rounded-full bg-[#C72C41] text-white flex items-center justify-center text-[10px]">
                  4
                </span>
                <span>NUMBER OF UNITS (VOLUME)</span>
              </div>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnits(u)}
                    className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                      units === u
                        ? "bg-[#3A202B] border-[#C72C41] text-[#FFF7F5]"
                        : "bg-[#24151D] border-[#563441] text-[#C3AEB4] hover:text-[#FFF7F5]"
                    }`}
                  >
                    {u} {u === 1 ? 'Unit' : 'Units'}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 5: Location Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FFF7F5]">
                <span className="w-5 h-5 rounded-full bg-[#C72C41] text-white flex items-center justify-center text-[10px]">
                  5
                </span>
                <span>HOSPITAL & ZONE SELECTION</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  required
                  placeholder="Hospital name"
                  className="input-premium py-2 text-xs"
                />
                <select
                  value={cityHub}
                  onChange={(e) => setCityHub(e.target.value)}
                  className="select-premium py-2 text-xs font-mono"
                >
                  <option value="Bengaluru">Bengaluru Hub</option>
                  <option value="Hyderabad">Hyderabad Hub</option>
                  <option value="Mumbai">Mumbai Hub</option>
                  <option value="Delhi">Delhi Hub</option>
                  <option value="Chennai">Chennai Hub</option>
                </select>
              </div>
            </div>

            {/* Section 6: Urgency Level */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FFF7F5]">
                <span className="w-5 h-5 rounded-full bg-[#C72C41] text-white flex items-center justify-center text-[10px]">
                  6
                </span>
                <span>URGENCY LEVEL</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setUrgency("Normal")}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer font-mono ${
                    urgency === "Normal"
                      ? "bg-[#22C55E]/20 border-[#22C55E] text-[#22C55E] shadow-sm"
                      : "bg-[#24151D] border-[#563441] text-[#C3AEB4] hover:text-[#FFF7F5]"
                  }`}
                >
                  ● Normal
                </button>
                <button
                  type="button"
                  onClick={() => setUrgency("Priority")}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer font-mono ${
                    urgency === "Priority"
                      ? "bg-[#F59E0B]/20 border-[#F59E0B] text-[#F59E0B] shadow-sm"
                      : "bg-[#24151D] border-[#563441] text-[#C3AEB4] hover:text-[#FFF7F5]"
                  }`}
                >
                  ▲ Urgent
                </button>
                <button
                  type="button"
                  onClick={() => setUrgency("Emergency")}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer font-mono ${
                    urgency === "Emergency"
                      ? "bg-[#FF334F]/25 border-[#FF334F] text-[#FF334F] shadow-md shadow-[#FF334F]/20"
                      : "bg-[#24151D] border-[#563441] text-[#C3AEB4] hover:text-[#FFF7F5]"
                  }`}
                >
                  ⚡ Emergency
                </button>
              </div>
            </div>

            {/* Section 7: Request Submission */}
            <div className="pt-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FFF7F5] mb-2">
                <span className="w-5 h-5 rounded-full bg-[#C72C41] text-white flex items-center justify-center text-[10px]">
                  7
                </span>
                <span>CONFIRM & EXECUTE PROTOCOL</span>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 btn-premium text-xs tracking-wider cursor-pointer font-bold uppercase font-mono shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing Matching Protocol...</span>
                  </>
                ) : (
                  <>
                    <Droplet className="w-4 h-4 fill-white" />
                    <span>Submit Request & Execute AI Match</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* AI Integrity Check Results */}
          {fraudScore && (
            <div className={`mt-4 p-4 border rounded-xl font-mono text-xs space-y-2 leading-relaxed ${
              fraudScore.isSuspicious
                ? 'bg-[#FF334F]/10 border-[#FF334F]/40 text-[#FF334F]'
                : 'bg-[#22C55E]/10 border-[#22C55E]/40 text-[#22C55E]'
            }`}>
              <span className="font-bold block uppercase tracking-wider">
                🛡️ AI Integrity: {fraudScore.isSuspicious ? 'Suspicious Request Flagged' : 'Verified Secure Clinical Request'}
              </span>
              <p>Trust Score Index: <span className="font-bold">{fraudScore.trustScore}/100</span></p>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                {fraudScore.reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Intelligent Matching Engine Results (Section 11) */}
        <div className="lg:col-span-6 burgundy-card p-6 border border-[#49303A] shadow-xl flex flex-col justify-between min-h-[450px]">
          <div>
            <div className="flex items-center justify-between border-b border-[#49303A] pb-3 mb-4">
              <h3 className="font-bold text-[#FFF7F5] text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#C72C41]" /> Intelligent Donor Matching Engine
              </h3>
              <span className="text-[10px] font-mono text-[#E8A0AA]">
                {resultsDonors.length + resultsBanks.length} Compatible Nodes Found
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-3">
                <RefreshCw className="w-8 h-8 text-[#C72C41] animate-spin" />
                <p className="text-xs text-[#C3AEB4] font-mono">Running RF-Dijkstra compatibility searches...</p>
              </div>
            ) : resultsDonors.length > 0 || resultsBanks.length > 0 ? (
              <div className="space-y-3 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
                {resultsDonors.map((donor, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 border border-[#49303A] bg-[#24151D] rounded-xl flex items-center justify-between hover:border-[#C72C41]/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#C72C41]/15 border border-[#C72C41]/30 flex items-center justify-center text-xs font-bold text-[#FFF7F5]">
                        {donor.blood}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-[#FFF7F5] block">{donor.name}</span>
                        <p className="text-[10px] text-[#C3AEB4] font-mono mt-0.5">
                          Distance: {donor.distance} | ETA: {donor.eta}
                        </p>
                        <span className="inline-block mt-1 text-[9px] font-mono text-[#22C55E] bg-[#22C55E]/10 px-1.5 py-0.2 rounded border border-[#22C55E]/30">
                          Eligible to Donate
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-[#E8A0AA] px-2 py-0.5 rounded bg-[#321923] border border-[#49303A] block">
                        {donor.score}% match
                      </span>
                      <button
                        type="button"
                        onClick={() => alert(`Direct dispatch notification sent to ${donor.name}`)}
                        className="mt-1.5 text-[10px] font-mono text-[#C72C41] hover:underline block"
                      >
                        Notify Donor →
                      </button>
                    </div>
                  </div>
                ))}

                {resultsBanks.map((bank, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 border border-[#49303A] bg-[#24151D] rounded-xl flex items-center justify-between hover:border-[#C72C41]/50 transition-all"
                  >
                    <div>
                      <span className="font-bold text-xs text-[#FFF7F5] block">{bank.name}</span>
                      <p className="text-[10px] text-[#C3AEB4] font-mono mt-0.5">
                        In Stock: {bank.stock} Units | Distance: {bank.distance} | ETA: {bank.eta}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#38BDF8] px-2 py-0.5 rounded bg-[#38BDF8]/10 border border-[#38BDF8]/30">
                      {bank.score}% confidence
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-[#9C858D] text-center space-y-2">
                <Search className="w-10 h-10 text-[#49303A] mb-1" />
                <p className="text-xs font-mono">Fill and submit the request to trigger live AI compatibility matching.</p>
                <p className="text-[10px] text-[#9C858D]">Evaluates distance, response likelihood, and current blood stock.</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#49303A] text-[10px] font-mono text-[#9C858D] flex items-center justify-between">
            <span>Dijkstra Match Engine: v4.2</span>
            <span className="text-[#22C55E]">Optimal Corridors Armed</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================
   SECTION 9: DONOR REGISTRATION INTERFACE
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
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [availability, setAvailability] = useState("Available");
  const [city, setCity] = useState("Bengaluru");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    addNotification(`DONOR REGISTERED: New active node verified for ${name} (${bloodGroup}) in ${city}`);
    setName("");
    setEmail("");
    alert("Donor successfully registered in the HemoConnect network!");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-[#49303A] pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-[#FFF7F5] font-heading flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#C72C41]" /> Donor Registration Network
          </h2>
          <p className="text-xs text-[#C3AEB4] mt-0.5">
            Register your blood profile and join the autonomous emergency dispatch roster.
          </p>
        </div>
        <span className="text-[10px] font-mono text-[#22C55E] px-2 py-0.5 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded">
          ● Registry Open
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <div className="burgundy-card p-6 space-y-4 border border-[#49303A] shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-[#C3AEB4] block mb-1 uppercase tracking-wider font-semibold">
                DONOR FULL NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Evelyn Vance"
                className="input-premium py-2.5 text-xs"
                required
              />
            </div>
            <div>
              <label className="text-xs font-mono text-[#C3AEB4] block mb-1 uppercase tracking-wider font-semibold">
                SECURE EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="evelyn@domain.org"
                className="input-premium py-2.5 text-xs font-mono"
                required
              />
            </div>

            {/* Blood Group Pill Selection */}
            <div>
              <label className="text-xs font-mono text-[#C3AEB4] block mb-1.5 uppercase tracking-wider font-semibold">
                BLOOD GROUP
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setBloodGroup(grp)}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer font-mono ${
                      bloodGroup === grp
                        ? "bg-[#C72C41] border-[#E05263] text-[#FFF7F5] shadow-sm"
                        : "bg-[#24151D] border-[#563441] text-[#C3AEB4] hover:text-[#FFF7F5]"
                    }`}
                  >
                    {grp}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-[#C3AEB4] block mb-1 uppercase tracking-wider font-semibold">
                  DISPATCH STATE
                </label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="select-premium text-xs font-mono"
                >
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-mono text-[#C3AEB4] block mb-1 uppercase tracking-wider font-semibold">
                  PRIMARY HUB
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="select-premium text-xs font-mono"
                >
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Chennai">Chennai</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 btn-premium text-xs tracking-wider cursor-pointer font-bold uppercase font-mono shadow-lg"
            >
              Confirm Donor Registration
            </button>
          </form>
        </div>

        {/* Center: Live Wearables */}
        <div className="burgundy-card p-6 space-y-4 border border-[#49303A] shadow-md flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-[#FFF7F5] text-xs font-mono uppercase tracking-wider flex items-center gap-2 border-b border-[#49303A] pb-2">
              <Activity className="w-4 h-4 text-[#C72C41] heartbeat-icon" /> Donor Vitals Compatibility
            </h3>
            <div className="grid grid-cols-2 gap-3 font-mono text-xs mt-4">
              <div className="p-3.5 border border-[#49303A] bg-[#24151D] rounded-xl text-center space-y-1">
                <span className="text-[10px] text-[#9C858D] block font-bold">HEART RATE</span>
                <span className="text-sm font-bold text-[#FFF7F5] flex items-center justify-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-[#C72C41] fill-[#C72C41] animate-pulse" /> {wearableData.heartRate} bpm
                </span>
              </div>
              <div className="p-3.5 border border-[#49303A] bg-[#24151D] rounded-xl text-center space-y-1">
                <span className="text-[10px] text-[#9C858D] block font-bold">BODY TEMP</span>
                <span className="text-sm font-bold text-[#FFF7F5]">{wearableData.bodyTemp} °C</span>
              </div>
            </div>

            {/* EKG heartbeat line */}
            <div className="h-20 border border-[#49303A] bg-[#24151D] rounded-xl overflow-hidden flex items-center relative mt-4">
              <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path
                  d="M 0,15 L 15,15 L 20,15 L 23,2 L 27,28 L 30,15 L 45,15 L 60,15 L 63,2 L 67,28 L 70,15 L 85,15 L 100,15"
                  fill="none"
                  stroke="#C72C41"
                  strokeWidth="1.5"
                  className="signal-path"
                  style={{ animationDuration: '2s' }}
                />
              </svg>
            </div>
          </div>

          <div className="text-[10px] font-mono text-[#9C858D] pt-2 border-t border-[#49303A] flex items-center justify-between">
            <span>Biometric Sync Status</span>
            <span className="text-[#22C55E]">STABLE_NORMAL</span>
          </div>
        </div>

        {/* Right: Digital Passport */}
        <div className="burgundy-card p-6 space-y-4 border border-[#49303A] shadow-md flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-[#FFF7F5] text-xs font-mono uppercase tracking-wider border-b border-[#49303A] pb-2">
              Verified Digital Passport
            </h3>
            <div className="bg-[#24151D] border border-[#49303A] rounded-xl p-4 flex items-center justify-between mt-4">
              <div className="space-y-1.5 font-mono text-xs">
                <span className="text-xs font-bold text-[#FFF7F5] block">PASS CODE: HC-99</span>
                <span className="text-[10px] text-[#E8A0AA] block uppercase font-bold">
                  Verified Blood Guardian
                </span>
                <span className="text-[9px] text-[#9C858D] block">
                  Eligible for Emergency Priority
                </span>
              </div>
              <QrCode className="w-12 h-12 text-[#E8A0AA]" />
            </div>
          </div>

          <div className="p-3 bg-[#321923] border border-[#49303A] rounded-xl text-[10px] text-[#C3AEB4] leading-relaxed">
            Present this QR code at authorized medical centers for automated fast-track donor registration.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================
   SECTION 11: MATCHING ENGINE & ALERT INBOX
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
    addNotification(`DISPATCH ACCEPTED: Coordinate drone transit armed for Case ${id}`);
    alert("Blood transport drone dispatched successfully!");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-[#49303A] pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-base font-extrabold text-[#FFF7F5] font-heading flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#C72C41]" /> Priority Alert Queue & Matching
          </h2>
          <p className="text-xs text-[#C3AEB4] mt-0.5">
            Active hospital emergency alerts requiring donor response in {userLocation}.
          </p>
        </div>
        <span className="text-[10px] font-mono text-[#38BDF8] border border-[#38BDF8]/30 px-2 py-0.5 rounded bg-[#38BDF8]/10">
          ● GPS Synced
        </span>
      </div>

      <div className="burgundy-card p-6 min-h-[350px] border border-[#49303A] shadow-md">
        {filtered.length > 0 ? (
          <div className="space-y-3.5">
            {filtered.map(req => (
              <div
                key={req.id}
                className="p-4 border border-[#49303A] bg-[#24151D] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#563441] transition-all"
              >
                <div>
                  <span className="px-2 py-0.5 bg-[#321923] border border-[#49303A] text-[9px] text-[#E8A0AA] font-mono rounded font-bold">
                    CASE REF: {req.id}
                  </span>
                  <h4 className="text-sm font-bold text-[#FFF7F5] mt-2 flex items-center gap-2">
                    {req.patientName}
                    <span className="px-2 py-0.5 bg-[#C72C41]/20 border border-[#C72C41]/40 text-[#E8A0AA] rounded text-xs font-mono">
                      {req.bloodGroup}
                    </span>
                    {req.urgency === "Emergency" && (
                      <span className="px-2 py-0.5 bg-[#FF334F]/20 text-[#FF334F] border border-[#FF334F]/40 text-[9px] rounded font-mono font-bold animate-pulse">
                        EMERGENCY DISPATCH
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-[#C3AEB4] mt-1 font-mono">{req.hospitalName}</p>
                </div>
                <button
                  onClick={() => handleAccept(req.id)}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#D93A50] to-[#A91F36] hover:brightness-110 text-white text-xs font-bold font-mono rounded-xl transition-all cursor-pointer shadow-md shadow-[#C72C41]/25"
                >
                  Accept Dispatch Alert
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-52 text-[#9C858D] text-center space-y-2">
            <CheckCircle className="w-10 h-10 text-[#22C55E] mb-1" />
            <p className="text-xs font-mono text-[#FFF7F5]">No pending critical alerts in {userLocation} Hub.</p>
            <p className="text-[10px] text-[#9C858D]">All requests in this zone have been matched or delivered.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ========================================================
   SECTION 8: GIS RADAR & LOCATION MAP
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
    } catch {
      // Offline fallback route calculation
      setRouteResult({
        path_details: [startNode, "N2", "N3", endNode],
        distance_km: 14.8,
        travel_time_minutes: 18.2,
        route_status: "OPTIMIZED_CORRIDOR"
      });
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
      <div className="border-b border-[#49303A] pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-base font-extrabold text-[#FFF7F5] font-heading flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#C72C41]" /> Live GIS Radar & Medical Operations Center
          </h2>
          <p className="text-xs text-[#C3AEB4] mt-0.5 font-mono">
            Location-based Dijkstra route optimization and emergency corridor mapping.
          </p>
        </div>
        <span className="text-[10px] font-mono text-[#E8A0AA] border border-[#49303A] px-2 py-0.5 rounded bg-[#321923]">
          Engine: Dijkstra v4.2
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-4 burgundy-card p-5 space-y-4 border border-[#49303A] shadow-md h-fit">
          <h3 className="font-bold text-[#FFF7F5] text-xs font-mono uppercase tracking-wider">
            Dispatch Corridors
          </h3>
          
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[10px] text-[#C3AEB4] font-mono block mb-1 font-bold">
                START DISPATCH HUB
              </label>
              <select
                value={startNode}
                onChange={e => setStartNode(e.target.value)}
                className="select-premium text-xs font-mono"
              >
                {Object.entries(nodeNames).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-[10px] text-[#C3AEB4] font-mono block mb-1 font-bold">
                DESTINATION HOSPITAL NODE
              </label>
              <select
                value={endNode}
                onChange={e => setEndNode(e.target.value)}
                className="select-premium text-xs font-mono"
              >
                {Object.entries(nodeNames).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>

            <div className="border-t border-[#49303A] pt-3 space-y-2 font-mono text-xs">
              <label className="text-[10px] text-[#9C858D] block mb-1 uppercase font-bold">
                ROAD TRAFFIC OVERRIDES
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer py-1 text-[#C3AEB4] hover:text-[#FFF7F5] transition-colors">
                <input
                  type="checkbox"
                  checked={trafficBegumpet}
                  onChange={e => setTrafficBegumpet(e.target.checked)}
                  className="rounded border-[#49303A] accent-[#C72C41] bg-[#24151D]"
                />
                <span>Heavy Traffic (Begumpet N2)</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer py-1 text-[#C3AEB4] hover:text-[#FFF7F5] transition-colors">
                <input
                  type="checkbox"
                  checked={roadClosureHitech}
                  onChange={e => setRoadClosureHitech(e.target.checked)}
                  className="rounded border-[#49303A] accent-[#C72C41] bg-[#24151D]"
                />
                <span className="text-[#FF334F]">Road Closure (Hitech City N8)</span>
              </label>
            </div>
          </div>

          <button
            onClick={calculateRoute}
            disabled={loading}
            className="w-full py-3 btn-premium text-xs tracking-wider cursor-pointer font-bold uppercase font-mono shadow-md"
          >
            {loading ? "Calculating Optimal Corridor..." : "⚡ Calculate AI Route"}
          </button>
        </div>

        {/* Map Visualization & Legend */}
        <div className="lg:col-span-8 burgundy-card p-5 flex flex-col justify-between min-h-[420px] border border-[#49303A] shadow-md">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#49303A] pb-3">
              <h3 className="font-bold text-[#FFF7F5] text-xs font-mono uppercase tracking-wider">
                Interactive GIS Radar Visualization
              </h3>
              {routeResult && (
                <span className="text-[#E8A0AA] font-mono text-xs border border-[#49303A] px-2.5 py-0.5 rounded bg-[#24151D]">
                  ETA: {routeResult.travel_time_minutes} MINS ({routeResult.distance_km || 14.8} km)
                </span>
              )}
            </div>

            {/* SVG Interactive Node Map Graph (Deep Burgundy Medical Tech Aesthetic) */}
            <div className="w-full h-72 border border-[#49303A] bg-[#190D13] rounded-xl relative overflow-hidden flex items-center justify-center">
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
                      stroke="#49303A"
                      strokeWidth="1.5"
                    />
                  );
                })}

                {/* Draw active Dijkstra route path if calculated */}
                {routeResult && routeResult.path_details && (
                  <path
                    d={getPathSvgD(routeResult.path_details)}
                    fill="none"
                    stroke="#C72C41"
                    strokeWidth="3.5"
                    className="signal-path"
                  />
                )}

                {/* Draw active nodes */}
                {Object.entries(nodeCoords).map(([id, coord]) => {
                  const isStart = id === startNode;
                  const isEnd = id === endNode;
                  const isInRoute = routeResult?.path_details?.includes(id);

                  let circleFill = "#24151D";
                  let circleStroke = "#49303A";
                  if (isStart) {
                    circleFill = "#A91F36";
                    circleStroke = "#C72C41";
                  } else if (isEnd) {
                    circleFill = "#1E293B";
                    circleStroke = "#38BDF8";
                  } else if (isInRoute) {
                    circleFill = "#14532D";
                    circleStroke = "#22C55E";
                  }

                  return (
                    <g key={`node-${id}`}>
                      {(isStart || isEnd) && (
                        <circle
                          cx={coord.x}
                          cy={coord.y}
                          r="15"
                          fill="none"
                          stroke={isStart ? "#C72C41" : "#38BDF8"}
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
                      <text
                        x={coord.x}
                        y={coord.y + 18}
                        fill={isStart || isEnd || isInRoute ? "#FFF7F5" : "#9C858D"}
                        fontSize="9"
                        fontWeight={isStart || isEnd || isInRoute ? "bold" : "normal"}
                        textAnchor="middle"
                        className="font-mono tracking-wider pointer-events-none"
                      >
                        {id}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Map Legend (Required in Section 8) */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#24151D] border border-[#49303A] rounded-xl text-[10px] font-mono text-[#C3AEB4]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]"></span>
                Available Donors
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#9C858D]"></span>
                Busy / Offline
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]"></span>
                Hospitals
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF334F]"></span>
                Emergency Requests
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C72C41]"></span>
                Current Hub
              </span>
            </div>

            {/* Turn by turn intersections */}
            {routeResult && (
              <div className="p-3 bg-[#24151D] border border-[#49303A] rounded-xl space-y-1.5 font-mono text-xs">
                <span className="text-[#9C858D] text-[10px] uppercase font-bold block">
                  AI DISPATCH PATHWAY INTERSECTIONS:
                </span>
                <p className="text-[#FFF7F5] font-bold flex flex-wrap items-center gap-1.5">
                  {routeResult.path_details.map((node: string, index: number) => (
                    <span key={index} className="flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${
                        node === startNode
                          ? 'bg-[#A91F36] text-[#FFF7F5] border border-[#C72C41]'
                          : (node === endNode
                            ? 'bg-[#1E293B] text-[#38BDF8] border border-[#38BDF8]/40'
                            : 'bg-[#321923] border border-[#49303A] text-[#C3AEB4]')
                      }`}>
                        {nodeNames[node] || node}
                      </span>
                      {index < routeResult.path_details.length - 1 && <span className="text-[#9C858D]">→</span>}
                    </span>
                  ))}
                </p>
              </div>
            )}
          </div>
          
          <div className="w-full text-center py-2 font-mono text-[9px] text-[#9C858D] uppercase tracking-widest mt-2">
            HEMO CONNECT GIS OPERATIONS RADAR v4.2
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================
   SUPPORTING VIEWS (HEALTH, CHAT, HISTORY, FORECAST, ETC.)
   ======================================================== */
function HealthTips() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-[#49303A] pb-3">
        <h2 className="text-base font-extrabold text-[#FFF7F5] font-heading flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#C72C41]" /> Health & Recovery Guides
        </h2>
        <p className="text-xs text-[#C3AEB4] mt-0.5">Pre & post donation clinical protocols for donor well-being.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="burgundy-card p-6 space-y-3 border border-[#49303A] shadow-md">
          <h3 className="text-xs font-bold text-[#FFF7F5] flex items-center gap-2">
            <Droplet className="w-4 h-4 text-[#38BDF8]" /> Pre-Donation Protocols
          </h3>
          <ul className="text-xs text-[#C3AEB4] space-y-2.5 list-disc pl-4 leading-relaxed font-mono">
            <li>Drink 500 mL of clean water directly before your extraction.</li>
            <li>Maintain iron-rich meals (beets, spinach, grains) 3 days prior.</li>
            <li>Verify 7–8 hours of restful sleep cycles on your vital tracker.</li>
          </ul>
        </div>

        <div className="burgundy-card p-6 space-y-3 border border-[#49303A] shadow-md">
          <h3 className="text-xs font-bold text-[#FFF7F5] flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#C72C41]" /> Post-Donation Recovery
          </h3>
          <ul className="text-xs text-[#C3AEB4] space-y-2.5 list-disc pl-4 leading-relaxed font-mono">
            <li>Avoid high strenuous weight lift activities for 24 hours.</li>
            <li>Hydrate heavily and consume electrolyte items post recovery.</li>
            <li>Keep the bandaging layer sealed on extraction spot for 5 hours.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

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

    recognition.onstart = () => setIsListening(true);
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

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
        setMessages(prev => [...prev, { sender: "ai", text: "Parser parsed request. Target blood units verified for emergency dispatch." }]);
      }
    } catch {
      setMessages(prev => [...prev, { sender: "ai", text: `Understood: "${query}". Processing request in local emergency buffer.` }]);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-[#49303A] pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-base font-extrabold text-[#FFF7F5] font-heading flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#C72C41]" /> Emergency Voice & AI Assistant
          </h2>
          <p className="text-xs text-[#C3AEB4] mt-0.5">Semantic natural language parser for rapid triage input.</p>
        </div>
      </div>

      <div className="burgundy-card p-6 h-[440px] flex flex-col justify-between border border-[#49303A] shadow-md">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] p-3.5 rounded-xl text-xs space-y-1 font-mono ${
                m.sender === "user"
                  ? "bg-[#C72C41]/20 border border-[#C72C41]/40 text-[#FFF7F5]"
                  : "bg-[#24151D] border border-[#49303A] text-[#C3AEB4]"
              }`}>
                <span className="text-[9px] text-[#9C858D] block uppercase font-bold">
                  {m.sender === "user" ? "USER DISPATCHER" : "HEMO-COPILOT"}
                </span>
                <div className="whitespace-pre-line leading-relaxed text-xs">{m.text}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2.5 border-t border-[#49303A] pt-4 mt-4 font-mono">
          <button 
            onClick={startVoiceDictation} 
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isListening ? 'bg-[#FF334F] animate-pulse text-white' : 'bg-[#24151D] border border-[#49303A] text-[#C3AEB4] hover:text-white'
            }`}
          >
            🎤 {isListening ? "Listening..." : "Dictate"}
          </button>
          <input
            type="text"
            placeholder="Type emergency query (e.g. 2 units O-Negative needed at Apollo)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendText()}
            className="input-premium py-2 text-xs"
          />
          <button
            onClick={() => handleSendText()}
            className="px-5 py-2.5 btn-premium text-xs cursor-pointer font-bold uppercase tracking-wider"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function DonationHistory() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-[#49303A] pb-3">
        <h2 className="text-base font-extrabold text-[#FFF7F5] font-heading">📋 Donation History</h2>
        <p className="text-xs text-[#C3AEB4] mt-0.5">Logged records of completed transfusions and donations.</p>
      </div>

      <div className="burgundy-card p-6 border border-[#49303A] shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#C3AEB4] font-mono">
            <thead>
              <tr className="border-b border-[#49303A] text-[#9C858D]">
                <th className="py-3">DATE</th>
                <th className="py-3">LOCATION ZONE</th>
                <th className="py-3">BLOOD TYPE</th>
                <th className="py-3">VOLUME</th>
                <th className="py-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#49303A]/60">
              <tr className="hover:bg-[#321923]/40 transition-colors">
                <td className="py-3.5">2026-02-10</td>
                <td className="py-3.5">Bengaluru Central Campus</td>
                <td className="py-3.5 font-bold text-[#FFF7F5]">O-</td>
                <td className="py-3.5">450 mL</td>
                <td className="py-3.5 text-[#22C55E] font-bold">TRANSFUSED</td>
              </tr>
              <tr className="hover:bg-[#321923]/40 transition-colors">
                <td className="py-3.5">2025-11-12</td>
                <td className="py-3.5">Hyderabad Gachibowli Hub</td>
                <td className="py-3.5 font-bold text-[#FFF7F5]">O-</td>
                <td className="py-3.5">450 mL</td>
                <td className="py-3.5 text-[#22C55E] font-bold">TRANSFUSED</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

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
    } catch {
      setForecast({
        predictedDemand: 412,
        predictedSupply: 380,
        predictedDeficit: -32
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [month, outbreakSeverity, festivalSeason, accidentsLogged]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-[#49303A] pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-base font-extrabold text-[#FFF7F5] font-heading">
            📊 Shortage Forecasting & Demand Simulator
          </h2>
          <p className="text-xs text-[#C3AEB4] mt-0.5">
            Predictive seasonal deficit analysis based on machine learning lag models.
          </p>
        </div>
        <span className="text-[10px] font-mono text-[#E8A0AA] border border-[#49303A] px-2 py-0.5 rounded bg-[#321923]">
          Ridge ML Model
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 burgundy-card p-5 space-y-4 border border-[#49303A] shadow-md h-fit">
          <h3 className="font-bold text-[#FFF7F5] text-xs font-mono uppercase tracking-wider">
            Lag Modifiers
          </h3>
          
          <div className="space-y-4 text-xs font-mono">
            <div>
              <label className="text-[10px] text-[#9C858D] block mb-1">CALENDAR MONTH</label>
              <select
                value={month}
                onChange={e => setMonth(parseInt(e.target.value))}
                className="select-premium text-xs font-mono"
              >
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, idx) => (
                  <option key={idx} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[#9C858D] block mb-1">OUTBREAK SEVERITY FACTOR</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={outbreakSeverity}
                  onChange={e => setOutbreakSeverity(parseFloat(e.target.value))}
                  className="flex-1 accent-[#C72C41] bg-[#24151D] border border-[#49303A] rounded"
                />
                <span className="text-[#FFF7F5] text-xs w-6 text-right font-bold">{outbreakSeverity}</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#9C858D] block mb-1">ACCIDENTS REPORTED WEEKLY</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={accidentsLogged}
                  onChange={e => setAccidentsLogged(parseInt(e.target.value))}
                  className="flex-1 accent-[#C72C41] bg-[#24151D] border border-[#49303A] rounded"
                />
                <span className="text-[#FFF7F5] text-xs w-6 text-right font-bold">{accidentsLogged}</span>
              </div>
            </div>

            <div className="border-t border-[#49303A] pt-3">
              <label className="flex items-center gap-2.5 cursor-pointer py-1 text-[#C3AEB4] hover:text-[#FFF7F5] transition-colors">
                <input
                  type="checkbox"
                  checked={festivalSeason === 1}
                  onChange={e => setFestivalSeason(e.target.checked ? 1 : 0)}
                  className="rounded border-[#49303A] accent-[#C72C41] bg-[#24151D]"
                />
                <span>Festival Season (Lower Turnout)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 burgundy-card p-6 space-y-6 border border-[#49303A] shadow-md">
          <h3 className="font-bold text-[#FFF7F5] border-b border-[#49303A] pb-3 text-xs font-mono uppercase tracking-wider">
            Predictive Model Outputs
          </h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-[#9C858D]">
              <RefreshCw className="w-8 h-8 text-[#C72C41] animate-spin" />
            </div>
          ) : forecast ? (
            <div className="space-y-6 font-mono text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 border border-[#49303A] rounded-xl bg-[#24151D] space-y-1">
                  <span className="text-[9px] text-[#9C858D] uppercase block font-bold">Predicted Demand</span>
                  <span className="text-xl font-bold text-[#FFF7F5] block">{forecast.predictedDemand} units</span>
                </div>
                <div className="p-4 border border-[#49303A] rounded-xl bg-[#24151D] space-y-1">
                  <span className="text-[9px] text-[#9C858D] uppercase block font-bold">Predicted Supply</span>
                  <span className="text-xl font-bold text-[#FFF7F5] block">{forecast.predictedSupply} units</span>
                </div>
                <div className={`p-4 border rounded-xl space-y-1 ${
                  forecast.predictedDeficit < 0
                    ? 'bg-[#FF334F]/10 border-[#FF334F]/30'
                    : 'bg-[#22C55E]/10 border-[#22C55E]/30'
                }`}>
                  <span className="text-[9px] text-[#9C858D] uppercase block font-bold">Net Margin Deficit</span>
                  <span className={`text-xl font-bold block ${
                    forecast.predictedDeficit < 0 ? 'text-[#FF334F]' : 'text-[#22C55E]'
                  }`}>
                    {forecast.predictedDeficit} units
                  </span>
                </div>
              </div>

              {forecast.predictedDeficit < 0 ? (
                <div className="p-4 bg-[#FF334F]/10 border border-[#FF334F]/30 text-[#FFF7F5] rounded-xl flex gap-3 text-xs leading-relaxed">
                  <AlertCircle className="w-5 h-5 text-[#FF334F] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#FF334F] uppercase block text-xs">
                      CRITICAL DEFICIT WARNING
                    </span>
                    <p className="mt-1 text-[#C3AEB4]">
                      ML regression forecasts a net deficiency of {Math.abs(forecast.predictedDeficit)} units. Recommending early blood donation drives in nearby residential zones.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#FFF7F5] rounded-xl flex gap-3 text-xs leading-relaxed">
                  <CheckCircle className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#22C55E] uppercase block text-xs">
                      STABLE RESERVES CONFIRMED
                    </span>
                    <p className="mt-1 text-[#C3AEB4]">
                      Predicted surplus (+{forecast.predictedDeficit} units). Normal routing dispatches are validated to proceed.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function RewardsPage() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-[#49303A] pb-3">
        <h2 className="text-base font-extrabold text-[#FFF7F5] font-heading">🏆 Rewards & Recognition</h2>
        <p className="text-xs text-[#C3AEB4] mt-0.5">Recognition tiers for active life-saving donors.</p>
      </div>

      <div className="burgundy-card p-6 border border-[#49303A] shadow-md space-y-4">
        <div className="p-4 border border-[#C72C41]/30 bg-[#24151D] rounded-xl flex gap-3">
          <Award className="w-8 h-8 text-[#E8A0AA] shrink-0" />
          <div className="font-mono text-xs">
            <span className="font-bold text-[#FFF7F5] block text-sm">Rare Blood Guardian Tier</span>
            <p className="text-[#C3AEB4] mt-1 leading-normal">
              Awarded to donors logging verified O-Negative or AB-Negative dispatches during priority alarms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessStories() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-[#49303A] pb-3">
        <h2 className="text-base font-extrabold text-[#FFF7F5] font-heading">🌟 Success Stories</h2>
        <p className="text-xs text-[#C3AEB4] mt-0.5">Documented accounts of rapid emergency blood logistics.</p>
      </div>

      <div className="burgundy-card p-6 border border-[#49303A] shadow-md space-y-4 leading-relaxed font-mono text-xs text-[#C3AEB4]">
        <div className="border-b border-[#49303A] pb-4">
          <h4 className="font-bold text-[#FFF7F5] text-sm mb-1">
            Emergency Trauma Case — Fortis Hospital (Bengaluru)
          </h4>
          <p className="mt-1">
            Trauma surgeon requested O-Negative units immediately following a multicar highway collision. Intelligent matching dispatched nearby donor alert within 80 seconds. Total corridor transit finalized in 16.2 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}

function VolunteerForm({ addNotification }: { addNotification: (msg: string) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    addNotification(`VOLUNTEER INITIALIZED: New node coordinator ${name}`);
    setName("");
    setPhone("");
    alert("Volunteer coordination node registered successfully!");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-[#49303A] pb-3">
        <h2 className="text-base font-extrabold text-[#FFF7F5] font-heading">
          🤝 Join the Volunteer Coordination Network
        </h2>
        <p className="text-xs text-[#C3AEB4] mt-0.5">Assist in local logistics, triage coordination, and emergency awareness.</p>
      </div>

      <div className="burgundy-card p-6 max-w-md mx-auto border border-[#49303A] shadow-md">
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs font-mono text-[#C3AEB4] block mb-1">COORDINATOR NAME</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="input-premium py-2.5 text-xs"
              required
            />
          </div>
          <div>
            <label className="text-xs font-mono text-[#C3AEB4] block mb-1">CONTACT PHONE</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              className="input-premium py-2.5 text-xs font-mono"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 btn-premium text-xs tracking-wider cursor-pointer font-bold uppercase font-mono shadow-md"
          >
            Register Volunteer Node
          </button>
        </form>
      </div>
    </div>
  );
}

function EventsCalendar() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-[#49303A] pb-3">
        <h2 className="text-base font-extrabold text-[#FFF7F5] font-heading">📅 Events & Donation Drives</h2>
        <p className="text-xs text-[#C3AEB4] mt-0.5">Scheduled mobile donation clinics and community drives.</p>
      </div>

      <div className="burgundy-card p-6 space-y-4 border border-[#49303A] shadow-md text-xs font-mono">
        <div className="p-4 border border-[#49303A] bg-[#24151D] rounded-xl flex items-center justify-between hover:border-[#563441] transition-colors">
          <div>
            <span className="text-[#C72C41] font-bold block text-sm">[CAMP] Bengaluru Tech Corridor Donation Drive</span>
            <span className="text-[#9C858D] text-xs mt-1 block">Scheduled: 2026-06-15 | Venue: Electronic City Hub</span>
          </div>
          <span className="text-[#22C55E] font-bold border border-[#22C55E]/30 px-2.5 py-1 rounded bg-[#22C55E]/10 text-xs">
            Open for RSVPs
          </span>
        </div>
      </div>
    </div>
  );
}
