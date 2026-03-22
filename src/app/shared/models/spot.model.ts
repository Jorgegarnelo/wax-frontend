export interface Spot {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  region: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  best_wind_direction: string | null;
  best_swell_direction: string | null;
  optimal_tide: string | null;
  difficulty: number;
  seabed: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Forecast {
  id: number;
  spot_id: number;
  forecast_time: string;
  wave_height: number | null;
  wave_period: number | null;
  wave_direction: number | null;
  swell_wave_height: number | null;
  swell_wave_period: number | null;
  swell_wave_direction: number | null;
  wind_wave_height: number | null;
  wind_wave_period: number | null;
  wind_wave_direction: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
  sea_surface_temperature: number | null;
}

export interface Report {
  id: number;
  user_id: number;
  spot_id: number;
  comment: string | null;
  wave_rating: number | null;
  photo_url: string | null;
  crowd_level: number | null;
  is_visible: boolean;
  created_at: string;
  user?: any;
}