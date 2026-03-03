import { Wheat, Carrot, Bean, Leaf, Apple, ShoppingBasket } from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  all: <ShoppingBasket className="h-5 w-5" />,
  grains: <Wheat className="h-5 w-5" />,
  vegetables: <Carrot className="h-5 w-5" />,
  legumes: <Bean className="h-5 w-5" />,
  roots: <Leaf className="h-5 w-5" />,
  fruits: <Apple className="h-5 w-5" />,
};

interface CategoryNavProps {
  categories: string[];
  selected: string;
  onSelect: (cat: string) => void;
}

const CategoryNav = ({ categories, selected, onSelect }: CategoryNavProps) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {categories.map((cat) => {
        const isActive = selected === cat;
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl transition-all duration-200 min-w-[72px] shrink-0 ${
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border"
            }`}
          >
            {CATEGORY_ICONS[cat] || <ShoppingBasket className="h-5 w-5" />}
            <span className="text-xs font-medium capitalize whitespace-nowrap">
              {cat === "all" ? "All" : cat}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryNav;
