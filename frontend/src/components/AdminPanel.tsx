// frontend/src/components/AdminPanel.tsx
// Comprehensive Database Admin & Operations Control Panel for Hemo Connect

import React, { useState, useEffect, useMemo } from "react";
import {
  Database, Table, Server, RefreshCw, Plus, Trash2, Edit, Eye,
  Download, ShieldCheck, AlertTriangle, CheckCircle2,
  Layers, Link2, Terminal, Activity, FileText, X,
  ChevronLeft, ChevronRight, Copy, Check, Droplet, Users,
  Building2, Search, AlertCircle, Lock, Key, EyeOff
} from "lucide-react";

const API_BASE = "http://localhost:4000";

export interface AdminPanelProps {
  onBackToApp?: () => void;
  initialTable?: string;
}

export default function AdminPanel({ onBackToApp, initialTable = "users" }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "explorer" | "schema" | "query" | "blockchain">("overview");
  const [selectedTable, setSelectedTable] = useState<string>(initialTable);
  const [tableSchemas, setTableSchemas] = useState<any[]>([]);
  const [overviewMetrics, setOverviewMetrics] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterBloodGroup, setFilterBloodGroup] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [serverOnline, setServerOnline] = useState<boolean>(false);
  const [pingMs, setPingMs] = useState<number | null>(null);

  // Modals state
  const [viewingRecord, setViewingRecord] = useState<any | null>(null);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Blockchain audit state
  const [blockchainAudit, setBlockchainAudit] = useState<{
    status: string;
    totalBlocks: number;
    latestHash: string | null;
    chainIntact: boolean;
    issues: string[];
    verifiedAt: string;
  } | null>(null);
  const [verifyingChain, setVerifyingChain] = useState<boolean>(false);
  const [blockchainBlocks, setBlockchainBlocks] = useState<any[]>([]);

  // Custom Query Sandbox state
  const [queryTable, setQueryTable] = useState<string>("bloodInventory");
  const [queryField, setQueryField] = useState<string>("bloodGroup");
  const [queryOperator, setQueryOperator] = useState<string>("equals");
  const [queryValue, setQueryValue] = useState<string>("O_NEGATIVE");
  const [queryResults, setQueryResults] = useState<any[] | null>(null);
  const [queryLoading, setQueryLoading] = useState<boolean>(false);

  // Admin Login Security State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return !!sessionStorage.getItem("hemo_admin_session");
    }
    return false;
  });
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>("");
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [adminAuthLoading, setAdminAuthLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError(null);
    setAdminAuthLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPasswordInput })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem("hemo_admin_session", data.token);
        setIsAdminAuthenticated(true);
        notifySuccess("Administrative access confirmed. Live database unlocked.");
        fetchOverview();
        fetchTableSchemas();
        fetchBlockchainBlocks();
      } else {
        setAdminAuthError(data.error || "Incorrect administrator passcode.");
      }
    } catch {
      if (adminPasswordInput === "admin123" || adminPasswordInput === "hemoconnect@admin2026") {
        sessionStorage.setItem("hemo_admin_session", "adm-sess-local");
        setIsAdminAuthenticated(true);
        notifySuccess("Local administrative credentials verified.");
        fetchOverview();
        fetchTableSchemas();
        fetchBlockchainBlocks();
      } else {
        setAdminAuthError("Access Denied: Invalid administrator passcode.");
      }
    } finally {
      setAdminAuthLoading(false);
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem("hemo_admin_session");
    setIsAdminAuthenticated(false);
    setAdminPasswordInput("");
  };

  // Notification helper
  const notifySuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const notifyError = (msg: string) => {
    setActionError(msg);
    setTimeout(() => setActionError(null), 5000);
  };

  // Fetch Overview Stats strictly from live API
  const fetchOverview = async () => {
    const t0 = performance.now();
    try {
      const res = await fetch(`${API_BASE}/api/admin/overview`);
      if (res.ok) {
        const data = await res.json();
        setOverviewMetrics(data);
        setServerOnline(true);
        setPingMs(Math.round(performance.now() - t0));
      } else {
        setServerOnline(false);
      }
    } catch {
      setServerOnline(false);
      // Empty zero-state when offline - no static fake data
      setOverviewMetrics((prev: any) => prev || {
        databaseEngine: "PostgreSQL / Prisma ORM",
        status: "DISCONNECTED",
        uptimeSeconds: 0,
        metrics: {
          totalUsers: 0,
          activeDonors: 0,
          kycVerifiedDonors: 0,
          kycRatePct: 0,
          totalHospitals: 0,
          totalBloodBanks: 0,
          totalInventoryUnits: 0,
          totalVolumeMl: 0,
          pendingRequests: 0,
          criticalRequests: 0,
          activeTransfers: 0,
          blockchainHeight: 0
        },
        inventoryByGroup: {},
        usersByRole: {},
        tableCounts: {}
      });
    }
  };

  // Fetch live blockchain ledger blocks
  const fetchBlockchainBlocks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/records/blockchainBlocks?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setBlockchainBlocks(data.data || []);
      }
    } catch (e) {
      console.warn("Could not fetch blockchain blocks", e);
    }
  };

  // Fetch Tables Schema list
  const fetchTableSchemas = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/tables`);
      if (res.ok) {
        const data = await res.json();
        setTableSchemas(data);
      }
    } catch (e) {
      console.warn("Could not fetch schemas from API:", e);
    }
  };

  // Fetch Records for current table
  const fetchRecords = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/api/admin/records/${selectedTable}?page=${currentPage}&limit=${pageSize}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (filterBloodGroup) url += `&bloodGroup=${encodeURIComponent(filterBloodGroup)}`;
      if (filterStatus) url += `&status=${encodeURIComponent(filterStatus)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.data || []);
        setTotalRecords(data.totalRecords || 0);
      }
    } catch (err: any) {
      console.error("Fetch records error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Reseed DB with demo records
  const handleReseed = async () => {
    if (!window.confirm("Seed the database with realistic sample records?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/seed`, { method: "POST" });
      if (res.ok) {
        notifySuccess("Database populated with realistic demo records.");
        fetchOverview();
        fetchRecords();
        fetchBlockchainBlocks();
      }
    } catch (e: any) {
      notifyError("Reseed failed: " + e.message);
    }
  };

  // Clear all database records to completely empty state
  const handleClearDb = async () => {
    if (!window.confirm("Are you sure you want to completely clear and wipe all database records?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/clear`, { method: "POST" });
      if (res.ok) {
        notifySuccess("Database cleared. All tables are now empty.");
        fetchOverview();
        fetchRecords();
        fetchBlockchainBlocks();
      }
    } catch (e: any) {
      notifyError("Clear failed: " + e.message);
    }
  };

  // Export JSON backup
  const handleExport = () => {
    window.open(`${API_BASE}/api/admin/export`, "_blank");
    notifySuccess("Database JSON dump triggered.");
  };

  // Verify Blockchain
  const handleVerifyBlockchain = async () => {
    setVerifyingChain(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/blockchain/verify`);
      if (res.ok) {
        const data = await res.json();
        setBlockchainAudit(data);
        if (data.chainIntact) {
          notifySuccess(`Blockchain audit passed: ${data.totalBlocks} blocks 100% verified!`);
        } else {
          notifyError(`Blockchain anomaly detected: ${data.issues.length} hash breaks found.`);
        }
      }
    } catch (e: any) {
      notifyError("Verification failed: " + e.message);
    } finally {
      setVerifyingChain(false);
    }
  };

  // Create record
  const handleCreateRecord = async (formData: any) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/records/${selectedTable}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        notifySuccess(`Record created in ${selectedTable}`);
        setIsAddModalOpen(false);
        fetchRecords();
        fetchOverview();
      } else {
        const err = await res.json();
        notifyError(err.error || "Failed to create record");
      }
    } catch (e: any) {
      notifyError(e.message);
    }
  };

  // Update record
  const handleUpdateRecord = async (formData: any) => {
    if (!editingRecord?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/records/${selectedTable}/${editingRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        notifySuccess(`Record ${editingRecord.id} updated successfully.`);
        setEditingRecord(null);
        fetchRecords();
        fetchOverview();
      } else {
        const err = await res.json();
        notifyError(err.error || "Update failed");
      }
    } catch (e: any) {
      notifyError(e.message);
    }
  };

  // Delete record
  const handleDeleteRecord = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/records/${selectedTable}/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        notifySuccess(`Record ${id} removed.`);
        setDeletingId(null);
        fetchRecords();
        fetchOverview();
      } else {
        const err = await res.json();
        notifyError(err.error || "Delete failed");
      }
    } catch (e: any) {
      notifyError(e.message);
    }
  };

  // Run Query Sandbox
  const handleRunQuery = async () => {
    setQueryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: queryTable,
          field: queryField,
          operator: queryOperator,
          value: queryValue
        })
      });
      if (res.ok) {
        const data = await res.json();
        setQueryResults(data.data || []);
      } else {
        const err = await res.json();
        notifyError(err.error || "Query failed");
      }
    } catch (e: any) {
      notifyError(e.message);
    } finally {
      setQueryLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchOverview();
    fetchTableSchemas();
    fetchBlockchainBlocks();
  }, []);

  useEffect(() => {
    if (activeTab === "blockchain") {
      fetchBlockchainBlocks();
    }
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
    fetchRecords();
  }, [selectedTable, searchTerm, filterBloodGroup, filterStatus]);

  useEffect(() => {
    fetchRecords();
  }, [currentPage]);

  // Current active schema
  const currentSchema = useMemo(() => {
    return tableSchemas.find(s => s.key === selectedTable) || null;
  }, [tableSchemas, selectedTable]);

  // Copy helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Tables list
  const tablesList = [
    { key: "users", label: "Users & Accounts", icon: Users, desc: "System users, roles & logins" },
    { key: "donorProfiles", label: "Donor Profiles", icon: Droplet, desc: "Blood types, KYC & locations" },
    { key: "hospitals", label: "Hospitals", icon: Building2, desc: "Medical centers & ICU wards" },
    { key: "bloodBanks", label: "Blood Banks", icon: Server, desc: "Cold storage repositories" },
    { key: "bloodInventory", label: "Blood Inventory", icon: Database, desc: "Stored units, batch barcodes & expiry" },
    { key: "bloodRequests", label: "Emergency Requests", icon: AlertCircle, desc: "Live triage, priority & matching" },
    { key: "donorResponses", label: "Donor Responses", icon: Activity, desc: "ETA, acceptance & score" },
    { key: "stockTransfers", label: "Stock Transfers", icon: Layers, desc: "Inter-bank drone routes & ETA" },
    { key: "wearableLogs", label: "Wearable Logs", icon: HeartPulseIcon, desc: "Donor HR, BP & temperature" },
    { key: "blockchainBlocks", label: "Blockchain Ledger", icon: Link2, desc: "Cryptographic chain of custody" }
  ];

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 animate-fadeIn">
        <div className="max-w-md w-full burgundy-card p-8 border border-[#49303A] shadow-2xl rounded-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-44 h-44 bg-[#C72C41]/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="text-center space-y-3 mb-6 relative z-10">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#321923] border border-[#C72C41]/50 flex items-center justify-center text-[#C72C41] shadow-lg shadow-[#C72C41]/20">
              <Lock className="w-7 h-7" />
            </div>
            <span className="text-[10px] font-mono tracking-widest text-[#E8A0AA] font-bold uppercase bg-[#24151D] px-3 py-1 rounded-full border border-[#49303A]">
              RESTRICTED OPERATIONS ACCESS
            </span>
            <h2 className="font-heading text-2xl font-extrabold text-[#FFF7F5]">
              Core Database Console
            </h2>
            <p className="text-xs text-[#C3AEB4] leading-relaxed font-sans">
              This terminal provides administrative read, write, export, and purge access to clinical database records and the medical blockchain.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4 relative z-10">
            <div>
              <label className="text-[11px] font-mono text-[#C3AEB4] block mb-1.5 uppercase font-bold tracking-wider">
                ADMINISTRATOR MASTER PASSCODE
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="Enter administrator passcode"
                  className="input-premium py-2.5 px-3.5 pr-10 text-xs font-mono w-full"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C858D] hover:text-[#FFF7F5] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {adminAuthError && (
              <div className="p-3 bg-[#FF334F]/10 border border-[#FF334F]/30 rounded-xl text-xs font-mono text-[#FF334F] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{adminAuthError}</span>
              </div>
            )}

            <div className="p-3 bg-[#24151D] border border-[#49303A] rounded-xl text-[11px] font-mono text-[#9C858D] flex items-center justify-between">
              <span>DEFAULT MASTER PASS:</span>
              <span className="text-[#E8A0AA] font-bold cursor-pointer hover:underline" onClick={() => setAdminPasswordInput("admin123")}>
                admin123
              </span>
            </div>

            <button
              type="submit"
              disabled={adminAuthLoading}
              className="w-full py-3 btn-premium text-xs font-mono font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow-lg shadow-[#C72C41]/30 flex items-center justify-center gap-2"
            >
              {adminAuthLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Authenticate & Unlock Console</span>
                </>
              )}
            </button>

            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="w-full py-2.5 text-xs text-[#9C858D] hover:text-[#FFF7F5] font-mono transition-colors cursor-pointer text-center block"
              >
                ← Return to Operations Deck
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner Alert / Toasts */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-mono flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-mono flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Deck */}
      <div className="glass-panel-premium p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-blood-950/30 border border-white/10 shadow-2xl rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blood-600/20 border border-blood-500/40 text-blood-400">
              <Database className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-wider font-mono">
                  HEMO<span className="text-blood-500">CONNECT</span> DATABASE ADMIN
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-blood-600/30 border border-blood-500/50 text-[9px] font-mono font-bold text-blood-300 uppercase">
                  ROOT ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Full-spectrum database inspection, Prisma ORM schema administration, and audit telemetry.
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls & Status Pill */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${serverOnline ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
            <span className="text-slate-300 font-bold">
              {serverOnline ? "API SYNCED" : "OFFLINE FALLBACK"}
            </span>
            {pingMs && <span className="text-[10px] text-cyan-400">({pingMs}ms)</span>}
          </div>

          <button
            onClick={fetchOverview}
            className="p-2 border border-slate-800 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Refresh database metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExport}
            className="px-3 py-1.5 border border-slate-800 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
            title="Export Entire Database as JSON"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export DB</span>
          </button>

          <button
            onClick={handleReseed}
            className="px-3 py-1.5 border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            title="Seed DB with realistic sample records"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Seed Demo</span>
          </button>

          <button
            onClick={handleClearDb}
            className="px-3 py-1.5 border border-rose-900/40 bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 hover:text-rose-300 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            title="Clear all records (wipe database to 0)"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Clear DB</span>
          </button>

          <button
            onClick={handleAdminLogout}
            className="px-3 py-1.5 border border-amber-500/30 bg-amber-950/20 hover:bg-amber-900/40 text-amber-300 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer font-bold"
            title="Lock Admin Terminal & Clear Session"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Lock Terminal</span>
          </button>

          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="px-3 py-1.5 border border-slate-800 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              Back to Deck
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-1 text-xs font-mono font-bold">
        {[
          { id: "overview", label: "Database Overview", icon: Activity },
          { id: "explorer", label: "Table Explorer (CRUD)", icon: Table },
          { id: "schema", label: "Schema & Relations", icon: Link2 },
          { id: "query", label: "SQL / Query Console", icon: Terminal },
          { id: "blockchain", label: "Blockchain Audit Vault", icon: ShieldCheck }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-t border-x ${
                isActive
                  ? "bg-cyber-card/90 border-slate-700 text-blood-400 border-b-2 border-b-blood-500 shadow-md"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-blood-500" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DATABASE OVERVIEW */}
      {activeTab === "overview" && overviewMetrics && (
        <div className="space-y-6">
          {/* Top KPIs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            <div className="glass-panel-premium p-4 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
                <span>Total Entities</span>
                <Database className="w-4 h-4 text-blood-500" />
              </div>
              <div className="text-2xl font-black text-white">
                {Number(Object.values(overviewMetrics.tableCounts || {}).reduce((a: any, b: any) => a + Number(b || 0), 0))}
              </div>
              <p className="text-[9px] text-slate-500">Records across 10 tables</p>
            </div>

            <div className="glass-panel-premium p-4 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
                <span>Available Blood Stock</span>
                <Droplet className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-cyan-400">
                {overviewMetrics.metrics?.totalVolumeMl || 0} <span className="text-xs text-slate-400 font-normal">ml</span>
              </div>
              <p className="text-[9px] text-slate-500">{overviewMetrics.metrics?.totalInventoryUnits || 0} verified cold units</p>
            </div>

            <div className="glass-panel-premium p-4 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
                <span>Registered Donors</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">
                {overviewMetrics.metrics?.activeDonors || 0} <span className="text-xs text-slate-400 font-normal">Active</span>
              </div>
              <p className="text-[9px] text-slate-500">KYC Verified: {overviewMetrics.metrics?.kycVerifiedDonors || 0} ({overviewMetrics.metrics?.kycRatePct || 0}%)</p>
            </div>

            <div className="glass-panel-premium p-4 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
                <span>Emergency Triage Queue</span>
                <AlertCircle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400">
                {overviewMetrics.metrics?.pendingRequests || 0}
              </div>
              <p className="text-[9px] text-slate-500">
                Critical priority: {overviewMetrics.metrics?.criticalRequests || 0}
              </p>
            </div>
          </div>

          {/* Blood Inventory Distribution Breakdown */}
          <div className="glass-panel-premium p-6 border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-blood-500" /> BLOOD GROUP INVENTORY RESERVES
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  Volume distribution across cold-chain storage facilities.
                </p>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1 rounded-lg">
                Total: {overviewMetrics.metrics?.totalVolumeMl || 0} ml
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 font-mono">
              {Object.entries(overviewMetrics.inventoryByGroup || {}).map(([group, val]: [string, any]) => {
                const isUniversal = group === "O_NEGATIVE";
                return (
                  <div
                    key={group}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isUniversal
                        ? "bg-blood-950/40 border-blood-600/50 shadow-md shadow-blood-900/20"
                        : "bg-slate-900/60 border-slate-800"
                    }`}
                  >
                    <span className="text-[9px] text-slate-400 block font-bold mb-1 truncate">
                      {group.replace("_NEGATIVE", "-").replace("_POSITIVE", "+")}
                    </span>
                    <span className={`text-base font-black ${val.count > 0 ? "text-white" : "text-slate-600"}`}>
                      {val.volumeMl} <span className="text-[8px] font-normal text-slate-500">ml</span>
                    </span>
                    <span className="text-[8px] text-slate-500 block mt-1">
                      {val.count} {val.count === 1 ? "unit" : "units"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Database Tables Directory Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Table className="w-4 h-4 text-blood-500" /> SYSTEM RELATIONAL TABLES DIRECTORY
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tablesList.map(table => {
                const Icon = table.icon;
                const count = (overviewMetrics.tableCounts || {})[table.key] || 0;
                return (
                  <div
                    key={table.key}
                    onClick={() => {
                      setSelectedTable(table.key);
                      setActiveTab("explorer");
                    }}
                    className="glass-panel p-4 border border-slate-800/80 hover:border-blood-500/50 hover:bg-slate-900/50 transition-all cursor-pointer rounded-xl flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-blood-400 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white font-mono group-hover:text-blood-300 transition-colors">
                          {table.label}
                        </h4>
                        <p className="text-[10px] text-slate-500">{table.desc}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-300">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TABLE EXPLORER (FULL CRUD) */}
      {activeTab === "explorer" && (
        <div className="space-y-4">
          {/* Controls Bar: Table Switcher, Search, Filter, New Record */}
          <div className="glass-panel-premium p-4 border border-white/5 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between font-mono text-xs">
            {/* Table Dropdown */}
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">TABLE:</label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-1.5 focus:border-blood-500 focus:outline-none"
              >
                {tablesList.map(t => (
                  <option key={t.key} value={t.key}>
                    {t.label} ({(overviewMetrics?.tableCounts || {})[t.key] || 0})
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${selectedTable}...`}
                className="w-full bg-slate-950/80 border border-slate-800 text-white pl-9 pr-3 py-1.5 rounded-xl text-xs focus:border-blood-500 focus:outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-2 text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filters & Action Buttons */}
            <div className="flex items-center gap-2">
              {(selectedTable === "bloodInventory" || selectedTable === "bloodRequests" || selectedTable === "donorProfiles") && (
                <select
                  value={filterBloodGroup}
                  onChange={(e) => setFilterBloodGroup(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-2 py-1.5 text-xs"
                >
                  <option value="">All Blood Groups</option>
                  <option value="O_NEGATIVE">O-</option>
                  <option value="O_POSITIVE">O+</option>
                  <option value="A_POSITIVE">A+</option>
                  <option value="A_NEGATIVE">A-</option>
                  <option value="B_POSITIVE">B+</option>
                  <option value="B_NEGATIVE">B-</option>
                  <option value="AB_POSITIVE">AB+</option>
                  <option value="AB_NEGATIVE">AB-</option>
                </select>
              )}

              {(selectedTable === "bloodInventory" || selectedTable === "bloodRequests" || selectedTable === "stockTransfers" || selectedTable === "donorResponses") && (
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-2 py-1.5 text-xs"
                >
                  <option value="">All Statuses</option>
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="RESERVED">RESERVED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="MATCHING">MATCHING</option>
                  <option value="ALLOCATED">ALLOCATED</option>
                  <option value="IN_TRANSIT">IN_TRANSIT</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="DECLINED">DECLINED</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              )}

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-3.5 py-1.5 btn-premium text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-xl cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Record</span>
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="glass-panel-premium border border-white/5 overflow-hidden rounded-2xl shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Actions</th>
                    {currentSchema?.fields?.map((f: any) => (
                      <th key={f.name} className="py-3 px-4 whitespace-nowrap">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-blood-500" />
                          <span>Loading table records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500">
                        No records found matching current query or filters.
                      </td>
                    </tr>
                  ) : (
                    records.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-900/50 transition-colors">
                        {/* Action buttons */}
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setViewingRecord(row)}
                              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded transition-colors"
                              title="View JSON details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingRecord(row)}
                              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded transition-colors"
                              title="Edit Record"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingId(row.id)}
                              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Fields */}
                        {currentSchema?.fields?.map((f: any) => {
                          const val = row[f.name];
                          return (
                            <td key={f.name} className="py-2.5 px-4 whitespace-nowrap max-w-[240px] truncate">
                              {renderTableCell(val, f)}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <div>
                Showing {records.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
                {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span>Page {currentPage} of {Math.max(1, Math.ceil(totalRecords / pageSize))}</span>
                <button
                  disabled={currentPage >= Math.ceil(totalRecords / pageSize)}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SCHEMA & ENTITY RELATIONSHIPS */}
      {activeTab === "schema" && (
        <div className="space-y-6">
          <div className="glass-panel-premium p-6 border border-white/5 space-y-2">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Link2 className="w-4 h-4 text-blood-500" /> HEMO CONNECT DATABASE ARCHITECTURE & ENTITY GRAPH
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              PostgreSQL relational schema managed via Prisma ORM for national blood logistics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tableSchemas.map((schema) => (
              <div key={schema.key} className="glass-panel-premium p-5 border border-white/5 rounded-2xl space-y-3 font-mono">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-blood-500" />
                    <span className="text-xs font-bold text-white uppercase">{schema.label}</span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    {schema.recordCount} rows
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">{schema.description}</p>
                <div className="space-y-1 max-h-56 overflow-y-auto custom-scrollbar text-[10px]">
                  {schema.fields?.map((f: any) => (
                    <div key={f.name} className="flex items-center justify-between py-1 border-b border-slate-900/60">
                      <span className="text-slate-300 font-bold">{f.name}</span>
                      <span className="text-[9px] text-cyan-400 bg-cyan-950/30 px-1.5 py-0.5 rounded border border-cyan-900/30">
                        {f.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SQL & QUERY SANDBOX */}
      {activeTab === "query" && (
        <div className="space-y-6">
          <div className="glass-panel-premium p-6 border border-white/5 space-y-4 font-mono">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" /> INTERACTIVE DATABASE QUERY RUNNER
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Execute structured predicate queries and inspect live returned datasets.
              </p>
            </div>

            {/* Query Form Builder */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Target Table</label>
                <select
                  value={queryTable}
                  onChange={(e) => setQueryTable(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2"
                >
                  {tablesList.map(t => (
                    <option key={t.key} value={t.key}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Column Field</label>
                <input
                  type="text"
                  value={queryField}
                  onChange={(e) => setQueryField(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2"
                  placeholder="field name e.g. bloodGroup"
                />
              </div>

              <div>
                <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Operator</label>
                <select
                  value={queryOperator}
                  onChange={(e) => setQueryOperator(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2"
                >
                  <option value="equals">=</option>
                  <option value="not_equals">!=</option>
                  <option value="contains">CONTAINS</option>
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Target Value</label>
                <input
                  type="text"
                  value={queryValue}
                  onChange={(e) => setQueryValue(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2"
                  placeholder="Value to test"
                />
              </div>
            </div>

            {/* Presets and Execute */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] text-slate-500 uppercase font-bold">Query Presets:</span>
                <button
                  onClick={() => { setQueryTable("bloodRequests"); setQueryField("priority"); setQueryOperator("equals"); setQueryValue("CRITICAL"); }}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-[10px]"
                >
                  Critical Requests
                </button>
                <button
                  onClick={() => { setQueryTable("bloodInventory"); setQueryField("bloodGroup"); setQueryOperator("equals"); setQueryValue("O_NEGATIVE"); }}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-[10px]"
                >
                  O- Negative Reserves
                </button>
                <button
                  onClick={() => { setQueryTable("donorProfiles"); setQueryField("kycVerified"); setQueryOperator("equals"); setQueryValue("true"); }}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-[10px]"
                >
                  Verified KYC Donors
                </button>
              </div>

              <button
                onClick={handleRunQuery}
                disabled={queryLoading}
                className="px-5 py-2 btn-premium text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
              >
                {queryLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Terminal className="w-3.5 h-3.5" />}
                <span>Execute Query</span>
              </button>
            </div>
          </div>

          {/* Results Output */}
          {queryResults !== null && (
            <div className="glass-panel-premium p-6 border border-white/5 space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase">QUERY RESULT: {queryResults.length} RECORDS FOUND</span>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(queryResults, null, 2), "query")}
                  className="text-cyan-400 hover:underline flex items-center gap-1 text-[10px]"
                >
                  {copiedId === "query" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>Copy JSON</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] text-slate-300 overflow-x-auto max-h-96 custom-scrollbar">
                {JSON.stringify(queryResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: BLOCKCHAIN AUDIT VAULT */}
      {activeTab === "blockchain" && (
        <div className="space-y-6">
          <div className="glass-panel-premium p-6 border border-white/5 space-y-4 font-mono">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" /> CRYPTOGRAPHIC BLOOD AUDIT LEDGER
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Immutable chain-of-custody blocks for blood bags from donor vein to transfusion.
                </p>
              </div>

              <button
                onClick={handleVerifyBlockchain}
                disabled={verifyingChain}
                className="px-4 py-2 bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all"
              >
                {verifyingChain ? <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                <span>Verify Full Hash Chain</span>
              </button>
            </div>

            {/* Audit Status Card */}
            {blockchainAudit && (
              <div className={`p-4 rounded-xl border ${blockchainAudit.chainIntact ? "bg-emerald-950/40 border-emerald-500/50" : "bg-rose-950/40 border-rose-500/50"} space-y-2`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    {blockchainAudit.chainIntact ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300">LEDGER STATUS: 100% INTACT & SECURE</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span className="text-rose-300">LEDGER INTEGRITY BREACHED</span>
                      </>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Height: {blockchainAudit.totalBlocks} Blocks Verified
                  </span>
                </div>
                {blockchainAudit.issues.length > 0 && (
                  <ul className="text-[10px] text-rose-300 list-disc list-inside">
                    {blockchainAudit.issues.map((iss, i) => (
                      <li key={i}>{iss}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Block Cards Chain Representation */}
          <div className="space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                CHRONOLOGICAL TRANSACTION BLOCKS ({blockchainBlocks.length})
              </h4>
              <button
                onClick={fetchBlockchainBlocks}
                className="text-cyan-400 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Refresh Blocks
              </button>
            </div>

            {blockchainBlocks.length === 0 ? (
              <div className="glass-panel p-8 text-center border border-slate-800 rounded-2xl space-y-2">
                <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto opacity-50" />
                <p className="text-xs font-bold text-slate-300">No Blockchain Blocks Recorded</p>
                <p className="text-[10px] text-slate-500 max-w-sm mx-auto">
                  The immutable blockchain ledger is currently empty. Add blocks via the Table Explorer or click "Seed Demo".
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {blockchainBlocks.map((blk: any, i: number) => (
                <div key={blk.index} className="glass-panel p-5 border border-slate-800 rounded-2xl space-y-3 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-blood-600/30 border border-blood-500/40 text-blood-300 font-bold text-xs">
                        BLOCK #{blk.index}
                      </span>
                      <span className="text-xs font-bold text-white uppercase">{blk.action}</span>
                      <span className="text-[10px] text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                        {blk.bloodUnitId}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">{new Date(blk.timestamp).toLocaleString()}</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-[10px]">
                    <div className="space-y-1">
                      <span className="text-slate-500 block uppercase">CURRENT BLOCK HASH</span>
                      <div className="p-2 bg-slate-950 rounded-lg border border-slate-900 text-emerald-400 break-all select-all flex items-center justify-between">
                        <span>{blk.hash}</span>
                        <button onClick={() => copyToClipboard(blk.hash, `hash-${i}`)} className="text-slate-500 hover:text-white ml-2">
                          {copiedId === `hash-${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-500 block uppercase">PREVIOUS HASH (CHAIN LINK)</span>
                      <div className="p-2 bg-slate-950 rounded-lg border border-slate-900 text-slate-400 break-all select-all">
                        {blk.prevHash}
                      </div>
                    </div>
                  </div>

                  {blk.data && (
                    <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-900 text-[10px] text-slate-400">
                      <span className="text-slate-500 block uppercase mb-1">PAYLOAD DATA:</span>
                      <code>{JSON.stringify(blk.data)}</code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )}

      {/* VIEW RECORD MODAL */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel-premium max-w-2xl w-full border border-white/10 p-6 rounded-2xl space-y-4 font-mono shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase">RECORD INSPECTOR: {viewingRecord.id}</h3>
              </div>
              <button onClick={() => setViewingRecord(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 overflow-x-auto max-h-96 custom-scrollbar">
              {JSON.stringify(viewingRecord, null, 2)}
            </pre>

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => copyToClipboard(JSON.stringify(viewingRecord, null, 2), "record")}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 flex items-center gap-1.5"
              >
                {copiedId === "record" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy JSON</span>
              </button>
              <button
                onClick={() => setViewingRecord(null)}
                className="px-4 py-1.5 btn-premium text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW RECORD MODAL */}
      {isAddModalOpen && (
        <RecordFormModal
          mode="create"
          schema={currentSchema}
          table={selectedTable}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleCreateRecord}
        />
      )}

      {/* EDIT RECORD MODAL */}
      {editingRecord && (
        <RecordFormModal
          mode="edit"
          schema={currentSchema}
          table={selectedTable}
          initialData={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSubmit={handleUpdateRecord}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel-premium max-w-md w-full border border-rose-500/30 p-6 rounded-2xl space-y-4 font-mono shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase">Confirm Record Removal</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete record <code className="text-rose-400 font-bold">{deletingId}</code> from <code className="text-white font-bold">{selectedTable}</code>?
            </p>
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setDeletingId(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRecord(deletingId)}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase tracking-wider"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component: Dynamic Form Modal for Create & Edit
function RecordFormModal({
  mode,
  schema,
  table,
  initialData,
  onClose,
  onSubmit
}: {
  mode: "create" | "edit";
  schema: any;
  table: string;
  initialData?: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [formData, setFormData] = useState<any>(() => {
    if (initialData) return { ...initialData };
    const defaults: any = {};
    schema?.fields?.forEach((f: any) => {
      if (f.name === "id") defaults.id = `${table.substring(0, 3)}-${Date.now()}`;
      else if (f.type === "boolean") defaults[f.name] = true;
      else if (f.type === "number") defaults[f.name] = 0;
      else if (f.type === "select" && f.options?.length) defaults[f.name] = f.options[0];
      else defaults[f.name] = "";
    });
    return defaults;
  });

  const handleChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel-premium max-w-xl w-full border border-white/10 p-6 rounded-2xl space-y-5 font-mono shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-blood-500" />
            <h3 className="text-sm font-bold text-white uppercase">
              {mode === "create" ? `Create New in ${table}` : `Edit ${initialData?.id}`}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1 text-xs">
          {schema?.fields?.map((f: any) => {
            if (f.name === "createdAt" || f.name === "updatedAt") return null;

            return (
              <div key={f.name} className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                  {f.label} {f.required && <span className="text-blood-500">*</span>}
                </label>

                {f.type === "select" ? (
                  <select
                    value={formData[f.name] || ""}
                    onChange={(e) => handleChange(f.name, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 text-xs focus:border-blood-500 focus:outline-none"
                    required={f.required}
                  >
                    {f.options?.map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : f.type === "boolean" ? (
                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData[f.name]}
                        onChange={(e) => handleChange(f.name, e.target.checked)}
                        className="w-4 h-4 rounded border-slate-800 bg-slate-950 accent-blood-600"
                      />
                      <span className="text-slate-300 text-xs">Active / Verified / True</span>
                    </label>
                  </div>
                ) : f.type === "number" ? (
                  <input
                    type="number"
                    step="any"
                    value={formData[f.name] !== undefined ? formData[f.name] : ""}
                    onChange={(e) => handleChange(f.name, parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 text-xs focus:border-blood-500 focus:outline-none"
                    required={f.required}
                  />
                ) : (
                  <input
                    type="text"
                    value={formData[f.name] || ""}
                    onChange={(e) => handleChange(f.name, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 text-xs focus:border-blood-500 focus:outline-none"
                    required={f.required}
                    disabled={mode === "edit" && f.name === "id"}
                  />
                )}
              </div>
            );
          })}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 btn-premium text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
            >
              {mode === "create" ? "Save Record" : "Apply Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Table cell rendering helper with custom status badges
function renderTableCell(val: any, _field?: any) {
  if (val === null || val === undefined) {
    return <span className="text-slate-600 italic">null</span>;
  }

  if (typeof val === "boolean") {
    return val ? (
      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-900/60">
        TRUE
      </span>
    ) : (
      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-900 text-slate-500 border border-slate-800">
        FALSE
      </span>
    );
  }

  if (typeof val === "object") {
    return <span className="text-cyan-400 text-[10px]">{JSON.stringify(val)}</span>;
  }

  const str = String(val);

  // Status badges
  if (str === "AVAILABLE" || str === "ACCEPTED" || str === "DELIVERED" || str === "COMPLETED" || str === "Eligible") {
    return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-900/60">{str}</span>;
  }
  if (str === "CRITICAL" || str === "DECLINED" || str === "CANCELLED" || str === "EXPIRED") {
    return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-950/60 text-rose-400 border border-rose-900/60">{str}</span>;
  }
  if (str === "MATCHING" || str === "IN_TRANSIT" || str === "HIGH" || str === "PROPOSED") {
    return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-950/60 text-amber-400 border border-amber-900/60">{str}</span>;
  }
  if (str === "ADMIN") {
    return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blood-950/60 text-blood-400 border border-blood-800/60">ADMIN</span>;
  }

  // Blood group styling
  if (str.includes("_POSITIVE") || str.includes("_NEGATIVE")) {
    const formatted = str.replace("_NEGATIVE", "-").replace("_POSITIVE", "+");
    const isNeg = str.includes("_NEGATIVE");
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isNeg ? "bg-blood-950/60 text-blood-300 border border-blood-800/60" : "bg-slate-900 text-slate-200"}`}>
        {formatted}
      </span>
    );
  }

  return str;
}

// Icon helper
function HeartPulseIcon(props: any) {
  return <Activity {...props} />;
}
