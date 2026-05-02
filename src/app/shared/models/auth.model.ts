export interface User {
  id: number;
  role_id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  is_active: boolean;
  current_plan?: string;
  role?: {
    id: number;
    name: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}