import axios from 'axios';
import type { TripInput, TripResult } from '../types/trip';

const API_URL = 'http://127.0.0.1:8000';

export async function createTrip(data: TripInput): Promise<TripResult> {
  const response = await axios.post(`${API_URL}/api/trips/`, data);
  return response.data;
}
