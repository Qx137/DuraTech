import { Wheat, Carrot, Bean, Leaf, Apple, LayoutGrid, FlaskConical, Cog, TreePine, Beef, Handshake, TruckIcon } from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  all: <LayoutGrid className="h-5 w-5" />,
  "agri-inputs": <FlaskConical className="h-5 w-5" />,
  equipment: <Cog className="h-5 w-5" />,
  "farm-produce": <TreePine className="h-5 w-5" />,
  livestock: <Beef className="h-5 w-5" />,
  "farm-services": <Handshake className="h-5 w-5" />,
  "transport-logistics": <TruckIcon className="h-5 w-5" />,
  grains: <Wheat className="h-5 w-5" />,
  vegetables: <Carrot className="h-5 w-5" />,
  legumes: <Bean className="h-5 w-5" />,
  roots: <Leaf className="h-5 w-5" />,
  fruits: <Apple className="h-5 w-5" />,
};

const MAJOR_CATEGORIES = [
  { key: "all", label: "All" },
  { key: "agri-inputs", label: "Agri Inputs" },
  { key: "equipment", label: "Equipment" },
  { key: "farm-produce", label: "Farm Produce" },
  { key: "livestock", label: "Livestock" },
  { key: "farm-services", label: "Farm Services" },
  { key: "transport-logistics", label: "Transport & Logistics" },
];

interface CategoryNavProps {
  categories: string[];
  selected: string;
  onSelect: (cat: string) => void;
}

const CategoryNav = ({ categories, selected, onSelect }: CategoryNavProps) => {
  // Merge major categories with any dynamic ones from products
  const allCats = [...MAJOR_CATEGORIES];
  categories.forEach((cat) => {
    if (cat !== "all" && !MAJOR_CATEGORIES.find((m) => m.key === cat)) {
      allCats.push({ key: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) });
    }
  });

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {allCats.map(({ key, label }) => {
        const isActive = selected === key;
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl transition-all duration-200 min-w-[72px] shrink-0 ${
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border"
            }`}
          >
            {CATEGORY_ICONS[key] || <ShoppingBasket className="h-5 w-5" />}
            <span className="text-xs font-medium whitespace-nowrap">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryNav;
