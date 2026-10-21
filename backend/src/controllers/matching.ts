// backend/src/controllers/matching.ts
// AI Emergency Blood Matching Engine

export enum BloodGroup {
  A_POSITIVE = "A_POSITIVE",
  A_NEGATIVE = "A_NEGATIVE",
  B_POSITIVE = "B_POSITIVE",
  B_NEGATIVE = "B_NEGATIVE",
  AB_POSITIVE = "AB_POSITIVE",
  AB_NEGATIVE = "AB_NEGATIVE",
  O_POSITIVE = "O_POSITIVE",
  O_NEGATIVE = "O_NEGATIVE"
}

// Compatibility Matrix: maps donor blood group to compatible recipient groups
const COMPATIBILITY_MATRIX: Record<BloodGroup, BloodGroup[]> = {
  [BloodGroup.O_NEGATIVE]: [
    BloodGroup.O_NEGATIVE, BloodGroup.O_POSITIVE,
    BloodGroup.A_NEGATIVE, BloodGroup.A_POSITIVE,
    BloodGroup.B_NEGATIVE, BloodGroup.B_POSITIVE,
    BloodGroup.AB_NEGATIVE, BloodGroup.AB_POSITIVE
  ],
  [BloodGroup.O_POSITIVE]: [
    BloodGroup.O_POSITIVE, BloodGroup.A_POSITIVE,
    BloodGroup.B_POSITIVE, BloodGroup.AB_POSITIVE
  ],
  [BloodGroup.A_NEGATIVE]: [
    BloodGroup.A_NEGATIVE, BloodGroup.A_POSITIVE,
    BloodGroup.AB_NEGATIVE, BloodGroup.AB_POSITIVE
  ],
  [BloodGroup.A_POSITIVE]: [
    BloodGroup.A_POSITIVE, BloodGroup.AB_POSITIVE
  ],
  [BloodGroup.B_NEGATIVE]: [
    BloodGroup.B_NEGATIVE, BloodGroup.B_POSITIVE,
    BloodGroup.AB_NEGATIVE, BloodGroup.AB_POSITIVE
  ],
  [BloodGroup.B_POSITIVE]: [
    BloodGroup.B_POSITIVE, BloodGroup.AB_POSITIVE
  ],
  [BloodGroup.AB_NEGATIVE]: [
    BloodGroup.AB_NEGATIVE, BloodGroup.AB_POSITIVE
  ],
  [BloodGroup.AB_POSITIVE]: [
    BloodGroup.AB_POSITIVE
  ]
};

/**
 * Checks if donor blood group is compatible with recipient blood group.
 */
export function isCompatible(donor: BloodGroup, recipient: BloodGroup): boolean {
  return COMPATIBILITY_MATRIX[donor]?.includes(recipient) || false;
}

/**
 * Computes Haversine distance in kilometers between two lat/long points.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface MatchCandidate {
  id: string;
  name: string;
  phone: string;
  bloodGroup: BloodGroup;
  latitude: number;
  longitude: number;
  isAvailable: boolean;
  kycVerified: boolean;
  lastDonationDate: string | null;
  donationFrequencyDays: number;
  historicalResponseRate: number; // 0.0 to 1.0
  averageResponseTimeMin: number;
  healthStatus: string;
}

interface MatchingResult {
  donorId: string;
  name: string;
  phone: string;
  bloodGroup: BloodGroup;
  distanceKm: number;
  estTravelTimeMin: number;
  responseLikelihoodPct: number;
  matchScore: number; // 0 to 100
  status: string;
}

/**
 * Ranks nearby available and compatible donors for a specific emergency request
 */
export function matchDonors(
  requestBloodGroup: BloodGroup,
  reqLat: number,
  reqLng: number,
  donors: MatchCandidate[]
): MatchingResult[] {
  return donors
    .filter(donor => {
      // 1. Core availability and compatibility check
      const compatible = isCompatible(donor.bloodGroup, requestBloodGroup);
      const eligible = donor.healthStatus === "Eligible";
      const available = donor.isAvailable;
      
      // Eligibility window check (e.g. 90 days deferral rule)
      let meetsCooldown = true;
      if (donor.lastDonationDate) {
        const lastDonation = new Date(donor.lastDonationDate);
        const diffDays = (Date.now() - lastDonation.getTime()) / (1000 * 60 * 60 * 24);
        meetsCooldown = diffDays >= donor.donationFrequencyDays;
      }

      return compatible && eligible && available && meetsCooldown;
    })
    .map(donor => {
      const distance = calculateDistance(reqLat, reqLng, donor.latitude, donor.longitude);
      
      // Estimated arrival time based on average speed (e.g., 40 km/h in city traffic) + prep time
      const estTravelTime = Math.round((distance / 40) * 60 + 10); 

      // Predictive Response Likelihood (%) using distance and historical patterns
      // Closer donors are more likely to respond.
      const distFactor = Math.max(0, 1 - distance / 20); // range 0 to 1, max 20km
      const likelihoodPct = Math.round(
        ((donor.historicalResponseRate * 0.6) + (distFactor * 0.4)) * 100
      );

      // AI Scoring logic (0 to 100):
      // - Distance: 35% weight
      // - Historical response rate: 25% weight
      // - Response speed: 15% weight
      // - KYC Verification status: 15% weight
      // - Universal Donor (O-) matching bonus: 10% weight
      let score = 0;
      
      // Distance component (closer = higher)
      const distanceScore = Math.max(0, 100 - (distance * 5)); // 0 distance = 100, 20km = 0
      score += distanceScore * 0.35;
      
      // Response rate component
      score += (donor.historicalResponseRate * 100) * 0.25;
      
      // Response speed component (fast = higher)
      const speedScore = Math.max(0, 100 - (donor.averageResponseTimeMin * 2));
      score += speedScore * 0.15;
      
      // KYC component
      score += (donor.kycVerified ? 100 : 50) * 0.15;

      // Compatibility bonus (O- gets a matching bonus for extreme compatibility)
      if (donor.bloodGroup === BloodGroup.O_NEGATIVE) {
        score += 10;
      }

      const finalScore = Math.min(100, Math.round(score));

      return {
        donorId: donor.id,
        name: donor.name,
        phone: donor.phone,
        bloodGroup: donor.bloodGroup,
        distanceKm: parseFloat(distance.toFixed(2)),
        estTravelTimeMin: estTravelTime,
        responseLikelihoodPct: Math.min(100, likelihoodPct),
        matchScore: finalScore,
        status: donor.healthStatus
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore); // Rank highest score first
}
