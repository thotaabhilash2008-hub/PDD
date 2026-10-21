// frontend/src/components/Landing3DStory.tsx
// Cinematic 3D Healthcare Storytelling Experience — "HEMOCONNECT: THE LIVING BLOOD NETWORK"
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, Brain, Droplet, Globe, Heart, Siren, Users, ChevronDown,
  Activity, Navigation, User, LogOut
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ThreeBloodDropHero from "./ThreeBloodDropHero";

gsap.registerPlugin(ScrollTrigger);

interface Landing3DStoryProps {
  onEnterApp: () => void;
  onGuestAccess: () => void;
  onOpenSosModal: () => void;
  onGoToRoute: (route: any) => void;
  userProfile?: any;
  onOpenCredentialsModal?: () => void;
  onLogout?: () => void;
  overviewMetrics?: any;
}

export default function Landing3DStory({
  onEnterApp,
  onGuestAccess,
  onOpenSosModal,
  onGoToRoute,
  userProfile,
  onOpenCredentialsModal,
  onLogout,
  overviewMetrics
}: Landing3DStoryProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [simulatedBlood, setSimulatedBlood] = useState("O-");
  const containerRef = useRef<HTMLDivElement>(null);

  // GSAP ScrollTrigger synchronization with 3D storytelling sections
  useEffect(() => {
    const sectionIds = [
      "hero-sec",
      "need-sec",
      "network-sec",
      "matching-sec",
      "location-sec",
      "emergency-sec",
      "action-sec"
    ];
    const triggers: ScrollTrigger[] = [];

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? Math.min(1, Math.max(0, scrollTop / scrollHeight)) : 0;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    sectionIds.forEach((id, idx) => {
      const el = document.getElementById(id);
      if (!el) return;
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top 55%",
        end: "bottom 55%",
        onEnter: () => setActiveSection(idx),
        onEnterBack: () => setActiveSection(idx)
      });
      triggers.push(st);
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      triggers.forEach(t => t.kill());
    };
  }, []);

  const scrollToSection = (index: number) => {
    const sectionIds = [
      "hero-sec",
      "need-sec",
      "network-sec",
      "matching-sec",
      "location-sec",
      "emergency-sec",
      "action-sec"
    ];
    const target = document.getElementById(sectionIds[index]);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Compatibility matrix helper
  const getCompatibleDonors = (type: string) => {
    switch (type) {
      case "O-": return ["O-"];
      case "O+": return ["O-", "O+"];
      case "A-": return ["O-", "A-"];
      case "A+": return ["O-", "O+", "A-", "A+"];
      case "B-": return ["O-", "B-"];
      case "B+": return ["O-", "O+", "B-", "B+"];
      case "AB-": return ["O-", "A-", "B-", "AB-"];
      case "AB+": return ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];
      default: return ["O-"];
    }
  };

  return (
    <div ref={containerRef} className="relative w-full text-[#FFF7F5] overflow-x-hidden selection:bg-[#C72C41] selection:text-white">
      
      {/* Fixed Background 3D WebGL Canvas Layer */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <ThreeBloodDropHero currentSection={activeSection} scrollProgress={scrollProgress} />
      </div>

      {/* Floating Story Progress Navigation Dots */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col gap-3">
        {[
          { label: "The Living Drop", idx: 0 },
          { label: "The Need", idx: 1 },
          { label: "The Network", idx: 2 },
          { label: "Intelligent Matching", idx: 3 },
          { label: "Location Intelligence", idx: 4 },
          { label: "Emergency Response", idx: 5 },
          { label: "Take Action", idx: 6 }
        ].map(item => (
          <button
            key={item.idx}
            onClick={() => scrollToSection(item.idx)}
            className="group flex items-center justify-end gap-2 cursor-pointer focus:outline-none"
            title={item.label}
          >
            <span className={`text-[10px] font-mono tracking-wider transition-all duration-300 opacity-0 group-hover:opacity-100 ${
              activeSection === item.idx ? "text-[#E8A0AA] font-bold" : "text-[#9C858D]"
            }`}>
              {item.label}
            </span>
            <div className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 ${
              activeSection === item.idx
                ? "bg-[#C72C41] border-[#E8A0AA] scale-125 shadow-md shadow-[#C72C41]"
                : "bg-[#24151D] border-[#49303A] group-hover:border-[#C72C41]"
            }`} />
          </button>
        ))}
      </div>

      {/* Top Floating Glass Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-[#190D13]/75 border-b border-[#49303A]/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3A202B] to-[#211018] border border-[#C72C41]/50 flex items-center justify-center shadow-md">
            <Droplet className="w-4 h-4 text-[#C72C41] fill-[#C72C41] heartbeat-icon" />
          </div>
          <span className="font-heading font-extrabold text-base tracking-wider text-[#FFF7F5]">
            HEMO<span className="text-[#C72C41]">CONNECT</span>
          </span>
          <span className="hidden sm:inline text-[9px] font-mono text-[#E8A0AA] px-2.5 py-0.5 rounded bg-[#321923] border border-[#49303A]">
            THE LIVING BLOOD NETWORK
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <button
            onClick={onOpenSosModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#FF334F]/20 hover:bg-[#FF334F]/30 border border-[#FF334F]/50 text-[#FF334F] font-bold rounded-xl transition-all cursor-pointer"
          >
            <Siren className="w-3.5 h-3.5 animate-pulse" />
            <span>SOS BEACON</span>
          </button>

          {userProfile ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenCredentialsModal}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#321923] hover:bg-[#3A202B] border border-[#C72C41]/50 text-[#FFF7F5] rounded-xl font-bold transition-all cursor-pointer group shadow-sm"
                title="View Account & Database Credentials"
              >
                <div className="w-5 h-5 rounded-full bg-[#C72C41] flex items-center justify-center text-[10px] text-white uppercase font-black">
                  {userProfile.name ? userProfile.name.charAt(0) : "U"}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[11px] leading-tight text-[#FFF7F5] group-hover:text-[#E8A0AA]">{userProfile.name || "User"}</span>
                  <span className="text-[9px] leading-tight text-[#E8A0AA] font-normal">{userProfile.role || "Citizen"}</span>
                </div>
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 bg-[#24151D] hover:bg-[#FF334F]/20 border border-[#49303A] hover:border-[#FF334F]/50 text-[#9C858D] hover:text-[#FF334F] rounded-xl transition-all cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => onGoToRoute("login")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#24151D] hover:bg-[#321923] border border-[#49303A] text-[#FFF7F5] rounded-xl font-bold transition-all cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-[#C72C41]" />
              <span>Sign In / OTP</span>
            </button>
          )}

          <button
            onClick={onEnterApp}
            className="px-4 py-1.5 btn-premium font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow-md shadow-[#C72C41]/20 flex items-center gap-1.5"
          >
            <span>Operations Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ========================================================
          PHASE 4: HERO SECTION — THE CINEMATIC INTRO
          ======================================================== */}
      <section
        id="hero-sec"
        className="relative min-h-screen flex flex-col justify-center px-6 sm:px-12 lg:px-20 pt-24 pb-12 z-10"
      >
        <div className="max-w-2xl space-y-6 animate-fadeIn">
          {/* Subtle Technology Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#321923] border border-[#49303A] text-[10px] font-mono font-bold tracking-widest text-[#E8A0AA] uppercase">
            <span className="w-2 h-2 rounded-full bg-[#C72C41] animate-ping" />
            <span>INTELLIGENT BLOOD LOGISTICS</span>
          </div>

          {/* Precise Hero Headline (Phase 4 Spec) */}
          <h1 className="font-heading text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-[#FFF7F5]">
            Every Drop. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFF7F5] via-[#E8A0AA] to-[#E05263]">
              A Connected Life.
            </span>
          </h1>

          {/* Supporting Text (Phase 4 Spec) */}
          <p className="text-sm sm:text-base text-[#C3AEB4] leading-relaxed max-w-xl font-sans">
            Intelligent blood logistics connecting donors, hospitals, and patients when every second matters.
          </p>

          {/* Three Primary Actions (Phase 4 Spec) */}
          <div className="pt-2 flex flex-wrap items-center gap-3 font-mono">
            <button
              onClick={() => onGoToRoute("dashboard")}
              className="px-6 py-3.5 btn-premium text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xl shadow-[#C72C41]/30 flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Find a Donor</span>
            </button>
            <button
              onClick={() => onGoToRoute("donate")}
              className="px-6 py-3.5 btn-secondary text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2"
            >
              <Heart className="w-4 h-4 text-[#C72C41]" />
              <span>Register as a Donor</span>
            </button>
            <button
              onClick={() => onGoToRoute("request")}
              className="px-6 py-3.5 bg-[#24151D] hover:bg-[#321923] border border-[#49303A] text-[#E8A0AA] hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2 transition-colors"
            >
              <Droplet className="w-4 h-4 text-[#FF334F]" />
              <span>Request Blood</span>
            </button>
          </div>

          {/* Network Telemetry Badges */}
          <div className="pt-8 grid grid-cols-3 gap-4 max-w-md border-t border-[#49303A]/60 font-mono">
            <div>
              <span className="text-xl sm:text-2xl font-bold text-[#FFF7F5] block font-mono">
                {overviewMetrics?.activeDonors !== undefined ? overviewMetrics.activeDonors.toLocaleString() : "1,428"}
              </span>
              <span className="text-[10px] text-[#9C858D] uppercase font-bold block">Verified Donors</span>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-bold text-[#22C55E] block font-mono">
                {overviewMetrics?.totalHospitals !== undefined ? `${overviewMetrics.totalHospitals} Hubs` : "42 Hubs"}
              </span>
              <span className="text-[10px] text-[#9C858D] uppercase font-bold block">Hospital Nodes</span>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-bold text-[#38BDF8] block font-mono">
                {overviewMetrics?.totalUnits !== undefined ? `${overviewMetrics.totalUnits} Units` : "850 Units"}
              </span>
              <span className="text-[10px] text-[#9C858D] uppercase font-bold block">DB Blood Inventory</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator Down Arrow */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-[10px] font-mono text-[#9C858D] animate-bounce cursor-pointer"
          onClick={() => scrollToSection(1)}
        >
          <span>SCROLL TO EXPLORE</span>
          <ChevronDown className="w-4 h-4 text-[#E8A0AA]" />
        </div>
      </section>

      {/* ========================================================
          PHASE 6: SECTION 1 — THE NEED
          ======================================================== */}
      <section
        id="need-sec"
        className="relative min-h-screen flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-20 z-10"
      >
        <div className="max-w-xl space-y-6 burgundy-card p-8 sm:p-10 border border-[#49303A] shadow-2xl backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#24151D] border border-[#49303A] text-[10px] font-mono font-bold text-[#E8A0AA] uppercase">
            <Activity className="w-3 h-3 text-[#C72C41]" />
            <span>CRITICAL LOGISTICS REALITY</span>
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#FFF7F5] leading-tight">
            One Donation Can Change Everything.
          </h2>

          <p className="text-xs sm:text-sm text-[#C3AEB4] leading-relaxed">
            Every two seconds, an emergency trauma patient, premature newborn, or surgical case relies on compatible whole blood units. Traditional blood banks face critical shortages due to fragmentation and static donor lists.
          </p>

          <div className="p-4 rounded-xl bg-[#24151D] border border-[#49303A] space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-[#E8A0AA] font-bold">
              <span>● THE COLD-CHAIN TIMELINE</span>
              <span>42 DAYS MAX</span>
            </div>
            <p className="text-[11px] text-[#9C858D] leading-normal font-sans">
              Platelets expire in just 5 days. Whole blood requires refrigerated 2°C–6°C transit. Real-time digital logistics bridge the vital gap between donor availability and clinical need.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onGoToRoute("donate")}
              className="py-3 px-5 btn-premium text-xs font-mono font-bold uppercase tracking-wider cursor-pointer shadow-lg flex items-center gap-2"
            >
              <span>Register Today</span>
              <Heart className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollToSection(2)}
              className="py-3 px-5 btn-secondary text-xs font-mono font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2"
            >
              <span>Explore The Network</span>
              <ArrowRight className="w-4 h-4 text-[#C72C41]" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          PHASE 6: SECTION 2 — THE NETWORK
          ======================================================== */}
      <section
        id="network-sec"
        className="relative min-h-screen flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-20 z-10"
      >
        <div className="max-w-xl ml-auto space-y-6 burgundy-card p-8 sm:p-10 border border-[#49303A] shadow-2xl backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#24151D] border border-[#49303A] text-[10px] font-mono font-bold text-[#38BDF8] uppercase">
            <Navigation className="w-3 h-3 text-[#38BDF8]" />
            <span>3D NETWORK CONSTELLATION</span>
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#FFF7F5] leading-tight">
            One Intelligent Network. <br />Countless Connections.
          </h2>

          <p className="text-xs sm:text-sm text-[#C3AEB4] leading-relaxed">
            Our autonomous 3D coordination grid connects certified blood donors, intensive care units, and cold-storage distribution hubs into a unified medical topology.
          </p>

          {/* Network Legend */}
          <div className="p-4 rounded-xl bg-[#24151D] border border-[#49303A] space-y-2.5 font-mono text-xs">
            <span className="text-[10px] text-[#9C858D] uppercase font-bold block">
              NETWORK TOPOLOGY NODE LEGEND:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] shadow-sm shadow-[#22C55E]" />
                <span className="text-[#FFF7F5]">Verified Donors</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] shadow-sm shadow-[#38BDF8]" />
                <span className="text-[#FFF7F5]">Hospital Trauma Hubs</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E8A0AA] shadow-sm shadow-[#E8A0AA]" />
                <span className="text-[#FFF7F5]">Cold Storage Depots</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF334F] shadow-sm shadow-[#FF334F]" />
                <span className="text-[#FFF7F5]">Priority ICU Beacons</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => scrollToSection(3)}
            className="w-full py-3 btn-premium text-xs font-mono font-bold uppercase tracking-wider cursor-pointer shadow-lg flex items-center justify-center gap-2"
          >
            <span>Inspect Algorithmic Matching</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ========================================================
          PHASE 6: SECTION 3 — INTELLIGENT MATCHING
          ======================================================== */}
      <section
        id="matching-sec"
        className="relative min-h-screen flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-20 z-10"
      >
        <div className="max-w-xl space-y-6 burgundy-card p-8 sm:p-10 border border-[#49303A] shadow-2xl backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#24151D] border border-[#49303A] text-[10px] font-mono font-bold text-[#E8A0AA] uppercase">
            <Brain className="w-3 h-3 text-[#C72C41]" />
            <span>ALGORITHMIC COMPATIBILITY</span>
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#FFF7F5] leading-tight">
            Find the Right Match. Faster.
          </h2>

          <p className="text-xs sm:text-sm text-[#C3AEB4] leading-relaxed">
            Our platform evaluates ABO/Rh blood-group compatibility, real-time donor availability, GIS transit distances, and clinical eligibility vectors to rank potential matches with sub-minute precision.
          </p>

          {/* Interactive Blood Match Simulator */}
          <div className="p-4 rounded-xl bg-[#24151D] border border-[#49303A] space-y-3 font-mono text-xs">
            <span className="text-[10px] text-[#9C858D] uppercase font-bold block">
              SELECT RECIPIENT BLOOD GROUP:
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].map(grp => (
                <button
                  key={grp}
                  onClick={() => setSimulatedBlood(grp)}
                  className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    simulatedBlood === grp
                      ? "bg-[#C72C41] border-[#E05263] text-white shadow-md shadow-[#C72C41]/30"
                      : "bg-[#321923] border-[#49303A] text-[#C3AEB4] hover:text-white"
                  }`}
                >
                  {grp}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-[#49303A]/60 space-y-1.5">
              <span className="text-[10px] text-[#E8A0AA] block font-bold">
                COMPATIBLE DONOR TYPES FOR {simulatedBlood}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {getCompatibleDonors(simulatedBlood).map(d => (
                  <span key={d} className="px-2 py-0.5 rounded bg-[#22C55E]/15 border border-[#22C55E]/40 text-[#22C55E] text-xs font-bold">
                    ✓ {d}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => onGoToRoute("request")}
            className="w-full py-3 btn-premium text-xs font-mono font-bold uppercase tracking-wider cursor-pointer shadow-lg flex items-center justify-center gap-2"
          >
            <span>Launch Intelligent Request Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ========================================================
          PHASE 6: SECTION 4 — LOCATION INTELLIGENCE
          ======================================================== */}
      <section
        id="location-sec"
        className="relative min-h-screen flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-20 z-10"
      >
        <div className="max-w-2xl ml-auto space-y-6 burgundy-card p-8 sm:p-10 border border-[#49303A] shadow-2xl backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#24151D] border border-[#49303A] text-[10px] font-mono font-bold text-[#38BDF8] uppercase">
            <Globe className="w-3 h-3" />
            <span>GIS OPERATIONS RADAR</span>
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#FFF7F5] leading-tight">
            Help Is Closer Than You Think.
          </h2>

          <p className="text-xs sm:text-sm text-[#C3AEB4] leading-relaxed">
            Dynamic urban routing accounts for live junction congestion, emergency roadblocks, and autonomous drone corridors between regional blood banks and intensive care units.
          </p>

          {/* Interactive Route Hub Showcase */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 bg-[#24151D] border border-[#49303A] rounded-xl space-y-1">
              <span className="text-[10px] text-[#9C858D] block">CORRIDOR STATUS</span>
              <span className="text-xs font-bold text-[#22C55E] flex items-center gap-1">
                ● Secunderabad → Apollo
              </span>
              <span className="text-[10px] text-[#C3AEB4] block">ETA: 14.8 mins</span>
            </div>
            <div className="p-3 bg-[#24151D] border border-[#49303A] rounded-xl space-y-1">
              <span className="text-[10px] text-[#9C858D] block">CONGESTION OVERRIDE</span>
              <span className="text-xs font-bold text-[#F59E0B]">
                ▲ Begumpet N2 (Rerouted)
              </span>
              <span className="text-[10px] text-[#C3AEB4] block">+3.2 min penalty avoided</span>
            </div>
            <div className="p-3 bg-[#24151D] border border-[#49303A] rounded-xl space-y-1">
              <span className="text-[10px] text-[#9C858D] block">DRONE DISPATCHERS</span>
              <span className="text-xs font-bold text-[#38BDF8]">
                18 Units in Flight
              </span>
              <span className="text-[10px] text-[#C3AEB4] block">Cold storage verified</span>
            </div>
          </div>

          <button
            onClick={() => onGoToRoute("map")}
            className="w-full py-3 btn-secondary text-xs font-mono font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Open Interactive GIS Radar Map</span>
            <ArrowRight className="w-4 h-4 text-[#C72C41]" />
          </button>
        </div>
      </section>

      {/* ========================================================
          PHASE 6: SECTION 5 — EMERGENCY RESPONSE
          ======================================================== */}
      <section
        id="emergency-sec"
        className="relative min-h-screen flex flex-col justify-center items-center px-6 sm:px-12 py-20 z-10"
      >
        <div className="max-w-xl w-full text-center lg:ml-auto lg:mr-8 space-y-6 burgundy-card p-8 sm:p-12 border border-[#FF334F]/40 shadow-2xl shadow-[#FF334F]/10 backdrop-blur-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FF334F]/20 border border-[#FF334F]/60 flex items-center justify-center text-[#FF334F] shadow-lg shadow-[#FF334F]/30 animate-pulse">
            <Siren className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono tracking-widest text-[#FF334F] font-bold uppercase bg-[#FF334F]/10 px-3 py-0.5 rounded-full border border-[#FF334F]/30">
              PRIORITY CODE RED
            </span>
            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-[#FFF7F5] leading-tight">
              When Every Second Matters.
            </h2>
            <p className="text-xs sm:text-sm text-[#C3AEB4] leading-relaxed max-w-md mx-auto">
              Our automated emergency triage system broadcasts critical alerts instantly to nearby verified donors, mobilizing life-saving units within 90 seconds.
            </p>
          </div>

          <div className="p-4 bg-[#24151D] border border-[#49303A] rounded-xl text-xs font-mono text-[#C3AEB4] space-y-2 text-left">
            <div className="flex items-center justify-between text-[#FF334F] font-bold">
              <span>● ACTIVE EMERGENCY PROTOCOL</span>
              <span>AES-256 SIGNED</span>
            </div>
            <p className="text-[11px] leading-normal">
              Direct mobile push notifications dispatch to all verified O-Negative and matching donor pools within a 15 km perimeter.
            </p>
          </div>

          <button
            onClick={onOpenSosModal}
            className="w-full py-4 bg-gradient-to-r from-[#FF334F] to-[#C72C41] hover:brightness-110 text-white font-bold text-sm tracking-wider uppercase font-mono rounded-xl shadow-xl shadow-[#FF334F]/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Siren className="w-4 h-4" />
            <span>Create Emergency Blood Request</span>
          </button>
        </div>
      </section>

      {/* ========================================================
          PHASE 6: SECTION 6 — TAKE ACTION
          ======================================================== */}
      <section
        id="action-sec"
        className="relative min-h-screen flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-20 z-10"
      >
        <div className="max-w-4xl mx-auto w-full space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#321923] border border-[#49303A] text-[10px] font-mono font-bold text-[#E8A0AA] uppercase">
              <Users className="w-3 h-3 text-[#C72C41]" />
              <span>THE LIVING COMMUNITY</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-[#FFF7F5]">
              Be the Connection Someone Needs.
            </h2>
            <p className="text-xs sm:text-sm text-[#C3AEB4] max-w-lg mx-auto">
              Every donor in our registry carries an encrypted digital health passport with live biometric sync, ensuring safety and trust at every stage.
            </p>
          </div>

          {/* Three Primary Actions Deck (Phase 6 Spec) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="burgundy-card p-6 border border-[#49303A] space-y-4 hover:border-[#C72C41]/60 transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/40 flex items-center justify-center font-bold text-[#22C55E]">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#FFF7F5]">Register as a Donor</h4>
                <p className="text-xs text-[#C3AEB4] mt-1 leading-relaxed">
                  Join our verified registry and receive notifications when patients near you need your blood type.
                </p>
              </div>
              <button
                onClick={() => onGoToRoute("donate")}
                className="w-full py-2.5 btn-secondary text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
              >
                Become a Donor
              </button>
            </div>

            <div className="burgundy-card p-6 border border-[#49303A] space-y-4 hover:border-[#C72C41]/60 transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/15 border border-[#38BDF8]/40 flex items-center justify-center font-bold text-[#38BDF8]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#FFF7F5]">Find a Donor</h4>
                <p className="text-xs text-[#C3AEB4] mt-1 leading-relaxed">
                  Filter verified donors by blood group, geographic location, and medical eligibility in real time.
                </p>
              </div>
              <button
                onClick={() => onGoToRoute("dashboard")}
                className="w-full py-2.5 btn-secondary text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
              >
                Search Donors
              </button>
            </div>

            <div className="burgundy-card p-6 border border-[#49303A] space-y-4 hover:border-[#C72C41]/60 transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#FF334F]/15 border border-[#FF334F]/40 flex items-center justify-center font-bold text-[#FF334F]">
                <Droplet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#FFF7F5]">Request Blood</h4>
                <p className="text-xs text-[#C3AEB4] mt-1 leading-relaxed">
                  Submit verified hospital transfusion orders through the 7-step triage matching portal.
                </p>
              </div>
              <button
                onClick={() => onGoToRoute("request")}
                className="w-full py-2.5 btn-premium text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
              >
                Request Units
              </button>
            </div>
          </div>

          {/* Master Operations Console Call to Action */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-[#211018] via-[#321923] to-[#27121B] border border-[#49303A] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center sm:text-left">
              <h3 className="font-heading text-xl font-bold text-[#FFF7F5]">
                Ready to Access the Full Platform?
              </h3>
              <p className="text-xs text-[#C3AEB4]">
                Explore live GIS radar maps, manage blood banks, or inspect biometric cold-chain telemetry.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 font-mono">
              <button
                onClick={onGuestAccess}
                className="px-5 py-2.5 btn-secondary text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Guest Demo
              </button>
              <button
                onClick={onEnterApp}
                className="px-6 py-2.5 btn-premium text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg shadow-[#C72C41]/30 flex items-center gap-2"
              >
                <span>Enter Operations Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Refined Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-[#49303A] bg-[#190D13]/85 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-[#9C858D]">
        <div className="flex items-center gap-2">
          <Droplet className="w-4 h-4 text-[#C72C41] fill-[#C72C41]" />
          <span>HEMOCONNECT — THE LIVING BLOOD NETWORK</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <button onClick={() => onGoToRoute("admin")} className="hover:text-[#FFF7F5] transition-colors cursor-pointer">
            Database Admin (/admin)
          </button>
          <span>•</span>
          <button onClick={onGuestAccess} className="hover:text-[#FFF7F5] transition-colors cursor-pointer">
            Guest Access
          </button>
          <span>•</span>
          <span className="text-[#22C55E]">All Services Operational</span>
        </div>
      </footer>
    </div>
  );
}
