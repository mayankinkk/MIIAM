"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";

const departments = ["All", "Delivery", "Operations", "Technology", "Marketing", "Support"];

const jobOpenings = [
  {
    id: "rider-1",
    title: "Delivery Rider",
    department: "Delivery",
    location: "Guwahati, Assam",
    type: "Full-time",
    description: "Deliver food orders to customers on time with a smile. Must have own bike and valid license.",
    requirements: ["Own bike with valid registration", "Valid driving license", "Smartphone with data", "Age 18+"],
    icon: "delivery_dining",
    color: "bg-[var(--color-primary)]",
  },
  {
    id: "rider-2",
    title: "Part-Time Delivery Rider",
    department: "Delivery",
    location: "Guwahati, Assam",
    type: "Part-time",
    description: "Flexible hours. Earn extra income on weekends and evenings. Perfect for students.",
    requirements: ["Own bike (optional)", "Flexible schedule", "Age 16+", "Smartphone required"],
    icon: "schedule",
    color: "bg-teal-600",
  },
];

const benefits = [
  {
    icon: "schedule",
    title: "Flexible Hours",
    description: "Work when you want, where you want. No fixed timings.",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: "payments",
    title: "100% Tips to You",
    description: "Keep 100% of all customer tips. We take zero commission from your earnings.",
    color: "from-green-500 to-green-600",
  },
  {
    icon: "trending_up",
    title: "Growth Path",
    description: "Start as rider, grow to team lead, ops manager, and beyond.",
    color: "from-purple-500 to-purple-600",
  },
];

export default function CareersPage() {
  const supabase = createClient();
  const [activeDept, setActiveDept] = useState("All");
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<typeof jobOpenings[0] | null>(null);
  const [formData, setFormData] = useState({
    // Basic Info
    fullName: "",
    phoneNumber: "",
    email: "",
    passportPicture: null as File | null,
    // Personal Info
    ageOrDob: "",
    gender: "",
    // Address
    currentAddress: "",
    city: "Guwahati",
    pincode: "",
    landmark: "",
    // Vehicle
    vehicleType: "",
    vehicleNumber: "",
    drivingLicenseNumber: "",
    drivingLicenseUrl: null as File | null,
    rcUrl: null as File | null,
    // Work Preferences
    workType: "",
    preferredArea: "Guwahati",
    availableMorning: false,
    availableAfternoon: false,
    availableNight: false,
    workMonday: false,
    workTuesday: false,
    workWednesday: false,
    workThursday: false,
    workFriday: false,
    workSaturday: false,
    workSunday: false,
    // Experience
    hasDeliveryExperience: null as boolean | null,
    previousPlatform: "",
    // Device
    hasSmartphone: null as boolean | null,
    comfortableGoogleMaps: null as boolean | null,
    // ID Verification
    aadhaarCardUrl: null as File | null,
  });
  const [showStatusCheck, setShowStatusCheck] = useState(false);
  const [statusPhone, setStatusPhone] = useState("");
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [foundStatus, setFoundStatus] = useState<{status: string, name: string} | null>(null);

  const checkStatus = async () => {
    if (!statusPhone || statusPhone.length < 10) return;
    setCheckingStatus(true);
    setFoundStatus(null);
    const { data } = await supabase.from("job_applications").select("status, full_name").eq("phone_number", statusPhone).order('created_at', {ascending: false}).limit(1).single();
    if (data) {
      setFoundStatus({ status: data.status, name: data.full_name });
    } else {
      useToastStore.getState().addToast("No application found for this phone number", "error");
    }
    setCheckingStatus(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "hired": return "bg-green-100 text-green-700";
      case "reviewed": return "bg-blue-100 text-blue-700";
      default: return "bg-amber-100 text-amber-700";
    }
  };
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredJobs = activeDept === "All"
    ? jobOpenings
    : jobOpenings.filter(job => job.department === activeDept);

  const handleApply = (job: typeof jobOpenings[0]) => {
    setSelectedJob(job);
    setShowApplyForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let passportUrl = "";
    let drivingLicenseUrl = "";
    let rcUrl = "";
    let aadhaarUrl = "";

    const uploadFile = async (file: File, folder: string): Promise<string> => {
      const fileName = `${folder}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from("applications").upload(fileName, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("applications").getPublicUrl(fileName);
      return urlData.publicUrl;
    };

    try {
      if (formData.passportPicture) passportUrl = await uploadFile(formData.passportPicture, "passport");
      if (formData.drivingLicenseUrl) drivingLicenseUrl = await uploadFile(formData.drivingLicenseUrl, "license");
      if (formData.rcUrl) rcUrl = await uploadFile(formData.rcUrl, "rc");
      if (formData.aadhaarCardUrl) aadhaarUrl = await uploadFile(formData.aadhaarCardUrl, "aadhaar");

      const { error } = await supabase.from("job_applications").insert({
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        email: formData.email,
        passport_picture: passportUrl,
        age_or_dob: formData.ageOrDob,
        gender: formData.gender || null,
        current_address: formData.currentAddress,
        city: formData.city,
        pincode: formData.pincode,
        landmark: formData.landmark || null,
        vehicle_type: formData.vehicleType,
        vehicle_number: formData.vehicleNumber || null,
        driving_license_number: formData.drivingLicenseNumber || null,
        driving_license_url: drivingLicenseUrl,
        rc_url: rcUrl || null,
        work_type: formData.workType,
        preferred_area: formData.preferredArea,
        available_morning: formData.availableMorning,
        available_afternoon: formData.availableAfternoon,
        available_night: formData.availableNight,
        work_monday: formData.workMonday,
        work_tuesday: formData.workTuesday,
        work_wednesday: formData.workWednesday,
        work_thursday: formData.workThursday,
        work_friday: formData.workFriday,
        work_saturday: formData.workSaturday,
        work_sunday: formData.workSunday,
        has_delivery_experience: formData.hasDeliveryExperience,
        previous_platform: formData.previousPlatform || null,
        has_smartphone: formData.hasSmartphone,
        comfortable_google_maps: formData.comfortableGoogleMaps,
        aadhaar_card_url: aadhaarUrl,
      });

      if (error) {
        useToastStore.getState().addToast("Something went wrong. Please try again.", "error");
      } else {
        useToastStore.getState().addToast("Application submitted! We'll contact you soon.", "success");
      }
    } catch (err) {
      useToastStore.getState().addToast("Error uploading files. Please try again.", "error");
    }

    setShowApplyForm(false);
    setFormData({
      fullName: "", phoneNumber: "", email: "", passportPicture: null,
      ageOrDob: "", gender: "", currentAddress: "", city: "Guwahati", pincode: "", landmark: "",
      vehicleType: "", vehicleNumber: "", drivingLicenseNumber: "", drivingLicenseUrl: null, rcUrl: null,
      workType: "", preferredArea: "Guwahati", availableMorning: false, availableAfternoon: false, availableNight: false,
      workMonday: false, workTuesday: false, workWednesday: false, workThursday: false, workFriday: false, workSaturday: false, workSunday: false,
      hasDeliveryExperience: null, previousPlatform: "", hasSmartphone: null, comfortableGoogleMaps: null, aadhaarCardUrl: null,
    });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--color-surface-container-lowest)] shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black text-[var(--color-primary)] tracking-tighter">
            MIIAM
          </Link>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setShowStatusCheck(true)}
              className="text-sm font-bold text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
            >
              Check Status
            </button>
            <Link href="/" className="text-sm font-bold text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]">
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[var(--color-primary)] to-[#6b0011] px-4 py-20 text-center text-white">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block bg-[var(--color-surface-container-lowest)]/20 text-white text-xs font-bold px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
            🚀 JOIN OUR TEAM
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Build Your Career with MIIAM
          </h1>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            We're building Assam's fastest food delivery platform. Join us and make an impact while growing your career.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
              <a href="#openings" className="bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] px-8 py-4 rounded-xl font-bold hover:scale-105 transition-transform shadow-xl">
                View Open Positions
              </a>
              <button 
                onClick={() => setShowStatusCheck(true)}
                className="bg-[var(--color-surface-container-lowest)]/20 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/30 transition-colors"
              >
                Check Application Status
              </button>
            </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[var(--color-surface-container-lowest)] px-4 py-10 border-b border-[var(--color-border-subtle)]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "100+", label: "Team Members" },
            { value: "500+", label: "Delivery Partners" },
            { value: "50+", label: "Partner Restaurants" },
            { value: "10K+", label: "Happy Customers" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-extrabold text-[var(--color-primary)]">{stat.value}</p>
              <p className="text-[var(--color-outline)] text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-[var(--color-on-surface)] mb-2">Why Work at MIIAM?</h2>
          <p className="text-[var(--color-outline)]">Great benefits that set us apart</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className={`w-14 h-14 bg-gradient-to-br ${benefit.color} rounded-xl flex items-center justify-center mb-4`}>
                <span className="material-symbols-outlined text-white text-2xl">{benefit.icon}</span>
              </div>
              <h3 className="text-lg font-bold text-[var(--color-on-surface)] mb-2">{benefit.title}</h3>
              <p className="text-[var(--color-outline)] text-sm">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Job Openings */}
      <section id="openings" className="bg-[var(--color-surface-container-lowest)] px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-[var(--color-on-surface)] mb-2">Open Positions</h2>
            <p className="text-[var(--color-outline)]">Find your perfect role and apply today</p>
          </div>

          {/* Department Filter */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setActiveDept(dept)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                  activeDept === dept
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Jobs List */}
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div key={job.id} className="bg-[var(--color-surface-subtle)] rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 ${job.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <span className="material-symbols-outlined text-white text-2xl">{job.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--color-on-surface)]">{job.title}</h3>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-[var(--color-outline)]">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          {job.type}
                        </span>
                      </div>
                      <p className="text-[var(--color-on-surface-variant)] text-sm mt-2 line-clamp-2">{job.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleApply(job)}
                    className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#a40017] transition-colors flex-shrink-0"
                  >
                    Apply Now
                  </button>
                </div>
                <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)]">
                  <p className="text-xs text-[var(--color-outline)] font-semibold mb-2">Requirements:</p>
                  <div className="flex flex-wrap gap-2">
                    {job.requirements.map((req, i) => (
                      <span key={i} className="bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)] text-xs px-3 py-1 rounded-full border border-[var(--color-border-subtle)]">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-6xl text-[var(--color-outline-variant)]/60">work_off</span>
              <p className="text-[var(--color-outline)] mt-4 font-bold">No open positions in this department</p>
              <p className="text-[var(--color-outline-variant)] text-sm">Check back later or explore other roles</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[var(--color-primary)] to-[#6b0011] px-4 py-20 text-center text-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Don't See the Perfect Role?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Send us your resume anyway. We're always looking for talented people to join our team.
          </p>
          <button
            onClick={() => {
              setSelectedJob(null);
              setShowApplyForm(true);
            }}
            className="bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] px-10 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-xl"
          >
            Send Your Resume
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 px-4 py-12 text-center">
        <div className="flex justify-center gap-6 mb-4">
          <Link href="/terms" className="text-[var(--color-outline)] text-sm hover:text-white transition-colors">Terms</Link>
          <Link href="/privacy" className="text-[var(--color-outline)] text-sm hover:text-white transition-colors">Privacy</Link>
          <Link href="/refunds" className="text-[var(--color-outline)] text-sm hover:text-white transition-colors">Refund Policy</Link>
        </div>
        <p className="text-[var(--color-outline)] text-sm">
          © 2026 MIIAM. All rights reserved. Guwahati, Assam.
        </p>
      </footer>

      {/* Application Modal */}
      {showApplyForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--color-surface-container-lowest)] border-b border-[var(--color-border-subtle)] px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-on-surface)]">
                  {selectedJob ? `Apply: ${selectedJob.title}` : "Apply for Delivery Rider"}
                </h2>
                <p className="text-xs text-[var(--color-outline)]">We'll get back to you within 3 business days</p>
              </div>
              <button
                onClick={() => setShowApplyForm(false)}
                className="w-10 h-10 bg-[var(--color-surface-container)] rounded-full flex items-center justify-center"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Section 1: Basic Info */}
              <div className="bg-[var(--color-surface-subtle)] rounded-xl p-4">
                <h3 className="text-sm font-bold text-[var(--color-on-surface)] mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[var(--color-primary)]">person</span>
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]">Full Name *</label>
                    <input type="text" required placeholder="Enter your full name" className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]">Phone Number *</label>
                    <input type="tel" required placeholder="10-digit phone number" className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]">Email Address *</label>
                    <input type="email" required placeholder="Enter your email" className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]">Passport Picture *</label>
                    <input type="file" required accept="image/*" className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)] text-sm" onChange={(e) => setFormData({ ...formData, passportPicture: e.target.files?.[0] || null })} />
                  </div>
                </div>
              </div>

              {/* Section 2: Personal Info */}
              <div className="bg-[var(--color-surface-subtle)] rounded-xl p-4">
                <h3 className="text-sm font-bold text-[var(--color-on-surface)] mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[var(--color-primary)]">badge</span>
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]">Age / Date of Birth *</label>
                    <input type="text" required placeholder="e.g., 25 years or 15/01/1999" className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]" value={formData.ageOrDob} onChange={(e) => setFormData({ ...formData, ageOrDob: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]">Gender (Optional)</label>
                    <select className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Address */}
              <div className="bg-[var(--color-surface-subtle)] rounded-xl p-4">
                <h3 className="text-sm font-bold text-[var(--color-on-surface)] mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[var(--color-primary)]">location_on</span>
                  Address
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]">Current Address *</label>
                    <input type="text" required placeholder="House/Flat/Street name" className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]" value={formData.currentAddress} onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-[var(--color-on-surface)]">City *</label>
                      <input type="text" required defaultValue="Guwahati" className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-[var(--color-on-surface)]">Pincode *</label>
                      <input type="text" required placeholder="6-digit pincode" className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]">Landmark (Optional)</label>
                    <input type="text" placeholder="Near landmark, if any" className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]" value={formData.landmark} onChange={(e) => setFormData({ ...formData, landmark: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Section 4: Vehicle Details */}
              <div className="bg-[var(--color-surface-subtle)] rounded-xl p-4">
                <h3 className="text-sm font-bold text-[var(--color-on-surface)] mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[var(--color-primary)]">two_wheeler</span>
                  Vehicle Details
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-[var(--color-on-surface)]">Vehicle Type *</label>
                      <select required value={formData.vehicleType} onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })} className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]">
                        <option value="">Select Vehicle</option>
                        <option value="Bike">Bike</option>
                        <option value="Scooter">Scooter</option>
                        <option value="Cycle">Cycle</option>
                      </select>
                    </div>
                    {formData.vehicleType !== "Cycle" && (
                      <div>
                        <label className="text-sm font-semibold text-[var(--color-on-surface)]">Vehicle Number *</label>
                        <input type="text" required placeholder="e.g., AS-01-AB-1234" className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]" value={formData.vehicleNumber} onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })} />
                      </div>
                    )}
                  </div>
                  {formData.vehicleType !== "Cycle" && (
                    <>
                      <div>
                        <label className="text-sm font-semibold text-[var(--color-on-surface)]">Driving License Number *</label>
                        <input type="text" required placeholder="Enter license number" className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]" value={formData.drivingLicenseNumber} onChange={(e) => setFormData({ ...formData, drivingLicenseNumber: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold text-[var(--color-on-surface)]">Upload Driving License *</label>
                          <input type="file" required accept="image/*,.pdf" className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)] text-sm" onChange={(e) => setFormData({ ...formData, drivingLicenseUrl: e.target.files?.[0] || null })} />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-[var(--color-on-surface)]">RC Upload (Optional)</label>
                          <input type="file" accept="image/*,.pdf" className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)] text-sm" onChange={(e) => setFormData({ ...formData, rcUrl: e.target.files?.[0] || null })} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Section 5: Work Preferences */}
              <div className="bg-[var(--color-surface-subtle)] rounded-xl p-4">
                <h3 className="text-sm font-bold text-[var(--color-on-surface)] mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[var(--color-primary)]">schedule</span>
                  Work Preferences
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-[var(--color-on-surface)]">Full-time / Part-time *</label>
                      <select required className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]" value={formData.workType} onChange={(e) => setFormData({ ...formData, workType: e.target.value })}>
                        <option value="">Select</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-[var(--color-on-surface)]">Preferred Area *</label>
                      <input type="text" required placeholder="e.g., Guwahati" className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]" value={formData.preferredArea} onChange={(e) => setFormData({ ...formData, preferredArea: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]">Available Time Slots</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <label className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer ${formData.availableMorning ? 'border-[var(--color-primary)] bg-red-50' : 'border-[var(--color-border-subtle)]'}`}>
                        <input type="checkbox" className="accent-[var(--color-primary)] hidden" checked={formData.availableMorning} onChange={(e) => setFormData({ ...formData, availableMorning: e.target.checked })} />
                        <span className="text-sm text-[var(--color-on-surface)]">Morning (6AM-12PM)</span>
                      </label>
                      <label className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer ${formData.availableAfternoon ? 'border-[var(--color-primary)] bg-red-50' : 'border-[var(--color-border-subtle)]'}`}>
                        <input type="checkbox" className="accent-[var(--color-primary)] hidden" checked={formData.availableAfternoon} onChange={(e) => setFormData({ ...formData, availableAfternoon: e.target.checked })} />
                        <span className="text-sm text-[var(--color-on-surface)]">Afternoon (12PM-6PM)</span>
                      </label>
                      <label className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer ${formData.availableNight ? 'border-[var(--color-primary)] bg-red-50' : 'border-[var(--color-border-subtle)]'}`}>
                        <input type="checkbox" className="accent-[var(--color-primary)] hidden" checked={formData.availableNight} onChange={(e) => setFormData({ ...formData, availableNight: e.target.checked })} />
                        <span className="text-sm text-[var(--color-on-surface)]">Night (6PM-12AM)</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]">Working Days</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {[
                        { key: "workMonday", label: "Mon" },
                        { key: "workTuesday", label: "Tue" },
                        { key: "workWednesday", label: "Wed" },
                        { key: "workThursday", label: "Thu" },
                        { key: "workFriday", label: "Fri" },
                        { key: "workSaturday", label: "Sat" },
                        { key: "workSunday", label: "Sun" },
                      ].map((day) => (
                        <label key={day.key} className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer ${formData[day.key as keyof typeof formData] ? 'border-[var(--color-primary)] bg-red-50' : 'border-[var(--color-border-subtle)]'}`}>
                          <input type="checkbox" className="accent-[var(--color-primary)] hidden" checked={formData[day.key as keyof typeof formData] as boolean} onChange={(e) => setFormData({ ...formData, [day.key]: e.target.checked })} />
                          <span className="text-sm text-[var(--color-on-surface)]">{day.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 6: Experience */}
              <div className="bg-[var(--color-surface-subtle)] rounded-xl p-4">
                <h3 className="text-sm font-bold text-[var(--color-on-surface)] mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[var(--color-primary)]">work_history</span>
                  Delivery Experience
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]">Do you have delivery experience?</label>
                    <div className="flex gap-4 mt-2">
                      <label className={`flex items-center gap-2 px-6 py-3 rounded-xl border cursor-pointer ${formData.hasDeliveryExperience === true ? 'border-[var(--color-primary)] bg-red-50' : 'border-[var(--color-border-subtle)]'}`}>
                        <input type="radio" name="experience" className="accent-[var(--color-primary)] hidden" checked={formData.hasDeliveryExperience === true} onChange={() => setFormData({ ...formData, hasDeliveryExperience: true })} />
                        <span className="text-sm text-[var(--color-on-surface)]">Yes</span>
                      </label>
                      <label className={`flex items-center gap-2 px-6 py-3 rounded-xl border cursor-pointer ${formData.hasDeliveryExperience === false ? 'border-[var(--color-primary)] bg-red-50' : 'border-[var(--color-border-subtle)]'}`}>
                        <input type="radio" name="experience" className="accent-[var(--color-primary)] hidden" checked={formData.hasDeliveryExperience === false} onChange={() => setFormData({ ...formData, hasDeliveryExperience: false, previousPlatform: "" })} />
                        <span className="text-sm text-[var(--color-on-surface)]">No</span>
                      </label>
                    </div>
                  </div>
                  {formData.hasDeliveryExperience && (
                    <div>
                      <label className="text-sm font-semibold text-[var(--color-on-surface)]">If yes, which platform? (Optional)</label>
                      <input type="text" placeholder="e.g., Swiggy, Zomato, Blinkit" className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]" value={formData.previousPlatform} onChange={(e) => setFormData({ ...formData, previousPlatform: e.target.value })} />
                    </div>
                  )}
                </div>
              </div>

              {/* Section 7: Device Check */}
              <div className="bg-[var(--color-surface-subtle)] rounded-xl p-4">
                <h3 className="text-sm font-bold text-[var(--color-on-surface)] mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[var(--color-primary)]">smartphone</span>
                  Device Check
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-[var(--color-surface-container-lowest)] px-4 py-3 rounded-xl border border-[var(--color-border-subtle)]">
                    <span className="text-sm text-[var(--color-on-surface)]">Do you own a smartphone?</span>
                    <div className="flex gap-2">
                      <label className={`flex items-center gap-1 px-4 py-2 rounded-lg border cursor-pointer ${formData.hasSmartphone === true ? 'border-[var(--color-primary)] bg-red-50' : 'border-[var(--color-border-subtle)]'}`}>
                        <input type="radio" name="smartphone" className="accent-[var(--color-primary)] hidden" checked={formData.hasSmartphone === true} onChange={() => setFormData({ ...formData, hasSmartphone: true })} />
                        <span className="text-sm text-[var(--color-on-surface)]">Yes</span>
                      </label>
                      <label className={`flex items-center gap-1 px-4 py-2 rounded-lg border cursor-pointer ${formData.hasSmartphone === false ? 'border-[var(--color-primary)] bg-red-50' : 'border-[var(--color-border-subtle)]'}`}>
                        <input type="radio" name="smartphone" className="accent-[var(--color-primary)] hidden" checked={formData.hasSmartphone === false} onChange={() => setFormData({ ...formData, hasSmartphone: false })} />
                        <span className="text-sm text-[var(--color-on-surface)]">No</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-[var(--color-surface-container-lowest)] px-4 py-3 rounded-xl border border-[var(--color-border-subtle)]">
                    <span className="text-sm text-[var(--color-on-surface)]">Comfortable using Google Maps?</span>
                    <div className="flex gap-2">
                      <label className={`flex items-center gap-1 px-4 py-2 rounded-lg border cursor-pointer ${formData.comfortableGoogleMaps === true ? 'border-[var(--color-primary)] bg-red-50' : 'border-[var(--color-border-subtle)]'}`}>
                        <input type="radio" name="maps" className="accent-[var(--color-primary)] hidden" checked={formData.comfortableGoogleMaps === true} onChange={() => setFormData({ ...formData, comfortableGoogleMaps: true })} />
                        <span className="text-sm text-[var(--color-on-surface)]">Yes</span>
                      </label>
                      <label className={`flex items-center gap-1 px-4 py-2 rounded-lg border cursor-pointer ${formData.comfortableGoogleMaps === false ? 'border-[var(--color-primary)] bg-red-50' : 'border-[var(--color-border-subtle)]'}`}>
                        <input type="radio" name="maps" className="accent-[var(--color-primary)] hidden" checked={formData.comfortableGoogleMaps === false} onChange={() => setFormData({ ...formData, comfortableGoogleMaps: false })} />
                        <span className="text-sm text-[var(--color-on-surface)]">No</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 8: Verification */}
              <div className="bg-[var(--color-surface-subtle)] rounded-xl p-4">
                <h3 className="text-sm font-bold text-[var(--color-on-surface)] mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[var(--color-primary)]">verified_user</span>
                  ID Verification
                </h3>
                <div>
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]">Upload Aadhaar Card *</label>
                  <input type="file" required accept="image/*,.pdf" className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)] text-sm" onChange={(e) => setFormData({ ...formData, aadhaarCardUrl: e.target.files?.[0] || null })} />
                  <p className="text-xs text-[var(--color-outline-variant)] mt-1">Accepted formats: JPG, PNG, PDF</p>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:bg-[#a40017] transition-colors disabled:opacity-50">
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Status Check Modal */}
      {showStatusCheck && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
              <h3 className="text-xl font-black text-[var(--color-on-surface)]">Check Your Status</h3>
              <button 
                onClick={() => { setShowStatusCheck(false); setFoundStatus(null); setStatusPhone(""); }}
                className="w-10 h-10 bg-[var(--color-surface-subtle)] rounded-full flex items-center justify-center hover:bg-[var(--color-surface-container)] transition-colors"
              >
                <span className="material-symbols-outlined text-[var(--color-outline)]">close</span>
              </button>
            </div>
            <div className="p-8">
              {!foundStatus ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl">fact_check</span>
                    </div>
                    <p className="text-[var(--color-on-surface-variant)]">Enter the phone number you used during application to track your progress.</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-outline-variant)] uppercase tracking-widest mb-2 block">Phone Number</label>
                    <input 
                      type="tel" 
                      value={statusPhone}
                      onChange={(e) => setStatusPhone(e.target.value)}
                      placeholder="e.g., 9876543210" 
                      className="w-full px-5 py-4 bg-[var(--color-surface-subtle)] border-2 border-[var(--color-border-subtle)] rounded-2xl focus:border-[var(--color-primary)] outline-none transition-all text-lg font-bold"
                    />
                  </div>
                  <button 
                    onClick={checkStatus}
                    disabled={checkingStatus || statusPhone.length < 10}
                    className="w-full py-4 bg-[var(--color-primary)] text-white font-bold rounded-2xl shadow-xl shadow-[var(--color-primary)]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    {checkingStatus ? "Checking..." : "Track My Application"}
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-6 animate-fade-in">
                  <div className="w-20 h-20 bg-[var(--color-surface-subtle)] rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-white shadow-lg overflow-hidden">
                    <div className={`w-full h-full flex items-center justify-center ${getStatusColor(foundStatus.status)}`}>
                      <span className="material-symbols-outlined text-4xl">
                        {foundStatus.status === 'hired' ? 'verified' : foundStatus.status === 'reviewed' ? 'visibility' : 'pending_actions'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-[var(--color-on-surface)]">Hi, {foundStatus.name.split(' ')[0]}!</h4>
                    <p className="text-[var(--color-outline)] text-sm mt-1">Your application status is:</p>
                  </div>
                  <div className={`inline-block px-8 py-3 rounded-2xl text-lg font-black uppercase tracking-widest ${getStatusColor(foundStatus.status)}`}>
                    {foundStatus.status}
                  </div>
                  <p className="text-[var(--color-outline)] text-sm px-4">
                    {foundStatus.status === 'hired' 
                      ? "Congratulations! Our team will contact you shortly for onboarding details." 
                      : foundStatus.status === 'reviewed'
                      ? "Your application has been reviewed. We'll be in touch soon for the next steps."
                      : "We've received your application and it's currently under review. Please check back later."}
                  </p>
                  <button 
                    onClick={() => setFoundStatus(null)}
                    className="text-[var(--color-primary)] font-bold text-sm hover:underline pt-4 block w-full"
                  >
                    Check another number
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}