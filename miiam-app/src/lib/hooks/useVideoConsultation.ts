"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import logger from "@/lib/logger";

export interface VideoCallState {
  isConnected: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
  callDuration: number;
  error: string | null;
}

export interface VideoConsultation {
  id: string;
  bookingId: string;
  userId: string;
  providerId: string;
  status: "waiting" | "connected" | "ended";
  startedAt?: string;
  endedAt?: string;
  recordingUrl?: string;
}

export function useVideoConsultation() {
  const [state, setState] = useState<VideoCallState>({
    isConnected: false,
    isMuted: false,
    isVideoOff: false,
    remoteStream: null,
    localStream: null,
    callDuration: 0,
    error: null,
  });

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  const startCamera = useCallback(async (videoOff = false): Promise<MediaStream | null> => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: videoOff ? false : { width: 640, height: 480, facingMode: "user" },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      logger.error({ err }, "Failed to access camera");
      setState(prev => ({ ...prev, error: "Could not access camera/microphone" }));
      return null;
    }
  }, []);

  const createPeerConnection = useCallback((localStream: MediaStream): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setState(prev => ({ ...prev, remoteStream }));
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        logger.debug("ICE candidate generated");
      }
    };

    pc.onconnectionstatechange = () => {
      const connectionState = pc.connectionState;
      if (connectionState === "connected") {
        setState(prev => ({ ...prev, isConnected: true, error: null }));
        timerRef.current = setInterval(() => {
          setState(prev => ({ ...prev, callDuration: prev.callDuration + 1 }));
        }, 1000);
      } else if (connectionState === "disconnected" || connectionState === "failed") {
        setState(prev => ({ ...prev, isConnected: false, error: "Connection lost" }));
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, []);

  const startConsultation = useCallback(async (bookingId: string): Promise<{ success: boolean; offer?: RTCSessionDescriptionInit }> => {
    try {
      const stream = await startCamera();
      if (!stream) return { success: false };

      const pc = createPeerConnection(stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      setState(prev => ({ ...prev, error: null }));
      return { success: true, offer };
    } catch (err) {
      logger.error({ err }, "Failed to start consultation");
      setState(prev => ({ ...prev, error: "Failed to start video consultation" }));
      return { success: false };
    }
  }, [startCamera, createPeerConnection]);

  const answerConsultation = useCallback(async (offer: RTCSessionDescriptionInit): Promise<{ success: boolean; answer?: RTCSessionDescriptionInit }> => {
    try {
      const stream = await startCamera();
      if (!stream) return { success: false };

      const pc = createPeerConnection(stream);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      return { success: true, answer };
    } catch (err) {
      logger.error({ err }, "Failed to answer consultation");
      setState(prev => ({ ...prev, error: "Failed to connect to consultation" }));
      return { success: false };
    }
  }, [startCamera, createPeerConnection]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setState(prev => ({ ...prev, isMuted: !audioTrack.enabled }));
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setState(prev => ({ ...prev, isVideoOff: !videoTrack.enabled }));
      }
    }
  }, []);

  const endConsultation = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setState({
      isConnected: false,
      isMuted: false,
      isVideoOff: false,
      remoteStream: null,
      localStream: null,
      callDuration: 0,
      error: null,
    });
  }, []);

  useEffect(() => {
    return () => {
      endConsultation();
    };
  }, [endConsultation]);

  return {
    ...state,
    localVideoRef,
    remoteVideoRef,
    startConsultation,
    answerConsultation,
    toggleMute,
    toggleVideo,
    endConsultation,
  };
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
