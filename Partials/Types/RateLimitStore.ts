export type ClientRateLimitInfo = {
    totalHits: number;
    resetTime: Date | undefined;
};

export type IncrementResponse = ClientRateLimitInfo;

export type Store = {
    init?: (options: Options) => void;

    get?: (
        key: string
    ) =>
        | Promise<ClientRateLimitInfo | undefined>
        | ClientRateLimitInfo
        | undefined;

    increment: (key: string) => Promise<IncrementResponse> | IncrementResponse;

    decrement: (key: string) => Promise<void> | void;

    resetKey: (key: string) => Promise<void> | void;

    resetAll?: () => Promise<void> | void;

    shutdown?: () => Promise<void> | void;

    localKeys?: boolean;

    prefix?: string;
};

export type Options = {
    windowMs: number;
};
