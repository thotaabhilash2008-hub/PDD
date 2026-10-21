// backend/src/server.ts
// Express Server + Socket.IO setup for BloodLink AI

import express, { Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { matchDonors, BloodGroup, calculateDistance } from "./controllers/matching";
import { runAiGateway } from "./utils/ai_runner";
import { adminRouter } from "./controllers/adminDb";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors());
app.use(express.json());

// Admin Database REST API router
app.use("/api/admin", adminRouter);

// Mock DB Cache for simulation
const MOCK_DONORS = [
  {
    id: "d1",
    name: "Aarav Sharma",
    phone: "+91 98765 43210",
    bloodGroup: BloodGroup.O_NEGATIVE,
    latitude: 17.3850,
    longitude: 78.4867, // Hyderabad coordinates base
    isAvailable: true,
    kycVerified: true,
    lastDonationDate: "2026-02-10T10:00:00.000Z",
    donationFrequencyDays: 90,
    historicalResponseRate: 0.92,
    averageResponseTimeMin: 6,
    healthStatus: "Eligible"
  },
  {
    id: "d2",
    name: "Sneha Reddy",
    phone: "+91 87654 32109",
    bloodGroup: BloodGroup.O_NEGATIVE,
    latitude: 17.4062,
    longitude: 78.4682,
    isAvailable: true,
    kycVerified: true,
    lastDonationDate: "2026-03-01T10:00:00.000Z",
    donationFrequencyDays: 90,
    historicalResponseRate: 0.85,
    averageResponseTimeMin: 12,
    healthStatus: "Eligible"
  },
  {
    id: "d3",
    name: "Vikram Malhotra",
    phone: "+91 76543 21098",
    bloodGroup: BloodGroup.A_POSITIVE,
    latitude: 17.4483,
    longitude: 78.3741,
    isAvailable: true,
    kycVerified: false,
    lastDonationDate: "2026-05-15T10:00:00.000Z",
    donationFrequencyDays: 90,
    historicalResponseRate: 0.60,
    averageResponseTimeMin: 20,
    healthStatus: "Eligible"
  },
  {
    id: "d4",
    name: "Ananya Patel",
    phone: "+91 65432 10987",
    bloodGroup: BloodGroup.O_NEGATIVE,
    latitude: 17.3616,
    longitude: 78.4746,
    isAvailable: true,
    kycVerified: true,
    lastDonationDate: "2026-01-20T10:00:00.000Z",
    donationFrequencyDays: 90,
    historicalResponseRate: 0.95,
    averageResponseTimeMin: 4,
    healthStatus: "Eligible"
  },
  {
    id: "d5",
    name: "Rohan Das",
    phone: "+91 99887 76655",
    bloodGroup: BloodGroup.B_POSITIVE,
    latitude: 17.4844,
    longitude: 78.5450,
    isAvailable: true,
    kycVerified: true,
    lastDonationDate: null,
    donationFrequencyDays: 90,
    historicalResponseRate: 0.78,
    averageResponseTimeMin: 15,
    healthStatus: "Eligible"
  }
];

const MOCK_BLOOD_BANKS = [
  { id: "b1", name: "Red Cross Hyderabad Central", latitude: 17.4116, longitude: 78.4320, O_NEG: 12, A_POS: 45, B_POS: 32 },
  { id: "b2", name: "Apollo Blood Repository", latitude: 17.4251, longitude: 78.4098, O_NEG: 2, A_POS: 15, B_POS: 18 },
  { id: "b3", name: "Nizam Institute Blood Unit", latitude: 17.4055, longitude: 78.4590, O_NEG: 0, A_POS: 8, B_POS: 5 }
];

const MOCK_REQUESTS: any[] = [
  {
    id: "r-1",
    patientCondition: "Severe hemorrhage - Trauma Accident",
    bloodGroup: "O_NEGATIVE",
    volumeMl: 1000,
    priority: "CRITICAL",
    status: "MATCHING",
    hospitalName: "Apollo Hospital, Jubilee Hills",
    latitude: 17.4251,
    longitude: 78.4098,
    createdAt: new Date().toISOString()
  }
];

const MOCK_BLOCKCHAIN: any[] = [
  {
    index: 1,
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    bloodUnitId: "UID-88902-O-NEG",
    action: "COLLECTION",
    hash: "a4f89d2c88f11c76e271ee1b2f4f2",
    prevHash: "00000000000000000000000000000",
    data: { operator: "Dr. K. Sharma", location: "Donor Camp Secunderabad", temperatureC: 4.2 }
  },
  {
    index: 2,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    bloodUnitId: "UID-88902-O-NEG",
    action: "TESTING",
    hash: "7bc82d01fe817abce75662ef562d9",
    prevHash: "a4f89d2c88f11c76e271ee1b2f4f2",
    data: { labId: "LAB-404", hiv: "Negative", hepB: "Negative", malaria: "Negative", clearance: "APPROVED" }
  }
];

// 1. AI Emergency Blood Matching Endpoint
app.post("/api/match", async (req: Request, res: Response) => {
  const { bloodGroup, latitude, longitude } = req.body;
  if (!bloodGroup || !latitude || !longitude) {
    return res.status(400).json({ error: "Missing required query parameters: bloodGroup, latitude, longitude" });
  }

  try {
    const results = await runAiGateway("match", {
      requestBloodGroup: bloodGroup,
      reqLat: parseFloat(latitude),
      reqLng: parseFloat(longitude),
      donors: MOCK_DONORS
    });

    // Find compatible inventory in blood banks
    const matchedBanks = MOCK_BLOOD_BANKS.map(bank => {
      const distance = calculateDistance(parseFloat(latitude), parseFloat(longitude), bank.latitude, bank.longitude);
      const stockCount = (bank as any)[bloodGroup.replace("-", "_NEG").replace("+", "_POS")] || 0;
      
      return {
        bankId: bank.id,
        name: bank.name,
        distanceKm: parseFloat(distance.toFixed(2)),
        stockAvailable: stockCount,
        estimatedArrivalMin: Math.round((distance / 35) * 60 + 15),
        confidenceScore: stockCount > 0 ? Math.min(100, Math.round(95 - distance * 2)) : 0
      };
    }).sort((a, b) => b.confidenceScore - a.confidenceScore);

    return res.json({
      requestedGroup: bloodGroup,
      matchedDonors: results,
      matchedBloodBanks: matchedBanks
    });
  } catch (error: any) {
    console.error("Match error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// 2. Raise Request
app.post("/api/requests", (req: Request, res: Response) => {
  const { patientCondition, bloodGroup, volumeMl, priority, hospitalName, latitude, longitude } = req.body;
  
  // Simple AI Emergency Priority categorization if priority is not supplied
  let computedPriority = priority || "MEDIUM";
  if (!priority && patientCondition) {
    if (patientCondition.toLowerCase().includes("trauma") || patientCondition.toLowerCase().includes("accident") || patientCondition.toLowerCase().includes("hemorrhage")) {
      computedPriority = "CRITICAL";
    } else if (patientCondition.toLowerCase().includes("surgery") || patientCondition.toLowerCase().includes("bypass")) {
      computedPriority = "HIGH";
    }
  }

  const newRequest = {
    id: `r-${Date.now()}`,
    patientCondition,
    bloodGroup,
    volumeMl: parseFloat(volumeMl || 450),
    priority: computedPriority,
    status: "MATCHING",
    hospitalName: hospitalName || "Emergency Trauma Center",
    latitude: parseFloat(latitude || 17.3850),
    longitude: parseFloat(longitude || 78.4867),
    createdAt: new Date().toISOString()
  };

  MOCK_REQUESTS.push(newRequest);
  
  // Real-time broadcast
  io.emit("new-emergency-request", newRequest);

  return res.status(201).json(newRequest);
});

// Get Requests
app.get("/api/requests", (req, res) => {
  res.json(MOCK_REQUESTS);
});

// 3. AI Voice Emergency Assistant Parser
app.post("/api/voice-assistant", async (req: Request, res: Response) => {
  const { transcript } = req.body;
  if (!transcript) {
    return res.status(400).json({ error: "Transcript is required" });
  }

  try {
    const result = await runAiGateway("voice-parse", { transcript });
    return res.json(result);
  } catch (error: any) {
    console.error("Voice parse error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// 4. AI Fraud & Fake Request System
app.post("/api/fraud-check", async (req: Request, res: Response) => {
  const { phone, locationText, patientCondition } = req.body;
  try {
    const result = await runAiGateway("fraud-check", { phone, locationText, patientCondition });
    return res.json(result);
  } catch (error: any) {
    console.error("Fraud check error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// 4.1. AI Blood Demand & Shortage Forecaster
app.post("/api/ai/forecast", async (req: Request, res: Response) => {
  const { month, outbreakSeverity, festivalSeason, accidentsLogged, demandLag1, demandLag2, supplyLag1 } = req.body;
  try {
    const result = await runAiGateway("forecast", {
      month: month !== undefined ? month : 6,
      outbreakSeverity: outbreakSeverity !== undefined ? outbreakSeverity : 0.0,
      festivalSeason: festivalSeason !== undefined ? festivalSeason : 0,
      accidentsLogged: accidentsLogged !== undefined ? accidentsLogged : 45.0,
      demandLag1: demandLag1 !== undefined ? demandLag1 : 350.0,
      demandLag2: demandLag2 !== undefined ? demandLag2 : 350.0,
      supplyLag1: supplyLag1 !== undefined ? supplyLag1 : 360.0,
    });
    return res.json(result);
  } catch (error: any) {
    console.error("Forecast error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// 4.2. AI Route Optimization
app.post("/api/ai/route", async (req: Request, res: Response) => {
  const { startNode, endNode, traffic, closures } = req.body;
  if (!startNode || !endNode) {
    return res.status(400).json({ error: "Missing startNode or endNode" });
  }
  try {
    const result = await runAiGateway("route", { startNode, endNode, traffic, closures });
    return res.json(result);
  } catch (error: any) {
    console.error("Route error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// 5. Blockchain trace endpoint
app.get("/api/blockchain/:unitId", (req, res) => {
  const { unitId } = req.params;
  const blocks = MOCK_BLOCKCHAIN.filter(b => b.bloodUnitId === unitId);
  res.json(blocks);
});

// Create new transaction block
app.post("/api/blockchain", (req, res) => {
  const { bloodUnitId, action, data } = req.body;
  const prevBlock = MOCK_BLOCKCHAIN[MOCK_BLOCKCHAIN.length - 1];
  const newIndex = prevBlock ? prevBlock.index + 1 : 1;
  const prevHash = prevBlock ? prevBlock.hash : "00000000000000000000000000000";
  
  const mockHash = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

  const block = {
    index: newIndex,
    timestamp: new Date().toISOString(),
    bloodUnitId,
    action,
    hash: mockHash,
    prevHash,
    data
  };

  MOCK_BLOCKCHAIN.push(block);
  res.status(201).json(block);
});

// Wearable telemetry endpoint
app.get("/api/wearable/:donorId", (req, res) => {
  const { donorId } = req.params;
  res.json({
    donorId,
    heartRate: Math.floor(Math.random() * (90 - 65 + 1)) + 65,
    bloodPressure: "120/80",
    bodyTemp: parseFloat((Math.random() * (37.2 - 36.4) + 36.4).toFixed(1)),
    status: "Eligible for blood donation",
    updatedAt: new Date().toISOString()
  });
});

// WebSockets
io.on("connection", (socket) => {
  console.log(`Node connected: ${socket.id}`);
  
  // Real-time donor coordinates stream simulator
  socket.on("request-donor-coordinates", (data) => {
    const interval = setInterval(() => {
      // simulate slight drift toward request coordinate
      const driftLat = (Math.random() - 0.5) * 0.001;
      const driftLng = (Math.random() - 0.5) * 0.001;
      
      socket.emit("donor-coordinates-stream", {
        donorId: data.donorId,
        latitude: 17.3850 + driftLat,
        longitude: 78.4867 + driftLng,
        timestamp: new Date().toISOString()
      });
    }, 3000);

    socket.on("disconnect", () => {
      clearInterval(interval);
    });
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`BloodLink AI Backend operating on port ${PORT}`);
});
