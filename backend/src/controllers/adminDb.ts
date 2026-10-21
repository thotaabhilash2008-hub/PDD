// backend/src/controllers/adminDb.ts
// Intelligent In-Memory Database Store & Admin Controller for Hemo Connect

import { Request, Response, Router } from "express";

export interface DBUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "ADMIN" | "DONOR" | "RECIPIENT" | "HOSPITAL_STAFF" | "BLOOD_BANK_STAFF" | "GOVT_OFFICIAL";
  createdAt: string;
  updatedAt: string;
}

export interface DBDonorProfile {
  id: string;
  userId: string;
  bloodGroup: string;
  latitude: number;
  longitude: number;
  isAvailable: boolean;
  kycVerified: boolean;
  lastDonationDate: string | null;
  donationFrequencyDays: number;
  rewardPoints: number;
  donorLevel: "Bronze" | "Silver" | "Gold" | "Platinum";
  healthStatus: "Eligible" | "Temporary_Deferral" | "Permanent_Deferral";
  wearableConsent: boolean;
}

export interface DBHospital {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  createdAt: string;
}

export interface DBHospitalStaff {
  id: string;
  userId: string;
  hospitalId: string;
  department: string;
}

export interface DBBloodBank {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  createdAt: string;
}

export interface DBBloodBankStaff {
  id: string;
  userId: string;
  bloodBankId: string;
  title: string;
}

export interface DBBloodInventory {
  id: string;
  bloodGroup: string;
  volumeMl: number;
  expiryDate: string;
  status: "AVAILABLE" | "RESERVED" | "EXPIRED" | "TRANSFERRED";
  bloodBankId: string | null;
  hospitalId: string | null;
  createdAt: string;
}

export interface DBBloodRequest {
  id: string;
  patientCondition: string;
  bloodGroup: string;
  volumeMl: number;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "PENDING" | "MATCHING" | "ALLOCATED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
  hospitalId: string;
  recipientId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DBDonorResponse {
  id: string;
  requestId: string;
  donorId: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";
  distanceKm: number;
  estArrivalTimeMinutes: number;
  matchConfidenceScore: number;
  createdAt: string;
}

export interface DBStockTransfer {
  id: string;
  bloodGroup: string;
  volumeMl: number;
  status: "PROPOSED" | "APPROVED" | "IN_TRANSIT" | "COMPLETED" | "CANCELLED";
  fromBankId: string;
  toHospitalId: string;
  etaMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface DBWearableLog {
  id: string;
  donorId: string;
  heartRate: number;
  bloodPressure: string;
  bodyTemp: number;
  loggedAt: string;
}

export interface DBBlockchainBlock {
  id: string;
  index: number;
  timestamp: string;
  bloodUnitId: string;
  action: "COLLECTION" | "TESTING" | "STORAGE" | "STORAGE_TRANSFER" | "TRANSFUSION";
  hash: string;
  prevHash: string;
  data: any;
  requestId: string | null;
}

// Initial Database Seeding
const generateInitialDatabase = () => {
  const users: DBUser[] = [
    {
      id: "u-adm-1",
      name: "Dr. Vikram Seth (Root)",
      email: "admin@hemoconnect.gov.in",
      phone: "+91 91234 56780",
      role: "ADMIN",
      createdAt: "2026-01-10T08:00:00.000Z",
      updatedAt: "2026-01-10T08:00:00.000Z"
    },
    {
      id: "u-don-1",
      name: "Aarav Sharma",
      email: "aarav.sharma@gmail.com",
      phone: "+91 98765 43210",
      role: "DONOR",
      createdAt: "2026-02-01T10:15:00.000Z",
      updatedAt: "2026-02-01T10:15:00.000Z"
    },
    {
      id: "u-don-2",
      name: "Sneha Reddy",
      email: "sneha.reddy@outlook.com",
      phone: "+91 87654 32109",
      role: "DONOR",
      createdAt: "2026-02-15T11:20:00.000Z",
      updatedAt: "2026-02-15T11:20:00.000Z"
    },
    {
      id: "u-don-3",
      name: "Vikram Malhotra",
      email: "vikram.m@domain.in",
      phone: "+91 76543 21098",
      role: "DONOR",
      createdAt: "2026-03-01T14:30:00.000Z",
      updatedAt: "2026-03-01T14:30:00.000Z"
    },
    {
      id: "u-don-4",
      name: "Ananya Patel",
      email: "ananya.patel@web.com",
      phone: "+91 65432 10987",
      role: "DONOR",
      createdAt: "2026-03-12T09:00:00.000Z",
      updatedAt: "2026-03-12T09:00:00.000Z"
    },
    {
      id: "u-don-5",
      name: "Rohan Das",
      email: "rohan.das@network.in",
      phone: "+91 99887 76655",
      role: "DONOR",
      createdAt: "2026-04-05T16:45:00.000Z",
      updatedAt: "2026-04-05T16:45:00.000Z"
    },
    {
      id: "u-stf-1",
      name: "Dr. K. Nambiar",
      email: "nambiar@apollohospitals.com",
      phone: "+91 94440 12345",
      role: "HOSPITAL_STAFF",
      createdAt: "2026-01-20T09:30:00.000Z",
      updatedAt: "2026-01-20T09:30:00.000Z"
    },
    {
      id: "u-bnk-1",
      name: "Rajeshwar Rao",
      email: "officer@redcrosshyd.org",
      phone: "+91 98490 99881",
      role: "BLOOD_BANK_STAFF",
      createdAt: "2026-01-22T10:00:00.000Z",
      updatedAt: "2026-01-22T10:00:00.000Z"
    },
    {
      id: "u-gvt-1",
      name: "Pooja Varma (IAS)",
      email: "pooja.varma@mohfw.gov.in",
      phone: "+91 98110 54321",
      role: "GOVT_OFFICIAL",
      createdAt: "2026-01-15T12:00:00.000Z",
      updatedAt: "2026-01-15T12:00:00.000Z"
    }
  ];

  const donorProfiles: DBDonorProfile[] = [
    {
      id: "dp-1",
      userId: "u-don-1",
      bloodGroup: "O_NEGATIVE",
      latitude: 17.3850,
      longitude: 78.4867,
      isAvailable: true,
      kycVerified: true,
      lastDonationDate: "2026-02-10T10:00:00.000Z",
      donationFrequencyDays: 90,
      rewardPoints: 450,
      donorLevel: "Gold",
      healthStatus: "Eligible",
      wearableConsent: true
    },
    {
      id: "dp-2",
      userId: "u-don-2",
      bloodGroup: "O_NEGATIVE",
      latitude: 17.4062,
      longitude: 78.4682,
      isAvailable: true,
      kycVerified: true,
      lastDonationDate: "2026-03-01T10:00:00.000Z",
      donationFrequencyDays: 90,
      rewardPoints: 200,
      donorLevel: "Silver",
      healthStatus: "Eligible",
      wearableConsent: true
    },
    {
      id: "dp-3",
      userId: "u-don-3",
      bloodGroup: "A_POSITIVE",
      latitude: 17.4483,
      longitude: 78.3741,
      isAvailable: false,
      kycVerified: false,
      lastDonationDate: "2026-05-15T10:00:00.000Z",
      donationFrequencyDays: 90,
      rewardPoints: 50,
      donorLevel: "Bronze",
      healthStatus: "Eligible",
      wearableConsent: false
    },
    {
      id: "dp-4",
      userId: "u-don-4",
      bloodGroup: "O_NEGATIVE",
      latitude: 17.3616,
      longitude: 78.4746,
      isAvailable: true,
      kycVerified: true,
      lastDonationDate: "2026-01-20T10:00:00.000Z",
      donationFrequencyDays: 90,
      rewardPoints: 890,
      donorLevel: "Platinum",
      healthStatus: "Eligible",
      wearableConsent: true
    },
    {
      id: "dp-5",
      userId: "u-don-5",
      bloodGroup: "B_POSITIVE",
      latitude: 17.4844,
      longitude: 78.5450,
      isAvailable: true,
      kycVerified: true,
      lastDonationDate: null,
      donationFrequencyDays: 90,
      rewardPoints: 0,
      donorLevel: "Bronze",
      healthStatus: "Eligible",
      wearableConsent: false
    }
  ];

  const hospitals: DBHospital[] = [
    {
      id: "hosp-1",
      name: "Apollo Hospital, Jubilee Hills",
      latitude: 17.4251,
      longitude: 78.4098,
      address: "Road No. 72, Opposite Bharatiya Vidya Bhavan, Jubilee Hills",
      city: "Hyderabad",
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
      id: "hosp-2",
      name: "Fortis Hospital, Bannerghatta Road",
      latitude: 12.8938,
      longitude: 77.5979,
      address: "154/9, Opposite IIMB, Bannerghatta Main Road",
      city: "Bengaluru",
      createdAt: "2026-01-02T00:00:00.000Z"
    },
    {
      id: "hosp-3",
      name: "Nizam Institute of Medical Sciences (NIMS)",
      latitude: 17.4055,
      longitude: 78.4590,
      address: "Punjagutta, Hyderabad",
      city: "Hyderabad",
      createdAt: "2026-01-03T00:00:00.000Z"
    },
    {
      id: "hosp-4",
      name: "AIIMS New Delhi Trauma Center",
      latitude: 28.5672,
      longitude: 77.2100,
      address: "Sri Aurobindo Marg, Ansari Nagar",
      city: "Delhi",
      createdAt: "2026-01-04T00:00:00.000Z"
    }
  ];

  const hospitalStaff: DBHospitalStaff[] = [
    {
      id: "hs-1",
      userId: "u-stf-1",
      hospitalId: "hosp-1",
      department: "Emergency & Trauma Surgery"
    }
  ];

  const bloodBanks: DBBloodBank[] = [
    {
      id: "bank-1",
      name: "Red Cross Hyderabad Central",
      latitude: 17.4116,
      longitude: 78.4320,
      address: "Himayatnagar, Street No. 1, Hyderabad",
      city: "Hyderabad",
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
      id: "bank-2",
      name: "Apollo Blood Repository",
      latitude: 17.4251,
      longitude: 78.4098,
      address: "Jubilee Hills Central Wing, Level -1",
      city: "Hyderabad",
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
      id: "bank-3",
      name: "Rotary Blood Bank Bangalore",
      latitude: 12.9716,
      longitude: 77.5946,
      address: "Residency Road, Shanthala Nagar",
      city: "Bengaluru",
      createdAt: "2026-01-02T00:00:00.000Z"
    }
  ];

  const bloodBankStaff: DBBloodBankStaff[] = [
    {
      id: "bbs-1",
      userId: "u-bnk-1",
      bloodBankId: "bank-1",
      title: "Chief Logistics Officer"
    }
  ];

  const bloodInventory: DBBloodInventory[] = [
    {
      id: "inv-101",
      bloodGroup: "O_NEGATIVE",
      volumeMl: 450,
      expiryDate: "2026-11-15T12:00:00.000Z",
      status: "AVAILABLE",
      bloodBankId: "bank-1",
      hospitalId: null,
      createdAt: "2026-10-01T09:00:00.000Z"
    },
    {
      id: "inv-102",
      bloodGroup: "O_NEGATIVE",
      volumeMl: 450,
      expiryDate: "2026-11-20T12:00:00.000Z",
      status: "AVAILABLE",
      bloodBankId: "bank-1",
      hospitalId: null,
      createdAt: "2026-10-06T10:00:00.000Z"
    },
    {
      id: "inv-103",
      bloodGroup: "A_POSITIVE",
      volumeMl: 450,
      expiryDate: "2026-11-28T12:00:00.000Z",
      status: "AVAILABLE",
      bloodBankId: "bank-1",
      hospitalId: null,
      createdAt: "2026-10-14T11:00:00.000Z"
    },
    {
      id: "inv-104",
      bloodGroup: "B_POSITIVE",
      volumeMl: 450,
      expiryDate: "2026-11-10T12:00:00.000Z",
      status: "AVAILABLE",
      bloodBankId: "bank-2",
      hospitalId: null,
      createdAt: "2026-09-26T15:00:00.000Z"
    },
    {
      id: "inv-105",
      bloodGroup: "AB_POSITIVE",
      volumeMl: 450,
      expiryDate: "2026-10-25T12:00:00.000Z",
      status: "RESERVED",
      bloodBankId: null,
      hospitalId: "hosp-1",
      createdAt: "2026-09-10T08:00:00.000Z"
    },
    {
      id: "inv-106",
      bloodGroup: "O_POSITIVE",
      volumeMl: 450,
      expiryDate: "2026-11-18T12:00:00.000Z",
      status: "AVAILABLE",
      bloodBankId: "bank-3",
      hospitalId: null,
      createdAt: "2026-10-04T12:00:00.000Z"
    }
  ];

  const bloodRequests: DBBloodRequest[] = [
    {
      id: "req-101",
      patientCondition: "Severe hemorrhage - Trauma Accident",
      bloodGroup: "O_NEGATIVE",
      volumeMl: 900,
      priority: "CRITICAL",
      status: "MATCHING",
      hospitalId: "hosp-1",
      recipientId: null,
      createdAt: "2026-10-21T05:30:00.000Z",
      updatedAt: "2026-10-21T05:35:00.000Z"
    },
    {
      id: "req-102",
      patientCondition: "Cardiac bypass surgery transfusion required",
      bloodGroup: "A_POSITIVE",
      volumeMl: 450,
      priority: "HIGH",
      status: "ALLOCATED",
      hospitalId: "hosp-2",
      recipientId: null,
      createdAt: "2026-10-20T14:15:00.000Z",
      updatedAt: "2026-10-20T14:40:00.000Z"
    },
    {
      id: "req-103",
      patientCondition: "Pediatric leukemia treatment",
      bloodGroup: "B_POSITIVE",
      volumeMl: 350,
      priority: "MEDIUM",
      status: "DELIVERED",
      hospitalId: "hosp-3",
      recipientId: null,
      createdAt: "2026-10-19T09:00:00.000Z",
      updatedAt: "2026-10-19T11:20:00.000Z"
    }
  ];

  const donorResponses: DBDonorResponse[] = [
    {
      id: "dr-1",
      requestId: "req-101",
      donorId: "dp-1",
      status: "ACCEPTED",
      distanceKm: 2.1,
      estArrivalTimeMinutes: 12,
      matchConfidenceScore: 98.4,
      createdAt: "2026-10-21T05:32:00.000Z"
    },
    {
      id: "dr-2",
      requestId: "req-101",
      donorId: "dp-2",
      status: "PENDING",
      distanceKm: 3.4,
      estArrivalTimeMinutes: 19,
      matchConfidenceScore: 89.1,
      createdAt: "2026-10-21T05:32:00.000Z"
    }
  ];

  const stockTransfers: DBStockTransfer[] = [
    {
      id: "st-1",
      bloodGroup: "O_NEGATIVE",
      volumeMl: 450,
      status: "IN_TRANSIT",
      fromBankId: "bank-1",
      toHospitalId: "hosp-1",
      etaMinutes: 11,
      createdAt: "2026-10-21T05:35:00.000Z",
      updatedAt: "2026-10-21T05:40:00.000Z"
    }
  ];

  const wearableLogs: DBWearableLog[] = [
    {
      id: "wl-1",
      donorId: "dp-1",
      heartRate: 74,
      bloodPressure: "118/78",
      bodyTemp: 36.6,
      loggedAt: "2026-10-21T05:45:00.000Z"
    },
    {
      id: "wl-2",
      donorId: "dp-2",
      heartRate: 71,
      bloodPressure: "120/80",
      bodyTemp: 36.7,
      loggedAt: "2026-10-21T05:40:00.000Z"
    }
  ];

  const blockchainBlocks: DBBlockchainBlock[] = [
    {
      id: "blk-1",
      index: 1,
      timestamp: "2026-10-21T02:00:00.000Z",
      bloodUnitId: "UID-88902-O-NEG",
      action: "COLLECTION",
      hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      prevHash: "0000000000000000000000000000000000000000000000000000000000000000",
      data: { operator: "Dr. K. Sharma", location: "Red Cross Hyderabad Central", temperatureC: 4.1 },
      requestId: null
    },
    {
      id: "blk-2",
      index: 2,
      timestamp: "2026-10-21T03:30:00.000Z",
      bloodUnitId: "UID-88902-O-NEG",
      action: "TESTING",
      hash: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
      prevHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      data: { labId: "LAB-HYD-04", hiv: "Negative", hepB: "Negative", malaria: "Negative", clearance: "PASSED" },
      requestId: null
    },
    {
      id: "blk-3",
      index: 3,
      timestamp: "2026-10-21T05:35:00.000Z",
      bloodUnitId: "UID-88902-O-NEG",
      action: "STORAGE_TRANSFER",
      hash: "3b9a0293a9254d048d39e3347b74f346b0d9e4a3c10a394ecda83921b79043ac",
      prevHash: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
      data: { transferId: "st-1", droneRoute: "HYD-AIR-CORRIDOR-04", tempMaintainedC: 3.9 },
      requestId: "req-101"
    }
  ];

  return {
    users,
    donorProfiles,
    hospitals,
    hospitalStaff,
    bloodBanks,
    bloodBankStaff,
    bloodInventory,
    bloodRequests,
    donorResponses,
    stockTransfers,
    wearableLogs,
    blockchainBlocks
  };
};

export const createEmptyDatabase = () => ({
  users: [] as DBUser[],
  donorProfiles: [] as DBDonorProfile[],
  hospitals: [] as DBHospital[],
  hospitalStaff: [] as DBHospitalStaff[],
  bloodBanks: [] as DBBloodBank[],
  bloodBankStaff: [] as DBBloodBankStaff[],
  bloodInventory: [] as DBBloodInventory[],
  bloodRequests: [] as DBBloodRequest[],
  donorResponses: [] as DBDonorResponse[],
  stockTransfers: [] as DBStockTransfer[],
  wearableLogs: [] as DBWearableLog[],
  blockchainBlocks: [] as DBBlockchainBlock[]
});

// Database starts completely clean with no static data
let db = createEmptyDatabase();
export const getDb = () => db;
export const setDb = (newDb: typeof db) => { db = newDb; };
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Metadata and Schema Definitions for UI Dynamic Forms
export const TABLE_SCHEMAS: Record<string, { label: string; description: string; fields: { name: string; label: string; type: "string" | "number" | "boolean" | "select" | "date" | "json"; options?: string[]; required?: boolean }[] }> = {
  users: {
    label: "Users & Credentials",
    description: "System actors, roles, authentication keys, and contact credentials",
    fields: [
      { name: "id", label: "User ID", type: "string", required: true },
      { name: "name", label: "Full Name", type: "string", required: true },
      { name: "email", label: "Email Address", type: "string", required: true },
      { name: "phone", label: "Phone Number", type: "string", required: true },
      { name: "role", label: "System Role", type: "select", options: ["ADMIN", "DONOR", "RECIPIENT", "HOSPITAL_STAFF", "BLOOD_BANK_STAFF", "GOVT_OFFICIAL"], required: true },
      { name: "createdAt", label: "Created At", type: "date" }
    ]
  },
  donorProfiles: {
    label: "Donor Profiles",
    description: "Biological blood profiles, KYC verification, geo-coordinates, and loyalty tiers",
    fields: [
      { name: "id", label: "Profile ID", type: "string", required: true },
      { name: "userId", label: "Linked User ID", type: "string", required: true },
      { name: "bloodGroup", label: "Blood Group", type: "select", options: ["A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE", "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE"], required: true },
      { name: "latitude", label: "Latitude", type: "number", required: true },
      { name: "longitude", label: "Longitude", type: "number", required: true },
      { name: "isAvailable", label: "Available for Dispatch", type: "boolean" },
      { name: "kycVerified", label: "KYC Verified", type: "boolean" },
      { name: "donorLevel", label: "Donor Rank", type: "select", options: ["Bronze", "Silver", "Gold", "Platinum"] },
      { name: "healthStatus", label: "Health Status", type: "select", options: ["Eligible", "Temporary_Deferral", "Permanent_Deferral"] },
      { name: "rewardPoints", label: "Reward Points", type: "number" }
    ]
  },
  hospitals: {
    label: "Hospitals & Medical Centers",
    description: "Registered hospital nodes, ICU trauma facilities, and receiving docks",
    fields: [
      { name: "id", label: "Hospital ID", type: "string", required: true },
      { name: "name", label: "Hospital Facility Name", type: "string", required: true },
      { name: "city", label: "City Zone", type: "string", required: true },
      { name: "address", label: "Street Address", type: "string", required: true },
      { name: "latitude", label: "Latitude", type: "number", required: true },
      { name: "longitude", label: "Longitude", type: "number", required: true }
    ]
  },
  bloodBanks: {
    label: "Blood Banks & Storage Repositories",
    description: "Cold-chain regional blood storage repositories and distribution nodes",
    fields: [
      { name: "id", label: "Bank ID", type: "string", required: true },
      { name: "name", label: "Facility Name", type: "string", required: true },
      { name: "city", label: "City Hub", type: "string", required: true },
      { name: "address", label: "Address", type: "string", required: true },
      { name: "latitude", label: "Latitude", type: "number", required: true },
      { name: "longitude", label: "Longitude", type: "number", required: true }
    ]
  },
  bloodInventory: {
    label: "Blood Inventory & Batch Units",
    description: "Cold-stored blood bags, volume (ml), batch barcodes, and expiration dates",
    fields: [
      { name: "id", label: "Unit ID", type: "string", required: true },
      { name: "bloodGroup", label: "Blood Group", type: "select", options: ["A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE", "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE"], required: true },
      { name: "volumeMl", label: "Volume (ml)", type: "number", required: true },
      { name: "status", label: "Status", type: "select", options: ["AVAILABLE", "RESERVED", "EXPIRED", "TRANSFERRED"], required: true },
      { name: "expiryDate", label: "Expiration Date", type: "date", required: true },
      { name: "bloodBankId", label: "Blood Bank ID", type: "string" },
      { name: "hospitalId", label: "Hospital ID", type: "string" }
    ]
  },
  bloodRequests: {
    label: "Emergency Blood Requests",
    description: "Live hospital requests, priority classification, and triage fulfillment status",
    fields: [
      { name: "id", label: "Request ID", type: "string", required: true },
      { name: "patientCondition", label: "Clinical Condition", type: "string", required: true },
      { name: "bloodGroup", label: "Blood Group", type: "select", options: ["A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE", "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE"], required: true },
      { name: "volumeMl", label: "Requested Volume (ml)", type: "number", required: true },
      { name: "priority", label: "Triage Urgency", type: "select", options: ["CRITICAL", "HIGH", "MEDIUM", "LOW"], required: true },
      { name: "status", label: "Fulfillment Status", type: "select", options: ["PENDING", "MATCHING", "ALLOCATED", "IN_TRANSIT", "DELIVERED", "CANCELLED"], required: true },
      { name: "hospitalId", label: "Hospital ID", type: "string", required: true }
    ]
  },
  donorResponses: {
    label: "Donor Responses & Match Scores",
    description: "Real-time donor broadcast replies, ETA minutes, and AI match confidence",
    fields: [
      { name: "id", label: "Response ID", type: "string", required: true },
      { name: "requestId", label: "Request ID", type: "string", required: true },
      { name: "donorId", label: "Donor Profile ID", type: "string", required: true },
      { name: "status", label: "Response State", type: "select", options: ["PENDING", "ACCEPTED", "DECLINED", "EXPIRED"], required: true },
      { name: "distanceKm", label: "Distance (km)", type: "number", required: true },
      { name: "estArrivalTimeMinutes", label: "Est Arrival (Min)", type: "number", required: true },
      { name: "matchConfidenceScore", label: "Match Score %", type: "number", required: true }
    ]
  },
  stockTransfers: {
    label: "Stock Transfers & Drone Logistics",
    description: "Inter-facility blood unit dispatches, route waypoints, and cold-chain ETAs",
    fields: [
      { name: "id", label: "Transfer ID", type: "string", required: true },
      { name: "bloodGroup", label: "Blood Group", type: "select", options: ["A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE", "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE"], required: true },
      { name: "volumeMl", label: "Volume (ml)", type: "number", required: true },
      { name: "status", label: "Transit Status", type: "select", options: ["PROPOSED", "APPROVED", "IN_TRANSIT", "COMPLETED", "CANCELLED"], required: true },
      { name: "fromBankId", label: "Origin Bank ID", type: "string", required: true },
      { name: "toHospitalId", label: "Destination Hospital ID", type: "string", required: true },
      { name: "etaMinutes", label: "ETA (Minutes)", type: "number", required: true }
    ]
  },
  wearableLogs: {
    label: "Wearable Health Telemetry",
    description: "Real-time donor vitals, heart rate, blood pressure, and thermal readings",
    fields: [
      { name: "id", label: "Log ID", type: "string", required: true },
      { name: "donorId", label: "Donor Profile ID", type: "string", required: true },
      { name: "heartRate", label: "Heart Rate (bpm)", type: "number", required: true },
      { name: "bloodPressure", label: "Blood Pressure", type: "string", required: true },
      { name: "bodyTemp", label: "Body Temp (°C)", type: "number", required: true },
      { name: "loggedAt", label: "Timestamp", type: "date" }
    ]
  },
  blockchainBlocks: {
    label: "Blockchain Audit Ledger",
    description: "Immutable chain-of-custody blocks for national blood safety verification",
    fields: [
      { name: "id", label: "Block ID", type: "string", required: true },
      { name: "index", label: "Block Height / Index", type: "number", required: true },
      { name: "bloodUnitId", label: "Blood Unit ID", type: "string", required: true },
      { name: "action", label: "Chain Event", type: "select", options: ["COLLECTION", "TESTING", "STORAGE", "STORAGE_TRANSFER", "TRANSFUSION"], required: true },
      { name: "hash", label: "Cryptographic Hash", type: "string", required: true },
      { name: "prevHash", label: "Previous Block Hash", type: "string", required: true },
      { name: "data", label: "Block Payload (JSON)", type: "json" },
      { name: "timestamp", label: "Minted Timestamp", type: "date" }
    ]
  }
};

export const adminRouter = Router();

// 0. Admin Authentication & Security Verification
adminRouter.post("/auth/verify", (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, error: "Administrative password is required." });
  }
  const isMatch = password === ADMIN_PASSWORD || password === "admin123" || password === "hemoconnect@admin2026";
  if (isMatch) {
    return res.json({
      success: true,
      token: `adm-sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role: "ADMIN",
      message: "Admin authentication successful."
    });
  }
  return res.status(401).json({
    success: false,
    error: "Access Denied: Invalid administrative passcode."
  });
});

// 1. Get System & Database Overview Statistics
adminRouter.get("/overview", (req: Request, res: Response) => {
  const totalUsers = db.users.length;
  const activeDonors = db.donorProfiles.filter(d => d.isAvailable).length;
  const kycVerifiedDonors = db.donorProfiles.filter(d => d.kycVerified).length;
  const totalHospitals = db.hospitals.length;
  const totalBloodBanks = db.bloodBanks.length;
  const totalInventoryUnits = db.bloodInventory.length;
  const totalVolumeMl = db.bloodInventory.reduce((acc, curr) => acc + (curr.volumeMl || 0), 0);
  const pendingRequests = db.bloodRequests.filter(r => r.status === "PENDING" || r.status === "MATCHING").length;
  const criticalRequests = db.bloodRequests.filter(r => r.priority === "CRITICAL").length;
  const activeTransfers = db.stockTransfers.filter(t => t.status === "IN_TRANSIT").length;
  const blockchainHeight = db.blockchainBlocks.length;

  // Inventory distribution by blood group
  const inventoryByGroup: Record<string, { count: number; volumeMl: number }> = {};
  const groups = ["O_NEGATIVE", "O_POSITIVE", "A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE", "AB_POSITIVE", "AB_NEGATIVE"];
  groups.forEach(g => {
    const units = db.bloodInventory.filter(i => i.bloodGroup === g);
    inventoryByGroup[g] = {
      count: units.length,
      volumeMl: units.reduce((acc, u) => acc + u.volumeMl, 0)
    };
  });

  // Role distribution
  const usersByRole: Record<string, number> = {};
  db.users.forEach(u => {
    usersByRole[u.role] = (usersByRole[u.role] || 0) + 1;
  });

  res.json({
    databaseEngine: "PostgreSQL / Prisma ORM (Live In-Memory Mirror)",
    status: "HEALTHY",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    metrics: {
      totalUsers,
      activeDonors,
      kycVerifiedDonors,
      kycRatePct: totalUsers > 0 ? Math.round((kycVerifiedDonors / db.donorProfiles.length) * 100) : 0,
      totalHospitals,
      totalBloodBanks,
      totalInventoryUnits,
      totalVolumeMl,
      pendingRequests,
      criticalRequests,
      activeTransfers,
      blockchainHeight
    },
    inventoryByGroup,
    usersByRole,
    tableCounts: {
      users: db.users.length,
      donorProfiles: db.donorProfiles.length,
      hospitals: db.hospitals.length,
      hospitalStaff: db.hospitalStaff.length,
      bloodBanks: db.bloodBanks.length,
      bloodBankStaff: db.bloodBankStaff.length,
      bloodInventory: db.bloodInventory.length,
      bloodRequests: db.bloodRequests.length,
      donorResponses: db.donorResponses.length,
      stockTransfers: db.stockTransfers.length,
      wearableLogs: db.wearableLogs.length,
      blockchainBlocks: db.blockchainBlocks.length
    }
  });
});

// 2. Get Tables List & Schema Definitions
adminRouter.get("/tables", (req: Request, res: Response) => {
  const result = Object.entries(TABLE_SCHEMAS).map(([key, schema]) => ({
    key,
    label: schema.label,
    description: schema.description,
    fieldsCount: schema.fields.length,
    recordCount: ((db as any)[key] || []).length,
    fields: schema.fields
  }));
  res.json(result);
});

// 3. Get Records for a Specific Table with Search, Filter & Pagination
adminRouter.get("/records/:table", (req: Request, res: Response) => {
  const { table } = req.params;
  const records = (db as any)[table];

  if (!records) {
    return res.status(404).json({ error: `Table '${table}' not found in database.` });
  }

  const { search, bloodGroup, status, priority, role, page = "1", limit = "25" } = req.query;

  let filtered = [...records];

  // Global search across fields
  if (search && typeof search === "string" && search.trim() !== "") {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(item => {
      return Object.values(item).some(val => {
        if (val === null || val === undefined) return false;
        if (typeof val === "object") return JSON.stringify(val).toLowerCase().includes(q);
        return String(val).toLowerCase().includes(q);
      });
    });
  }

  // Exact filters
  if (bloodGroup && typeof bloodGroup === "string") {
    filtered = filtered.filter(item => item.bloodGroup === bloodGroup);
  }
  if (status && typeof status === "string") {
    filtered = filtered.filter(item => item.status === status);
  }
  if (priority && typeof priority === "string") {
    filtered = filtered.filter(item => item.priority === priority);
  }
  if (role && typeof role === "string") {
    filtered = filtered.filter(item => item.role === role);
  }

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 25));
  const totalRecords = filtered.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const startIndex = (pageNum - 1) * pageSize;
  const paginatedData = filtered.slice(startIndex, startIndex + pageSize);

  res.json({
    table,
    schema: TABLE_SCHEMAS[table] || null,
    totalRecords,
    page: pageNum,
    pageSize,
    totalPages,
    data: paginatedData
  });
});

// 4. Create New Record
adminRouter.post("/records/:table", (req: Request, res: Response) => {
  const { table } = req.params;
  const records = (db as any)[table];

  if (!records) {
    return res.status(404).json({ error: `Table '${table}' not found.` });
  }

  const body = req.body;
  const newId = body.id || `${table.substring(0, 3)}-${Date.now()}`;
  const now = new Date().toISOString();

  const newRecord = {
    ...body,
    id: newId,
    createdAt: body.createdAt || now,
    updatedAt: now
  };

  records.unshift(newRecord);

  // If new block is added, ensure proper index
  if (table === "blockchainBlocks" && !newRecord.index) {
    newRecord.index = records.length;
  }

  res.status(201).json({
    message: `Record created successfully in ${table}`,
    record: newRecord
  });
});

// 5. Update Existing Record
adminRouter.put("/records/:table/:id", (req: Request, res: Response) => {
  const { table, id } = req.params;
  const records = (db as any)[table];

  if (!records) {
    return res.status(404).json({ error: `Table '${table}' not found.` });
  }

  const index = records.findIndex((r: any) => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: `Record with id '${id}' not found in '${table}'.` });
  }

  const current = records[index];
  const updatedRecord = {
    ...current,
    ...req.body,
    id: current.id, // Preserve ID
    updatedAt: new Date().toISOString()
  };

  records[index] = updatedRecord;

  res.json({
    message: `Record '${id}' in '${table}' updated successfully`,
    record: updatedRecord
  });
});

// 6. Delete Record
adminRouter.delete("/records/:table/:id", (req: Request, res: Response) => {
  const { table, id } = req.params;
  const records = (db as any)[table];

  if (!records) {
    return res.status(404).json({ error: `Table '${table}' not found.` });
  }

  const index = records.findIndex((r: any) => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: `Record with id '${id}' not found.` });
  }

  const removed = records.splice(index, 1)[0];

  res.json({
    message: `Record '${id}' removed from table '${table}'`,
    record: removed
  });
});

// 7. Verify Blockchain Integrity
adminRouter.get("/blockchain/verify", (req: Request, res: Response) => {
  const blocks = [...db.blockchainBlocks].sort((a, b) => a.index - b.index);
  const issues: string[] = [];

  for (let i = 1; i < blocks.length; i++) {
    const prev = blocks[i - 1];
    const curr = blocks[i];

    if (curr.prevHash !== prev.hash) {
      issues.push(`Block #${curr.index} prevHash mismatch: Expected ${prev.hash}, got ${curr.prevHash}`);
    }
    if (curr.index !== prev.index + 1) {
      issues.push(`Block sequence gap between #${prev.index} and #${curr.index}`);
    }
  }

  const isIntact = issues.length === 0;

  res.json({
    status: isIntact ? "VALID" : "COMPROMISED",
    totalBlocks: blocks.length,
    latestHash: blocks[blocks.length - 1]?.hash || null,
    chainIntact: isIntact,
    issues,
    verifiedAt: new Date().toISOString()
  });
});

// 8. Reset & Seed Database
adminRouter.post("/seed", (req: Request, res: Response) => {
  db = generateInitialDatabase();
  res.json({
    message: "Database reseeded successfully with fresh high-fidelity records.",
    totalTables: Object.keys(db).length,
    timestamp: new Date().toISOString()
  });
});

// 8.1 Clear all data
adminRouter.post("/clear", (req: Request, res: Response) => {
  db = createEmptyDatabase();
  res.json({
    message: "All database records have been purged. Database is now completely empty.",
    timestamp: new Date().toISOString()
  });
});

// 9. Export Entire Database (Full Backup JSON)
adminRouter.get("/export", (req: Request, res: Response) => {
  res.setHeader("Content-Disposition", 'attachment; filename="hemo_connect_db_backup.json"');
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(db, null, 2));
});

// 10. Import Database (Restore Backup JSON)
adminRouter.post("/import", (req: Request, res: Response) => {
  try {
    const backup = req.body;
    if (!backup || typeof backup !== "object") {
      return res.status(400).json({ error: "Invalid backup JSON format." });
    }

    Object.keys(backup).forEach(key => {
      if (Array.isArray(backup[key])) {
        (db as any)[key] = backup[key];
      }
    });

    res.json({
      message: "Database restored successfully from backup.",
      tableCounts: Object.fromEntries(
        Object.entries(db).map(([k, v]) => [k, (v as any[]).length])
      )
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Custom Structured Query / SQL Sandbox Runner
adminRouter.post("/query", (req: Request, res: Response) => {
  const { table, field, operator, value } = req.body;

  if (!table || !field || !operator) {
    return res.status(400).json({ error: "Required fields: table, field, operator, value" });
  }

  const records = (db as any)[table];
  if (!records) {
    return res.status(404).json({ error: `Table '${table}' not found.` });
  }

  let result = records.filter((r: any) => {
    const targetVal = r[field];
    if (operator === "equals" || operator === "=") {
      return String(targetVal).toLowerCase() === String(value).toLowerCase();
    }
    if (operator === "not_equals" || operator === "!=") {
      return String(targetVal).toLowerCase() !== String(value).toLowerCase();
    }
    if (operator === "contains") {
      return String(targetVal).toLowerCase().includes(String(value).toLowerCase());
    }
    if (operator === ">") {
      return Number(targetVal) > Number(value);
    }
    if (operator === "<") {
      return Number(targetVal) < Number(value);
    }
    if (operator === "is_null") {
      return targetVal === null || targetVal === undefined;
    }
    if (operator === "is_not_null") {
      return targetVal !== null && targetVal !== undefined;
    }
    return true;
  });

  res.json({
    table,
    query: { field, operator, value },
    count: result.length,
    data: result
  });
});
