import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "MIIAM Wallet | MIIAM" };

export default function WalletPage() {
  const balance = 500.0;
  const points = 350;

  const transactions = [
    { id: "tx_1", type: "refund", amount: 120, title: "Refund for Order #A8B2C4", date: "Oct 12, 2023", sign: "+" },
    { id: "tx_2", type: "payment", amount: 350, title: "Order from The Burger Alchemist", date: "Oct 10, 2023", sign: "-" },
    { id: "tx_3", type: "topup", amount: 1000, title: "Added via UPI", date: "Oct 05, 2023", sign: "+" },
    { id: "tx_4", type: "payment", amount: 270, title: "Order from Sushi Zen Master", date: "Oct 02, 2023", sign: "-" },
  ];

  return (
    <div className="min-h-screen bg-[#fff4f4] pb-32">
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-[#fff4f4]/80 backdrop-blur-2xl shadow-[0px_10px_30px_rgba(77,33,42,0.04)]">
        <div className="flex items-center gap-4">
          <Link href="/app/profile" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#ffe1e4] transition-all">
            <span className="material-symbols-outlined text-[#ba001c]">arrow_back</span>
          </Link>
          <span className="text-2xl font-extrabold tracking-tighter text-[#ba001c]">MIIAM</span>
        </div>
        <span className="text-slate-800 font-bold hidden md:block">Wallet</span>
      </nav>

      <main className="pt-24 max-w-2xl mx-auto px-4">
        
        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-r from-[#4e0006] to-[#ba001c] rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-2xl shadow-[#ba001c]/30">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex flex-col items-start gap-6">
            <div className="w-full flex justify-between items-start">
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                <span className="text-xs font-bold tracking-widest uppercase">MIIAM Wallet</span>
              </div>
              <span className="material-symbols-outlined text-3xl opacity-50">contactless</span>
            </div>
            
            <div>
              <p className="text-white/80 font-medium text-sm mb-1">Available Balance</p>
              <h1 className="text-5xl font-extrabold tracking-tighter">₹{balance.toFixed(2)}</h1>
            </div>

            <div className="w-full flex gap-3 mt-2">
              <button className="flex-1 bg-white text-[#ba001c] py-3 rounded-xl font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
                Add Money
              </button>
              <button className="flex-1 bg-white/20 text-white py-3 rounded-xl font-bold text-sm hover:bg-white/30 transition-all">
                Send to Bank
              </button>
            </div>
          </div>
        </div>

        {/* Loyalty Dashboard */}
        <div className="bg-gradient-to-r from-[#ffd709]/20 to-[#ffe9a0]/20 rounded-3xl p-6 border border-[#ffd709]/40 mb-8 flex items-center justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[#b08800] text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
              <h3 className="font-extrabold text-[#453900] text-lg">MIIAM Points</h3>
            </div>
            <p className="text-[#665500] text-sm">Use points for discounts on checkout.</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-extrabold text-[#b08800]">{points}</p>
            <p className="text-[10px] uppercase font-bold text-[#b08800]/80 tracking-widest">Available</p>
          </div>
        </div>

        {/* MIIAM+ Banner */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-8 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full blur-3xl group-hover:bg-amber-200 transition-colors" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>Workspace_Premium</span>
                <h3 className="font-extrabold text-slate-900 text-xl">MIIAM<span className="text-[#ba001c]">+</span></h3>
              </div>
              <p className="text-slate-500 text-sm mb-4">Free delivery &amp; 10% off services.</p>
              <p className="font-extrabold text-[#ba001c]">₹149 <span className="text-slate-400 text-sm font-medium">/ month</span></p>
            </div>
            <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-black transition-colors">
              Subscribe
            </button>
          </div>
        </div>

        {/* Transaction History */}
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-4">Recent Transactions</h2>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            {transactions.map((tx, idx) => (
              <div key={tx.id} className={`p-4 flex items-center justify-between ${idx !== transactions.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    tx.type === 'refund' ? 'bg-amber-100 text-amber-700' :
                    tx.type === 'topup' ? 'bg-green-100 text-green-700' :
                    'bg-[#ffe1e4] text-[#ba001c]'
                  }`}>
                    <span className="material-symbols-outlined text-[20px]">
                      {tx.type === 'refund' ? 'undo' : tx.type === 'topup' ? 'add' : 'shopping_bag'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{tx.title}</h4>
                    <p className="text-xs text-slate-500">{tx.date}</p>
                  </div>
                </div>
                <div className={`font-extrabold ${tx.sign === '+' ? 'text-green-600' : 'text-slate-900'}`}>
                  {tx.sign}₹{tx.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
