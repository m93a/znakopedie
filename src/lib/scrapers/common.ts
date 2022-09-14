
export interface Entry {
    headword: string;
    signs: Sign[];
}

export interface Sign {
    id: string;
    source: string;
    license: string;
    videos: Record<string, URL>;
}
