"use client";

import { useEffect, useRef, useState } from "react";

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
  aspect?: number;
  hint?: string;
}

export default function CameraCapture({
  onCapture,
  onClose,
  aspect = 1,
  hint = "Position your face within the oval guide",
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError("Camera not supported in this browser");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 1280 },
          },
          audio: false,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setReady(true);
          };
        }
      } catch (e) {
        const err = e as Error;
        if (err.name === "NotAllowedError") {
          setError("Camera access was blocked. Please allow camera in browser settings.");
        } else if (err.name === "NotFoundError") {
          setError("No camera found on this device.");
        } else {
          setError(err.message || "Could not access camera");
        }
      }
    }

    start();

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current || !ready) return;
    const v = videoRef.current;
    const canvas = document.createElement("canvas");
    const w = v.videoWidth;
    const h = v.videoHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    onCapture(dataUrl);
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Camera capture"
    >
      <div className="flex items-center justify-between p-4 text-white">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <p className="font-bold text-sm">{hint}</p>
        <div className="w-10" />
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-white text-center p-6 max-w-sm">
            <span className="material-symbols-outlined text-6xl mb-3">videocam_off</span>
            <p className="font-bold mb-1">Camera unavailable</p>
            <p className="text-sm text-white/70">{error}</p>
            <p className="text-xs text-white/50 mt-3">You can still upload a photo instead.</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Compliance overlay — oval face guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="border-4 border-white/80 border-dashed"
                style={{
                  width: aspect >= 1 ? "70%" : `${70 * aspect}%`,
                  height: aspect >= 1 ? `${70 / aspect}%` : "70%",
                  maxWidth: "min(80vw, 80vh)",
                  maxHeight: "min(80vw, 80vh)",
                  borderRadius: aspect === 1 ? "50%" : "30%",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
                }}
              />
            </div>
            <div className="absolute bottom-32 left-4 right-4 text-center text-white/90 text-xs">
              <p>Hold still · look straight at the camera · keep a plain background</p>
            </div>
          </>
        )}
      </div>

      <div className="p-6 flex items-center justify-center gap-4 bg-black/50">
        <button
          onClick={handleCapture}
          disabled={!ready || !!error}
          aria-label="Capture photo"
          className="w-20 h-20 rounded-full bg-white flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-black text-4xl">photo_camera</span>
        </button>
      </div>
    </div>
  );
}
