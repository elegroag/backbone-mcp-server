export interface Resource {
    uri: string;
    content: {
        text: string;
        mimeType: string;
    };
    metadata?: {
        title?: string;
        chapter?: number;
    };
}

export interface ListResourcesResponse {
    resources: Array<{
        uri: string;
        content: { mimeType: string };
        metadata?: { title?: string; chapter?: number };
    }>;
}

export interface ReadResourceResponse {
    content: string;
    mimeType: string;
}

export interface SearchMatch {
    chapter: number;
    title: string;
    uri: string;
    mimeType: string;
    occurrences: number;
    excerpts: string[];
}