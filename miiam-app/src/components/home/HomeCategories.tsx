import Link from "next/link";
import { normalizeGradientClass } from "@/lib/gradient-utils";

interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
}

interface HomeCategoriesProps {
  categories: Category[];
}

export default function HomeCategories({ categories }: HomeCategoriesProps) {
  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="px-4 pt-3 pb-2">
      <div className="grid grid-cols-4 gap-x-2 gap-y-3">
        {categories.map((cat, index) => (
          <Link
            key={cat.id}
            href={`/app/${cat.id}`}
            onClick={handleClick}
            className="group flex flex-col items-center gap-1.5"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="w-full aspect-[6/5] rounded-xl bg-surface-container-lowest border border-outline-variant/70 flex items-center justify-center overflow-hidden group-hover:border-outline-variant group-hover:shadow-sm group-active:scale-95 transition-all duration-200">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${normalizeGradientClass(cat.color) || "from-primary to-primary-dim"} flex items-center justify-center`}>
                <span className="material-symbols-outlined text-white text-xl group-hover:scale-110 transition-transform duration-200">{cat.icon}</span>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-on-surface text-center leading-tight line-clamp-2 w-full">{cat.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
