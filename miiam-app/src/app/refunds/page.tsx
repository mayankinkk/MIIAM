"use client";

import { useState } from "react";
import Link from "next/link";

export default function RefundsPage() {
  const [activeSection, setActiveSection] = useState<string>("overview");

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "food", label: "Food Orders" },
    { id: "services", label: "Home Services" },
    { id: "timing", label: "Cancellation Timing" },
    { id: "timeline", label: "Processing Time" },
    { id: "howto", label: "How to Request" },
    { id: "wallet", label: "Wallet Credits" },
    { id: "disputes", label: "Disputes" },
    { id: "fraud", label: "Fraud Policy" },
    { id: "contact", label: "Contact" },
  ];

  return (
    <div className="min-h-screen bg-[#fff4f4]">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#ba001c] rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-xl">M</span>
              </div>
              <span className="text-xl font-black text-[#4d212a]">MIIAM</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="text-sm font-medium text-slate-600 hover:text-[#ba001c]">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-sm font-medium text-slate-600 hover:text-[#ba001c]">
                Privacy Policy
              </Link>
              <Link href="/" className="px-4 py-2 bg-[#ba001c] text-white rounded-lg text-sm font-bold hover:opacity-90">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24">
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? "bg-[#ba001c] text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9 mt-8 lg:mt-0">
            <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 lg:p-10">
              <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-4xl text-[#ba001c]">attach_money</span>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#4d212a]">Refund Policy</h1>
                  <p className="text-slate-500 text-sm mt-1">Last updated: May 2026</p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Overview */}
                <section id="overview">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">1. Overview</h2>
                  <p className="text-slate-600 leading-relaxed">
                    At MIIAM, we want every order and service booking to meet your expectations. If something goes wrong, we're committed to making it right. This policy explains when and how you can request a refund for food orders, home services, and other transactions made on the MIIAM platform.
                  </p>
                </section>

                {/* Food & Grocery Orders */}
                <section id="food">
                  <h2 className="text-xl font-bold text-[#ba001c] mb-4">2. Food & Grocery Orders</h2>
                  <div className="space-y-4 text-slate-600">
                    <p><strong className="text-slate-800">2.1 Eligible for full refund:</strong></p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Your order was never picked up or delivered</li>
                      <li>The wrong items were delivered</li>
                      <li>Items were missing from your order</li>
                      <li>The food was in an unacceptable condition (spoiled, contaminated, or severely different from description)</li>
                      <li>The restaurant cancelled your order after payment</li>
                    </ul>
                    
                    <p className="mt-4"><strong className="text-slate-800">2.2 Eligible for partial refund:</strong></p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Some items in your order were missing or incorrect</li>
                      <li>Quality was below standard for specific items but not the entire order</li>
                    </ul>
                    
                    <p className="mt-4"><strong className="text-slate-800">2.3 Not eligible for refund:</strong></p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>You ordered the wrong item by mistake</li>
                      <li>You changed your mind after the order was confirmed</li>
                      <li>The delivery was delayed but the food was delivered in acceptable condition</li>
                      <li>The complaint is raised more than 24 hours after delivery</li>
                    </ul>
                  </div>
                </section>

                {/* Home Services */}
                <section id="services">
                  <h2 className="text-xl font-bold text-[#ba001c] mb-4">3. Home Services</h2>
                  <div className="space-y-4 text-slate-600">
                    <p><strong className="text-slate-800">3.1 Eligible for full refund:</strong></p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>You cancelled the booking at least 2 hours before the scheduled time</li>
                      <li>The assigned professional did not show up</li>
                      <li>The service was not started due to a MIIAM-side issue</li>
                    </ul>
                    
                    <p className="mt-4"><strong className="text-slate-800">3.2 Eligible for partial refund:</strong></p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>The work was incomplete due to the professional's fault</li>
                      <li>The service quality was significantly below the described standard</li>
                    </ul>
                    
                    <p className="mt-4"><strong className="text-slate-800">3.3 Not eligible for refund:</strong></p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Cancellation made less than 1 hour before the scheduled time</li>
                      <li>Service was completed and accepted by you at the time</li>
                      <li>Dissatisfaction arising from a change of mind after work was completed</li>
                    </ul>
                  </div>
                </section>

                {/* Cancellation Timing */}
                <section id="timing">
                  <h2 className="text-xl font-bold text-[#ba001c] mb-4">4. Cancellation Timing & Refunds</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-[#ba001c]/20 text-sm">
                      <thead className="bg-[#ba001c]">
                        <tr>
                          <th className="p-3 text-left text-white font-bold">Scenario</th>
                          <th className="p-3 text-left text-white font-bold">Refund</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td className="p-3 border-b border-[#ba001c]/10">Before restaurant accepts</td><td className="p-3 border-b border-[#ba001c]/10 font-bold text-green-600">100%</td></tr>
                        <tr><td className="p-3 border-b border-[#ba001c]/10">After acceptance, before preparation</td><td className="p-3 border-b border-[#ba001c]/10 font-bold text-green-600">100%</td></tr>
                        <tr><td className="p-3 border-b border-[#ba001c]/10">After preparation began</td><td className="p-3 border-b border-[#ba001c]/10 font-bold text-red-600">No refund</td></tr>
                        <tr><td className="p-3 border-b border-[#ba001c]/10">After rider picked up</td><td className="p-3 border-b border-[#ba001c]/10 font-bold text-red-600">No refund</td></tr>
                        <tr><td className="p-3 border-b border-[#ba001c]/10">Service — 2+ hours before</td><td className="p-3 border-b border-[#ba001c]/10 font-bold text-green-600">100%</td></tr>
                        <tr><td className="p-3 border-b border-[#ba001c]/10">Service — 1-2 hours before</td><td className="p-3 border-b border-[#ba001c]/10 font-bold text-amber-600">50%</td></tr>
                        <tr><td className="p-3 border-b border-[#ba001c]/10">Service — under 1 hour</td><td className="p-3 border-b border-[#ba001c]/10 font-bold text-red-600">No refund</td></tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Processing Timeline */}
                <section id="timeline">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">5. Payment Method Refund Timelines</h2>
                  <ul className="list-disc pl-6 space-y-2 text-slate-600">
                    <li><strong>MIIAM Wallet</strong> — Instant (within minutes)</li>
                    <li><strong>UPI (GPay, PhonePe, Paytm)</strong> — 2-3 business days</li>
                    <li><strong>Debit / Credit Card</strong> — 5-7 business days</li>
                    <li><strong>Net Banking</strong> — 3-5 business days</li>
                    <li><strong>Cash on Delivery</strong> — Refunded to MIIAM Wallet only</li>
                  </ul>
                </section>

                {/* How to Request */}
                <section id="howto">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">6. How to Request a Refund</h2>
                  <ul className="list-disc pl-6 space-y-2 text-slate-600">
                    <li>Go to My Orders in the app → select the order → tap Report an Issue</li>
                    <li>Chat with us via the Help section in the app</li>
                    <li>Email us at support@miiam.in with your order ID and issue description</li>
                    <li>WhatsApp us at +91-XXXXXXXXXX</li>
                  </ul>
                  <p className="mt-4 text-slate-500 text-sm">
                    All refund requests for food orders must be raised within 24 hours of delivery. For home services, raise the issue within 48 hours of service completion.
                  </p>
                </section>

                {/* Wallet Credits */}
                <section id="wallet">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">7. MIIAM Wallet Credits</h2>
                  <ul className="list-disc pl-6 space-y-2 text-slate-600">
                    <li>Valid for 90 days from the date of issue</li>
                    <li>Can be used on any order or service booking on MIIAM</li>
                    <li>Cannot be transferred or withdrawn as cash</li>
                    <li>Are non-refundable once applied to an order</li>
                  </ul>
                </section>

                {/* Disputes */}
                <section id="disputes">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">8. Disputes & Escalations</h2>
                  <p className="text-slate-600">
                    If you are not satisfied with the resolution of your refund request, you may escalate by emailing grievance@miiam.in. Our Grievance Officer will respond within 5 business days. MIIAM's decision after escalation review shall be final.
                  </p>
                </section>

                {/* Fraud */}
                <section id="fraud">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">9. Fraud & Misuse</h2>
                  <p className="text-slate-600">
                    MIIAM reserves the right to deny refund requests and suspend accounts if we detect a pattern of misuse, including but not limited to repeated false complaints, manipulation of the refund system, or fraudulent claims. We use order data, photos, and rider GPS logs to verify complaints.
                  </p>
                </section>

                {/* Contact */}
                <section id="contact">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">10. Contact</h2>
                  <div className="bg-slate-50 rounded-xl p-6">
                    <p className="text-slate-600 mb-4">For any questions about refunds, please contact us:</p>
                    <div className="space-y-2 text-slate-700">
                      <p><strong>MIIAM Technologies Pvt. Ltd.</strong></p>
                      <p>Guwahati, Assam — 781001</p>
                      <p>Email: support@miiam.in</p>
                      <p>Grievance: grievance@miiam.in</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ba001c]">M</span>
              <span className="font-bold text-slate-600">MIIAM Technologies Pvt. Ltd.</span>
            </div>
            <div className="flex gap-6">
              <Link href="/terms" className="text-sm text-slate-500 hover:text-[#ba001c]">Terms of Service</Link>
              <Link href="/privacy" className="text-sm text-slate-500 hover:text-[#ba001c]">Privacy Policy</Link>
              <Link href="/refunds" className="text-sm text-slate-500 hover:text-[#ba001c]">Refund Policy</Link>
            </div>
            <p className="text-sm text-slate-400">© 2026 MIIAM. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}