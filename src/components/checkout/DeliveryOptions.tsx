import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Truck, Clock, MapPin, Star, DollarSign } from "lucide-react";

interface DeliveryOption {
  id: string;
  name: string;
  description: string;
  estimatedTime: string;
  basePrice: number;
  coverage: string[];
  rating: number;
  features: string[];
  isRecommended?: boolean;
}

interface DeliveryOptionsProps {
  onDeliverySelect: (option: DeliveryOption) => void;
  selectedOption?: string;
  deliveryDistance?: number;
}

const DeliveryOptions = ({ onDeliverySelect, selectedOption, deliveryDistance = 0 }: DeliveryOptionsProps) => {
  const [selected, setSelected] = useState<string>(selectedOption || "");

  const deliveryOptions: DeliveryOption[] = [
    {
      id: "zimdrive",
      name: "ZimDrive",
      description: "Our premium in-house delivery service with real-time tracking",
      estimatedTime: "30-60 minutes",
      basePrice: 2.50,
      coverage: ["Harare", "Bulawayo", "Chitungwiza", "Mutare", "Gweru"],
      rating: 4.8,
      features: ["Real-time tracking", "Temperature controlled", "Farm-fresh guarantee", "Insurance included"],
      isRecommended: true
    },
    {
      id: "courier_connect",
      name: "Courier Connect Zimbabwe",
      description: "Reliable nationwide delivery service",
      estimatedTime: "1-3 hours",
      basePrice: 3.00,
      coverage: ["All major cities", "Rural areas"],
      rating: 4.2,
      features: ["Nationwide coverage", "SMS notifications", "Proof of delivery"]
    },
    {
      id: "speed_couriers",
      name: "Speed Couriers",
      description: "Fast urban delivery specialist",
      estimatedTime: "45-90 minutes",
      basePrice: 3.50,
      coverage: ["Harare", "Bulawayo", "Chitungwiza"],
      rating: 4.0,
      features: ["Express delivery", "Urban specialist", "Cash on delivery"]
    },
    {
      id: "zim_express",
      name: "Zim Express",
      description: "Budget-friendly delivery with flexible timing",
      estimatedTime: "2-4 hours",
      basePrice: 1.80,
      coverage: ["Major cities", "Selected towns"],
      rating: 3.8,
      features: ["Budget friendly", "Flexible timing", "Basic tracking"]
    },
    {
      id: "fresh_logistics",
      name: "Fresh Logistics",
      description: "Specialized in fresh produce delivery",
      estimatedTime: "1-2 hours",
      basePrice: 4.00,
      coverage: ["Harare", "Bulawayo", "Mutare"],
      rating: 4.5,
      features: ["Cold chain", "Fresh produce specialist", "Quality guarantee"]
    }
  ];

  const calculateDeliveryPrice = (option: DeliveryOption) => {
    if (!deliveryDistance || deliveryDistance === 0) {
      return option.basePrice.toFixed(2);
    }
    
    // Calculate price: base price + (distance in km * per km rate)
    // Each km costs $0.50 beyond the base price
    const pricePerKm = 0.50;
    const price = option.basePrice + (deliveryDistance * pricePerKm);
    
    // Cap at reasonable maximum of $50
    const finalPrice = Math.min(price, 50.00);
    return finalPrice.toFixed(2);
  };

  const handleOptionChange = (value: string) => {
    setSelected(value);
    const option = deliveryOptions.find(opt => opt.id === value);
    if (option) {
      onDeliverySelect(option);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Truck className="h-5 w-5" />
          <span>Choose Delivery Option</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selected} onValueChange={handleOptionChange} className="space-y-4">
          {deliveryOptions.map((option) => (
            <div key={option.id} className="relative">
              <Label
                htmlFor={option.id}
                className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-lg">{option.name}</h3>
                      {option.isRecommended && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold">${calculateDeliveryPrice(option)}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm">{option.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{option.estimatedTime}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>{option.rating}/5</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Coverage: {option.coverage.join(", ")}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {option.features.map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
        
        {!selected && (
          <p className="text-sm text-muted-foreground mt-4">
            Please select a delivery option to continue with your order.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default DeliveryOptions;