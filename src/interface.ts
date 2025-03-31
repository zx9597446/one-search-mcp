export interface IMediaItem {
  thumbnail?: string;
  src?: string;
}

export interface ISearchRequestOptions {
  query: string;
  page?: number;
  limit?: number;
  categories?: string;
  format?: string;
  language?: string;
  engines?: string;
  safeSearch?: 0 | 1 | 2;
  timeRange?: string;
  timeout?: number | string;
  apiKey?: string;
  apiUrl?: string;
}

export interface ISearchResponseResult {
  title: string;
  snippet: string;
  url: string;
  thumbnailUrl?: string;
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

/**
 * Options for performing a Bing search
 */
export interface BingSearchOptions {
  /**
   * Search query string
   */
  q: string;

  /**
   * Number of results to return
   */
  count?: number;

  /**
   * Result offset for pagination
   */
  offset?: number;

  /**
   * Market code (e.g., 'en-US')
   */
  mkt?: string;

  /**
   * Safe search filtering level
   */
  safeSearch?: 'Off' | 'Moderate' | 'Strict';

  /**
   * Additional parameters supported by Bing Search API
   */
  [key: string]: any;
}

/**
 * Represents a web page result from Bing Search
 */
export interface BingSearchWebPage {
  /**
   * Title of the web page
   */
  name: string;

  /**
   * URL of the web page
   */
  url: string;

  /**
   * Text snippet from the web page
   */
  snippet: string;

  /**
   * Date the page was last crawled by Bing
   */
  dateLastCrawled?: string;

  /**
   * Display URL for the web page
   */
  displayUrl?: string;

  /**
   * Unique identifier for the result
   */
  id?: string;

  /**
   * Indicates if the content is family friendly
   */
  isFamilyFriendly?: boolean;

  /**
   * Indicates if the result is navigational
   */
  isNavigational?: boolean;

  /**
   * Language of the web page
   */
  language?: string;

  /**
   * Indicates if caching should be disabled
   */
  noCache?: boolean;

  /**
   * Name of the website
   */
  siteName?: string;

  /**
   * URL to a thumbnail image
   */
  thumbnailUrl?: string;
}

/**
 * Represents an image result from Bing Search
 */
export interface BingSearchImage {
  contentSize: string;
  contentUrl: string;
  datePublished: string;
  encodingFormat: string;
  height: number;
  width: number;
  hostPageDisplayUrl: string;
  hostPageUrl: string;
  name: string;
  thumbnail: {
    height: number;
    width: number;
  };
  thumbnailUrl: string;
  webSearchUrl: string;
}

/**
 * Represents a video result from Bing Search
 */
export interface BingSearchVideo {
  allowHttpsEmbed: boolean;
  allowMobileEmbed: boolean;
  contentUrl: string;
  creator?: {
    name: string;
  };
  datePublished: string;
  description: string;
  duration: string;
  embedHtml: string;
  encodingFormat: string;
  height: number;
  width: number;
  hostPageDisplayUrl: string;
  hostPageUrl: string;
  name: string;
  publisher?: {
    name: string;
  }[];
  thumbnail: {
    height: number;
    width: number;
  };
  thumbnailUrl: string;
  viewCount?: number;
  webSearchUrl: string;
}

export interface BingSearchResponse {
  _type?: string;
  queryContext?: {
    originalQuery: string;
  };
  webPages?: {
    value: BingSearchWebPage[];
    totalEstimatedMatches?: number;
    someResultsRemoved?: boolean;
    webSearchUrl?: string;
  };
  images?: {
    value: BingSearchImage[];
    isFamilyFriendly?: boolean;
    readLink?: string;
    webSearchUrl?: string;
    id?: string;
  };
  videos?: {
    value: BingSearchVideo[];
    isFamilyFriendly?: boolean;
    readLink?: string;
    webSearchUrl?: string;
    id?: string;
    scenario?: string;
  };
  rankingResponse?: {
    mainline?: {
      items: {
        answerType: string;
        resultIndex?: number;
        value: {
          id: string;
        };
      }[];
    };
  };
  [key: string]: any; // Allow other response fields
}
