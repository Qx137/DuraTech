import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, DollarSign, Clock, ArrowRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TransportTypeSelector, TransportType } from "./TransportTypeSelector";

interface DeliveryRequestPanelProps {
    pickupName: string;
    destinationName: string;
    onPickupNameChange: (val: string) => void;
    onDestinationNameChange: (val: string) => void;
    distance: number | null;
    price: number | null;
    onRequest: () => void;
    loading: boolean;
    isValid: boolean;
    pickupSuggestions?: any[];
    destinationSuggestions?: any[];
    onSelectSuggestion: (suggestion: any, type: 'pickup' | 'destination') => void;
    searching: 'pickup' | 'destination' | null;
    selectedTransport: string | null;
    onTransportSelect: (type: TransportType) => void;
}

export const DeliveryRequestPanel = ({
    pickupName,
    destinationName,
    onPickupNameChange,
    onDestinationNameChange,
    distance,
    price,
    onRequest,
    loading,
    isValid,
    pickupSuggestions = [],
    destinationSuggestions = [],
    onSelectSuggestion,
    searching,
    selectedTransport,
    onTransportSelect
}: DeliveryRequestPanelProps) => {
    return (
        <div className="w-full md:w-[400px] pointer-events-auto">
            <Card className="shadow-2xl border-primary/10 overflow-hidden">
                <CardHeader className="bg-primary/5 pb-4">
                    <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="bg-background">Delivery Request</Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>~15 min</span>
                        </div>
                    </div>
                    <CardTitle className="text-xl">Where to?</CardTitle>
                    <CardDescription>Enter details or pick on map</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-4 relative">
                        {/* Visual connector line */}
                        <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-muted-foreground/20 z-0"></div>

                        <div className="space-y-2 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center border-2 border-background shadow-sm">
                                    <MapPin className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1 space-y-1 relative">
                                    <Label htmlFor="pickup" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pickup Point</Label>
                                    <Input
                                        id="pickup"
                                        placeholder="Search pickup location..."
                                        value={pickupName}
                                        onChange={(e) => onPickupNameChange(e.target.value)}
                                        className="border-none bg-muted/30 focus-visible:ring-1 focus-visible:ring-green-500"
                                    />
                                    {pickupSuggestions.length > 0 && (
                                        <div className="absolute left-0 right-0 top-full mt-1 bg-background border rounded-md shadow-xl z-50 max-h-48 overflow-y-auto">
                                            {pickupSuggestions.map((s, i) => (
                                                <button
                                                    key={i}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors border-b last:border-0"
                                                    onClick={() => onSelectSuggestion(s, 'pickup')}
                                                >
                                                    <p className="font-medium truncate">{s.display_name}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate">{s.type} • {s.address?.city || s.address?.state}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {searching === 'pickup' && (
                                        <div className="absolute right-2 top-[34px]">
                                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center border-2 border-background shadow-sm">
                                    <Navigation className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="flex-1 space-y-1 relative">
                                    <Label htmlFor="destination" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Destination</Label>
                                    <Input
                                        id="destination"
                                        placeholder="Where are we going?"
                                        value={destinationName}
                                        onChange={(e) => onDestinationNameChange(e.target.value)}
                                        className="border-none bg-muted/30 focus-visible:ring-1 focus-visible:ring-red-500"
                                    />
                                    {destinationSuggestions.length > 0 && (
                                        <div className="absolute left-0 right-0 top-full mt-1 bg-background border rounded-md shadow-xl z-50 max-h-48 overflow-y-auto">
                                            {destinationSuggestions.map((s, i) => (
                                                <button
                                                    key={i}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors border-b last:border-0"
                                                    onClick={() => onSelectSuggestion(s, 'destination')}
                                                >
                                                    <p className="font-medium truncate">{s.display_name}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate">{s.type} • {s.address?.city || s.address?.state}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {searching === 'destination' && (
                                        <div className="absolute right-2 top-[34px]">
                                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <TransportTypeSelector
                        selected={selectedTransport}
                        onSelect={onTransportSelect}
                    />

                    {(distance !== null && distance > 0) && (
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="bg-muted/40 rounded-xl p-3 border border-border/50">
                                <div className="flex items-center gap-2 mb-1">
                                    <Navigation className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Distance</span>
                                </div>
                                <p className="text-lg font-bold">{distance.toFixed(1)} <span className="text-xs font-normal text-muted-foreground tracking-normal">km</span></p>
                            </div>
                            <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                                <div className="flex items-center gap-2 mb-1">
                                    <DollarSign className="w-3.5 h-3.5 text-primary" />
                                    <span className="text-xs text-muted-foreground">Est. Fare</span>
                                </div>
                                <p className="text-lg font-bold text-primary">${price?.toFixed(2)}</p>
                            </div>
                        </div>
                    )}

                    <Button
                        className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                        onClick={onRequest}
                        disabled={!isValid || loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                Confirm Delivery
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                        )}
                    </Button>

                    <p className="text-[10px] text-center text-muted-foreground px-4">
                        By confirming, you agree to DuraHub's terms of service and driver bidding policy.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};
