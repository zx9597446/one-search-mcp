#!/usr/bin/env node
import AsyncRetry from 'async-retry';

interface IMediaItem {
    thumbnail?: string;
    src?: string;
}
interface ISearchRequestOptions {
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
    retry?: AsyncRetry.Options;
}
interface ISearchResponseResult {
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
interface ISearchResponse {
    results: ISearchResponseResult[];
    success: boolean;
}
type Provider = 'searxng' | 'duckduckgo' | 'bing' | 'tavily';
type SearchTimeRange = 'year' | 'month' | 'week' | 'day';

export type { IMediaItem, ISearchRequestOptions, ISearchResponse, ISearchResponseResult, Provider, SearchTimeRange };
