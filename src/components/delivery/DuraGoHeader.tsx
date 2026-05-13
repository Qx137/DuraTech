import { Truck } from 'lucide-react';

export const DuraGoHeader = () => {
  return (
    <div className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-xl shadow-lg mb-6 flex items-center justify-between overflow-hidden relative">
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-white/90 px-3 py-1.5 rounded-xl shadow-sm backdrop-blur-sm">
            <img src="/DURAGO.webp" alt="DuraGo Logo" className="h-10 w-auto object-contain" />
          </div>
        </div>
        <p className="text-green-50/90 text-sm max-w-md font-medium">
          Premium agricultural transport & logistics. Set your locations, choose your vehicle, and get competitive bids from verified drivers.
        </p>
      </div>
      
      <div className="hidden md:block opacity-10 absolute -right-4 -bottom-8">
        <Truck className="w-48 h-48" />
      </div>

      <div className="bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/20 text-xs font-semibold animate-pulse">
        Live Marketplace
      </div>
    </div>
  );
};
