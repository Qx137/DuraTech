import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, DollarSign, Loader2, Send, Info } from "lucide-react";
import { TransportTypeSelector, TransportType } from "./TransportTypeSelector";

interface DeliveryRequestPanelProps {
    pickupName: string;
    destinationName: string;
    onPickupNameChange: (val: string) => void;
    onDestinationNameChange: (val: string) => void;
    distance: number | null;
    minPrice: number | null;
    offeredPrice: number | null;
    onOfferedPriceChange: (value: number) => void;
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
    minPrice,
    offeredPrice,
    onOfferedPriceChange,
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
        <div className="w-full space-y-4">
            {/* Location inputs */}
            <Card className="shadow-lg border-border/50">
                <CardContent className="p-4 space-y-4">
                    <div className="space-y-3 relative">
                        <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-muted-foreground/20 z-0"></div>

                        {/* Pickup */}
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center border-2 border-background shadow-sm shrink-0">
                                <MapPin className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1 relative">
                                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pickup</Label>
                                <Input
                                    placeholder="Search pickup location..."
                                    value={pickupName}
                                    onChange={(e) => onPickupNameChange(e.target.value)}
                                    className="h-9 border-none bg-muted/30 text-sm"
                                />
                                {pickupSuggestions.length > 0 && (
                                    <div className="absolute left-0 right-0 top-full mt-1 bg-background border rounded-md shadow-xl z-50 max-h-40 overflow-y-auto">
                                        {pickupSuggestions.map((s, i) => (
                                            <button key={i} className="w-full text-left px-3 py-2 text-xs hover:bg-muted border-b last:border-0" onClick={() => onSelectSuggestion(s, 'pickup')}>
                                                <p className="font-medium truncate">{s.display_name}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {searching === 'pickup' && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground absolute right-2 top-7" />}
                            </div>
                        </div>

                        {/* Destination */}
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center border-2 border-background shadow-sm shrink-0">
                                <Navigation className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="flex-1 relative">
                                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Destination</Label>
                                <Input
                                    placeholder="Where are we going?"
                                    value={destinationName}
                                    onChange={(e) => onDestinationNameChange(e.target.value)}
                                    className="h-9 border-none bg-muted/30 text-sm"
                                />
                                {destinationSuggestions.length > 0 && (
                                    <div className="absolute left-0 right-0 top-full mt-1 bg-background border rounded-md shadow-xl z-50 max-h-40 overflow-y-auto">
                                        {destinationSuggestions.map((s, i) => (
                                            <button key={i} className="w-full text-left px-3 py-2 text-xs hover:bg-muted border-b last:border-0" onClick={() => onSelectSuggestion(s, 'destination')}>
                                                <p className="font-medium truncate">{s.display_name}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {searching === 'destination' && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground absolute right-2 top-7" />}
                            </div>
                        </div>
                    </div>

                    {distance !== null && distance > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                            <Navigation className="w-3 h-3" />
                            <span>Distance: <strong className="text-foreground">{distance.toFixed(1)} km</strong></span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Transport type */}
            <Card className="shadow-lg border-border/50">
                <CardContent className="p-4">
                    <TransportTypeSelector selected={selectedTransport} onSelect={onTransportSelect} />
                </CardContent>
            </Card>

            {/* Pricing */}
            {minPrice !== null && (
                <Card className="shadow-lg border-orange-200 bg-orange-50/50">
                    <CardContent className="p-4 space-y-3">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            Your Offer
                        </Label>

                        <div className="flex items-center gap-2 text-[11px] text-orange-700 bg-orange-100 rounded-lg px-3 py-2">
                            <Info className="w-3.5 h-3.5 shrink-0" />
                            <span>Minimum recommended price: <strong>${minPrice.toFixed(2)}</strong>. You can offer higher to attract drivers faster.</span>
                        </div>

                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">$</span>
                            <Input
                                type="number"
                                min={minPrice}
                                step={0.5}
                                value={offeredPrice ?? ''}
                                onChange={(e) => onOfferedPriceChange(parseFloat(e.target.value) || minPrice)}
                                className="pl-8 text-xl font-bold h-12 border-orange-200 focus-visible:ring-orange-400"
                            />
                        </div>
                        {offeredPrice !== null && minPrice !== null && offeredPrice < minPrice && (
                            <p className="text-[11px] text-destructive">Price cannot be below ${minPrice.toFixed(2)}</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Submit */}
            <Button
                className="w-full h-12 text-base font-semibold bg-orange-500 hover:bg-orange-600 shadow-lg transition-all active:scale-[0.98]"
                onClick={onRequest}
                disabled={!isValid || loading}
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending...
                    </>
                ) : (
                    <>
                        <Send className="mr-2 h-5 w-5" />
                        Send Request to Drivers
                    </>
                )}
            </Button>

            <p className="text-[10px] text-center text-muted-foreground px-4">
                Drivers will review your offer and can accept or counter. You'll choose the best offer and pay via ContiPay.
            </p>
        </div>
    );
};
