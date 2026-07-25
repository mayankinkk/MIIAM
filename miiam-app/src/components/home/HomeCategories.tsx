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
        {categories.map((cat) => (
          <Link key={cat.id} href={`/app/${cat.id}`} onClick={handleClick} className="flex flex-col items-center gap-2 flex-shrink-0 group">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-sm group-active:scale-95 transition-transform`}>
              <span className="material-symbols-outlined text-white text-xl">{cat.icon}</span>
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant whitespace-nowrap">{cat.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}