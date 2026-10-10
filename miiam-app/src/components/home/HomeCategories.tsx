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
            <div className="bg-surface-container-lowest border-outline-variant/70 group-hover:border-outline-variant flex aspect-[6/5] w-full items-center justify-center overflow-hidden rounded-xl border transition-all duration-200 group-hover:shadow-sm group-active:scale-95">
              <div
                className={`h-11 w-11 rounded-xl bg-gradient-to-br ${normalizeGradientClass(cat.color) || "from-primary to-primary-dim"} flex items-center justify-center`}
              >
                <span className="material-symbols-outlined text-xl text-white transition-transform duration-200 group-hover:scale-110">
                  {cat.icon}
                </span>
              </div>
            </div>
            <span className="text-on-surface line-clamp-2 w-full text-center text-[10px] leading-tight font-semibold">
              {cat.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
