"use client";

interface ChatMessage {
  id: string;
  message: string;
  sender_id: string;
  created_at?: string;
}

interface ChatModalProps {
  open: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  currentUserId: string;
  customerName?: string;
  chatMessage: string;
  onChatMessageChange: (value: string) => void;
  onSend: () => void;
  onCall: () => void;
}

const QUICK_REPLIES = [
  "I'm on my way",
  "I've arrived",
  "Item not available",
  "Traffic delay",
  "Contacting support",
];

export default function ChatModal({
  open,
  onClose,
  messages,
  currentUserId,
  customerName,
  chatMessage,
  onChatMessageChange,
  onSend,
  onCall,
}: ChatModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end">
      <div className="bg-white rounded-t-2xl w-full h-[70vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose}>
              <span className="material-symbols-outlined text-slate-600">arrow_back</span>
            </button>
            <div className="w-10 h-10 bg-[#0b50d5]/10 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-[#0b50d5]">person</span>
            </div>
            <div>
              <p className="font-bold">{customerName || "Customer"}</p>
              <p className="text-[10px] text-green-500">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onCall}
              className="p-2 text-green-500 hover:bg-green-50 rounded-full"
              title="Call Customer"
            >
              <span className="material-symbols-outlined">call</span>
            </button>
            <button onClick={onClose} aria-label="Close">
              <span className="material-symbols-outlined text-slate-600">close</span>
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-slate-400 text-sm py-8">No messages yet. Start the conversation!</div>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            const msgTime = msg.created_at
              ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "";
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${isMe ? "bg-[#0b50d5] text-white" : "bg-slate-100"}`}>
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-[9px] ${isMe ? "text-white/70" : "text-slate-400"}`}>{msgTime}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t">
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
            {QUICK_REPLIES.map((msg) => (
              <button
                key={msg}
                onClick={() => onChatMessageChange(msg)}
                className="flex-shrink-0 px-3 py-1.5 bg-[#0b50d5]/10 text-[#0b50d5] rounded-full text-xs font-bold"
              >
                {msg}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast("File attachment coming soon", "info"))}
              className="p-2 text-slate-400 hover:text-[#0b50d5] hover:bg-slate-100 rounded-full"
              title="Attach file"
            >
              <span className="material-symbols-outlined">attach_file</span>
            </button>
            <button
              onClick={() => import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast("Voice messages coming soon", "info"))}
              className="p-2 text-slate-400 hover:text-[#0b50d5] hover:bg-slate-100 rounded-full"
              title="Voice message"
            >
              <span className="material-symbols-outlined">mic</span>
            </button>
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => onChatMessageChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSend()}
              placeholder="Type a message..."
              className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-sm"
            />
            <button
              onClick={onSend}
              disabled={!chatMessage.trim()}
              className="w-10 h-10 bg-[#0b50d5] text-white rounded-full flex items-center justify-center disabled:opacity-50"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
