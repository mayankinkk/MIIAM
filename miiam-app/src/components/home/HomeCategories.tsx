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
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {categories.map((cat, index) => (
          <Link
            key={cat.id}
            href={`/app/${cat.id}`}
            onClick={handleClick}
            className="flex flex-col items-center gap-2 group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="w-full aspect-square max-w-20 rounded-xl bg-surface-container-lowest border border-border-subtle shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center justify-center group-hover:shadow-md group-hover:-translate-y-0.5 group-active:scale-95 transition-all duration-200 ease-out">
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                <span className="material-symbols-outlined text-white text-xl">{cat.icon}</span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-on-surface text-center leading-tight group-hover:text-accent transition-colors">{cat.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}