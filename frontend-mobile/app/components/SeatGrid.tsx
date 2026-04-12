import { Seat } from '../data/mockData';
import { cn } from './ui/utils';

interface SeatGridProps {
  seats: Seat[];
  onSeatClick?: (seat: Seat) => void;
  columns?: number;
}

export function SeatGrid({ seats, onSeatClick, columns = 4 }: SeatGridProps) {
  const getSeatColor = (status: Seat['status']) => {
    switch (status) {
      case 'reserved-counter':
        return 'bg-red-600 hover:bg-red-700';
      case 'sold-onboard':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'available':
        return 'bg-green-600 hover:bg-green-700';
    }
  };

  const getSeatLabel = (status: Seat['status']) => {
    switch (status) {
      case 'reserved-counter':
        return 'R';
      case 'sold-onboard':
        return 'V';
      case 'available':
        return 'D';
    }
  };

  return (
    <div>
      <div
        className="grid gap-2 mb-6 max-w-md mx-auto"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {seats.map((seat) => (
          <button
            key={seat.number}
            onClick={() => onSeatClick?.(seat)}
            className={cn(
              'h-14 rounded-lg text-white transition-colors flex flex-col items-center justify-center',
              getSeatColor(seat.status),
              onSeatClick && 'cursor-pointer'
            )}
          >
            <div className="text-base font-semibold">{seat.number}</div>
            <div className="text-[9px] opacity-75">{getSeatLabel(seat.status)}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 text-xs justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-green-600 rounded"></div>
          <span className="text-gray-700">Disponible (D)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-red-600 rounded"></div>
          <span className="text-gray-700">Réservé Guichet (R)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-blue-600 rounded"></div>
          <span className="text-gray-700">Vendu à Bord (V)</span>
        </div>
      </div>
    </div>
  );
}