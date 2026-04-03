import { useState } from "react";
import { ChevronDown } from "lucide-react";

const MAJOR_CATEGORIES = [
  { key: "all", label: "All", subcategories: [] },
  {
    key: "agri-inputs",
    label: "Agri Inputs",
    subcategories: [
      { key: "seeds", label: "Seeds" },
      { key: "fertilizers", label: "Fertilizers" },
      { key: "pesticides", label: "Pesticides" },
      { key: "herbicides", label: "Herbicides" },
      { key: "animal-feed", label: "Animal Feed" },
    ],
  },
  {
    key: "equipment",
    label: "Equipment",
    subcategories: [
      { key: "tractors", label: "Tractors" },
      { key: "irrigation", label: "Irrigation" },
      { key: "hand-tools", label: "Hand Tools" },
      { key: "harvesters", label: "Harvesters" },
      { key: "spare-parts", label: "Spare Parts" },
    ],
  },
  {
    key: "farm-produce",
    label: "Farm Produce",
    subcategories: [
      { key: "grains", label: "Grains" },
      { key: "vegetables", label: "Vegetables" },
      { key: "fruits", label: "Fruits" },
      { key: "legumes", label: "Legumes" },
      { key: "roots", label: "Roots & Tubers" },
    ],
  },
  {
    key: "livestock",
    label: "Livestock",
    subcategories: [
      { key: "cattle", label: "Cattle" },
      { key: "poultry", label: "Poultry" },
      { key: "goats", label: "Goats & Sheep" },
      { key: "pigs", label: "Pigs" },
      { key: "rabbits", label: "Rabbits" },
    ],
  },
  {
    key: "farm-services",
    label: "Farm Services",
    subcategories: [
      { key: "ploughing", label: "Ploughing" },
      { key: "spraying", label: "Spraying" },
      { key: "consulting", label: "Consulting" },
      { key: "veterinary", label: "Veterinary" },
      { key: "soil-testing", label: "Soil Testing" },
    ],
  },
  {
    key: "transport-logistics",
    label: "Transport & Logistics",
    subcategories: [
      { key: "cold-chain", label: "Cold Chain" },
      { key: "bulk-transport", label: "Bulk Transport" },
      { key: "last-mile", label: "Last Mile" },
      { key: "warehousing", label: "Warehousing" },
      { key: "packaging", label: "Packaging" },
    ],
  },
];

interface CategoryNavProps {
  categories: string[];
  selected: string;
  onSelect: (cat: string) => void;
}

const CategoryNav = ({ categories, selected, onSelect }: CategoryNavProps) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleCategoryClick = (key: string, hasSubcategories: boolean) => {
    if (hasSubcategories) {
      setExpandedCategory(expandedCategory === key ? null : key);
    }
    onSelect(key);
  };

  // Check if the selected category is a subcategory of a major category
  const getParentKey = (selectedKey: string) => {
    for (const cat of MAJOR_CATEGORIES) {
      if (cat.subcategories.some((sub) => sub.key === selectedKey)) {
        return cat.key;
      }
    }
    return null;
  };

  const parentKey = getParentKey(selected);

  return (
    <div className="space-y-2">
      {/* Major categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {MAJOR_CATEGORIES.map(({ key, label, subcategories }) => {
          const isActive = selected === key || parentKey === key;
          const isExpanded = expandedCategory === key;
          const hasSubs = subcategories.length > 0;

          return (
            <button
              key={key}
              onClick={() => handleCategoryClick(key, hasSubs)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl transition-all duration-200 shrink-0 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border"
              }`}
            >
              <span className="text-xs font-medium whitespace-nowrap">{label}</span>
              {hasSubs && (
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Subcategories row */}
      {expandedCategory && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none animate-in fade-in slide-in-from-top-2 duration-200">
          {MAJOR_CATEGORIES.find((c) => c.key === expandedCategory)?.subcategories.map(({ key, label }) => {
            const isActive = selected === key;
            return (
              <button
                key={key}
                onClick={() => onSelect(key)}
                className={`px-3 py-1.5 rounded-xl transition-all duration-200 shrink-0 text-[11px] font-medium whitespace-nowrap ${
                  isActive
                    ? "bg-primary/80 text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CategoryNav;
