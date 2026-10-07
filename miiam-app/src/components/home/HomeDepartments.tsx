import Link from "next/link";

interface Department {
  id: string;
  label: string;
  icon: string;
  color: string;
}

const DEPARTMENTS: Department[] = [
  { id: "food", label: "Food", icon: "restaurant", color: "from-orange-400 to-red-400" },
  { id: "store", label: "Grocery", icon: "storefront", color: "from-emerald-400 to-teal-500" },
  { id: "services", label: "Services", icon: "handyman", color: "from-accent to-accent/70" },
  { id: "flowers", label: "Flowers", icon: "local_florist", color: "from-pink-400 to-rose-500" },
];

export default function HomeDepartments() {
  return (
    <div className="px-4 pt-3 pb-1">
      <div className="grid grid-cols-4 gap-x-2 gap-y-3">
        {DEPARTMENTS.map((dept) => (
          <Link
            key={dept.id}
            href={`/app/${dept.id}`}
            className="group flex flex-col items-center gap-1.5"
          >
            <div className="w-full aspect-[6/5] rounded-xl bg-surface-container-lowest border border-outline-variant/70 flex items-center justify-center overflow-hidden group-hover:border-outline-variant group-hover:shadow-sm group-active:scale-95 transition-all duration-200">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${dept.color} flex items-center justify-center`}>
                <span className="material-symbols-outlined text-white text-xl group-hover:scale-110 transition-transform duration-200">{dept.icon}</span>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-on-surface text-center leading-tight line-clamp-2 w-full">{dept.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
