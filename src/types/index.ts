export enum LandmarkCategory {
  MONUMENT = "MONUMENT",
  PARK = "PARK",
  MUSEUM = "MUSEUM",
  BRIDGE = "BRIDGE",
  BUILDING = "BUILDING",
  CHURCH = "CHURCH",
  SQUARE = "SQUARE",
  MARKET = "MARKET",
  OTHER = "OTHER",
}

export enum TimeOfDay {
  GOLDEN_HOUR = "GOLDEN_HOUR",
  BLUE_HOUR = "BLUE_HOUR",
  MIDDAY = "MIDDAY",
  NIGHT = "NIGHT",
  SUNRISE = "SUNRISE",
  SUNSET = "SUNSET",
}

export interface Landmark {
  id: string;
  name: string;
  description: string | null;
  category: LandmarkCategory;
  latitude: number;
  longitude: number;
  city: string | null;
  country: string | null;
  createdById: string;
  createdAt: string;
  photoCount: number;
}

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string;
  landmarkId: string;
  uploadedById: string;
  uploaderName: string | null;
  timeOfDay: TimeOfDay | null;
  gearNotes: string | null;
  accessibilityNotes: string | null;
  tags: string[];
  loveCount: number;
  lovedByUser: boolean;
  createdAt: string;
}

export interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}
