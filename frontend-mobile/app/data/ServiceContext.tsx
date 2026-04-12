import { useState, createContext, useContext, ReactNode } from 'react';
import { Seat, Passenger, Ticket, Bus, Route, generateInitialSeats } from './mockData';

interface ServiceContextType {
  // Service actuel
  isServiceActive: boolean;
  currentBus: Bus | null;
  currentRoute: Route | null;
  serviceStartTime: Date | null;
  receiverMatricule: string;

  // Données du service
  seats: Seat[];
  tickets: Ticket[];
  totalCash: number;

  // Actions
  startService: (bus: Bus, route: Route, matricule: string) => void;
  endService: () => void;
  validatePassenger: (passengerId: string) => void;
  sellTicket: (ticket: Ticket, seatNumber?: number) => void;
  updateSeatStatus: (seatNumber: number, status: Seat['status'], passenger?: Passenger) => void;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export function ServiceProvider({ children }: { children: ReactNode }) {
  const [isServiceActive, setIsServiceActive] = useState(false);
  const [currentBus, setCurrentBus] = useState<Bus | null>(null);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [serviceStartTime, setServiceStartTime] = useState<Date | null>(null);
  const [receiverMatricule, setReceiverMatricule] = useState('');
  const [seats, setSeats] = useState<Seat[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [totalCash, setTotalCash] = useState(0);

  const startService = (bus: Bus, route: Route, matricule: string) => {
    setCurrentBus(bus);
    setCurrentRoute(route);
    setReceiverMatricule(matricule);
    setServiceStartTime(new Date());
    setSeats(generateInitialSeats(bus.capacity));
    setTickets([]);
    setTotalCash(0);
    setIsServiceActive(true);
  };

  const endService = () => {
    setIsServiceActive(false);
    setCurrentBus(null);
    setCurrentRoute(null);
    setServiceStartTime(null);
    setReceiverMatricule('');
    setSeats([]);
  };

  const validatePassenger = (passengerId: string) => {
    setSeats((prevSeats) =>
      prevSeats.map((seat) =>
        seat.passenger?.id === passengerId
          ? { ...seat, passenger: { ...seat.passenger, validated: true } }
          : seat
      )
    );
  };

  const sellTicket = (ticket: Ticket, seatNumber?: number) => {
    setTickets((prev) => [...prev, ticket]);
    setTotalCash((prev) => prev + ticket.total);

    if (seatNumber) {
      updateSeatStatus(seatNumber, 'sold-onboard');
    }
  };

  const updateSeatStatus = (seatNumber: number, status: Seat['status'], passenger?: Passenger) => {
    setSeats((prevSeats) =>
      prevSeats.map((seat) =>
        seat.number === seatNumber ? { ...seat, status, passenger } : seat
      )
    );
  };

  return (
    <ServiceContext.Provider
      value={{
        isServiceActive,
        currentBus,
        currentRoute,
        serviceStartTime,
        receiverMatricule,
        seats,
        tickets,
        totalCash,
        startService,
        endService,
        validatePassenger,
        sellTicket,
        updateSeatStatus,
      }}
    >
      {children}
    </ServiceContext.Provider>
  );
}

export function useService() {
  const context = useContext(ServiceContext);
  if (context === undefined) {
    throw new Error('useService must be used within a ServiceProvider');
  }
  return context;
}
