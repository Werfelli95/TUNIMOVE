import { Bus, Route } from '../data/mockData';
import { useService } from '../data/ServiceContext';
import { Bus as BusIcon, MapPin } from 'lucide-react';

export function Header() {
  const { isServiceActive, currentBus, currentRoute, receiverMatricule } = useService();

  if (!isServiceActive || !currentBus || !currentRoute) {
    return null;
  }

  return (
    <div className="bg-[#1a3a52] text-white px-4 py-3 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BusIcon className="w-5 h-5" />
          <div>
            <div className="text-sm opacity-80">Bus {currentBus.number}</div>
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="w-3 h-3" />
              <span>{currentRoute.departure} → {currentRoute.destination}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs opacity-80">Receveur</div>
          <div className="text-sm">#{receiverMatricule}</div>
        </div>
      </div>
    </div>
  );
}
