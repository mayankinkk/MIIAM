path = "/home/mayank/Downloads/MIIAM Final UI/miiam-app/src/app/rider/dashboard/page.tsx"
with open(path, "r") as f:
    content = f.read()

import re

# Find the vibration button block
vibration_block_pattern = r'onClick=\{\(\) => setVibrationEnabled\(!vibrationEnabled\)\}\s+className=\{`w-12 h-6 rounded-full transition-all \$\{vibrationEnabled \? "bg-green-500" : "bg-slate-300"\}`\}\s+>\s+<div className=\{`w-5 h-5 bg-white rounded-full transition-all \$\{vibrationEnabled \? "translate-x-6" : "translate-x-0.5"\}\`\}></div>'

# The goal is to replace the whole modal content starting from the vibration div to the end of the modal.
# Let s find the start of the vibration div.
vibration_div_start = content.find('<div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">', content.find('Vibration'))

if vibration_div_start != -1:
    # Find the end of the modal content container
    modal_end = content.find('</div>\n\n            <button', vibration_div_start)
    if modal_end == -1:
        modal_end = content.find('</div>\n\n            <button', vibration_div_start) # try without double newline
        
    # Actually I will just replace the whole modal content block.
    modal_start = content.find('<div className="space-y-4">', content.find('Alert Settings'))
    if modal_start != -1:
        modal_end = content.find('            <button', modal_start)
        if modal_end != -1:
            new_modal_content = """<div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#0b50d5]">volume_up</span>
                  <div>
                    <p className="font-bold">Sound Alert</p>
                    <p className="text-xs text-slate-500">Play sound for new orders</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-12 h-6 rounded-full transition-all ${soundEnabled ? "bg-green-500" : "bg-slate-300"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-all ${soundEnabled ? "translate-x-6" : "translate-x-0.5"}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#0b50d5]">vibration</span>
                  <div>
                    <p className="font-bold">Vibration</p>
                    <p className="text-xs text-slate-500">Vibrate for new orders</p>
                  </div>
                </div>
                <button 
                  onClick={() => setVibrationEnabled(!vibrationEnabled)}
                  className={`w-12 h-6 rounded-full transition-all ${vibrationEnabled ? "bg-green-500" : "bg-slate-300"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-all ${vibrationEnabled ? "translate-x-6" : "translate-x-0.5"}`}></div>
                </button>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-sm">info</span>
                  <p className="text-xs text-blue-700">
                    Alerts are triggered when you are online and a new order arrives within your zone.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Developer Tools</p>
                <button 
                  onClick={clearAllPendingOrders}
                  className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">delete_sweep</span>
                  Clear All Pending Orders
                </button>
                <p className="text-[10px] text-slate-400 mt-2 text-center italic">Deletes all unassigned pending orders from database.</p>
              </div>
            </div>

"""
            new_content = content[:modal_start] + new_modal_content + content[modal_end:]
            with open(path, "w") as f:
                f.write(new_content)
            print("Successfully restored and fixed modal.")
        else:
            print("Could not find modal end.")
    else:
        print("Could not find modal start.")
else:
    print("Could not find vibration div start.")
