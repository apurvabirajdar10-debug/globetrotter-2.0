import React, { useState, useMemo } from 'react';
import {
  Train,
  Bus,
  Plane,
  Car,
  Hotel,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Star,
  Users,
  CreditCard,
  Luggage,
  Sparkles,
  ChevronDown,
  X,
  Compass,
  AlertTriangle,
  QrCode,
  Download,
  Share2,
  Check,
  Landmark,
  Building2,
  Trees,
  FerrisWheel,
  Bike
} from 'lucide-react';
import { Trip, Activity, Stop } from '../types/travel';
import { api } from '../lib/api';

interface BookingsViewProps {
  trips: Trip[];
  activeTrip: Trip | null;
  onSelectTrip: (trip: Trip) => void;
  onTripUpdated?: (trip: Trip) => void;
}

export interface ConfirmedBooking {
  id: string;
  type: 'train' | 'bus' | 'flight' | 'vehicle' | 'stay' | 'attraction';
  title: string;
  subtitle: string;
  bookingRef: string;
  travelDate: string;
  origin?: string;
  destination: string;
  amount: number;
  passengersOrGuests: string;
  status: 'Confirmed' | 'Completed';
  categoryLabel: string;
  details: Record<string, string>;
  qrData?: string;
}

export const BookingsView: React.FC<BookingsViewProps> = ({
  trips,
  activeTrip,
  onSelectTrip,
  onTripUpdated,
}) => {
  // Main Subsections: 'travel' | 'stay' | 'attractions' | 'my-bookings'
  const [activeSubSection, setActiveSubSection] = useState<'travel' | 'stay' | 'attractions' | 'my-bookings'>('travel');

  // Travelling sub-tabs: 'train' | 'bus' | 'flight' | 'vehicle'
  const [travelTab, setTravelTab] = useState<'train' | 'bus' | 'flight' | 'vehicle'>('train');

  // Vehicle sub-toggle: 'cars' | 'bikes'
  const [vehicleType, setVehicleType] = useState<'cars' | 'bikes'>('cars');

  // Local state for confirmed bookings archive (stored in component session + synced)
  const [confirmedBookings, setConfirmedBookings] = useState<ConfirmedBooking[]>([
    {
      id: 'BK-1049',
      type: 'train',
      title: 'TGV InOui High-Speed Express (Paris Gare de Lyon → Lyon Part-Dieu)',
      subtitle: 'Coach 4, Seats 32 & 33 (First Class)',
      bookingRef: 'SNCF-948201',
      travelDate: '2026-06-12',
      origin: 'Paris',
      destination: 'Lyon',
      amount: 4850,
      passengersOrGuests: '2 Adults',
      status: 'Confirmed',
      categoryLabel: 'High-Speed Rail',
      details: { 'Train No': 'TGV-6612', 'Departure': '08:26 AM', 'Platform': 'Hall 2' }
    },
    {
      id: 'BK-1050',
      type: 'attraction',
      title: 'Louvre Museum: Timed-Entry & Mona Lisa Priority Ticket',
      subtitle: 'Pyramid Fast-Track Entrance • 10:00 AM Slot',
      bookingRef: 'LVR-773910',
      travelDate: '2026-06-11',
      destination: 'Paris',
      amount: 2975,
      passengersOrGuests: '2 Adults',
      status: 'Confirmed',
      categoryLabel: 'Museum Entry',
      details: { 'Time Slot': '10:00 AM', 'Entry Gate': 'Pyramid Main', 'Audio Guide': 'Included' }
    }
  ]);

  // Modal states for reservation flow
  const [activeReservationModal, setActiveReservationModal] = useState<any | null>(null);
  const [activeTicketVoucher, setActiveTicketVoucher] = useState<ConfirmedBooking | null>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [addToTripExpensesChecked, setAddToTripExpensesChecked] = useState(true);

  // User's itinerary destination cities (derived from activeTrip)
  const itineraryCities = useMemo(() => {
    if (!activeTrip || !activeTrip.stops || activeTrip.stops.length === 0) {
      return ['Paris', 'Barcelona', 'Rome', 'Tokyo'];
    }
    return activeTrip.stops.map(s => s.city_name);
  }, [activeTrip]);

  const defaultOrigin = activeTrip?.stops?.[0]?.city_name || 'Paris';
  const defaultDestination = activeTrip?.stops?.[1]?.city_name || activeTrip?.stops?.[0]?.city_name || 'Barcelona';

  /* ==========================================================================
     SUB-SECTION 1: TRAVELLING SEARCH STATES & DATA
     ========================================================================== */
  const [trainSearch, setTrainSearch] = useState({
    from: defaultOrigin,
    to: defaultDestination,
    date: activeTrip?.start_date || '2026-06-10',
    travelClass: 'AC 1st Class / Executive',
    quota: 'General'
  });

  const [busSearch, setBusSearch] = useState({
    from: defaultOrigin,
    to: defaultDestination,
    date: activeTrip?.start_date || '2026-06-10',
    busType: 'AC Volvo Multi-Axle'
  });

  const [flightSearch, setFlightSearch] = useState({
    from: defaultOrigin,
    to: defaultDestination,
    date: activeTrip?.start_date || '2026-06-10',
    cabinClass: 'Economy',
    passengers: 1
  });

  const [vehicleSearch, setVehicleSearch] = useState({
    pickupCity: defaultOrigin,
    pickupDate: activeTrip?.start_date || '2026-06-10',
    dropoffDate: activeTrip?.end_date || '2026-06-15',
  });

  // Mock Travel Catalogs in Rupees (₹)
  const trainRoutes = [
    {
      id: 'tr-1',
      trainName: 'Vande Bharat / TGV High-Speed Express',
      trainNo: 'VB-22436',
      from: trainSearch.from,
      to: trainSearch.to,
      departTime: '06:00 AM',
      arriveTime: '11:45 AM',
      duration: '5h 45m',
      classes: ['Executive (EC)', 'AC Chair Car (CC)', 'First AC (1A)'],
      price: 2450,
      availability: 'Available (42 seats)',
      rating: 4.8,
      punctuality: '98% On Time',
      badge: 'Fastest Route'
    },
    {
      id: 'tr-2',
      trainName: 'Eurostar Intercity Express',
      trainNo: 'ES-9014',
      from: trainSearch.from,
      to: trainSearch.to,
      departTime: '09:15 AM',
      arriveTime: '04:10 PM',
      duration: '6h 55m',
      classes: ['Standard Premier', 'Standard', 'Business Premier'],
      price: 3650,
      availability: 'Available (18 seats)',
      rating: 4.7,
      punctuality: '95% On Time',
      badge: 'Scenic Views'
    },
    {
      id: 'tr-3',
      trainName: 'Overnight Sleeper Superfast',
      trainNo: 'EXP-12952',
      from: trainSearch.from,
      to: trainSearch.to,
      departTime: '10:30 PM',
      arriveTime: '07:15 AM',
      duration: '8h 45m',
      classes: ['AC 2-Tier (2A)', 'AC 3-Tier (3A)', 'First AC (1A)'],
      price: 1850,
      availability: 'Available (64 berths)',
      rating: 4.6,
      punctuality: '92% On Time',
      badge: 'Save Hotel Night'
    }
  ];

  const busRoutes = [
    {
      id: 'bus-1',
      operator: 'IntrCity SmartBus Volvo 9600 Multi-Axle',
      busType: 'AC Sleeper (2+1)',
      from: busSearch.from,
      to: busSearch.to,
      departTime: '07:30 PM',
      arriveTime: '05:45 AM',
      duration: '10h 15m',
      rating: 4.8,
      reviewCount: 1420,
      amenities: ['Free Wi-Fi', 'USB Charging', 'Fresh Blanket', 'Mineral Water', 'GPS Tracking'],
      price: 1250,
      seatsLeft: 12,
      badge: 'Top Rated'
    },
    {
      id: 'bus-2',
      operator: 'Zingbus Premier Mercedes Benz',
      busType: 'AC Semi-Sleeper (2+2)',
      from: busSearch.from,
      to: busSearch.to,
      departTime: '09:00 PM',
      arriveTime: '06:30 AM',
      duration: '9h 30m',
      rating: 4.7,
      reviewCount: 980,
      amenities: ['Emergency SOS', 'Reading Lights', 'Live Tracking', 'Water Bottle'],
      price: 990,
      seatsLeft: 19,
      badge: 'Budget Friendly'
    },
    {
      id: 'bus-3',
      operator: 'FlixBus Intercity Euro Express',
      busType: 'Comfort Seater High-Deck',
      from: busSearch.from,
      to: busSearch.to,
      departTime: '08:15 AM',
      arriveTime: '04:45 PM',
      duration: '8h 30m',
      rating: 4.6,
      reviewCount: 2310,
      amenities: ['Free Wi-Fi', 'Luggage Space', 'Snack Bar Onboard'],
      price: 850,
      seatsLeft: 8,
      badge: 'Daytime Route'
    }
  ];

  const flightRoutes = [
    {
      id: 'fl-1',
      airline: 'IndiGo / Air France Partner',
      flightNo: '6E-402 / AF-1784',
      from: flightSearch.from,
      to: flightSearch.to,
      departTime: '07:15 AM',
      arriveTime: '09:05 AM',
      duration: '1h 50m (Non-stop)',
      stops: 'Non-stop',
      baggage: '15 kg Check-in • 7 kg Cabin',
      price: 5499,
      refundable: 'Refundable on cancellation',
      rating: 4.7,
      badge: 'Best Value'
    },
    {
      id: 'fl-2',
      airline: 'Air India / Lufthansa',
      flightNo: 'AI-143 / LH-205',
      from: flightSearch.from,
      to: flightSearch.to,
      departTime: '11:40 AM',
      arriveTime: '01:35 PM',
      duration: '1h 55m (Non-stop)',
      stops: 'Non-stop',
      baggage: '25 kg Check-in • 8 kg Cabin',
      price: 7200,
      refundable: 'Flexible Date Change',
      rating: 4.8,
      badge: 'Free Hot Meal'
    },
    {
      id: 'fl-3',
      airline: 'Emirates / Vistara Connection',
      flightNo: 'EK-72 / UK-994',
      from: flightSearch.from,
      to: flightSearch.to,
      departTime: '04:20 PM',
      arriveTime: '09:10 PM',
      duration: '4h 50m (1 Short Layover)',
      stops: '1 Layover (1h 10m)',
      baggage: '30 kg Check-in • 7 kg Cabin',
      price: 9850,
      refundable: 'Full Refund with Fee',
      rating: 4.9,
      badge: 'Premium Comfort'
    }
  ];

  const rentalVehicles = [
    {
      id: 'veh-1',
      category: 'cars',
      name: 'Hyundai Creta / Tucson SX(O)',
      type: 'Compact SUV • 5 Seats',
      transmission: 'Automatic',
      fuel: 'Petrol • 17 km/l',
      features: ['Unlimited km', 'Zero Security Deposit', 'Free Cancellation up to 6 hrs'],
      pricePerDay: 2800,
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
      rating: 4.9,
      tripsCompleted: 142
    },
    {
      id: 'veh-2',
      category: 'cars',
      name: 'Mahindra Thar 4x4 Hardtop',
      type: 'Adventure SUV • 4 Seats',
      transmission: 'Manual 4x4',
      fuel: 'Diesel',
      features: ['Off-road Capable', 'Convertible Feel', 'GPS Included'],
      pricePerDay: 3900,
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
      rating: 4.8,
      tripsCompleted: 89
    },
    {
      id: 'veh-3',
      category: 'cars',
      name: 'Maruti Suzuki Swift / Polo',
      type: 'Economical Hatchback • 5 Seats',
      transmission: 'Manual',
      fuel: 'Petrol • 21 km/l',
      features: ['Easy City Parking', '300 km/day included', 'Comprehensive Insurance'],
      pricePerDay: 1450,
      image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=600&q=80',
      rating: 4.7,
      tripsCompleted: 310
    },
    {
      id: 'veh-4',
      category: 'bikes',
      name: 'Royal Enfield Classic 350 Stealth Black',
      type: 'Cruiser Motorcycle',
      transmission: '5-Speed Manual',
      fuel: 'Petrol • 36 km/l',
      features: ['2 ISI Certified Helmets', 'Mobile Mount & Charger', 'Roadside Assistance'],
      pricePerDay: 850,
      image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
      rating: 4.9,
      tripsCompleted: 520
    },
    {
      id: 'veh-5',
      category: 'bikes',
      name: 'Royal Enfield Himalayan 450 Adv',
      type: 'Adventure Tourer',
      transmission: '6-Speed Manual',
      fuel: 'Petrol • Dual ABS',
      features: ['Panniers Ready', 'Long-Range Tank', 'TFT Navigation'],
      pricePerDay: 1350,
      image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=600&q=80',
      rating: 4.9,
      tripsCompleted: 215
    },
    {
      id: 'veh-6',
      category: 'bikes',
      name: 'Honda Activa 6G / Vespa Elegante',
      type: 'Automatic Scooter',
      transmission: 'CVT Automatic',
      fuel: 'Petrol • 50 km/l',
      features: ['Under-seat Storage', 'Lightweight & Agile', 'Helmet Included'],
      pricePerDay: 450,
      image: 'https://images.unsplash.com/photo-1597687210367-a4915552d890?auto=format&fit=crop&w=600&q=80',
      rating: 4.6,
      tripsCompleted: 640
    }
  ];

  /* ==========================================================================
     SUB-SECTION 2: STAY / ACCOMMODATION (SORTED CHEAPEST TO MOST EXPENSIVE)
     ========================================================================== */
  const [stayCityFilter, setStayCityFilter] = useState<string>('All');
  const [stayTypeFilter, setStayTypeFilter] = useState<string>('All');
  const [staySortBy, setStaySortBy] = useState<'price-asc' | 'price-desc' | 'rating' | 'distance'>('price-asc');
  const [stayMaxPrice, setStayMaxPrice] = useState<number>(25000);

  // Raw Accommodations across Destinations
  const rawAccommodations = [
    {
      id: 'st-1',
      name: 'Highway Star Express Motel & Suites',
      type: 'Motel',
      city: 'Paris',
      country: 'France',
      location: 'Suburban Ring Road • Free Parking',
      pricePerNight: 1050,
      rating: 4.2,
      reviewsCount: 310,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
      perks: ['Free Parking', '24/7 Check-in', 'Drive-in Motel Rooms', 'Free Breakfast Snack'],
      tag: 'Cheapest Stay'
    },
    {
      id: 'st-2',
      name: 'Backpacker Central Pods & Hostel',
      type: 'Hostel / Budget Stay',
      city: 'Barcelona',
      country: 'Spain',
      location: 'Near Gothic Quarter • 200m to Metro',
      pricePerNight: 1290,
      rating: 4.6,
      reviewsCount: 840,
      image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80',
      perks: ['Privacy Pods', 'Free High-Speed Wi-Fi', 'Rooftop Social Lounge', 'Keycard Access'],
      tag: 'Backpacker Choice'
    },
    {
      id: 'st-3',
      name: 'Travelers Oasis Roadside Motel',
      type: 'Motel',
      city: 'Rome',
      country: 'Italy',
      location: 'Highway Exit 12 • 15 min to Center',
      pricePerNight: 1450,
      rating: 4.3,
      reviewsCount: 195,
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80',
      perks: ['Air Conditioned', 'Free Ground Parking', 'Pet Friendly', 'Self-Check-in Kiosk'],
      tag: 'Road Trip Pick'
    },
    {
      id: 'st-4',
      name: 'Montmartre Charm Heritage Inn',
      type: 'Budget Hotel',
      city: 'Paris',
      country: 'France',
      location: 'Montmartre Village • Sacré-Cœur views',
      pricePerNight: 2350,
      rating: 4.5,
      reviewsCount: 620,
      image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80',
      perks: ['Continental Breakfast', 'Private Bathroom', 'Elevator', 'Tea/Coffee Maker'],
      tag: 'Best Value City Stay'
    },
    {
      id: 'st-5',
      name: 'Ramblas Terrace Boutique Hotel (3★)',
      type: 'Boutique Hotel',
      city: 'Barcelona',
      country: 'Spain',
      location: 'Las Ramblas • 5 min to Boqueria Market',
      pricePerNight: 3600,
      rating: 4.7,
      reviewsCount: 940,
      image: 'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?auto=format&fit=crop&w=600&q=80',
      perks: ['Rooftop Solarium', 'Free Buffet Breakfast', 'Soundproof Windows', 'City Center'],
      tag: 'Traveler Favorite'
    },
    {
      id: 'st-6',
      name: 'Navona Square Courtyard Hotel (4★)',
      type: 'Boutique Hotel',
      city: 'Rome',
      country: 'Italy',
      location: 'Piazza Navona • Historic Center',
      pricePerNight: 4800,
      rating: 4.8,
      reviewsCount: 1120,
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80',
      perks: ['Italian Marble Bath', 'Complimentary Wine Hour', 'Concierge Service', 'Garden Patio'],
      tag: 'Prime Location'
    },
    {
      id: 'st-7',
      name: 'Tokyo Bay Panorama Skyline Hotel (4★)',
      type: 'Hotel',
      city: 'Tokyo',
      country: 'Japan',
      location: 'Shinjuku Center • Direct Station Link',
      pricePerNight: 6200,
      rating: 4.8,
      reviewsCount: 780,
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
      perks: ['Onsen Hot Spring Baths', 'Fuji View High Floors', 'Robot Luggage Delivery'],
      tag: 'Modern Luxury'
    },
    {
      id: 'st-8',
      name: 'The Ritz & Palace Heritage Resort (5★)',
      type: 'Luxury Resort',
      city: 'Paris',
      country: 'France',
      location: 'Place Vendôme • Golden Triangle',
      pricePerNight: 18500,
      rating: 4.95,
      reviewsCount: 1450,
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80',
      perks: ['Michelin Dining', 'Roman Pool & Spa', 'Private Butler Service', 'Limousine Transfer'],
      tag: 'Ultra Luxury'
    }
  ];

  // Stays arranged automatically from cheapest to most expensive range, with sorting/filtering
  const processedStays = useMemo(() => {
    return rawAccommodations
      .filter((stay) => {
        if (stayCityFilter !== 'All' && stay.city !== stayCityFilter) return false;
        if (stayTypeFilter !== 'All') {
          if (stayTypeFilter === 'Motel' && stay.type !== 'Motel') return false;
          if (stayTypeFilter === 'Budget' && !stay.type.includes('Budget') && !stay.type.includes('Hostel')) return false;
          if (stayTypeFilter === 'Hotel' && !stay.type.includes('Hotel')) return false;
          if (stayTypeFilter === 'Luxury' && !stay.type.includes('Luxury')) return false;
        }
        if (stay.pricePerNight > stayMaxPrice) return false;
        return true;
      })
      .sort((a, b) => {
        if (staySortBy === 'price-asc') return a.pricePerNight - b.pricePerNight; // CHEAPEST FIRST (DEFAULT)
        if (staySortBy === 'price-desc') return b.pricePerNight - a.pricePerNight;
        if (staySortBy === 'rating') return b.rating - a.rating;
        return a.pricePerNight - b.pricePerNight;
      });
  }, [stayCityFilter, stayTypeFilter, staySortBy, stayMaxPrice]);

  /* ==========================================================================
     SUB-SECTION 3: PRE-BOOKING ATTRACTIONS (MUSEUMS, ZOOS, AMUSEMENT PARKS, MONUMENTS)
     ========================================================================== */
  const [attractionCategoryFilter, setAttractionCategoryFilter] = useState<'All' | 'museum' | 'zoo' | 'amusement' | 'monument'>('All');
  const [attractionCityFilter, setAttractionCityFilter] = useState<string>('All');

  const rawAttractions = [
    // Museums
    {
      id: 'att-1',
      title: 'The Louvre Museum: Timed-Entry & Denon Wing Mona Lisa Access',
      category: 'museum',
      city: 'Paris',
      country: 'France',
      advanceRequirement: 'Strict 30-min slot booking mandatory • Sells out 2 weeks ahead',
      highlights: ['Priority Pyramid Fast Track', 'Denon & Sully Wings Access', 'Interactive Audio Guide'],
      ticketPrice: 2975,
      slots: ['09:30 AM', '11:00 AM', '01:30 PM', '03:45 PM'],
      duration: '3.5 Hours',
      image: 'https://images.unsplash.com/photo-1565099824688-e93eb20fe622?auto=format&fit=crop&w=600&q=80',
      badge: 'High Demand'
    },
    {
      id: 'att-2',
      title: 'Vatican Museums & Sistine Chapel Skip-The-Line Access',
      category: 'museum',
      city: 'Rome',
      country: 'Italy',
      advanceRequirement: 'Official timed entry required • No on-spot ticket sales',
      highlights: ['Michelangelo Ceiling', 'Raphael Rooms', 'St. Peter\'s Direct Corridor'],
      ticketPrice: 3450,
      slots: ['08:45 AM', '10:15 AM', '02:00 PM', '04:00 PM'],
      duration: '3.0 Hours',
      image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80',
      badge: 'Fast Track'
    },
    {
      id: 'att-3',
      title: 'Picasso Museum & Born Medieval Quarter Guided Entry',
      category: 'museum',
      city: 'Barcelona',
      country: 'Spain',
      advanceRequirement: 'Capacity restricted • Pre-booking saves 1.5 hr queue',
      highlights: ['Blue Period Masterpieces', 'Palau Berenguer d\'Aguilar entry', 'Multilingual Audio'],
      ticketPrice: 1650,
      slots: ['10:00 AM', '12:30 PM', '03:00 PM', '05:15 PM'],
      duration: '2.0 Hours',
      image: 'https://images.unsplash.com/photo-1582561424760-0321d75e81fa?auto=format&fit=crop&w=600&q=80',
      badge: 'Cultural Landmark'
    },

    // Zoos & Wildlife Parks
    {
      id: 'att-4',
      title: 'Barcelona Zoo & Marine Biodiversity Biodome',
      category: 'zoo',
      city: 'Barcelona',
      country: 'Spain',
      advanceRequirement: 'Advance barcode scan for instant entrance through Ciutadella Park',
      highlights: ['Dolphin Observatory', 'Savannah Habitat', 'Electric Safari Tram Included'],
      ticketPrice: 1980,
      slots: ['10:00 AM', '12:00 PM', '02:00 PM'],
      duration: '4.0 Hours',
      image: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=600&q=80',
      badge: 'Family Favorite'
    },
    {
      id: 'att-5',
      title: 'Tokyo Ueno Zoo & Giant Panda Reserve',
      category: 'zoo',
      city: 'Tokyo',
      country: 'Japan',
      advanceRequirement: 'Panda viewing requires designated advance QR lottery entry',
      highlights: ['Giant Panda Pavilion', 'Ancient 5-Story Pagoda Walk', 'Shinobazu Pond Aviary'],
      ticketPrice: 850,
      slots: ['09:30 AM', '11:30 AM', '01:30 PM', '03:00 PM'],
      duration: '3.0 Hours',
      image: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&w=600&q=80',
      badge: 'Limited Slots'
    },

    // Amusement & Theme Parks
    {
      id: 'att-6',
      title: 'Disneyland Paris: 1-Day 2-Parks Dated Entry Pass',
      category: 'amusement',
      city: 'Paris',
      country: 'France',
      advanceRequirement: 'Dated pre-registration required by Disney • Gate tickets not sold',
      highlights: ['Disneyland Park & Walt Disney Studios', 'Avengers Campus Access', 'Nighttime Drone Show'],
      ticketPrice: 7850,
      slots: ['All-Day 09:30 AM - 11:00 PM'],
      duration: 'Full Day',
      image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
      badge: 'Premier Pass'
    },
    {
      id: 'att-7',
      title: 'PortAventura World & Ferrari Land Express Pass',
      category: 'amusement',
      city: 'Barcelona',
      country: 'Spain',
      advanceRequirement: 'Europe\'s fastest roller coaster • Advance skip-the-line queue access',
      highlights: ['Red Force 180 km/h Coaster', '6 Themed Worlds', 'Direct train station connectivity'],
      ticketPrice: 5200,
      slots: ['All-Day 10:00 AM - 08:00 PM'],
      duration: 'Full Day',
      image: 'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?auto=format&fit=crop&w=600&q=80',
      badge: 'Adrenaline Thrill'
    },
    {
      id: 'att-8',
      title: 'Tokyo DisneySea & Fantasy Springs Premier Entry',
      category: 'amusement',
      city: 'Tokyo',
      country: 'Japan',
      advanceRequirement: 'Strict reservation required on Tokyo Disney Resort App',
      highlights: ['Only DisneySea in the World', 'Fantasy Springs Access', 'Tower of Terror'],
      ticketPrice: 6400,
      slots: ['All-Day 09:00 AM - 09:00 PM'],
      duration: 'Full Day',
      image: 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?auto=format&fit=crop&w=600&q=80',
      badge: 'Global Exclusive'
    },

    // Monuments & Landmarks
    {
      id: 'att-9',
      title: 'Eiffel Tower: Summit by Glass Lift & Champagne Bar',
      category: 'monument',
      city: 'Paris',
      country: 'France',
      advanceRequirement: 'Summit tickets sell out 60 days in advance • Advance slot mandatory',
      highlights: ['Top 276m Observation Deck', 'Direct Lift Access (Floor 1, 2 & 3)', 'Gustave Eiffel Office'],
      ticketPrice: 2975,
      slots: ['10:00 AM', '02:30 PM', '06:00 PM', '08:30 PM (Sunset/Illumination)'],
      duration: '2.5 Hours',
      image: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=600&q=80',
      badge: 'Iconic Summit'
    },
    {
      id: 'att-10',
      title: 'Sagrada Família: Nativity Towers & Crypt Skip-The-Line',
      category: 'monument',
      city: 'Barcelona',
      country: 'Spain',
      advanceRequirement: 'Strict 15-minute entrance window • Radio audio-guide provided',
      highlights: ['Nativity Tower Climb & Elevator', 'Gaudi\'s Stained Glass Illumination', 'Museum Crypt'],
      ticketPrice: 3230,
      slots: ['09:15 AM', '11:45 AM', '03:15 PM', '05:30 PM'],
      duration: '2.5 Hours',
      image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=600&q=80',
      badge: 'Must Pre-Book'
    },
    {
      id: 'att-11',
      title: 'Rome Colosseum, Arena Floor & Roman Forum VIP Entry',
      category: 'monument',
      city: 'Rome',
      country: 'Italy',
      advanceRequirement: 'Government quota permits only 3,000 visitors/day • Pre-book mandatory',
      highlights: ['Gladiator Arena Floor Access', 'Palatine Hill Emperors Palace', 'Ancient Roman Forum'],
      ticketPrice: 2850,
      slots: ['09:00 AM', '11:30 AM', '02:00 PM', '04:15 PM'],
      duration: '3.0 Hours',
      image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80',
      badge: 'Gladiator Arena'
    }
  ];

  // Automatically pulls in attractions from the user's chosen itinerary destinations
  const processedAttractions = useMemo(() => {
    return rawAttractions
      .filter((item) => {
        // If city filter is applied, respect it
        if (attractionCityFilter !== 'All') {
          return item.city.toLowerCase() === attractionCityFilter.toLowerCase();
        }
        // If user has an active trip with stops, prioritize/filter by chosen destinations
        if (activeTrip && activeTrip.stops && activeTrip.stops.length > 0) {
          const userStopCities = activeTrip.stops.map(s => s.city_name.toLowerCase());
          const matchesTrip = userStopCities.some(cityName =>
            item.city.toLowerCase().includes(cityName) || cityName.includes(item.city.toLowerCase())
          );
          if (!matchesTrip) {
            // Keep general attractions if no direct match, but sort trip-matched first
            return true;
          }
        }
        return true;
      })
      .filter((item) => {
        if (attractionCategoryFilter === 'All') return true;
        return item.category === attractionCategoryFilter;
      })
      .sort((a, b) => {
        // Prioritize items that match the user's active trip stops
        if (activeTrip && activeTrip.stops) {
          const userStopCities = activeTrip.stops.map(s => s.city_name.toLowerCase());
          const aMatches = userStopCities.some(c => a.city.toLowerCase().includes(c));
          const bMatches = userStopCities.some(c => b.city.toLowerCase().includes(c));
          if (aMatches && !bMatches) return -1;
          if (!aMatches && bMatches) return 1;
        }
        return 0;
      });
  }, [rawAttractions, activeTrip, attractionCategoryFilter, attractionCityFilter]);

  /* ==========================================================================
     MOCK BOOKING EXECUTION FLOW
     ========================================================================== */
  const handleOpenReservation = (bookingType: string, itemData: any) => {
    setActiveReservationModal({
      type: bookingType,
      item: itemData,
      passengers: 1,
      passengerName: 'Alex Morgan',
      contactEmail: 'alex@globetrotter.io',
      contactPhone: '+91 98765 43210',
      travelDate: itemData.date || activeTrip?.start_date || '2026-06-15',
      timeSlot: itemData.slots ? itemData.slots[0] : (itemData.departTime || 'Morning Slot'),
      specialRequests: ''
    });
  };

  const handleConfirmReservation = async () => {
    if (!activeReservationModal) return;
    setIsSubmittingBooking(true);

    const { type, item, passengerName, contactEmail, travelDate, timeSlot, passengers } = activeReservationModal;
    const refCode = (type.toUpperCase().substring(0, 3)) + '-' + Math.floor(100000 + Math.random() * 900000);
    const costTotal = (item.price || item.pricePerNight || item.ticketPrice || item.pricePerDay || 1500) * (passengers || 1);

    const newBooking: ConfirmedBooking = {
      id: 'BK-' + Math.floor(1000 + Math.random() * 9000),
      type: type as any,
      title: item.title || item.trainName || item.operator || item.airline || item.name,
      subtitle: `${type === 'stay' ? 'Room Stay' : type === 'attraction' ? 'Advance Admission' : 'Reserved Seat'} • ${timeSlot}`,
      bookingRef: refCode,
      travelDate: travelDate,
      origin: item.from || item.city,
      destination: item.to || item.city,
      amount: costTotal,
      passengersOrGuests: `${passengers || 1} Traveler${(passengers || 1) > 1 ? 's' : ''} (${passengerName})`,
      status: 'Confirmed',
      categoryLabel: type.toUpperCase(),
      details: {
        'Contact Email': contactEmail,
        'Booking Reference': refCode,
        'Selected Slot / Schedule': timeSlot,
        'Currency': 'INR (₹)'
      },
      qrData: `GT-CONFIRMED|${refCode}|${costTotal}|${travelDate}`
    };

    // If activeTrip exists and user checked "Add to Trip Expenses/Itinerary"
    if (activeTrip && addToTripExpensesChecked) {
      try {
        let expenseCategory: 'transport' | 'stay' | 'activities' = 'transport';
        if (type === 'stay') expenseCategory = 'stay';
        if (type === 'attraction') expenseCategory = 'activities';

        // Add expense via API
        await api.addExpense(activeTrip.id, {
          title: `Pre-Booking: ${newBooking.title.substring(0, 45)}`,
          category: expenseCategory,
          amount: costTotal,
          currency: 'INR',
          date: travelDate,
          paid_by: passengerName,
          notes: `Booking Ref: ${refCode}. Auto-synced from Bookings concierge.`
        });

        // If attraction, also link to stop activities if matching stop exists
        if (type === 'attraction' && activeTrip.stops && activeTrip.stops.length > 0) {
          const matchingStop = activeTrip.stops.find(s => s.city_name.toLowerCase().includes(item.city.toLowerCase())) || activeTrip.stops[0];
          await api.addActivity(matchingStop.id, {
            title: `🎟️ [Booked] ${item.title.substring(0, 40)}`,
            description: `Advance entry confirmed. Ref: ${refCode}. Slot: ${timeSlot}.`,
            date: travelDate,
            time_slot: timeSlot.toLowerCase().includes('pm') ? 'afternoon' : 'morning',
            category: 'sightseeing',
            cost: costTotal,
            duration_hours: 2.5,
            location: `${item.city}, ${item.country}`
          });
        }

        // Fetch refreshed trip
        const fresh = await api.getTrip(activeTrip.id);
        if (onTripUpdated) onTripUpdated(fresh.trip);
      } catch (e) {
        console.warn('Could not auto-add expense/activity to trip:', e);
      }
    }

    setConfirmedBookings(prev => [newBooking, ...prev]);
    setIsSubmittingBooking(false);
    setActiveReservationModal(null);
    setActiveTicketVoucher(newBooking);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Concierge Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold mb-3 border border-sky-400/30">
              <Ticket className="w-3.5 h-3.5" />
              <span>Dedicated Multi-City Travel Bookings Concierge</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif-heading tracking-tight text-white">
              Reservations & Pre-Bookings Hub
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Book seamless intercity transit (Train, Bus, Flight & Car/Bike), reserve verified stays from cheapest to luxury, and pre-book advance entry tickets for famous museums, zoos, and monuments.
            </p>
          </div>

          {/* Active Trip Selector / Sync Indicator */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 shrink-0 min-w-[260px]">
            <div className="text-[11px] uppercase tracking-wider text-amber-300 font-bold mb-1.5 flex items-center justify-between">
              <span>Target Trip Itinerary</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            {activeTrip ? (
              <div>
                <p className="text-sm font-bold text-white truncate max-w-[220px]">{activeTrip.name}</p>
                <div className="flex items-center space-x-2 text-xs text-slate-300 mt-1">
                  <MapPin className="w-3 h-3 text-sky-400" />
                  <span>{activeTrip.stops?.length || 0} destinations connected</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-300">No trip selected. Defaulting to major world hubs.</p>
            )}

            {trips.length > 1 && (
              <div className="mt-3 pt-2.5 border-t border-white/10">
                <select
                  value={activeTrip?.id || ''}
                  onChange={(e) => {
                    const found = trips.find(t => t.id === Number(e.target.value));
                    if (found) onSelectTrip(found);
                  }}
                  className="w-full text-xs bg-slate-900/80 text-white rounded-lg px-2.5 py-1.5 border border-white/20 focus:outline-none"
                >
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Primary Sub-section Navigation Tabs */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setActiveSubSection('travel')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 ${
              activeSubSection === 'travel'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 ring-2 ring-sky-300'
                : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
            }`}
          >
            <Train className="w-4 h-4" />
            <span>1. Travelling (Transit)</span>
          </button>

          <button
            onClick={() => setActiveSubSection('stay')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 ${
              activeSubSection === 'stay'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 ring-2 ring-amber-300 font-extrabold'
                : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
            }`}
          >
            <Hotel className="w-4 h-4" />
            <span>2. Stay / Accommodation</span>
          </button>

          <button
            onClick={() => setActiveSubSection('attractions')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 ${
              activeSubSection === 'attractions'
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-300'
                : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>3. Pre-Booking Attractions</span>
          </button>

          <button
            onClick={() => setActiveSubSection('my-bookings')}
            className={`ml-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 ${
              activeSubSection === 'my-bookings'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-300'
                : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>My Confirmed Bookings ({confirmedBookings.length})</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SUB-SECTION 1: TRAVELLING SUB-SECTION (Train, Bus, Flight, Car/Bike)
          ========================================================================= */}
      {activeSubSection === 'travel' && (
        <div className="space-y-6">
          {/* Sub-tabs for the 4 travel transit modes */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 flex-1">
              <button
                onClick={() => setTravelTab('train')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  travelTab === 'train'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Train className="w-4 h-4" />
                <span>Train Bookings</span>
              </button>

              <button
                onClick={() => setTravelTab('bus')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  travelTab === 'bus'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Bus className="w-4 h-4" />
                <span>Bus Bookings</span>
              </button>

              <button
                onClick={() => setTravelTab('flight')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  travelTab === 'flight'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Plane className="w-4 h-4" />
                <span>Flight Bookings</span>
              </button>

              <button
                onClick={() => setTravelTab('vehicle')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  travelTab === 'vehicle'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Car className="w-4 h-4" />
                <span>Car / Bike Bookings</span>
              </button>
            </div>

            {travelTab === 'vehicle' && (
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 shrink-0">
                <button
                  onClick={() => setVehicleType('cars')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    vehicleType === 'cars' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Cars & SUVs
                </button>
                <button
                  onClick={() => setVehicleType('bikes')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    vehicleType === 'bikes' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Bikes & Scooters
                </button>
              </div>
            )}
          </div>

          {/* SEARCH FORM & RESULTS FOR TRAIN */}
          {travelTab === 'train' && (
            <div className="space-y-6">
              {/* Train Search Bar */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">From Station / City</label>
                  <input
                    type="text"
                    value={trainSearch.from}
                    onChange={(e) => setTrainSearch({ ...trainSearch, from: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">To Station / City</label>
                  <input
                    type="text"
                    value={trainSearch.to}
                    onChange={(e) => setTrainSearch({ ...trainSearch, to: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Travel Date</label>
                  <input
                    type="date"
                    value={trainSearch.date}
                    onChange={(e) => setTrainSearch({ ...trainSearch, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Class</label>
                  <select
                    value={trainSearch.travelClass}
                    onChange={(e) => setTrainSearch({ ...trainSearch, travelClass: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option>AC 1st Class / Executive</option>
                    <option>AC 2-Tier (2A)</option>
                    <option>AC 3-Tier (3A)</option>
                    <option>Sleeper (SL)</option>
                    <option>AC Chair Car (CC)</option>
                  </select>
                </div>
                <div>
                  <button className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-1.5">
                    <Search className="w-3.5 h-3.5" />
                    <span>Search Trains</span>
                  </button>
                </div>
              </div>

              {/* Train Cards List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                  <span>Available Trains on Route: <strong>{trainSearch.from} → {trainSearch.to}</strong></span>
                  <span className="text-emerald-600 font-semibold">Live Seat Availability Checked</span>
                </div>

                {trainRoutes.map((train) => (
                  <div key={train.id} className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-sky-300 transition-all shadow-sm hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold text-[10px] border border-sky-200">
                          {train.trainNo}
                        </span>
                        <h3 className="text-base font-bold text-slate-900">{train.trainName}</h3>
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-semibold">
                          {train.badge}
                        </span>
                      </div>

                      <div className="flex items-center space-x-6 text-xs text-slate-600">
                        <div>
                          <p className="text-base font-black text-slate-900">{train.departTime}</p>
                          <p className="text-slate-500">{train.from}</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-slate-600 font-semibold">{train.duration}</span>
                          <div className="w-20 h-0.5 bg-slate-300 relative my-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-sky-600 absolute -top-0.5 right-0" />
                          </div>
                          <span className="text-[10px] text-emerald-600 font-medium">{train.punctuality}</span>
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-900">{train.arriveTime}</p>
                          <p className="text-slate-500">{train.to}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {train.classes.map((cls, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-medium">
                            {cls}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 gap-3">
                      <div className="text-left sm:text-right">
                        <span className="text-[11px] text-emerald-600 font-bold block">{train.availability}</span>
                        <div className="text-xl font-black text-slate-900">
                          ₹{train.price.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-600 font-medium">per passenger • GST incl.</span>
                      </div>

                      <button
                        onClick={() => handleOpenReservation('train', train)}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                      >
                        Book Train Seat →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEARCH FORM & RESULTS FOR BUS */}
          {travelTab === 'bus' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Departure City</label>
                  <input
                    type="text"
                    value={busSearch.from}
                    onChange={(e) => setBusSearch({ ...busSearch, from: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Arrival City</label>
                  <input
                    type="text"
                    value={busSearch.to}
                    onChange={(e) => setBusSearch({ ...busSearch, to: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Date of Journey</label>
                  <input
                    type="date"
                    value={busSearch.date}
                    onChange={(e) => setBusSearch({ ...busSearch, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <button className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-1.5">
                    <Search className="w-3.5 h-3.5" />
                    <span>Search Buses</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {busRoutes.map((bus) => (
                  <div key={bus.id} className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-sky-300 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-bold text-slate-900">{bus.operator}</h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 flex items-center space-x-1">
                          <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                          <span>{bus.rating} ({bus.reviewCount})</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 text-[10px] font-semibold">
                          {bus.badge}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500">{bus.busType}</p>

                      <div className="flex items-center space-x-6 text-xs text-slate-600">
                        <div>
                          <p className="text-base font-black text-slate-900">{bus.departTime}</p>
                          <p className="text-slate-500">{bus.from}</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-slate-600 font-semibold">{bus.duration}</span>
                          <div className="w-20 h-0.5 bg-slate-300 relative my-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-sky-600 absolute -top-0.5 right-0" />
                          </div>
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-900">{bus.arriveTime}</p>
                          <p className="text-slate-500">{bus.to}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {bus.amenities.map((am, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px]">
                            ✓ {am}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 gap-3">
                      <div className="text-left sm:text-right">
                        <span className="text-[11px] text-amber-600 font-bold block">{bus.seatsLeft} berths left</span>
                        <div className="text-xl font-black text-slate-900">
                          ₹{bus.price.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-600 font-medium">all taxes included</span>
                      </div>

                      <button
                        onClick={() => handleOpenReservation('bus', bus)}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                      >
                        Select Seats & Book →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEARCH FORM & RESULTS FOR FLIGHT */}
          {travelTab === 'flight' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">From Airport</label>
                  <input
                    type="text"
                    value={flightSearch.from}
                    onChange={(e) => setFlightSearch({ ...flightSearch, from: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">To Airport</label>
                  <input
                    type="text"
                    value={flightSearch.to}
                    onChange={(e) => setFlightSearch({ ...flightSearch, to: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Departure Date</label>
                  <input
                    type="date"
                    value={flightSearch.date}
                    onChange={(e) => setFlightSearch({ ...flightSearch, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Cabin</label>
                  <select
                    value={flightSearch.cabinClass}
                    onChange={(e) => setFlightSearch({ ...flightSearch, cabinClass: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option>Economy</option>
                    <option>Premium Economy</option>
                    <option>Business Class</option>
                  </select>
                </div>
                <div>
                  <button className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-1.5">
                    <Search className="w-3.5 h-3.5" />
                    <span>Search Flights</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {flightRoutes.map((flight) => (
                  <div key={flight.id} className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-sky-300 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2.5">
                        <span className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-black text-xs">
                          ✈️
                        </span>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">{flight.airline}</h3>
                          <span className="text-[11px] text-slate-600 font-semibold">{flight.flightNo}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-semibold">
                          {flight.badge}
                        </span>
                      </div>

                      <div className="flex items-center space-x-6 text-xs text-slate-600 pt-1">
                        <div>
                          <p className="text-base font-black text-slate-900">{flight.departTime}</p>
                          <p className="text-slate-500">{flight.from}</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-slate-600 font-semibold">{flight.duration}</span>
                          <div className="w-24 h-0.5 bg-slate-300 relative my-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-sky-600 absolute -top-0.5 right-0" />
                          </div>
                          <span className="text-[10px] text-sky-600 font-medium">{flight.stops}</span>
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-900">{flight.arriveTime}</p>
                          <p className="text-slate-500">{flight.to}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-[11px] text-slate-500">
                        <span className="flex items-center space-x-1">
                          <Luggage className="w-3.5 h-3.5 text-slate-400" />
                          <span>{flight.baggage}</span>
                        </span>
                        <span className="text-emerald-600">✓ {flight.refundable}</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 gap-3">
                      <div className="text-left sm:text-right">
                        <div className="text-xl font-black text-slate-900">
                          ₹{flight.price.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-600 font-medium">per traveler • air fare + taxes</span>
                      </div>

                      <button
                        onClick={() => handleOpenReservation('flight', flight)}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                      >
                        Book Flight Ticket →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEARCH FORM & RESULTS FOR CAR / BIKE */}
          {travelTab === 'vehicle' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Pickup City / Hub</label>
                  <input
                    type="text"
                    value={vehicleSearch.pickupCity}
                    onChange={(e) => setVehicleSearch({ ...vehicleSearch, pickupCity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Rental Period</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={vehicleSearch.pickupDate}
                      onChange={(e) => setVehicleSearch({ ...vehicleSearch, pickupDate: e.target.value })}
                      className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-800"
                    />
                    <input
                      type="date"
                      value={vehicleSearch.dropoffDate}
                      onChange={(e) => setVehicleSearch({ ...vehicleSearch, dropoffDate: e.target.value })}
                      className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-800"
                    />
                  </div>
                </div>
                <div>
                  <button className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-1.5">
                    <Search className="w-3.5 h-3.5" />
                    <span>Search Available Rentals</span>
                  </button>
                </div>
              </div>

              {/* Vehicle Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {rentalVehicles
                  .filter(v => v.category === vehicleType)
                  .map((vehicle) => (
                    <div key={vehicle.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        <div className="relative h-44 bg-slate-100 overflow-hidden">
                          <img
                            src={vehicle.image}
                            alt={vehicle.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-3 left-3 px-2 py-1 bg-slate-900/80 backdrop-blur-md rounded-lg text-white text-[10px] font-bold">
                            {vehicle.type}
                          </div>
                          <div className="absolute top-3 right-3 px-2 py-1 bg-amber-400 text-slate-950 rounded-lg text-[10px] font-bold flex items-center space-x-1">
                            <Star className="w-3 h-3 fill-slate-950" />
                            <span>{vehicle.rating}</span>
                          </div>
                        </div>

                        <div className="p-4 space-y-2.5">
                          <h4 className="text-base font-bold text-slate-900 leading-snug">{vehicle.name}</h4>
                          <div className="flex items-center space-x-3 text-xs text-slate-500">
                            <span>{vehicle.transmission}</span>
                            <span>•</span>
                            <span>{vehicle.fuel}</span>
                          </div>

                          <div className="pt-2 border-t border-slate-100 space-y-1">
                            {vehicle.features.map((feat, idx) => (
                              <p key={idx} className="text-[11px] text-slate-600 flex items-center space-x-1.5">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>{feat}</span>
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-600 block">Daily Tariff</span>
                          <span className="text-lg font-black text-slate-900">
                            ₹{vehicle.pricePerDay.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-slate-600 font-medium"> / day</span>
                        </div>

                        <button
                          onClick={() => handleOpenReservation('vehicle', vehicle)}
                          className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                        >
                          Reserve Vehicle →
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SUB-SECTION 2: STAY / ACCOMMODATION (SORTED CHEAPEST TO MOST EXPENSIVE)
          ========================================================================= */}
      {activeSubSection === 'stay' && (
        <div className="space-y-6">
          {/* Automatic Sorting & Filters Bar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">All Available Stays & Accommodations</h3>
                <p className="text-xs text-slate-500">
                  Arranged automatically from <strong className="text-emerald-700 font-bold">cheapest to most expensive range</strong> for budget-conscious & luxury multi-city travelers.
                </p>
              </div>

              {/* Sorting options */}
              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-xs font-semibold text-slate-500">Sort By:</span>
                <select
                  value={staySortBy}
                  onChange={(e) => setStaySortBy(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="price-asc">Price: Low to High (Cheapest First - Default)</option>
                  <option value="price-desc">Price: High to Low (Luxury First)</option>
                  <option value="rating">Guest Rating (Highest First)</option>
                </select>
              </div>
            </div>

            {/* Filter pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Destination Filter</label>
                <select
                  value={stayCityFilter}
                  onChange={(e) => setStayCityFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                >
                  <option value="All">All Destination Cities</option>
                  {itineraryCities.map((c, i) => (
                    <option key={i} value={c}>Itinerary Stop: {c}</option>
                  ))}
                  <option value="Paris">Paris, France</option>
                  <option value="Barcelona">Barcelona, Spain</option>
                  <option value="Rome">Rome, Italy</option>
                  <option value="Tokyo">Tokyo, Japan</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Stay Category</label>
                <select
                  value={stayTypeFilter}
                  onChange={(e) => setStayTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                >
                  <option value="All">All Categories (Motels, Hotels, Resorts)</option>
                  <option value="Motel">Motels & Roadside Inns</option>
                  <option value="Budget">Hostels & Budget Stays</option>
                  <option value="Hotel">Boutique & 4-Star Hotels</option>
                  <option value="Luxury">5-Star Luxury Resorts</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Max Budget / Night</label>
                  <span className="text-xs font-bold text-sky-600">₹{stayMaxPrice.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="25000"
                  step="500"
                  value={stayMaxPrice}
                  onChange={(e) => setStayMaxPrice(Number(e.target.value))}
                  className="w-full accent-sky-600"
                />
              </div>
            </div>
          </div>

          {/* Stays Cards Grid (Arranged Cheapest to Most Expensive) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedStays.map((stay, idx) => (
              <div key={stay.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group">
                <div>
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img
                      src={stay.image}
                      alt={stay.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                      <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-md rounded-lg text-white text-[10px] font-bold">
                        #{idx + 1} • {stay.type}
                      </span>
                      {stay.pricePerNight <= 1500 && (
                        <span className="px-2 py-0.5 bg-emerald-500 text-white rounded-md text-[10px] font-extrabold uppercase">
                          Cheapest
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3 px-2 py-1 bg-white/95 backdrop-blur-sm rounded-lg text-slate-900 text-xs font-bold flex items-center space-x-1 shadow-sm">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{stay.rating}</span>
                      <span className="text-[10px] text-slate-600">({stay.reviewsCount})</span>
                    </div>

                    <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-white text-[11px] font-medium flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-sky-400" />
                      <span>{stay.city}, {stay.country}</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors leading-tight">
                        {stay.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">{stay.location}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-1.5">
                      {stay.perks.map((perk, pIdx) => (
                        <div key={pIdx} className="text-[11px] text-slate-600 flex items-center space-x-1.5 truncate">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-600 block">Nightly Rate</span>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-xl font-black text-slate-900">
                        ₹{stay.pricePerNight.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] text-slate-600 font-medium">/ night</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-semibold">Taxes included</span>
                  </div>

                  <button
                    onClick={() => handleOpenReservation('stay', stay)}
                    className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    Reserve Room →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-SECTION 3: PRE-BOOKING ATTRACTIONS (Museums, Zoos, Amusement Parks, Monuments)
          ========================================================================= */}
      {activeSubSection === 'attractions' && (
        <div className="space-y-6">
          {/* Header Notice Banner */}
          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-800">
                <Ticket className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  Itinerary Advance Attractions Pre-Booking
                </h3>
                <p className="text-xs text-amber-800 mt-0.5 max-w-2xl">
                  Automatically pulled from your itinerary destinations: <strong>{itineraryCities.join(', ')}</strong>. Advance timed entry tickets prevent long wait lines (up to 3 hrs) and guarantee guaranteed access to world-famous sites.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-xs font-semibold text-amber-900">Filter Destination:</span>
              <select
                value={attractionCityFilter}
                onChange={(e) => setAttractionCityFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="All">All Itinerary Cities</option>
                {itineraryCities.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Attraction Category Switcher */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setAttractionCategoryFilter('All')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                attractionCategoryFilter === 'All'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Advance Attractions ({rawAttractions.length})
            </button>
            <button
              onClick={() => setAttractionCategoryFilter('museum')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                attractionCategoryFilter === 'museum'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Museums & Galleries</span>
            </button>
            <button
              onClick={() => setAttractionCategoryFilter('zoo')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                attractionCategoryFilter === 'zoo'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Trees className="w-3.5 h-3.5" />
              <span>Zoos & Aquariums</span>
            </button>
            <button
              onClick={() => setAttractionCategoryFilter('amusement')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                attractionCategoryFilter === 'amusement'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FerrisWheel className="w-3.5 h-3.5" />
              <span>Amusement & Theme Parks</span>
            </button>
            <button
              onClick={() => setAttractionCategoryFilter('monument')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                attractionCategoryFilter === 'monument'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Monuments & Heritage Sites</span>
            </button>
          </div>

          {/* Attractions Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedAttractions.map((att) => (
              <div key={att.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group">
                <div>
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img
                      src={att.image}
                      alt={att.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/85 backdrop-blur-md rounded-lg text-white text-[10px] font-bold uppercase tracking-wider">
                      {att.category}
                    </div>
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-amber-400 text-slate-950 rounded-lg text-[10px] font-extrabold">
                      {att.badge}
                    </div>
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-white text-xs font-semibold flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      <span>{att.city}, {att.country}</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h4 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors leading-snug">
                      {att.title}
                    </h4>

                    {/* Advance requirement warning */}
                    <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60 text-amber-900 text-[11px] flex items-start space-x-1.5 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{att.advanceRequirement}</span>
                    </div>

                    <div className="space-y-1">
                      {att.highlights.map((h, i) => (
                        <p key={i} className="text-[11px] text-slate-600 flex items-center space-x-1.5">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>{h}</span>
                        </p>
                      ))}
                    </div>

                    {/* Time slots preview */}
                    <div className="pt-2">
                      <span className="text-[10px] uppercase font-bold text-slate-600 block mb-1">Available Entry Slots:</span>
                      <div className="flex flex-wrap gap-1">
                        {att.slots.map((slot, sIdx) => (
                          <span key={sIdx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
                            {slot}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-600 block">Advance Entry Ticket</span>
                    <span className="text-xl font-black text-slate-900">
                      ₹{att.ticketPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-600 font-medium"> / person</span>
                  </div>

                  <button
                    onClick={() => handleOpenReservation('attraction', att)}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    Pre-Book Ticket →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          MY CONFIRMED BOOKINGS SECTION
          ========================================================================= */}
      {activeSubSection === 'my-bookings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">All Confirmed Travel & Stay Bookings</h3>
              <p className="text-xs text-slate-500">
                Access your instant tickets, PNR vouchers, check-in barcodes, and reservation confirmations.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {confirmedBookings.length} Active Reservations
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {confirmedBookings.map((b) => (
              <div key={b.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
                    {b.type === 'train' && <Train className="w-6 h-6" />}
                    {b.type === 'bus' && <Bus className="w-6 h-6" />}
                    {b.type === 'flight' && <Plane className="w-6 h-6" />}
                    {b.type === 'vehicle' && <Car className="w-6 h-6" />}
                    {b.type === 'stay' && <Hotel className="w-6 h-6" />}
                    {b.type === 'attraction' && <Ticket className="w-6 h-6" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                        {b.status}
                      </span>
                      <span className="text-xs text-slate-600 font-mono font-bold">Ref: {b.bookingRef}</span>
                      <span className="text-xs text-slate-600">• {b.categoryLabel}</span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">{b.title}</h4>
                    <p className="text-xs text-slate-500">{b.subtitle}</p>

                    <div className="flex items-center space-x-4 text-xs text-slate-600 pt-1">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Date: {b.travelDate}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{b.passengersOrGuests}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 gap-3">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-600 block">Total Paid</span>
                    <span className="text-xl font-black text-slate-900">
                      ₹{b.amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    onClick={() => setActiveTicketVoucher(b)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-amber-300" />
                    <span>View E-Ticket & Voucher</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          RESERVATION CHECKOUT MODAL
          ========================================================================= */}
      {activeReservationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 bg-gradient-to-r from-sky-600 to-indigo-600 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-sky-200 block">
                  Express Checkout & Confirmation
                </span>
                <h3 className="text-lg font-bold">
                  {activeReservationModal.item.title || activeReservationModal.item.name || activeReservationModal.item.trainName || activeReservationModal.item.operator}
                </h3>
              </div>
              <button
                onClick={() => setActiveReservationModal(null)}
                className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">Base Price</span>
                  <span className="text-base font-black text-slate-900">
                    ₹{(activeReservationModal.item.price || activeReservationModal.item.pricePerNight || activeReservationModal.item.ticketPrice || activeReservationModal.item.pricePerDay || 1500).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Destination</span>
                  <span className="font-bold text-slate-800">
                    {activeReservationModal.item.city || activeReservationModal.item.to || 'Itinerary Stop'}
                  </span>
                </div>
              </div>

              {/* Form inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Traveler Name</label>
                  <input
                    type="text"
                    value={activeReservationModal.passengerName}
                    onChange={(e) => setActiveReservationModal({ ...activeReservationModal, passengerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={activeReservationModal.contactEmail}
                      onChange={(e) => setActiveReservationModal({ ...activeReservationModal, contactEmail: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={activeReservationModal.contactPhone}
                      onChange={(e) => setActiveReservationModal({ ...activeReservationModal, contactPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Travel Date</label>
                    <input
                      type="date"
                      value={activeReservationModal.travelDate}
                      onChange={(e) => setActiveReservationModal({ ...activeReservationModal, travelDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Pass / Ticket Count</label>
                    <select
                      value={activeReservationModal.passengers}
                      onChange={(e) => setActiveReservationModal({ ...activeReservationModal, passengers: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                    >
                      <option value={1}>1 Traveler</option>
                      <option value={2}>2 Travelers</option>
                      <option value={3}>3 Travelers</option>
                      <option value={4}>4 Travelers</option>
                    </select>
                  </div>
                </div>

                {activeTrip && (
                  <div className="pt-2">
                    <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addToTripExpensesChecked}
                        onChange={(e) => setAddToTripExpensesChecked(e.target.checked)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span>Automatically record cost to active trip budget & expenses</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] text-slate-600 block">Total Payable in INR</span>
                <span className="text-lg font-black text-slate-900">
                  ₹{((activeReservationModal.item.price || activeReservationModal.item.pricePerNight || activeReservationModal.item.ticketPrice || activeReservationModal.item.pricePerDay || 1500) * (activeReservationModal.passengers || 1)).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveReservationModal(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  disabled={isSubmittingBooking}
                  onClick={handleConfirmReservation}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  {isSubmittingBooking ? 'Issuing Ticket...' : 'Confirm & Generate Ticket →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DIGITAL E-TICKET & VOUCHER PREVIEW MODAL
          ========================================================================= */}
      {activeTicketVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            {/* Ticket Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-center relative">
              <button
                onClick={() => setActiveTicketVoucher(null)}
                className="absolute top-4 right-4 p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>

              <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-200 block">
                Official Booking Voucher & Pass
              </span>
              <h3 className="text-lg font-extrabold font-serif-heading mt-0.5">
                {activeTicketVoucher.title}
              </h3>
              <p className="text-xs text-white/80 mt-1">
                Booking Reference: <strong className="font-mono text-amber-200">{activeTicketVoucher.bookingRef}</strong>
              </p>
            </div>

            {/* Ticket Body with perforated style */}
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-600 uppercase font-bold block">Status</span>
                  <span className="text-emerald-700 font-extrabold flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span>Confirmed</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-600 uppercase font-bold block">Travel / Entry Date</span>
                  <span className="text-slate-900 font-bold">{activeTicketVoucher.travelDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-600 uppercase font-bold block">Primary Traveler</span>
                  <span className="text-slate-900 font-bold">{activeTicketVoucher.passengersOrGuests}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-600 uppercase font-bold block">Total Amount Paid</span>
                  <span className="text-slate-900 font-extrabold text-sm">
                    ₹{activeTicketVoucher.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Dynamic QR Code representation */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-2 text-center">
                <div className="w-32 h-32 bg-white p-2 rounded-xl shadow-inner border border-slate-300 flex items-center justify-center">
                  <QrCode className="w-28 h-28 text-slate-900" />
                </div>
                <p className="text-[10px] font-mono text-slate-500">
                  SCAN AT GATE / COUNTER • REF #{activeTicketVoucher.bookingRef}
                </p>
              </div>

              <div className="text-[11px] text-slate-500 text-center">
                A confirmation copy has been registered and synced with your itinerary expenses.
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center space-x-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print / Save Voucher</span>
              </button>
              <button
                onClick={() => setActiveTicketVoucher(null)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
