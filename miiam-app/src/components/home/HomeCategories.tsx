import Link from "next/link";

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
    <div className="px-5 pt-4 pb-2">
      <div className="grid grid-cols-4 gap-x-2 gap-y-3">
        {categories.map((cat, index) => (
          <Link
            key={cat.id}
            href={`/app/${cat.id}`}
            onClick={handleClick}
            className="group flex flex-col items-center gap-1.5"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={`w-full aspect-square rounded-lg bg-gradient-to-br ${cat.color || "from-primary to-primary-dim"} flex items-center justify-center overflow-hidden group-hover:shadow-md group-active:scale-95 transition-all duration-200`}>
              <span className="material-symbols-outlined text-white text-[22px] drop-shadow-sm group-hover:scale-110 transition-transform duration-200">{cat.icon}</span>
            </div>
            <span className="text-[10px] font-semibold text-on-surface text-center leading-tight line-clamp-2 w-full">{cat.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
