import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Bike, Truck, Snowflake, PawPrint } from 'lucide-react';

export interface TransportType {
  id: string;
  name: string;
  description: string;
  examples: string;
  capacity: string;
  icon: React.ReactNode;
  priceMultiplier: number;
}

const TRANSPORT_TYPES: TransportType[] = [
  {
    id: 'motorbike',
    name: 'Motorbike / Small Courier',
    description: 'Very small packages',
    examples: 'Documents, small parcels, seeds, medicines',
    capacity: 'Up to ~20 kg',
    icon: <Bike className="h-5 w-5" />,
    priceMultiplier: 0.8,
  },
  {
    id: 'pickup_1t',
    name: 'Small Pickup (1 Ton)',
    description: 'Small farm produce',
    examples: 'Vegetables, fruits, poultry crates',
    capacity: '~1 ton',
    icon: <Truck className="h-5 w-5" />,
    priceMultiplier: 1.0,
  },
  {
    id: 'truck_3t',
    name: 'Medium Truck (3 Ton)',
    description: 'Moderate loads',
    examples: 'Bags of maize, fertilizers, animal feed',
    capacity: '~3 tons',
    icon: <Truck className="h-5 w-5" />,
    priceMultiplier: 1.5,
  },
  {
    id: 'truck_5t',
    name: '5 Ton Truck',
    description: 'Larger farm deliveries',
    examples: 'Bulk vegetables, potatoes, building materials',
    capacity: '~5 tons',
    icon: <Truck className="h-5 w-5" />,
    priceMultiplier: 2.0,
  },
  {
    id: 'truck_10t',
    name: '10 Ton Truck',
    description: 'Large commercial deliveries',
    examples: 'Grain, farm inputs, equipment',
    capacity: '~10 tons',
    icon: <Truck className="h-5 w-5" />,
    priceMultiplier: 3.0,
  },
  {
    id: 'truck_20_30t',
    name: 'Heavy Truck (20–30 Ton)',
    description: 'Bulk agricultural transport',
    examples: 'Maize, wheat, tobacco bales, fertilizers',
    capacity: '20–30 tons',
    icon: <Truck className="h-5 w-5" />,
    priceMultiplier: 5.0,
  },
  {
    id: 'refrigerated',
    name: 'Refrigerated Truck',
    description: 'Perishable goods (cold chain)',
    examples: 'Meat, dairy, fresh vegetables, fruits',
    capacity: 'Varies',
    icon: <Snowflake className="h-5 w-5" />,
    priceMultiplier: 3.5,
  },
  {
    id: 'livestock',
    name: 'Livestock Transport',
    description: 'Designed for animals',
    examples: 'Cattle, goats, pigs, chickens',
    capacity: 'Varies',
    icon: <PawPrint className="h-5 w-5" />,
    priceMultiplier: 4.0,
  },
];

interface TransportTypeSelectorProps {
  selected: string | null;
  onSelect: (type: TransportType) => void;
}

export const TransportTypeSelector = ({ selected, onSelect }: TransportTypeSelectorProps) => {
  const [expanded, setExpanded] = useState(false);

  const selectedType = TRANSPORT_TYPES.find(t => t.id === selected);
  const visibleTypes = expanded ? TRANSPORT_TYPES : TRANSPORT_TYPES.slice(0, 4);

  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Vehicle Type
      </Label>
      <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-1">
        {visibleTypes.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => onSelect(type)}
            className={cn(
              "flex flex-col items-start gap-1 p-2.5 rounded-lg border text-left transition-all text-xs",
              selected === type.id
                ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                : "border-border/50 bg-muted/20 hover:bg-muted/40"
            )}
          >
            <div className="flex items-center gap-2 w-full">
              <div className={cn(
                "p-1.5 rounded-md",
                selected === type.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {type.icon}
              </div>
              <span className="font-semibold leading-tight line-clamp-2">{type.name}</span>
            </div>
            <p className="text-[10px] text-muted-foreground line-clamp-1">{type.examples}</p>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
              {type.capacity}
            </Badge>
          </button>
        ))}
      </div>
      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full text-xs text-primary hover:underline py-1"
        >
          Show {TRANSPORT_TYPES.length - 4} more options
        </button>
      )}
      {expanded && TRANSPORT_TYPES.length > 4 && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="w-full text-xs text-primary hover:underline py-1"
        >
          Show less
        </button>
      )}
    </div>
  );
};

export { TRANSPORT_TYPES };
