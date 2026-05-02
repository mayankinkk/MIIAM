export interface ServiceProvider {
  id: string;
  name: string;
  photo: string;
  service_type: string;
  rating: number;
  review_count: number;
  experience_years: number;
  jobs_completed: number;
  verified: boolean;
  skills: string[];
  certifications: string[];
  bio: string;
  hourly_rate: number;
  is_available: boolean;
  is_emergency_available: boolean;
}

export interface ServiceWarranty {
  period_days: number;
  coverage: string;
  claim_process: string;
  is_extended: boolean;
  extended_period_days?: number;
}

export interface ServiceAddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
}

export interface AMCPlan {
  id: string;
  name: string;
  service_type: string;
  description: string;
  duration_months: number;
  price: number;
  original_price: number;
  visits_per_year: number;
  included_services: string[];
  benefits: string[];
  savings_percent: number;
}

export interface ServiceReview {
  id: string;
  user_name: string;
  user_photo: string;
  rating: number;
  comment: string;
  photos: string[];
  date: string;
  service_name: string;
  is_verified: boolean;
}

export interface ServiceInsurance {
  id: string;
  name: string;
  coverage_amount: number;
  price: number;
  description: string;
  covers: string[];
}

export interface ServiceLocation {
  id: string;
  type: "home" | "office" | "other";
  address: string;
  landmark?: string;
  city: string;
  pincode: string;
  is_default: boolean;
}

export interface ServiceQuotation {
  id: string;
  user_id: string;
  service_type: string;
  description: string;
  preferred_date: string;
  preferred_time: string;
  photos: string[];
  status: "pending" | "quoted" | "accepted" | "rejected";
  quoted_amount?: number;
  quotation_valid_until?: string;
}

export const serviceProviders: ServiceProvider[] = [
  {
    id: "p1",
    name: "Rahul Sharma",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    service_type: "ac_repair",
    rating: 4.9,
    review_count: 342,
    experience_years: 8,
    jobs_completed: 1245,
    verified: true,
    skills: ["AC Repair", "Gas Refill", "Installation", "Deep Cleaning"],
    certifications: ["Daikin Certified", "LG Authorized", "Carrier Partner"],
    bio: "Expert in all AC brands with 8+ years of experience. Specialized in inverter ACs and modern cooling systems.",
    hourly_rate: 199,
    is_available: true,
    is_emergency_available: true,
  },
  {
    id: "p2",
    name: "Amit Kumar",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
    service_type: "plumbing",
    rating: 4.8,
    review_count: 256,
    experience_years: 6,
    jobs_completed: 890,
    verified: true,
    skills: ["Pipe Fitting", "Tank Cleaning", "Leak Repair", "Installation"],
    certifications: ["Licensed Plumber", "ISO 9001"],
    bio: "Licensed plumber specializing in residential and commercial plumbing solutions.",
    hourly_rate: 149,
    is_available: true,
    is_emergency_available: true,
  },
  {
    id: "p3",
    name: "Suresh Patel",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80",
    service_type: "electrical",
    rating: 4.7,
    review_count: 189,
    experience_years: 5,
    jobs_completed: 567,
    verified: true,
    skills: ["Wiring", "Switch Board", "Fan Installation", "MCB Repair"],
    certifications: ["Electrician License", "Safety Certified"],
    bio: "Certified electrician with expertise in home wiring and electrical panel services.",
    hourly_rate: 129,
    is_available: false,
    is_emergency_available: true,
  },
];

export const serviceWarranties: Record<string, ServiceWarranty> = {
  "ac_repair": { period_days: 30, coverage: "Labor and service", claim_process: "Call support or visit nearest service center", is_extended: false },
  "plumbing": { period_days: 15, coverage: "Leak repair and fittings", claim_process: "Contact via app within warranty period", is_extended: false },
  "electrical": { period_days: 30, coverage: "Electrical work and repairs", claim_process: "Schedule revisit through customer support", is_extended: false },
  "cleaning": { period_days: 7, coverage: "Service quality", claim_process: "Report within 7 days for re-service", is_extended: false },
};

export const serviceAddOns: ServiceAddOn[] = [
  { id: "addon1", name: "Genuine Spare Parts", description: "Use only OEM parts for repair", price: 299, icon: "build" },
  { id: "addon2", name: "90-Day Extended Warranty", description: "Extend coverage by 90 days", price: 199, icon: "verified_user" },
  { id: "addon3", name: "Deep Sanitization", description: "Extra sanitization included", price: 149, icon: "cleaning_services" },
  { id: "addon4", name: "Priority Booking", description: "Get serviced within 2 hours", price: 99, icon: "bolt" },
];

export const amcPlans: AMCPlan[] = [
  {
    id: "amc1",
    name: "AC Silver Plan",
    service_type: "ac_repair",
    description: "2 AC services per year with complete maintenance",
    duration_months: 12,
    price: 2499,
    original_price: 3999,
    visits_per_year: 2,
    included_services: ["Deep Cleaning", "Gas Check", "Filter Cleaning", "Remote Check"],
    benefits: ["Free service calls", "20% discount on repairs", "Priority support", "Free consumables"],
    savings_percent: 38,
  },
  {
    id: "amc2",
    name: "AC Gold Plan",
    service_type: "ac_repair",
    description: "4 AC services per year + emergency support",
    duration_months: 12,
    price: 3999,
    original_price: 7999,
    visits_per_year: 4,
    included_services: ["Deep Cleaning", "Gas Refill", "Full Servicing", "Installation Support"],
    benefits: ["Unlimited service calls", "50% discount on repairs", "Emergency support", "Free spare parts"],
    savings_percent: 50,
  },
  {
    id: "amc3",
    name: "Home Deep Cleaning Annual",
    service_type: "cleaning",
    description: "Quarterly deep cleaning for your home",
    duration_months: 12,
    price: 5999,
    original_price: 9999,
    visits_per_year: 4,
    included_services: ["Full Home Deep Clean", "Kitchen Cleaning", "Bathroom Sanitization", "Sofa Cleaning"],
    benefits: ["All materials included", "Trained professionals", "Eco-friendly products", "100% satisfaction"],
    savings_percent: 40,
  },
  {
    id: "amc4",
    name: "Plumbing Annual",
    service_type: "plumbing",
    description: "Unlimited plumbing visits for a year",
    duration_months: 12,
    price: 2999,
    original_price: 5999,
    visits_per_year: 12,
    included_services: ["Leak Repair", "Tap Fixing", "Pipe Cleaning", "Drainage"],
    benefits: ["Unlimited visits", "Free parts up to ₹500", "24/7 emergency", "Annual inspection"],
    savings_percent: 50,
  },
];

export const serviceInsurance: ServiceInsurance = {
  id: "ins1",
  name: "MIIAM Service Protection",
  coverage_amount: 5000,
  price: 99,
  description: "Get coverage for any damage during service",
  covers: ["Accidental damage to property", "Service quality issues", "Part replacement damage", "Service not completed"],
};

export const serviceReviews: ServiceReview[] = [
  {
    id: "r1",
    user_name: "Priya Singh",
    user_photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    rating: 5,
    comment: "Excellent service! The technician was very professional and completed the AC repair in just 2 hours. Very satisfied with the work.",
    photos: ["https://images.unsplash.com/photo-1631564591547-4d46fe7c9c0a?w=300&q=80"],
    date: "2024-01-15",
    service_name: "AC Gas Refill",
    is_verified: true,
  },
  {
    id: "r2",
    user_name: "Rahul Mehta",
    user_photo: "https://images.unsplash.com/photo-1500648767791-00dcc4aac36a?w=100&q=80",
    rating: 4,
    comment: "Good plumbing service. The technician arrived on time and fixed the leak quickly. Would recommend.",
    photos: [],
    date: "2024-01-10",
    service_name: "Leak Repair",
    is_verified: true,
  },
  {
    id: "r3",
    user_name: "Anjali Sharma",
    user_photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    rating: 5,
    comment: "Amazing deep cleaning! My home looks brand new. Team was punctual and very thorough. Worth every rupee!",
    photos: ["https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&q=80", "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=300&q=80"],
    date: "2024-01-05",
    service_name: "Full Home Deep Cleaning",
    is_verified: true,
  },
];

export const emergencyServices = [
  { id: "em1", name: "AC Not Cooling", icon: "ac_unit", available: true },
  { id: "em2", name: "Water Leak", icon: "water_drop", available: true },
  { id: "em3", name: "Electrical Issue", icon: "electrical_services", available: true },
  { id: "em4", name: "Gas Leak", icon: "warning", available: true },
];