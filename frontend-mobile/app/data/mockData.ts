// Mock data pour l'application receveur de bord

export interface Bus {
  id: string;
  number: string;
  capacity: number;
}

export interface Route {
  id: string;
  name: string;
  departure: string;
  destination: string;
  stops: Stop[];
}

export interface Stop {
  id: string;
  name: string;
  distanceKm: number;
  baseFare: number;
}

export interface Seat {
  number: number;
  status: 'available' | 'reserved-counter' | 'sold-onboard';
  passenger?: Passenger;
}

export interface Passenger {
  id: string;
  ticketNumber: string;
  counterMatricule: string;
  seatNumber: number;
  qrCode: string;
  boardingStop: string;
  destinationStop: string;
  fare: number;
  validated: boolean;
}

export interface Ticket {
  id: string;
  from: string;
  to: string;
  fare: number;
  discount: number;
  total: number;
  timestamp: Date;
  qrCode: string;
}

export const BUSES: Bus[] = [
  { id: '1', number: '3121', capacity: 48 },
  { id: '2', number: '3122', capacity: 48 },
  { id: '3', number: '3123', capacity: 52 },
];

export const ROUTES: Route[] = [
  {
    id: '1',
    name: 'Tunis - Kairouan',
    departure: 'Tunis',
    destination: 'Kairouan',
    stops: [
      { id: 's1', name: 'Tunis', distanceKm: 0, baseFare: 0 },
      { id: 's2', name: 'Enfidha', distanceKm: 65, baseFare: 6.5 },
      { id: 's3', name: 'Bouficha', distanceKm: 85, baseFare: 7.6 },
      { id: 's4', name: 'Kondar', distanceKm: 110, baseFare: 9.2 },
      { id: 's5', name: 'Kairouan', distanceKm: 160, baseFare: 12.0 },
    ],
  },
  {
    id: '2',
    name: 'Tunis - Sousse',
    departure: 'Tunis',
    destination: 'Sousse',
    stops: [
      { id: 's1', name: 'Tunis', distanceKm: 0, baseFare: 0 },
      { id: 's2', name: 'Hammamet', distanceKm: 65, baseFare: 6.5 },
      { id: 's3', name: 'Sousse', distanceKm: 140, baseFare: 10.5 },
    ],
  },
];

export const MOCK_RESERVED_PASSENGERS: Passenger[] = [
  {
    id: 'p1',
    ticketNumber: 'GCT-2026-001',
    counterMatricule: 'GCT-2045',
    seatNumber: 12,
    qrCode: 'RES-001-12',
    boardingStop: 'Tunis',
    destinationStop: 'Kairouan',
    fare: 12.0,
    validated: false,
  },
  {
    id: 'p2',
    ticketNumber: 'GCT-2026-002',
    counterMatricule: 'GCT-2045',
    seatNumber: 15,
    qrCode: 'RES-002-15',
    boardingStop: 'Tunis',
    destinationStop: 'Enfidha',
    fare: 6.5,
    validated: false,
  },
  {
    id: 'p3',
    ticketNumber: 'GCT-2026-003',
    counterMatricule: 'GCT-1823',
    seatNumber: 23,
    qrCode: 'RES-003-23',
    boardingStop: 'Tunis',
    destinationStop: 'Bouficha',
    fare: 7.6,
    validated: true,
  },
  {
    id: 'p4',
    ticketNumber: 'GCT-2026-004',
    counterMatricule: 'GCT-2045',
    seatNumber: 8,
    qrCode: 'RES-004-08',
    boardingStop: 'Tunis',
    destinationStop: 'Kairouan',
    fare: 12.0,
    validated: false,
  },
];

export const DISCOUNT_TYPES = [
  { id: 'none', label: 'Aucune', percentage: 0 },
  { id: 'student', label: 'Étudiant', percentage: 25 },
  { id: 'military', label: 'Militaire', percentage: 50 },
  { id: 'senior', label: 'Senior (65+)', percentage: 30 },
];

export const INCIDENT_TYPES = [
  { id: 'engine', label: 'Panne Moteur', icon: '🔧' },
  { id: 'accident', label: 'Accident', icon: '⚠️' },
  { id: 'road-closed', label: 'Route Barrée', icon: '🚧' },
  { id: 'delay', label: 'Retard Important', icon: '⏰' },
  { id: 'other', label: 'Autre', icon: '📝' },
];

// Fonction pour générer un plan de salle initial
export function generateInitialSeats(capacity: number): Seat[] {
  const seats: Seat[] = [];
  const reservedSeats = MOCK_RESERVED_PASSENGERS.map((p) => p.seatNumber);

  for (let i = 1; i <= capacity; i++) {
    if (reservedSeats.includes(i)) {
      const passenger = MOCK_RESERVED_PASSENGERS.find((p) => p.seatNumber === i);
      seats.push({
        number: i,
        status: 'reserved-counter',
        passenger,
      });
    } else {
      seats.push({
        number: i,
        status: 'available',
      });
    }
  }

  return seats;
}