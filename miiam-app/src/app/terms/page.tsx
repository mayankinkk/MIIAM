"use client";

import { useState } from "react";
import Link from "next/link";

export default function TermsOfService() {
  const [activeSection, setActiveSection] = useState<string>("introduction");

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const sections = [
    { id: "introduction", label: "Introduction" },
    { id: "acceptance", label: "Acceptance of Terms" },
    { id: "eligibility", label: "Eligibility" },
    { id: "accounts", label: "User Accounts" },
    { id: "services", label: "Our Services" },
    { id: "payment", label: "Payments & Pricing" },
    { id: "obligations", label: "User Obligations" },
    { id: "intellectual", label: "Intellectual Property" },
    { id: "termination", label: "Termination" },
    { id: "liability", label: "Limitation of Liability" },
    { id: "indemnification", label: "Indemnification" },
    { id: "governing", label: "Governing Law" },
    { id: "dpdp", label: "DPDP Act 2023 Compliance" },
    { id: "contact", label: "Contact Us" },
  ];

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* Header */}
      <header className="bg-surface-container border-b border-outline-variant/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-xl">M</span>
              </div>
              <span className="text-xl font-black text-on-background">MIIAM</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/" className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold hover:bg-primary/95 transition-all">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24">
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? "bg-primary text-on-primary"
                        : "text-on-surface-variant hover:bg-surface-container-high"
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
            <div className="bg-surface-container border border-outline-variant/10 rounded-2xl shadow-sm p-6 sm:p-8 lg:p-10">
              <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-4xl text-primary">description</span>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-on-background">Terms of Service</h1>
                  <p className="text-on-surface-variant/70 text-sm mt-1">Last updated: May 2025</p>
                </div>
              </div>

              <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                {/* Introduction */}
                <section id="introduction" className="scroll-mt-20">
                  <h2 className="text-xl font-bold text-on-background mb-4">1. Introduction</h2>
                  <p className="text-on-surface-variant leading-relaxed">
                    Welcome to MIIAM ("we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of the MIIAM mobile application, website, and related services (collectively, the "Platform"). MIIAM is a technology platform that connects users with local vendors, delivery riders, and service providers across food delivery, grocery, pharmacy, beauty, and various on-demand services.
                  </p>
                  <p className="text-on-surface-variant leading-relaxed mt-4">
                    By accessing or using our Platform, you agree to be bound by these Terms. If you disagree with any part of these Terms, you may not access our Platform.
                  </p>
                </section>

                {/* Acceptance of Terms */}
                <section id="acceptance" className="scroll-mt-20">
                  <h2 className="text-xl font-bold text-on-background mb-4">2. Acceptance of Terms</h2>
                  <p className="text-on-surface-variant leading-relaxed">
                    By creating an account, placing an order, or using any feature of the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. You also agree to comply with all applicable laws and regulations.
                  </p>
                </section>

                {/* Eligibility */}
                <section id="eligibility" className="scroll-mt-20">
                  <h2 className="text-xl font-bold text-on-background mb-4">3. Eligibility</h2>
                  <p className="text-on-surface-variant leading-relaxed">
                    You must be at least 18 years of age to use our Platform. By using MIIAM, you represent and warrant that you meet this eligibility requirement. If you are using the Platform on behalf of a business, you represent that you have the authority to bind that business to these Terms.
                  </p>
                </section>

                {/* User Accounts */}
                <section id="accounts" className="scroll-mt-20">
                  <h2 className="text-xl font-bold text-on-background mb-4">4. User Accounts</h2>
                  <div className="space-y-4 text-on-surface-variant leading-relaxed">
                    <p><strong>4.1 Account Registration:</strong> To access certain features, you must register an account by providing accurate and complete information, including your phone number, email address, and location.</p>
                    <p><strong>4.2 Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.</p>
                    <p><strong>4.3 Phone Verification:</strong> We require phone number verification via OTP (One-Time Password) to create an account and verify your identity for security purposes.</p>
                    <p><strong>4.4 Location Services:</strong> To provide delivery services, we collect your location data. You agree to share your location to enable order tracking and delivery.</p>
                  </div>
                </section>

                {/* Our Services */}
                <section id="services" className="scroll-mt-20">
                  <h2 className="text-xl font-bold text-on-background mb-4">5. Our Services</h2>
                  <div className="space-y-4 text-on-surface-variant leading-relaxed">
                    <p>MIIAM provides a digital marketplace connecting users with:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Food Delivery:</strong> Orders from restaurants, cloud kitchens, and food outlets</li>
                      <li><strong>Grocery Delivery:</strong> Fresh produce, daily essentials, and household items</li>
                      <li><strong>Pharmacy:</strong> Medicines and health products with prescription upload capability</li>
                      <li><strong>Beauty & Personal Care:</strong> Salon services, beauty products, and at-home treatments</li>
                      <li><strong>On-Demand Services:</strong> Home cleaning, AC repair, plumbing, electrical, and pest control</li>
                      <li><strong>Flowers & Gifts:</strong> Flower arrangements, gift baskets, and special occasion items</li>
                    </ul>
                    <p className="mt-4">We act as an intermediary platform and do not own or operate the vendors, riders, or service providers listed on our Platform.</p>
                  </div>
                </section>

                {/* Payments & Pricing */}
                <section id="payment" className="scroll-mt-20">
                  <h2 className="text-xl font-bold text-on-background mb-4">6. Payments & Pricing</h2>
                  <div className="space-y-4 text-on-surface-variant leading-relaxed">
                    <p><strong>6.1 Payment Methods:</strong> We accept various payment methods including credit/debit cards, UPI, net banking, wallet payments, and cash on delivery.</p>
                    <p><strong>6.2 Pricing:</strong> Prices are determined by vendors and may include item prices, packing charges, delivery fees, and applicable taxes. Delivery fees vary based on distance and demand.</p>
                    <p><strong>6.3 Wallet:</strong> MIIAM Wallet credits are non-refundable unless required by applicable law.</p>
                    <p><strong>6.4 Refunds:</strong> Refunds are processed for cancelled orders or quality issues. See Section 11 (Refund Policy) for details.</p>
                  </div>
                </section>

                {/* User Obligations */}
                <section id="obligations" className="scroll-mt-20">
                  <h2 className="text-xl font-bold text-on-background mb-4">7. User Obligations</h2>
                  <div className="space-y-4 text-on-surface-variant leading-relaxed">
                    <p>You agree to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Provide accurate and current information</li>
                      <li>Not use the Platform for any unlawful purpose</li>
                      <li>Not attempt to gain unauthorized access to any part of the Platform</li>
                      <li>Not interfere with the proper working of the Platform</li>
                      <li>Not place fraudulent or fake orders</li>
                      <li>Not harass, abuse, or harm any vendor, rider, or other user</li>
                      <li>Comply with all applicable laws including the Digital Personal Data Protection Act, 2023</li>
                    </ul>
                  </div>
                </section>

                {/* Intellectual Property */}
                <section id="intellectual" className="scroll-mt-20">
                  <h2 className="text-xl font-bold text-on-background mb-4">8. Intellectual Property</h2>
                  <p className="text-on-surface-variant leading-relaxed">
                    All content, features, and functionality of the Platform, including logos, trademarks, and software, are owned by MIIAM Technologies Pvt. Ltd. and are protected by Indian and international copyright, trademark, and other intellectual property laws. You may not copy, reproduce, distribute, or create derivative works without our prior written consent.
                  </p>
                </section>

                {/* Termination */}
                <section id="termination" className="scroll-mt-20">
                  <h2 className="text-xl font-bold text-on-background mb-4">9. Termination</h2>
                  <p className="text-on-surface-variant leading-relaxed">
                    We reserve the right to suspend or terminate your account at any time for violation of these Terms, suspicious activity, or upon legal request. You may delete your account at any time through the app settings. Upon termination, all rights granted to you under these Terms will immediately cease.
                  </p>
                </section>

                {/* Limitation of Liability */}
                <section id="liability" className="scroll-mt-20">
                  <h2 className="text-xl font-bold text-on-background mb-4">10. Limitation of Liability</h2>
                  <p className="text-on-surface-variant leading-relaxed">
                    MIIAM shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the Platform. Our total liability shall not exceed the amount paid by you for the specific order in question. We are not liable for any issues with vendors, riders, or third-party service providers.
                  </p>
                </section>

                {/* Refund Policy */}
                <section id="refund" className="scroll-mt-20">
                  <h2 className="text-xl font-bold text-on-background mb-4">11. Refund Policy</h2>
                  <div className="space-y-6 text-on-surface-variant leading-relaxed">
                    <p>At MIIAM, we want every order and service booking to meet your expectations. If something goes wrong, we're committed to making it right.</p>
                    
                    <h3 className="text-lg font-bold text-on-surface mt-6">2. Food & Grocery Orders</h3>
                    <p><strong>2.1 Eligible for full refund:</strong></p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Your order was never picked up or delivered</li>
                      <li>The wrong items were delivered</li>
                      <li>Items were missing from your order</li>
                      <li>The food was in an unacceptable condition (spoiled, contaminated, or severely different from description)</li>
                      <li>The restaurant cancelled your order after payment</li>
                    </ul>
                    
                    <p><strong>2.2 Eligible for partial refund:</strong></p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Some items in your order were missing or incorrect</li>
                      <li>Quality was below standard for specific items but not the entire order</li>
                    </ul>
                    
                    <p><strong>2.3 Not eligible for refund:</strong></p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>You ordered the wrong item by mistake</li>
                      <li>You changed your mind after the order was confirmed</li>
                      <li>The delivery was delayed but the food was delivered in acceptable condition</li>
                      <li>The complaint is raised more than 24 hours after delivery</li>
                    </ul>
                    
                    <h3 className="text-lg font-bold text-on-surface mt-6">3. Home Services</h3>
                    <p><strong>3.1 Eligible for full refund:</strong></p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>You cancelled the booking at least 2 hours before the scheduled time</li>
                      <li>The assigned professional did not show up</li>
                      <li>The service was not started due to a MIIAM-side issue</li>
                    </ul>
                    
                    <p><strong>3.2 Eligible for partial refund:</strong></p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>The work was incomplete due to the professional's fault</li>
                      <li>The service quality was significantly below the described standard</li>
                    </ul>
                    
                    <p><strong>3.3 Not eligible for refund:</strong></p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Cancellation made less than 1 hour before the scheduled time</li>
                      <li>Service was completed and accepted by you at the time</li>
                      <li>Dissatisfaction arising from a change of mind after work was completed</li>
                    </ul>
                    
                    <h3 className="text-lg font-bold text-primary mt-6">4. Cancellation Timing & Refunds</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-primary/20 text-sm text-on-surface">
                        <thead className="bg-primary">
                          <tr>
                            <th className="p-3 text-left text-on-primary font-bold">Scenario</th>
                            <th className="p-3 text-left text-on-primary font-bold">Refund</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr><td className="p-3 border-b border-outline-variant/10">Before restaurant accepts</td><td className="p-3 border-b border-outline-variant/10 font-bold text-green-600">100%</td></tr>
                          <tr><td className="p-3 border-b border-outline-variant/10">After acceptance, before preparation</td><td className="p-3 border-b border-outline-variant/10 font-bold text-green-600">100%</td></tr>
                          <tr><td className="p-3 border-b border-outline-variant/10">After preparation began</td><td className="p-3 border-b border-outline-variant/10 font-bold text-red-600">No refund</td></tr>
                          <tr><td className="p-3 border-b border-outline-variant/10">After rider picked up</td><td className="p-3 border-b border-outline-variant/10 font-bold text-red-600">No refund</td></tr>
                          <tr><td className="p-3 border-b border-outline-variant/10">Service — 2+ hours before</td><td className="p-3 border-b border-outline-variant/10 font-bold text-green-600">100%</td></tr>
                          <tr><td className="p-3 border-b border-outline-variant/10">Service — 1-2 hours before</td><td className="p-3 border-b border-outline-variant/10 font-bold text-amber-600">50%</td></tr>
                          <tr><td className="p-3 border-b border-outline-variant/10">Service — under 1 hour</td><td className="p-3 border-b border-outline-variant/10 font-bold text-red-600">No refund</td></tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <h3 className="text-lg font-bold text-on-surface mt-6">5. Refund Processing Timeline</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li><strong>MIIAM Wallet:</strong> Instant (within minutes)</li>
                      <li><strong>UPI (GPay, PhonePe, Paytm):</strong> 2-3 business days</li>
                      <li><strong>Debit / Credit Card:</strong> 5-7 business days</li>
                      <li><strong>Net Banking:</strong> 3-5 business days</li>
                      <li><strong>Cash on Delivery:</strong> Refunded to MIIAM Wallet only</li>
                    </ul>
                    
                    <h3 className="text-lg font-bold text-on-surface mt-6">6. How to Request a Refund</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Go to My Orders → select order → tap Report an Issue</li>
                      <li>Chat with us via Help section in the app</li>
                      <li>Email support@miiam.in with order ID and issue description</li>
                    </ul>
                    <p className="mt-2">Refund requests for food orders must be raised within 24 hours of delivery. For home services, raise within 48 hours of service completion.</p>
                    
                    <h3 className="text-lg font-bold text-on-surface mt-6">7. MIIAM Wallet Credits</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Valid for 90 days from date of issue</li>
                      <li>Can be used on any order or service booking</li>
                      <li>Cannot be transferred or withdrawn as cash</li>
                      <li>Non-refundable once applied to an order</li>
                    </ul>
                    
                    <h3 className="text-lg font-bold text-on-surface mt-6">8. Disputes & Escalations</h3>
                    <p>Escalate by emailing grievance@miiam.in. Our Grievance Officer will respond within 5 business days. MIIAM's decision after escalation review shall be final.</p>
                    
                    <h3 className="text-lg font-bold text-on-surface mt-6">9. Fraud & Misuse</h3>
                    <p>MIIAM reserves the right to deny refund requests and suspend accounts if we detect a pattern of misuse, including repeated false complaints, manipulation of the refund system, or fraudulent claims.</p>
                  </div>
                </section>

                {/* Cookie Policy */}
                <section id="cookies" className="scroll-mt-20">
                  <h2 className="text-xl font-bold text-on-background mb-4">12. Cookie Policy</h2>
                  <div className="space-y-4 text-on-surface-variant leading-relaxed">
                    <p>We use cookies and similar tracking technologies to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Keep you logged in and remember your preferences</li>
                      <li>Analyze traffic and improve our services</li>
                      <li>Personalize content and advertisements</li>
                      <li>Provide location-based services</li>
                    </ul>
                    <p className="mt-4">You can manage cookie preferences in your browser settings. Disabling cookies may affect some Platform features.</p>
                  </div>
                </section>

                {/* Indemnification */}
                <section id="indemnification" className="scroll-mt-20">
                  <h2 className="text-xl font-bold text-on-background mb-4">13. Indemnification</h2>
                  <p className="text-on-surface-variant leading-relaxed">
                    You agree to indemnify, defend, and hold harmless MIIAM and its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising out of your violation of these Terms or your use of the Platform.
                  </p>
                </section>

                {/* Governing Law */}
                <section id="governing" className="scroll-mt-20">
                  <h2 className="text-xl font-bold text-on-background mb-4">14. Governing Law & Dispute Resolution</h2>
                  <div className="space-y-4 text-on-surface-variant leading-relaxed">
                    <p>These Terms shall be governed by and construed in accordance with the laws of India.</p>
                    <p>Any dispute arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka, India.</p>
                    <p>For any complaints or grievances, please contact our Grievance Officer.</p>
                  </div>
                </section>

                {/* DPDP Act 2023 Compliance */}
                <section id="dpdp" className="scroll-mt-20">
                  <h2 className="text-xl font-bold text-on-background mb-4">15. Digital Personal Data Protection Act, 2023 Compliance</h2>
                  <div className="space-y-4 text-on-surface-variant leading-relaxed">
                    <p>MIIAM is committed to complying with the Digital Personal Data Protection Act, 2023 ("DPDP Act") of India. This section outlines our data protection commitments:</p>
                    
                    <p><strong>15.1 Lawful Basis:</strong> We process your personal data based on your consent, contractual necessity, and legitimate interests.</p>
                    
                    <p><strong>15.2 Data Collection:</strong> We collect personal data including:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Identity details (name, phone, email)</li>
                      <li>Location data for delivery</li>
                      <li>Payment information</li>
                      <li>Order history and preferences</li>
                      <li>Device and usage data</li>
                    </ul>
                    
                    <p><strong>15.3 Purpose Limitation:</strong> Your data is used only for:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Providing and improving our services</li>
                      <li>Order fulfillment and delivery</li>
                      <li>Customer support</li>
                      <li>Analytics and personalization</li>
                      <li>Legal compliance</li>
                    </ul>
                    
                    <p><strong>15.4 Data Retention:</strong> We retain personal data only as long as necessary for the purposes outlined, or as required by law.</p>
                    
                    <p><strong>15.5 Your Rights (under DPDP Act):</strong></p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Right to Access:</strong> You can request access to your personal data</li>
                      <li><strong>Right to Correction:</strong> You can request correction of inaccurate data</li>
                      <li><strong>Right to Erasure:</strong> You can request deletion of your personal data ("right to be forgotten")</li>
                      <li><strong>Right to Portability:</strong> You can request your data in a portable format</li>
                      <li><strong>Right to Grievance:</strong> You can file complaints with our Grievance Officer or the Data Protection Board</li>
                    </ul>
                    
                    <p><strong>15.6 Consent Management:</strong> You can manage your consent preferences in the app settings. You have the right to withdraw consent at any time.</p>
                    
                    <p><strong>15.7 Data Breach:</strong> In case of a data breach that affects your personal data, we will notify you and the Data Protection Board as required by law.</p>
                    
                    <p><strong>15.8 Cross-Border Transfer:</strong> Your data may be transferred outside India for processing. We ensure adequate protections are in place.</p>
                    
                    <p><strong>15.9 Children's Data:</strong> We do not knowingly collect data from children under 18 without parental consent.</p>
                  </div>
                </section>

                {/* Contact Us */}
                <section id="contact" className="scroll-mt-20">
                  <h2 className="text-xl font-bold text-on-background mb-4">16. Contact Us</h2>
                  <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-6">
                    <p className="text-on-surface-variant mb-4">For any questions about these Terms, please contact us:</p>
                    <div className="space-y-2 text-on-surface">
                      <p><strong>MIIAM Technologies Pvt. Ltd.</strong></p>
                      <p>Registered Office: Bangalore, Karnataka, India</p>
                      <p>Email: legal@miiam.com</p>
                      <p>Phone: +91 98765 43210</p>
                      <p className="mt-4"><strong>Grievance Officer:</strong></p>
                      <p>Email: grievance@miiam.com</p>
                      <p>Phone: +91 98765 43211</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-surface-container border-t border-outline-variant/20 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">M</span>
              <span className="font-bold text-on-surface-variant">MIIAM Technologies Pvt. Ltd.</span>
            </div>
            <div className="flex gap-6">
              <Link href="/terms" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Privacy Policy</Link>
            </div>
            <p className="text-sm text-on-surface-variant/60">© 2026 MIIAM. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}