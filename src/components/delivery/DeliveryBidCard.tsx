import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, DollarSign, Star, Truck, Building2, Check, X } from 'lucide-react';
import { format } from 'date-fns';

interface DeliveryBidCardProps {
  bid: {
    id: string;
    bid_amount: number;
    estimated_time_minutes: number;
    message: string | null;
    status: string;
    created_at: string;
    driver?: {
      id: string;
      rating: number | null;
      vehicle_type: string;
      profiles?: {
        name: string;
      };
    } | null;
    company?: {
      id: string;
      name: string;
      rating: number | null;
      logo_url: string | null;
    } | null;
    demo_provider_name?: string | null;
  };
  onAccept?: (bidId: string) => void;
  onReject?: (bidId: string) => void;
  isBuyer?: boolean;
  isSelected?: boolean;
}

export const DeliveryBidCard = ({ 
  bid, 
  onAccept, 
  onReject, 
  isBuyer = false,
  isSelected = false 
}: DeliveryBidCardProps) => {
  const isCompanyBid = !!bid.company;
  const providerName = isCompanyBid 
    ? bid.company?.name 
    : bid.demo_provider_name || bid.driver?.profiles?.name || 'Driver';
  const providerRating = isCompanyBid 
    ? bid.company?.rating 
    : bid.driver?.rating;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      case 'withdrawn': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className={`transition-all ${isSelected ? 'ring-2 ring-primary border-primary' : ''}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            {isCompanyBid && bid.company?.logo_url ? (
              <AvatarImage src={bid.company.logo_url} />
            ) : null}
            <AvatarFallback className="bg-primary/10">
              {isCompanyBid ? <Building2 className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{providerName}</h4>
                {isCompanyBid && (
                  <Badge variant="secondary" className="text-xs">
                    <Building2 className="h-3 w-3 mr-1" />
                    Company
                  </Badge>
                )}
                <Badge variant={getStatusVariant(bid.status)}>{bid.status}</Badge>
              </div>
              {providerRating && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{providerRating.toFixed(1)}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 font-semibold text-primary">
                <DollarSign className="h-4 w-4" />
                ${bid.bid_amount.toFixed(2)}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {bid.estimated_time_minutes} min
              </span>
            </div>
            
            {bid.message && (
              <p className="text-sm text-muted-foreground italic">"{bid.message}"</p>
            )}
            
            <p className="text-xs text-muted-foreground">
              Bid placed {format(new Date(bid.created_at), 'MMM d, h:mm a')}
            </p>
          </div>
          
          {isBuyer && bid.status === 'pending' && (
            <div className="flex flex-col gap-2">
              <Button size="sm" onClick={() => onAccept?.(bid.id)}>
                <Check className="h-4 w-4 mr-1" />
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={() => onReject?.(bid.id)}>
                <X className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          )}
          
          {isSelected && (
            <Badge className="bg-green-500 text-white">
              <Check className="h-3 w-3 mr-1" />
              Selected
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
