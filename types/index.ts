// User types
export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

// Photo types
export interface Photo {
  id: string;
  userId: string;
  url: string;
  fileName: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

// Auth types
export interface Session {
  user: User;
  expires: string;
}

// Voice recognition types
export interface VoiceRecognitionState {
  isListening: boolean;
  transcript: string;
  error: string | null;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

