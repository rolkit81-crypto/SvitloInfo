export interface City {
  id: string;
  nameUk: string; // Ukrainian name for display
  nameEn: string; // English name for search queries
  region: string;
}

export enum PowerStatus {
  ON = 'ON',
  OFF = 'OFF',
  MAYBE = 'MAYBE', // Stabilization/Grey zone
  UNKNOWN = 'UNKNOWN'
}

export interface GroupData {
  id: string;
  status: PowerStatus;
  description: string;
}

export interface OutageInfo {
  status: PowerStatus;
  summary: string;
  groups: GroupData[];
  lastUpdated: number;
  sources: {
    title: string;
    uri: string;
  }[];
}

export interface SearchResult {
  text: string;
  groundingChunks: {
    web?: {
      uri: string;
      title: string;
    };
  }[];
}
