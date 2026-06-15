"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ChatMessage {
  id: string;
  message: string;
  sender_id: string;
  created_at?: string;
  type?: "text" | "image" | "audio";
  file_url?: string;
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
  onSendFile?: (fileUrl: string, type: "image" | "audio") => void;
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
  onSendFile,
  onCall,
}: ChatModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  if (!open) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const fileName = `chat/${currentUserId}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage.from("chat-files").upload(fileName, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(data.path);
      const fileType = file.type.startsWith("image/") ? "image" : "audio";
      onSendFile?.(urlData.publicUrl, fileType);
    } catch {
      import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast("Failed to upload file", "error"));
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(t => t.stop());
        setUploading(true);
        try {
          const supabase = createClient();
          const fileName = `chat/${currentUserId}/${Date.now()}_voice.webm`;
          const { data, error } = await supabase.storage.from("chat-files").upload(fileName, blob);
          if (error) throw error;
          const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(data.path);
          onSendFile?.(urlData.publicUrl, "audio");
        } catch {
          import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast("Failed to upload voice message", "error"));
        }
        setUploading(false);
      };
      recorder.start();
      setIsRecording(true);
    } catch {
      import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast("Microphone permission denied", "error"));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end">
      <div className="bg-[var(--color-surface-container-lowest)] rounded-t-2xl w-full h-[70vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose}>
              <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">arrow_back</span>
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
              <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">close</span>
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-[var(--color-outline-variant)] text-sm py-8">No messages yet. Start the conversation!</div>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            const msgTime = msg.created_at
              ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "";
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${isMe ? "bg-[#0b50d5] text-white" : "bg-[var(--color-surface-container)]"}`}>
                  {msg.type === "image" && msg.file_url ? (
                    <img src={msg.file_url} alt="Shared image" className="rounded-lg max-w-full mb-1" />
                  ) : msg.type === "audio" && msg.file_url ? (
                    <audio controls src={msg.file_url} className="max-w-full mb-1" />
                  ) : null}
                  {msg.message && <p className="text-sm">{msg.message}</p>}
                  <p className={`text-[9px] ${isMe ? "text-white/70" : "text-[var(--color-outline-variant)]"}`}>{msgTime}</p>
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-2 text-[var(--color-outline-variant)] hover:text-[#0b50d5] hover:bg-[var(--color-surface-container)] rounded-full disabled:opacity-50"
              title="Attach file"
            >
              <span className="material-symbols-outlined">{uploading ? "hourglass_top" : "attach_file"}</span>
            </button>
            <button
              onClick={toggleRecording}
              className={`p-2 rounded-full ${isRecording ? "text-red-500 bg-red-50 animate-pulse" : "text-[var(--color-outline-variant)] hover:text-[#0b50d5] hover:bg-[var(--color-surface-container)]"}`}
              title={isRecording ? "Stop recording" : "Voice message"}
            >
              <span className="material-symbols-outlined">{isRecording ? "stop" : "mic"}</span>
            </button>
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => onChatMessageChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSend()}
              placeholder="Type a message..."
              className="flex-1 bg-[var(--color-surface-container)] rounded-full px-4 py-2 text-sm"
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
