export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface Campaign {
  id: string;
  name: string;
  hostname: string;
  redirect: string;
  userId: string;
  createdAt: string;
  publicSlug: string;
  previewTitle?: string;
  previewDescription?: string;
  previewImage?: string;
  previewSiteName?: string;
}

export interface IpLookup {
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
}

export interface VisitorLog {
  id: string;
  sessionId: string;
  ip: string;
  rayId: string;
  userAgent: string;
  referrer: string;
  label?: string;
  timestamp: string;
}
