export interface TripInput {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used: number;
}

export interface Stop {
  type: string;
  location: { lat: number; lng: number; display_name: string } | null;
  arrival_time: string;
  departure_time: string;
  duration_hours: number;
  duty_status: string;
  remark: string;
}

export interface ELDSegment {
  status: string;
  start: number;
  end: number;
  remark: string;
}

export interface ELDLog {
  date: string;
  segments: ELDSegment[];
  totals: {
    off_duty: number;
    sleeper_berth: number;
    driving: number;
    on_duty_not_driving: number;
  };
}

export interface TripResult {
  id: string;
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used: number;
  route_data: {
    total_distance_miles: number;
    total_duration_hours: number;
    polyline: string;
    legs: { distance_miles: number; duration_hours: number }[];
    locations: {
      current: { lat: number; lng: number; display_name: string };
      pickup: { lat: number; lng: number; display_name: string };
      dropoff: { lat: number; lng: number; display_name: string };
    };
  };
  stops: Stop[];
  eld_logs: ELDLog[];
  total_distance_miles: number;
  total_driving_hours: number;
  total_trip_days: number;
}
