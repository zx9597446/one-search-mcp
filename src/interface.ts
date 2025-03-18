export interface IMediaItem {
  thumbnail?: string;
  src?: string;
}

export interface ISearchRequestOptions {
  query: string;
  limit?: number;
  categories?: string;
  format?: string;
  language?: string;
  engines?: string;
  safeSearch?: number;
  timeRange?: string;
  timeout?: number | string;
  apiKey?: string;
  apiUrl?: string;
}

export interface ISearchResponseResult {
  title: string;
  snippet: string;
  url: string;
  markdown?: string;
  source?: string;
  engine?: string;
  image?: IMediaItem | null;
  video?: IMediaItem | null;
}

export interface ISearchResponse {
  results: ISearchResponseResult[];
  success: boolean;
}

export type Provider = 'searxng' | 'google' | 'bing' | 'tavily';
export type SearchTimeRange = 'year' | 'month' | 'week' | 'day';
