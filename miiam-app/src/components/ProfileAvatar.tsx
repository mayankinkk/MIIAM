"use client";

interface ProfileAvatarProps {
  name: string;
  image?: string | null;
  size?: "sm" | "md" | "lg";
  online?: boolean;
  className?: string;
}

export default function ProfileAvatar({
  name,
  image,
  size = "md",
  online,
  className = "",
}: ProfileAvatarProps) {
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
          className={`${sizes[size]} ring-surface-container-lowest rounded-full object-cover ring-2`}
        />
      ) : (
        <div
          className={`${sizes[size]} bg-primary/10 ring-surface-container-lowest flex items-center justify-center rounded-full ring-2`}
        >
          <span className="text-accent font-bold">{initials}</span>
        </div>
      )}

      {online !== undefined && (
        <span
          className={`border-surface-container-lowest absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 ${
            online ? "bg-emerald-500" : "bg-gray-300"
          }`}
        />
      )}
    </div>
  );
}
