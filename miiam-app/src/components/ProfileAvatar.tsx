"use client";

interface ProfileAvatarProps {
  name: string;
  image?: string | null;
  size?: "sm" | "md" | "lg";
  online?: boolean;
  className?: string;
}

export default function ProfileAvatar({ name, image, size = "md", online, className = "" }: ProfileAvatarProps) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-20 h-20 text-xl",
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {image ? (
        <img
          src={image}
          alt={name}
          className={`${sizes[size]} rounded-full object-cover ring-2 ring-surface-container-lowest`}
        />
      ) : (
        <div className={`${sizes[size]} rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-surface-container-lowest`}>
          <span className="font-bold text-primary">{initials}</span>
        </div>
      )}

      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface-container-lowest ${
          online ? "bg-emerald-500" : "bg-gray-300"
        }`} />
      )}
    </div>
  );
}
