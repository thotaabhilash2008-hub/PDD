// frontend/src/components/Landing3DStory.tsx
// Cinematic 3D Storytelling Experience for HemoConnect
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, Brain, Droplet, Globe, Heart, Siren, Users, ChevronDown
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
}

export default function Landing3DStory({
  onEnterApp,
  onGuestAccess,
  onOpenSosModal,
  onGoToRoute
}: Landing3DStoryProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [simulatedBlood, setSimulatedBlood] = useState("O-");
  const containerRef = useRef<HTMLDivElement>(null);

  // GSAP ScrollTrigger synchronization with 3D storytelling sections
  useEffect(() => {
    const sectionIds = ["hero-sec", "matching-sec", "location-sec", "emergency-sec", "community-sec"];
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
    const sectionIds = ["hero-sec", "matching-sec", "location-sec", "emergency-sec", "community-sec"];
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
      
      {/* Fixed Background 3D Canvas Layer */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <ThreeBloodDropHero currentSection={activeSection} scrollProgress={scrollProgress} />
      </div>

      {/* Floating Story Progress Navigation Dots */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col gap-3">
        {[
          { label: "The Connection", idx: 0 },
          { label: "Intelligent Matching", idx: 1 },
          { label: "Real-Time Location", idx: 2 },
          { label: "Emergency Response", idx: 3 },
          { label: "Donor Community", idx: 4 }
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
      <header className="fixed top-0 left-0 right-0 z-40 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-[#190D13]/70 border-b border-[#49303A]/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3A202B] to-[#211018] border border-[#C72C41]/50 flex items-center justify-center shadow-md">
            <Droplet className="w-4 h-4 text-[#C72C41] fill-[#C72C41] heartbeat-icon" />
          </div>
          <span className="font-heading font-extrabold text-base tracking-wider text-[#FFF7F5]">
            HEMO<span className="text-[#C72C41]">CONNECT</span>
          </span>
          <span className="hidden sm:inline text-[9px] font-mono text-[#E8A0AA] px-2 py-0.5 rounded bg-[#321923] border border-[#49303A]">
            3D LOGISTICS PLATFORM
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
          <button
            onClick={onGuestAccess}
            className="px-3.5 py-1.5 bg-[#24151D] hover:bg-[#321923] border border-[#49303A] text-[#C3AEB4] hover:text-[#FFF7F5] rounded-xl font-bold transition-all cursor-pointer"
          >
            Guest Mode
          </button>
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
          HERO SECTION — CINEMATIC 3D EXPERIENCE (SECTION 1)
          ======================================================== */}
      <section
        id="hero-sec"
        className="relative min-h-screen flex flex-col justify-center px-6 sm:px-12 lg:px-20 pt-24 pb-12 z-10"
      >
        <div className="max-w-2xl space-y-6 animate-fadeIn">
          {/* Section Small Label */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#321923] border border-[#49303A] text-[10px] font-mono font-bold tracking-widest text-[#E8A0AA] uppercase">
            <span className="w-2 h-2 rounded-full bg-[#C72C41] animate-ping"></span>
            <span>INTELLIGENT BLOOD LOGISTICS</span>
          </div>

          {/* Main Cinematic Heading */}
          <h1 className="font-heading text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-[#FFF7F5]">
            Every Connection <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFF7F5] via-[#E8A0AA] to-[#E05263]">
              Can Save a Life.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="text-sm sm:text-base text-[#C3AEB4] leading-relaxed max-w-xl font-sans">
            Connecting blood donors, patients, and hospitals through intelligent matching, location-aware GIS telemetry, and autonomous emergency coordination.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3 font-mono">
            <button
              onClick={onOpenSosModal}
              className="px-6 py-3.5 btn-premium text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xl shadow-[#C72C41]/30 flex items-center gap-2"
            >
              <Siren className="w-4 h-4" />
              <span>Emergency Blood Request</span>
            </button>
            <button
              onClick={() => onGoToRoute("donate")}
              className="px-6 py-3.5 btn-secondary text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2"
            >
              <Heart className="w-4 h-4 text-[#C72C41]" />
              <span>Become a Donor</span>
            </button>
            <button
              onClick={() => scrollToSection(1)}
              className="px-4 py-3.5 text-xs text-[#E8A0AA] hover:text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Explore the Network</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Network Telemetry Badges */}
          <div className="pt-8 grid grid-cols-3 gap-4 max-w-md border-t border-[#49303A]/60 font-mono">
            <div>
              <span className="text-xl sm:text-2xl font-bold text-[#FFF7F5] block font-mono">1,428</span>
              <span className="text-[10px] text-[#9C858D] uppercase font-bold block">Verified Donors</span>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-bold text-[#22C55E] block font-mono">42 Hubs</span>
              <span className="text-[10px] text-[#9C858D] uppercase font-bold block">Hospital Nodes</span>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-bold text-[#38BDF8] block font-mono">16.2 min</span>
              <span className="text-[10px] text-[#9C858D] uppercase font-bold block">Avg Corridor ETA</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator Down Arrow */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-[10px] font-mono text-[#9C858D] animate-bounce cursor-pointer" onClick={() => scrollToSection(1)}>
          <span>SCROLL TO EXPLORE</span>
          <ChevronDown className="w-4 h-4 text-[#E8A0AA]" />
        </div>
      </section>

      {/* ========================================================
          SECTION 2 — INTELLIGENT MATCHING (SCROLL-BASED)
          ======================================================== */}
      <section
        id="matching-sec"
        className="relative min-h-screen flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-20 z-10"
      >
        <div className="max-w-xl ml-auto space-y-6 burgundy-card p-8 sm:p-10 border border-[#49303A] shadow-2xl backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#24151D] border border-[#49303A] text-[10px] font-mono font-bold text-[#E8A0AA] uppercase">
            <Brain className="w-3 h-3 text-[#C72C41]" />
            <span>ALGORITHMIC COMPATIBILITY</span>
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#FFF7F5] leading-tight">
            Intelligence That Connects Lives.
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
          SECTION 3 — REAL-TIME LOCATION (GIS RADAR TRANSITION)
          ======================================================== */}
      <section
        id="location-sec"
        className="relative min-h-screen flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-20 z-10"
      >
        <div className="max-w-2xl space-y-6 burgundy-card p-8 sm:p-10 border border-[#49303A] shadow-2xl backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#24151D] border border-[#49303A] text-[10px] font-mono font-bold text-[#38BDF8] uppercase">
            <Globe className="w-3 h-3" />
            <span>GIS OPERATIONS RADAR</span>
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#FFF7F5] leading-tight">
            Location-Aware Dijkstra Corridors.
          </h2>

          <p className="text-xs sm:text-sm text-[#C3AEB4] leading-relaxed">
            Dynamic urban routing accounts for live junction congestion, emergency roadblocks, and autonomous drone corridors between blood banks and intensive care units.
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
          SECTION 4 — EMERGENCY RESPONSE (FOCUSED RUBY COMPOSITION)
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
              Direct mobile push notifications dispatches to all verified O-Negative and matching donor pools within a 15 km perimeter.
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
          SECTION 5 — DONOR COMMUNITY & HUMAN IMPACT
          ======================================================== */}
      <section
        id="community-sec"
        className="relative min-h-screen flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-20 z-10"
      >
        <div className="max-w-4xl mx-auto w-full space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#321923] border border-[#49303A] text-[10px] font-mono font-bold text-[#E8A0AA] uppercase">
              <Users className="w-3 h-3 text-[#C72C41]" />
              <span>COMMUNITY NETWORK</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-[#FFF7F5]">
              Empowered by Ordinary Heroes.
            </h2>
            <p className="text-xs sm:text-sm text-[#C3AEB4] max-w-lg mx-auto">
              Every donor in our registry carries an encrypted digital health passport with live biometric sync, ensuring safety and trust at every stage.
            </p>
          </div>

          {/* Donor Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="burgundy-card p-5 border border-[#49303A] space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/40 flex items-center justify-center font-bold text-[#22C55E] text-xs font-mono">
                  O-
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#22C55E]/10 text-[#22C55E] font-bold border border-[#22C55E]/30">
                  ● AVAILABLE
                </span>
              </div>
              <div>
                <h4 className="font-bold text-xs text-[#FFF7F5]">Dr. Evelyn Vance</h4>
                <p className="text-[10px] text-[#C3AEB4] font-mono mt-0.5">Bengaluru Central • 14 Donations</p>
                <span className="inline-block mt-2 text-[9px] font-mono text-[#E8A0AA]">
                  Rare Blood Guardian Tier
                </span>
              </div>
            </div>

            <div className="burgundy-card p-5 border border-[#49303A] space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#C72C41]/15 border border-[#C72C41]/40 flex items-center justify-center font-bold text-[#FFF7F5] text-xs font-mono">
                  O+
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#22C55E]/10 text-[#22C55E] font-bold border border-[#22C55E]/30">
                  ● AVAILABLE
                </span>
              </div>
              <div>
                <h4 className="font-bold text-xs text-[#FFF7F5]">Rahul Sharma</h4>
                <p className="text-[10px] text-[#C3AEB4] font-mono mt-0.5">Hyderabad Hub • 9 Donations</p>
                <span className="inline-block mt-2 text-[9px] font-mono text-[#E8A0AA]">
                  Verified Digital Passport
                </span>
              </div>
            </div>

            <div className="burgundy-card p-5 border border-[#49303A] space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/15 border border-[#38BDF8]/40 flex items-center justify-center font-bold text-[#38BDF8] text-xs font-mono">
                  AB-
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#38BDF8]/10 text-[#38BDF8] font-bold border border-[#38BDF8]/30">
                  ● RECOVERING
                </span>
              </div>
              <div>
                <h4 className="font-bold text-xs text-[#FFF7F5]">Ananya Sen</h4>
                <p className="text-[10px] text-[#C3AEB4] font-mono mt-0.5">Mumbai Node • 6 Donations</p>
                <span className="inline-block mt-2 text-[9px] font-mono text-[#E8A0AA]">
                  Next Eligible: 12 Days
                </span>
              </div>
            </div>
          </div>

          {/* Master Call to Action Deck */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-[#211018] via-[#321923] to-[#27121B] border border-[#49303A] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center sm:text-left">
              <h3 className="font-heading text-xl font-bold text-[#FFF7F5]">
                Ready to Join the Logistics Network?
              </h3>
              <p className="text-xs text-[#C3AEB4]">
                Register as a donor, request clinical blood supplies, or inspect live telemetry.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 font-mono">
              <button
                onClick={() => onGoToRoute("donate")}
                className="px-5 py-2.5 btn-secondary text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Become a Donor
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

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-[#49303A] bg-[#190D13]/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-[#9C858D]">
        <div className="flex items-center gap-2">
          <Droplet className="w-4 h-4 text-[#C72C41] fill-[#C72C41]" />
          <span>HEMOCONNECT 3D MEDICAL LOGISTICS PLATFORM</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <button onClick={() => onGoToRoute("admin")} className="hover:text-[#FFF7F5] transition-colors">
            Database Admin (/admin)
          </button>
          <span>•</span>
          <button onClick={onGuestAccess} className="hover:text-[#FFF7F5] transition-colors">
            Guest Access
          </button>
          <span>•</span>
          <span className="text-[#22C55E]">All Services Operational</span>
        </div>
      </footer>
    </div>
  );
}
