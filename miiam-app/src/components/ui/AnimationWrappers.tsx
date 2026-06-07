"use client";

import { motion } from "framer-motion";
import { ReactNode, useState, useEffect } from "react";
import { useUiA11yStore } from "@/lib/store/uiA11yStore";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted;
}

function useReducedMotion() {
  const [mounted, setMounted] = useState(false);
  const reducedMotion = useUiA11yStore((s) => s.reducedMotion);
  useEffect(() => { setMounted(true); }, []);
  return mounted ? reducedMotion : false;
}

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function FadeIn({ children, className = "", delay = 0 }: Props) {
  const mounted = useMounted();
  const reduced = useReducedMotion();
  if (!mounted) return <div className={className}>{children}</div>;
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({ children, className = "", delay = 0 }: Props) {
  const mounted = useMounted();
  const reduced = useReducedMotion();
  if (!mounted) return <div className={className}>{children}</div>;
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SlideInLeft({ children, className = "", delay = 0 }: Props) {
  const mounted = useMounted();
  const reduced = useReducedMotion();
  if (!mounted) return <div className={className}>{children}</div>;
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SlideInRight({ children, className = "", delay = 0 }: Props) {
  const mounted = useMounted();
  const reduced = useReducedMotion();
  if (!mounted) return <div className={className}>{children}</div>;
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({ children, className = "", staggerDelay = 0.05 }: StaggerProps) {
  const mounted = useMounted();
  if (!mounted) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }: Props) {
  const mounted = useMounted();
  if (!mounted) return <div className={className}>{children}</div>;
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function PressScale({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  const mounted = useMounted();
  const reduced = useReducedMotion();
  if (!mounted || reduced) return <div className={`cursor-pointer ${className}`} onClick={onClick}>{children}</div>;
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`cursor-pointer ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function CartBounce({ children, isBouncing, className = "" }: { children: ReactNode; isBouncing: boolean; className?: string }) {
  const mounted = useMounted();
  const reduced = useReducedMotion();
  if (!mounted || reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      animate={isBouncing ? { scale: [1, 1.2, 0.95, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
