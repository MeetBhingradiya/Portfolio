/**
 * @copyright 2025 Github Copilot Generated Code
 * High-Performance Buffer-based Rate Limit Store
 * Uses binary data structures for memory efficiency
 * Implements sliding window log algorithm for accurate rate limiting
 */

export interface RateLimitInfo {
    totalHits: number;
    resetTime: number;
    remaining: number;
}

export interface StoreOptions {
    windowMs: number;
    maxRequests: number;
    cleanupInterval?: number;
}

interface ClientEntry {
    timestamps: Float64Array;
    head: number;
    count: number;
}

export class BufferRateLimitStore {
    private readonly windowMs: number;
    private readonly maxRequests: number;
    private readonly cleanupInterval: number;
    
    // Buffer for storing client data
    private clientsBuffer: Buffer;
    private clientsIndex: Map<string, number>;
    private freeSlots: number[];
    
    // Each client entry: 4 bytes (head) + 4 bytes (count) + (maxRequests * 8) bytes (timestamps)
    private readonly entrySize: number;
    private readonly maxClients: number;
    
    private cleanupTimer?: NodeJS.Timeout;
    private lastCleanup: number;

    constructor(options: StoreOptions, maxClients: number = 10000) {
        this.windowMs = options.windowMs;
        this.maxRequests = options.maxRequests;
        this.cleanupInterval = options.cleanupInterval || this.windowMs;
        this.maxClients = maxClients;
        
        // Calculate entry size: head(4) + count(4) + timestamps(maxRequests * 8)
        this.entrySize = 8 + (this.maxRequests * 8);
        
        // Initialize buffer
        this.clientsBuffer = Buffer.alloc(this.maxClients * this.entrySize);
        this.clientsIndex = new Map();
        this.freeSlots = Array.from({ length: maxClients }, (_, i) => i);
        this.lastCleanup = Date.now();
        
        this.startCleanupTimer();
    }

    /**
     * Get current rate limit info for a client
     */
    public get(key: string): RateLimitInfo | null {
        const entry = this.getClientEntry(key);
        if (!entry) return null;

        const now = Date.now();
        const validTimestamps = this.getValidTimestamps(entry, now);
        
        return {
            totalHits: validTimestamps,
            resetTime: now + this.windowMs,
            remaining: Math.max(0, this.maxRequests - validTimestamps)
        };
    }

    /**
     * Increment request count for a client
     */
    public increment(key: string): RateLimitInfo {
        const now = Date.now();
        let entry = this.getClientEntry(key);
        
        if (!entry) {
            entry = this.createClientEntry(key);
        }

        // Clean old timestamps and add new one
        const validCount = this.cleanAndAddTimestamp(entry, now);
        
        return {
            totalHits: validCount,
            resetTime: now + this.windowMs,
            remaining: Math.max(0, this.maxRequests - validCount)
        };
    }

    /**
     * Reset a specific client's data
     */
    public reset(key: string): void {
        const slotIndex = this.clientsIndex.get(key);
        if (slotIndex !== undefined) {
            this.clearClientSlot(slotIndex);
            this.clientsIndex.delete(key);
            this.freeSlots.push(slotIndex);
        }
    }

    /**
     * Reset all clients
     */
    public resetAll(): void {
        this.clientsBuffer.fill(0);
        this.clientsIndex.clear();
        this.freeSlots = Array.from({ length: this.maxClients }, (_, i) => i);
    }

    /**
     * Shutdown the store
     */
    public shutdown(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
        this.resetAll();
    }

    /**
     * Get memory usage statistics
     */
    public getStats() {
        const usedSlots = this.maxClients - this.freeSlots.length;
        const memoryUsed = this.clientsBuffer.length;
        
        return {
            activeClients: usedSlots,
            maxClients: this.maxClients,
            memoryUsed: memoryUsed,
            memoryUsedMB: (memoryUsed / 1024 / 1024).toFixed(2),
            utilization: ((usedSlots / this.maxClients) * 100).toFixed(2) + '%'
        };
    }

    private getClientEntry(key: string): ClientEntry | null {
        const slotIndex = this.clientsIndex.get(key);
        if (slotIndex === undefined) return null;

        const offset = slotIndex * this.entrySize;
        const head = this.clientsBuffer.readUInt32LE(offset);
        const count = this.clientsBuffer.readUInt32LE(offset + 4);
        
        // Create Float64Array view of the timestamps section
        const timestampsOffset = offset + 8;
        const timestampsBuffer = this.clientsBuffer.subarray(
            timestampsOffset, 
            timestampsOffset + (this.maxRequests * 8)
        );
        const timestamps = new Float64Array(
            timestampsBuffer.buffer,
            timestampsBuffer.byteOffset,
            this.maxRequests
        );

        return { timestamps, head, count };
    }

    private createClientEntry(key: string): ClientEntry {
        if (this.freeSlots.length === 0) {
            // Force cleanup to free up slots
            this.performCleanup();
            
            if (this.freeSlots.length === 0) {
                throw new Error('Rate limit store capacity exceeded');
            }
        }

        const slotIndex = this.freeSlots.pop()!;
        this.clientsIndex.set(key, slotIndex);

        const offset = slotIndex * this.entrySize;
        
        // Initialize entry
        this.clientsBuffer.writeUInt32LE(0, offset);     // head = 0
        this.clientsBuffer.writeUInt32LE(0, offset + 4); // count = 0
        
        // Clear timestamps
        const timestampsOffset = offset + 8;
        this.clientsBuffer.fill(0, timestampsOffset, timestampsOffset + (this.maxRequests * 8));

        return this.getClientEntry(key)!;
    }

    private getValidTimestamps(entry: ClientEntry, now: number): number {
        const cutoff = now - this.windowMs;
        let validCount = 0;

        for (let i = 0; i < entry.count; i++) {
            const timestamp = entry.timestamps[i];
            if (timestamp > cutoff) {
                validCount++;
            }
        }

        return validCount;
    }

    private cleanAndAddTimestamp(entry: ClientEntry, timestamp: number): number {
        const cutoff = timestamp - this.windowMs;
        let writeIndex = 0;

        // Compact valid timestamps
        for (let i = 0; i < entry.count; i++) {
            const ts = entry.timestamps[i];
            if (ts > cutoff) {
                if (writeIndex !== i) {
                    entry.timestamps[writeIndex] = ts;
                }
                writeIndex++;
            }
        }

        // Add new timestamp
        if (writeIndex < this.maxRequests) {
            entry.timestamps[writeIndex] = timestamp;
            writeIndex++;
        } else {
            // Shift array and add new timestamp
            for (let i = 0; i < this.maxRequests - 1; i++) {
                entry.timestamps[i] = entry.timestamps[i + 1];
            }
            entry.timestamps[this.maxRequests - 1] = timestamp;
        }

        // Update count in buffer
        const slotIndex = Array.from(this.clientsIndex.entries())
            .find(([_, index]) => {
                const offset = index * this.entrySize;
                const timestamps = entry.timestamps;
                const bufferTimestamps = new Float64Array(
                    this.clientsBuffer.buffer,
                    this.clientsBuffer.byteOffset + offset + 8,
                    this.maxRequests
                );
                return bufferTimestamps === timestamps;
            })?.[1];

        if (slotIndex !== undefined) {
            const offset = slotIndex * this.entrySize;
            this.clientsBuffer.writeUInt32LE(writeIndex, offset + 4);
        }

        entry.count = writeIndex;
        return writeIndex;
    }

    private clearClientSlot(slotIndex: number): void {
        const offset = slotIndex * this.entrySize;
        this.clientsBuffer.fill(0, offset, offset + this.entrySize);
    }

    private startCleanupTimer(): void {
        this.cleanupTimer = setInterval(() => {
            this.performCleanup();
        }, this.cleanupInterval);

        if (this.cleanupTimer.unref) {
            this.cleanupTimer.unref();
        }
    }

    private performCleanup(): void {
        const now = Date.now();
        const cutoff = now - this.windowMs;
        const keysToRemove: string[] = [];

        for (const [key, slotIndex] of this.clientsIndex.entries()) {
            const entry = this.getClientEntry(key);
            if (!entry) continue;

            // Check if client has any valid timestamps
            let hasValidTimestamps = false;
            for (let i = 0; i < entry.count; i++) {
                if (entry.timestamps[i] > cutoff) {
                    hasValidTimestamps = true;
                    break;
                }
            }

            if (!hasValidTimestamps) {
                keysToRemove.push(key);
            }
        }

        // Remove inactive clients
        for (const key of keysToRemove) {
            this.reset(key);
        }

        this.lastCleanup = now;
    }
}