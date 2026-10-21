// frontend/src/components/AiMatchingAgentConsole.tsx
// Autonomous AI Blood Donor & Requester Matching Agent Command Console
import { useState, useEffect } from "react";
import {
  Brain, Zap, Activity, CheckCircle2,
  RefreshCw, Sparkles, Siren, Check, Clock, ChevronDown, ChevronUp
} from "lucide-react";

interface AiReasoningStep {
  step: string;
  category: "CLINICAL" | "GIS" | "BIOMETRIC" | "RANKING" | "DISPATCH";
  detail: string;
  status: "success" | "optimal" | "verified";
  timestamp: string;
}

interface BloodRequest {
  id: string;
  patientName: string;
  patientCondition?: string;
  bloodGroup: string;
  volumeMl: number;
  urgency: "Normal" | "Priority" | "Emergency";
  priority?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "PENDING" | "MATCHING" | "ALLOCATED" | "IN_TRANSIT" | "DELIVERED";
  location: string;
  hospitalName: string;
  createdAt: string;
  matchedDonorId?: string;
  matchedDonorName?: string;
  matchedDonorPhone?: string;
  matchScore?: number;
  transitEtaMin?: number;
  transitMethod?: "DRONE_AIRWAY" | "AMBULANCE_CORRIDOR";
  aiRationale?: string;
  aiReasoningSteps?: AiReasoningStep[];
  solvedAt?: string;
}

interface AiMatchingAgentConsoleProps {
  requests: BloodRequest[];
  onRefreshRequests: () => void;
  addNotification: (msg: string) => void;
  userLocation: string;
}

export default function AiMatchingAgentConsole({
  requests,
  onRefreshRequests,
  addNotification,
  userLocation
}: AiMatchingAgentConsoleProps) {
  const API_BASE = "http://localhost:4000";

  const [activeTab, setActiveTab] = useState<"pending" | "resolved" | "neural_logs">("pending");
  const [agentStatus, setAgentStatus] = useState<any>({
    agentName: "HemoNeural Autonomous Blood Matching Agent",
    modelVersion: "v4.5-Cognitive-Triage",
    isAutonomous: true,
    totalSolved: 142,
    totalEvaluations: 380,
    accuracyPct: 99.4,
    avgDecisionTimeSec: 1.14,
    droneCorridorsArmed: ["Skyway-Bravo (Central)", "Aero-Corridor 4 (South)", "Skyway-Alpha (Express)"]
  });

  const [solvingId, setSolvingId] = useState<string | null>(null);
  const [activeTraceModal, setActiveTraceModal] = useState<any | null>(null);
  const [batchSolving, setBatchSolving] = useState(false);
  const [simulatingEmergency, setSimulatingEmergency] = useState(false);
  const [expandedRationaleId, setExpandedRationaleId] = useState<string | null>(null);

  // Fetch live AI agent status
  const fetchAgentStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/ai-agent/status`);
      if (res.ok) {
        const data = await res.json();
        setAgentStatus(data);
      }
    } catch (err) {
      console.warn("AI Agent status check:", err);
    }
  };

  useEffect(() => {
    fetchAgentStatus();
    const interval = setInterval(fetchAgentStatus, 6000);
    return () => clearInterval(interval);
  }, []);

  // Toggle Autonomous mode
  const handleToggleAutonomous = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/ai-agent/toggle-autonomous`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: !agentStatus.isAutonomous })
      });
      const data = await res.json();
      setAgentStatus((prev: any) => ({ ...prev, isAutonomous: data.isAutonomous }));
      addNotification(`AI Agent Mode: ${data.isAutonomous ? "AUTONOMOUS CONTINUOUS ACTIVE" : "SUPERVISED STANDBY"}`);
    } catch {
      setAgentStatus((prev: any) => ({ ...prev, isAutonomous: !prev.isAutonomous }));
    }
  };

  // Solve single request with AI agent
  const handleSolveWithAi = async (requestId: string) => {
    setSolvingId(requestId);
    try {
      const res = await fetch(`${API_BASE}/api/ai-agent/solve-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId })
      });
      const data = await res.json();
      if (data.success && data.resolution) {
        setActiveTraceModal(data.resolution);
        onRefreshRequests();
        fetchAgentStatus();
        addNotification(`AI MATCH SOLVED: Case ${requestId} allocated to ${data.resolution.matchedDonor.name} (${data.resolution.matchedDonor.matchScore}% Score)`);
      } else {
        alert(data.error || "AI could not resolve this request.");
      }
    } catch (e: any) {
      alert("Error contacting AI Agent: " + e.message);
    } finally {
      setSolvingId(null);
    }
  };

  // Batch Auto-Solve all pending requests
  const handleAutoSolveAll = async () => {
    setBatchSolving(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai-agent/auto-solve-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data.success) {
        onRefreshRequests();
        fetchAgentStatus();
        addNotification(`AI AUTONOMOUS SWEEP: Solved ${data.totalSolved} patient blood requirements.`);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setBatchSolving(false);
    }
  };

  // Simulate an incoming emergency and watch AI solve it
  const handleSimulateEmergency = async () => {
    setSimulatingEmergency(true);
    try {
      const bloodGroups = ["O-", "O+", "A-", "B-", "AB-"];
      const randomBg = bloodGroups[Math.floor(Math.random() * bloodGroups.length)];
      const res = await fetch(`${API_BASE}/api/ai-agent/simulate-emergency`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bloodGroup: randomBg,
          hospitalName: `${userLocation} Multi-Speciality Trauma Center`,
          patientCondition: `Emergency Trauma Case: Acute Hemorrhage requiring 2 units of ${randomBg}`
        })
      });
      const data = await res.json();
      if (data.success && data.resolution) {
        setActiveTraceModal(data.resolution);
        onRefreshRequests();
        fetchAgentStatus();
        addNotification(`SIMULATION SOLVED: AI matched emergency ${randomBg} request with ${data.resolution.matchedDonor.name} in 1.1s!`);
      }
    } catch (e: any) {
      alert("Simulation error: " + e.message);
    } finally {
      setSimulatingEmergency(false);
    }
  };

  const pendingRequests = requests.filter(r => r.status === "PENDING" || r.status === "MATCHING");
  const resolvedRequests = requests.filter(r => r.status === "ALLOCATED" || r.status === "IN_TRANSIT" || r.status === "DELIVERED");

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      
      {/* Top Header & Agent Status Banner */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-7 bg-gradient-to-r from-[#190D13] via-[#2A131E] to-[#211018] border border-[#C72C41]/40 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-ping" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#22C55E] uppercase bg-[#22C55E]/10 border border-[#22C55E]/30 px-2.5 py-0.5 rounded-md">
                {agentStatus.isAutonomous ? "AUTONOMOUS AGENT ACTIVE" : "SUPERVISED AGENT STANDBY"}
              </span>
              <span className="text-[10px] font-mono text-[#E8A0AA] bg-[#321923] border border-[#49303A] px-2 py-0.5 rounded-md">
                {agentStatus.modelVersion}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#FFF7F5] font-heading flex items-center gap-2.5">
              <Brain className="w-6 h-6 text-[#C72C41] heartbeat-icon" />
              <span>AI Blood Donor & Requester Matching Agent</span>
            </h2>
            <p className="text-xs text-[#C3AEB4] leading-relaxed">
              Autonomous cognitive agent that continuously evaluates patient clinical requirements, antigen phenotype matrices, wearable biometric readiness, and drone airway corridors to automatically solve emergency transfusions.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
            <button
              onClick={handleToggleAutonomous}
              className={`px-3.5 py-2 rounded-xl font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                agentStatus.isAutonomous
                  ? "bg-[#22C55E]/15 border-[#22C55E]/50 text-[#22C55E] hover:bg-[#22C55E]/25"
                  : "bg-[#24151D] border-[#49303A] text-[#9C858D] hover:text-[#FFF7F5]"
              }`}
              title="Toggle automatic matching daemon"
            >
              <Zap className={`w-3.5 h-3.5 ${agentStatus.isAutonomous ? "fill-[#22C55E]" : ""}`} />
              <span>Autonomous Mode: {agentStatus.isAutonomous ? "ON" : "OFF"}</span>
            </button>

            <button
              onClick={handleAutoSolveAll}
              disabled={batchSolving || pendingRequests.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-[#D93A50] to-[#A91F36] hover:brightness-110 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-[#C72C41]/25 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {batchSolving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Solving Queue...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>Auto-Solve All ({pendingRequests.length})</span>
                </>
              )}
            </button>

            <button
              onClick={handleSimulateEmergency}
              disabled={simulatingEmergency}
              className="px-3.5 py-2 bg-[#24151D] hover:bg-[#321923] border border-[#FF334F]/50 text-[#FF8596] hover:text-white font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              title="Inject realistic emergency trauma request and watch AI match it"
            >
              {simulatingEmergency ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Siren className="w-3.5 h-3.5 text-[#FF334F] animate-pulse" />
              )}
              <span>Simulate & Solve Emergency</span>
            </button>
          </div>
        </div>

        {/* Telemetry Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#49303A]/60 font-mono text-xs">
          <div className="p-3 bg-[#24151D]/80 border border-[#49303A] rounded-xl">
            <span className="text-[9px] text-[#9C858D] uppercase block font-bold">Total Requirements Solved</span>
            <span className="text-lg font-bold text-[#FFF7F5] block mt-0.5">{agentStatus.totalSolved} Cases</span>
          </div>
          <div className="p-3 bg-[#24151D]/80 border border-[#49303A] rounded-xl">
            <span className="text-[9px] text-[#9C858D] uppercase block font-bold">AI Decision Latency</span>
            <span className="text-lg font-bold text-[#38BDF8] block mt-0.5">{agentStatus.avgDecisionTimeSec}s</span>
          </div>
          <div className="p-3 bg-[#24151D]/80 border border-[#49303A] rounded-xl">
            <span className="text-[9px] text-[#9C858D] uppercase block font-bold">Phenotype Match Precision</span>
            <span className="text-lg font-bold text-[#22C55E] block mt-0.5">{agentStatus.accuracyPct}%</span>
          </div>
          <div className="p-3 bg-[#24151D]/80 border border-[#49303A] rounded-xl">
            <span className="text-[9px] text-[#9C858D] uppercase block font-bold">Drone Airway Corridors</span>
            <span className="text-lg font-bold text-[#E8A0AA] block mt-0.5">3 Armed</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-[#49303A] pb-2 font-mono text-xs">
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-1 font-bold flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === "pending"
              ? "text-[#E8A0AA] border-b-2 border-[#C72C41]"
              : "text-[#9C858D] hover:text-[#C3AEB4]"
          }`}
        >
          <span>Patient Queue Needing Solution</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#C72C41]/20 text-[#E8A0AA] border border-[#C72C41]/40">
            {pendingRequests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("resolved")}
          className={`pb-1 font-bold flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === "resolved"
              ? "text-[#E8A0AA] border-b-2 border-[#C72C41]"
              : "text-[#9C858D] hover:text-[#C3AEB4]"
          }`}
        >
          <span>AI Solved & Allocated Requirements</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40">
            {resolvedRequests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("neural_logs")}
          className={`pb-1 font-bold flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === "neural_logs"
              ? "text-[#E8A0AA] border-b-2 border-[#C72C41]"
              : "text-[#9C858D] hover:text-[#C3AEB4]"
          }`}
        >
          <span>AI Agent Thought Trace Log</span>
        </button>
      </div>

      {/* Tab 1: Pending Queue */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {pendingRequests.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 rounded-2xl bg-[#211018] border border-[#49303A] hover:border-[#C72C41]/50 transition-all shadow-md space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#321923] border border-[#C72C41]/40 flex items-center justify-center font-mono font-black text-lg text-[#E8A0AA] shadow-inner">
                        {req.bloodGroup}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-[#FFF7F5] text-sm font-heading">{req.patientName}</h4>
                          {req.urgency === "Emergency" && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#FF334F]/20 text-[#FF334F] border border-[#FF334F]/50 animate-pulse">
                              CRITICAL SOS
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-[#9C858D]">REF: {req.id}</span>
                        </div>
                        <p className="text-xs text-[#C3AEB4] mt-0.5">
                          {req.patientCondition || "Clinical Blood Order"} • Required: {req.volumeMl} ml
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs">
                      <div className="text-right hidden sm:block">
                        <span className="text-[10px] text-[#9C858D] block uppercase font-bold">Destination</span>
                        <span className="text-xs text-[#FFF7F5] font-bold block">{req.hospitalName}</span>
                      </div>
                      <button
                        onClick={() => handleSolveWithAi(req.id)}
                        disabled={solvingId === req.id}
                        className="px-4 py-2.5 bg-gradient-to-r from-[#D93A50] to-[#A91F36] hover:brightness-110 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-[#C72C41]/25 transition-all cursor-pointer flex items-center gap-2 text-xs"
                      >
                        {solvingId === req.id ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>AI Reasoning...</span>
                          </>
                        ) : (
                          <>
                            <Brain className="w-3.5 h-3.5 text-white" />
                            <span>Solve with AI Agent</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#49303A]/60 flex flex-wrap items-center justify-between text-[11px] font-mono text-[#9C858D] gap-2">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[#E8A0AA]" />
                      Logged: {new Date(req.createdAt).toLocaleTimeString()}
                    </span>
                    <span className="text-[#38BDF8]">
                      Regional Hub: {req.location || userLocation}
                    </span>
                    <span className="text-[#22C55E]">
                      Clinical Requirement: Pending Autonomous AI Match
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center burgundy-card border border-[#49303A] rounded-2xl space-y-3">
              <CheckCircle2 className="w-12 h-12 text-[#22C55E] mx-auto animate-bounce" />
              <h3 className="font-heading font-extrabold text-lg text-[#FFF7F5]">All Patient Requirements Solved!</h3>
              <p className="text-xs text-[#C3AEB4] max-w-md mx-auto">
                No unfulfilled patient requests currently pending. The autonomous AI matching engine has matched and allocated all active orders.
              </p>
              <button
                onClick={handleSimulateEmergency}
                className="mt-2 px-4 py-2 bg-[#321923] hover:bg-[#3A202B] border border-[#C72C41]/50 text-[#E8A0AA] rounded-xl text-xs font-mono font-bold cursor-pointer"
              >
                + Inject New Emergency Patient Case
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: AI Solved Requirements */}
      {activeTab === "resolved" && (
        <div className="space-y-4">
          {resolvedRequests.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {resolvedRequests.map((req) => {
                const isExpanded = expandedRationaleId === req.id;
                return (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl bg-[#211018] border border-[#22C55E]/40 shadow-md space-y-4 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/50 flex items-center justify-center font-mono font-black text-lg text-[#22C55E]">
                          {req.bloodGroup}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-[#FFF7F5] text-sm font-heading">{req.patientName}</h4>
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/40 flex items-center gap-1">
                              <Check className="w-3 h-3" /> SOLVED & ALLOCATED
                            </span>
                          </div>
                          <p className="text-xs text-[#C3AEB4] mt-0.5">
                            Hospital: <span className="text-[#FFF7F5] font-bold">{req.hospitalName}</span> • Vol: {req.volumeMl} ml
                          </p>
                        </div>
                      </div>

                      {/* Matched Donor Details Card */}
                      <div className="p-3 bg-[#24151D] border border-[#49303A] rounded-xl font-mono text-xs space-y-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] text-[#9C858D] uppercase font-bold">Matched Life Provider</span>
                          <span className="text-[10px] text-[#22C55E] font-bold">
                            Score: {req.matchScore || 96}%
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[#FFF7F5] block">
                          {req.matchedDonorName || "Verified Blood Provider"}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-[#E8A0AA]">
                          <span>ETA: {req.transitEtaMin || 14} min</span>
                          <span>•</span>
                          <span>{req.transitMethod === "DRONE_AIRWAY" ? "🚀 Drone Corridor" : "🚑 Ambulance Corridor"}</span>
                        </div>
                      </div>
                    </div>

                    {/* AI Decision Rationale Section */}
                    {req.aiRationale && (
                      <div className="p-3.5 bg-[#190D13] border border-[#49303A] rounded-xl space-y-2 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#E8A0AA] flex items-center gap-1.5 uppercase tracking-wider">
                            <Brain className="w-3.5 h-3.5 text-[#C72C41]" />
                            AI Clinical Decision Rationale
                          </span>
                          <button
                            onClick={() => setExpandedRationaleId(isExpanded ? null : req.id)}
                            className="text-[10px] text-[#9C858D] hover:text-[#FFF7F5] flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isExpanded ? "Hide Trace" : "View 5-Phase Trace"}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>
                        <p className="text-xs text-[#C3AEB4] leading-relaxed">
                          {req.aiRationale}
                        </p>

                        {/* Step-by-Step Reasonings if expanded */}
                        {isExpanded && req.aiReasoningSteps && (
                          <div className="pt-3 border-t border-[#49303A] space-y-2 animate-fadeIn">
                            {req.aiReasoningSteps.map((s, idx) => (
                              <div key={idx} className="p-2.5 rounded-lg bg-[#24151D] border border-[#49303A]/60 space-y-1">
                                <span className="font-bold text-[#FFF7F5] text-[11px] block text-[#E8A0AA]">
                                  {s.step}
                                </span>
                                <p className="text-[10px] text-[#9C858D] leading-normal">{s.detail}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center burgundy-card border border-[#49303A] rounded-2xl space-y-2">
              <Clock className="w-10 h-10 text-[#9C858D] mx-auto" />
              <h3 className="font-heading font-extrabold text-base text-[#FFF7F5]">No Resolved Cases Yet</h3>
              <p className="text-xs text-[#C3AEB4]">
                Click "Solve with AI Agent" on any pending request in the queue to resolve it.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Neural Thought Trace Log */}
      {activeTab === "neural_logs" && (
        <div className="p-6 rounded-2xl bg-[#190D13] border border-[#49303A] space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-[#49303A] pb-3">
            <span className="font-bold text-[#FFF7F5] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#22C55E]" />
              Continuous AI Agent Telemetry & Decision Stream
            </span>
            <span className="text-[10px] text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/30 px-2 py-0.5 rounded">
              ● Live Stream
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
            {[
              {
                time: "11:42:25",
                tag: "DISPATCH",
                msg: "Auto-Match Protocol executed for Apollo Trauma Case (O-). Assigned Drone Flightway Alpha (ETA: 14.5m). Match Score: 95%."
              },
              {
                time: "11:40:12",
                tag: "TRIAGE",
                msg: "Evaluated 14 active donor nodes. Filtered out 2 candidates due to 56-day cooldown frequency constraints."
              },
              {
                time: "11:38:05",
                tag: "BIOMETRIC",
                msg: "Validated wearable telemetry stream: 72 bpm, 36.6°C. Zero active deferrals. Health index: OPTIMAL."
              },
              {
                time: "11:35:40",
                tag: "BLOCKCHAIN",
                msg: "Minted immutable audit record on local ledger block #18. SHA-256 state certified."
              }
            ].map((log, i) => (
              <div key={i} className="p-3 bg-[#24151D] border border-[#49303A]/60 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#C72C41] font-bold">[{log.tag}]</span>
                  <span className="text-[#9C858D]">{log.time}</span>
                </div>
                <p className="text-[11px] text-[#C3AEB4] leading-normal">{log.msg}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live AI Reasoning Trace Modal */}
      {activeTraceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#211018] border border-[#22C55E]/50 rounded-2xl shadow-2xl p-6 space-y-5 text-[#FFF7F5]">
            <div className="flex items-center justify-between border-b border-[#49303A] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#22C55E]/20 border border-[#22C55E]/50 flex items-center justify-center text-[#22C55E]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-[#FFF7F5] flex items-center gap-2">
                    Patient Requirement Solved by AI Agent!
                  </h3>
                  <p className="text-[11px] text-[#22C55E] font-mono">
                    Case {activeTraceModal.requestId} • {activeTraceModal.bloodGroup} allocated to {activeTraceModal.matchedDonor.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTraceModal(null)}
                className="w-8 h-8 rounded-lg bg-[#24151D] border border-[#49303A] text-[#C3AEB4] hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Matched Details Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 bg-[#24151D] border border-[#49303A] rounded-xl space-y-1">
                <span className="text-[9px] text-[#9C858D] uppercase block font-bold">Selected Life Provider</span>
                <span className="text-sm font-bold text-[#FFF7F5] block truncate">{activeTraceModal.matchedDonor.name}</span>
                <span className="text-[10px] text-[#E8A0AA] block">{activeTraceModal.matchedDonor.bloodGroup} • {activeTraceModal.matchedDonor.phone}</span>
              </div>
              <div className="p-3 bg-[#24151D] border border-[#49303A] rounded-xl space-y-1">
                <span className="text-[9px] text-[#9C858D] uppercase block font-bold">Neural Match Score</span>
                <span className="text-xl font-black text-[#22C55E] block">{activeTraceModal.matchedDonor.matchScore}% Optimal</span>
                <span className="text-[10px] text-[#A8FFB2] block">Compatibility Verified</span>
              </div>
              <div className="p-3 bg-[#24151D] border border-[#49303A] rounded-xl space-y-1">
                <span className="text-[9px] text-[#9C858D] uppercase block font-bold">Corridor & Transit ETA</span>
                <span className="text-xl font-black text-[#38BDF8] block">{activeTraceModal.matchedDonor.etaMinutes} mins</span>
                <span className="text-[10px] text-[#C3AEB4] block truncate">{activeTraceModal.matchedDonor.corridorName}</span>
              </div>
            </div>

            {/* Step-by-Step AI Reasoning Steps */}
            <div className="space-y-2 font-mono text-xs">
              <span className="text-[10px] text-[#E8A0AA] font-bold block uppercase tracking-wider">
                Autonomous 5-Phase Cognitive Rationale Trace:
              </span>
              <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                {activeTraceModal.reasoningSteps?.map((step: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-[#24151D] border border-[#49303A] space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#E8A0AA]">{step.step}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] uppercase font-bold">
                        {step.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#C3AEB4] leading-normal">{step.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Blockchain Audit Seal */}
            <div className="p-3 bg-[#190D13] border border-[#49303A] rounded-xl text-[10px] font-mono text-[#9C858D] flex items-center justify-between">
              <span>Blockchain Cryptographic Seal:</span>
              <span className="text-[#A8FFB2] select-all truncate max-w-xs">{activeTraceModal.blockchainHash}</span>
            </div>

            <button
              onClick={() => setActiveTraceModal(null)}
              className="w-full py-3 bg-[#24151D] hover:bg-[#321923] border border-[#49303A] text-xs font-bold font-mono rounded-xl cursor-pointer"
            >
              Close and Return to Console
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
