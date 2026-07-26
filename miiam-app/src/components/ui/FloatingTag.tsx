"use client";

interface FloatingTagProps {
  text: string;
  icon?: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  variant?: "fire" | "new" | "hot" | "sale";
  className?: string;
}

export default function FloatingTag({ text, icon, position = "top-left", variant = "fire", className = "" }: FloatingTagProps) {
  const variants = {
    fire: "bg-gradient-to-r from-orange-500 to-red-500 animate-pulse",
    new: "bg-gradient-to-r from-green-500 to-emerald-500",
    hot: "bg-gradient-to-r from-pink-500 to-rose-500 animate-bounce",
    sale: "bg-gradient-to-r from-purple-500 to-indigo-500",
  };

  const positions = {
    "top-left": "top-2 left-2",
    "top-right": "top-2 right-2",
    "bottom-left": "bottom-2 left-2",
    "bottom-right": "bottom-2 right-2",
  };

  return (
    <div className={`absolute ${positions[position]} z-10 ${className}`}>
      <div className={`${variants[variant]} text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1`}>
        {icon && <span className="text-xs">{icon}</span>}
        {text}
      </div>
    </div>
  );
}