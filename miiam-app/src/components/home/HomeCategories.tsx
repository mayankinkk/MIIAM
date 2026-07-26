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
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat, index) => (
          <Link
            key={cat.id}
            href={`/app/${cat.id}`}
            onClick={handleClick}
            className="flex flex-col items-center gap-2 flex-shrink-0 group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-sm group-hover:shadow-lg group-hover:scale-110 group-active:scale-90 transition-all duration-200 ease-out`}>
              <span className="material-symbols-outlined text-white text-xl group-hover:rotate-12 transition-transform duration-200">{cat.icon}</span>
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant whitespace-nowrap group-hover:text-primary transition-colors">{cat.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}