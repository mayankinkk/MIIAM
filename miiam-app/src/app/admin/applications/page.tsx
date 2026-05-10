"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type JobApplication = {
  id: string;
  full_name: string;
  phone_number: string;
  email: string;
  passport_picture: string | null;
  age_or_dob: string;
  gender: string | null;
  current_address: string;
  city: string;
  pincode: string;
  landmark: string | null;
  vehicle_type: string;
  vehicle_number: string | null;
  driving_license_number: string | null;
  driving_license_url: string | null;
  rc_url: string | null;
  work_type: string;
  preferred_area: string;
  available_morning: boolean;
  available_afternoon: boolean;
  available_night: boolean;
  work_monday: boolean;
  work_tuesday: boolean;
  work_wednesday: boolean;
  work_thursday: boolean;
  work_friday: boolean;
  work_saturday: boolean;
  work_sunday: boolean;
  has_delivery_experience: boolean | null;
  previous_platform: string | null;
  has_smartphone: boolean | null;
  comfortable_google_maps: boolean | null;
  aadhaar_card_url: string | null;
  status: string;
  created_at: string;
};

export default function AdminApplicationsPage() {
  const supabase = createClient();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);

  const loadApplications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("job_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setApplications(data);
    setLoading(false);
  }

  useEffect(() => {
    const fetchApplications = async () => {
      const { data } = await supabase
        .from("job_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setApplications(data);
      setLoading(false);
    };
    fetchApplications();
  }, [supabase]);

  async function updateStatus(id: string, status: string) {
    await supabase.from("job_applications").update({ status }).eq("id", id);
    loadApplications();
  }

  async function deleteApplication(id: string) {
    if (!confirm("Delete this application?")) return;
    await supabase.from("job_applications").delete().eq("id", id);
    loadApplications();
  }

  const filteredApps = filter === "all" 
    ? applications 
    : applications.filter(a => a.status === filter);

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    reviewed: applications.filter(a => a.status === "reviewed").length,
    hired: applications.filter(a => a.status === "hired").length,
  };

  if (loading) return <div className="px-8 py-12">Loading applications...</div>;

  return (
    <div className="px-8 py-12 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-800">Job Applications</h1>
        <button 
          onClick={loadApplications}
          className="text-sm font-bold text-[#ba001c] hover:underline"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Applications", value: stats.total, color: "bg-slate-800", icon: "assignments" },
          { label: "Pending", value: stats.pending, color: "bg-amber-500", icon: "pending" },
          { label: "Reviewed", value: stats.reviewed, color: "bg-blue-500", icon: "fact_check" },
          { label: "Hired", value: stats.hired, color: "bg-green-500", icon: "check_circle" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
              <span className="material-symbols-outlined text-white">{stat.icon}</span>
            </div>
            <p className="text-2xl font-black text-slate-800">{stat.value}</p>
            <p className="text-xs font-bold text-slate-400 uppercase">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {["all", "pending", "reviewed", "hired"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-full font-bold text-sm capitalize ${
              filter === status 
                ? "bg-[#ba001c] text-white" 
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left text-xs font-bold text-slate-400 uppercase px-6 py-4">Applicant</th>
                <th className="text-left text-xs font-bold text-slate-400 uppercase px-6 py-4">Contact</th>
                <th className="text-left text-xs font-bold text-slate-400 uppercase px-6 py-4">Position</th>
                <th className="text-left text-xs font-bold text-slate-400 uppercase px-6 py-4">Vehicle</th>
                <th className="text-left text-xs font-bold text-slate-400 uppercase px-6 py-4">Applied</th>
                <th className="text-left text-xs font-bold text-slate-400 uppercase px-6 py-4">Status</th>
                <th className="text-left text-xs font-bold text-slate-400 uppercase px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No applications found
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{app.full_name}</p>
                      <p className="text-xs text-slate-400">{app.age_or_dob} • {app.gender}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{app.phone_number}</p>
                      <p className="text-xs text-slate-400">{app.city}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800">{app.work_type}</span>
                      <p className="text-xs text-slate-400">{app.preferred_area}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{app.vehicle_type}</p>
                      {app.vehicle_number && (
                        <p className="text-xs text-slate-400">{app.vehicle_number}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">
                        {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={app.status}
                        onChange={(e) => updateStatus(app.id, e.target.value)}
                        className={`text-xs font-bold px-3 py-1 rounded-full border-0 cursor-pointer ${
                          app.status === "pending" 
                            ? "bg-amber-100 text-amber-700" 
                            : app.status === "reviewed"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="hired">Hired</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="text-xs font-bold text-[#ba001c] hover:underline"
                        >
                          View
                        </button>
                        <button
                          onClick={() => deleteApplication(app.id)}
                          className="text-xs font-bold text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Application Details</h2>
              <button
                onClick={() => setSelectedApp(null)}
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Full Name</p>
                    <p className="font-semibold">{selectedApp.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Phone</p>
                    <p className="font-semibold">{selectedApp.phone_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Email</p>
                    <p className="font-semibold">{selectedApp.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Passport Picture</p>
                    {selectedApp.passport_picture ? (
                      <a href={selectedApp.passport_picture} target="_blank" className="text-[#ba001c] text-sm underline">View</a>
                    ) : <span className="text-slate-400">Not uploaded</span>}
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Age/DOB</p>
                    <p className="font-semibold">{selectedApp.age_or_dob}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Gender</p>
                    <p className="font-semibold">{selectedApp.gender || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Address</p>
                    <p className="font-semibold">{selectedApp.current_address}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">City, Pincode</p>
                    <p className="font-semibold">{selectedApp.city}, {selectedApp.pincode}</p>
                  </div>
                </div>
              </div>

              {/* Vehicle */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Vehicle Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Vehicle Type</p>
                    <p className="font-semibold">{selectedApp.vehicle_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Vehicle Number</p>
                    <p className="font-semibold">{selectedApp.vehicle_number || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">License Number</p>
                    <p className="font-semibold">{selectedApp.driving_license_number || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">License</p>
                    {selectedApp.driving_license_url ? (
                      <a href={selectedApp.driving_license_url} target="_blank" className="text-[#ba001c] text-sm underline">View</a>
                    ) : <span className="text-slate-400">Not uploaded</span>}
                  </div>
                </div>
              </div>

              {/* Work Preferences */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Work Preferences</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Work Type</p>
                    <p className="font-semibold">{selectedApp.work_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Preferred Area</p>
                    <p className="font-semibold">{selectedApp.preferred_area}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Time Slots</p>
                    <p className="font-semibold">
                      {[selectedApp.available_morning && "Morning", selectedApp.available_afternoon && "Afternoon", selectedApp.available_night && "Night"].filter(Boolean).join(", ") || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Working Days</p>
                    <p className="font-semibold">
                      {[selectedApp.work_monday && "Mon", selectedApp.work_tuesday && "Tue", selectedApp.work_wednesday && "Wed", selectedApp.work_thursday && "Thu", selectedApp.work_friday && "Fri", selectedApp.work_saturday && "Sat", selectedApp.work_sunday && "Sun"].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Experience & Device */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Experience & Device</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Delivery Experience</p>
                    <p className="font-semibold">{selectedApp.has_delivery_experience ? `Yes${selectedApp.previous_platform ? ` - ${selectedApp.previous_platform}` : ""}` : "No"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Smartphone</p>
                    <p className="font-semibold">{selectedApp.has_smartphone === true ? "Yes" : selectedApp.has_smartphone === false ? "No" : "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Google Maps</p>
                    <p className="font-semibold">{selectedApp.comfortable_google_maps === true ? "Yes" : selectedApp.comfortable_google_maps === false ? "No" : "-"}</p>
                  </div>
                </div>
              </div>

              {/* ID Verification */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-700 mb-4">ID Verification</h3>
                <div>
                  <p className="text-xs text-slate-400">Aadhaar Card</p>
                  {selectedApp.aadhaar_card_url ? (
                    <a href={selectedApp.aadhaar_card_url} target="_blank" className="text-[#ba001c] text-sm underline">View</a>
                  ) : <span className="text-slate-400">Not uploaded</span>}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <button
                  onClick={() => { updateStatus(selectedApp.id, "reviewed"); setSelectedApp(null); }}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"
                >
                  Mark Reviewed
                </button>
                <button
                  onClick={() => { updateStatus(selectedApp.id, "hired"); setSelectedApp(null); }}
                  className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700"
                >
                  Mark Hired
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}