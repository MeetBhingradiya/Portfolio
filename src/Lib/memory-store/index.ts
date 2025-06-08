import type { Store, Options, ClientRateLimitInfo } from './types'

type Client = {
	totalHits: number
	resetTime: Date
}

// type SerializedClient = {
// 	totalHits: number
// 	resetTime: number
// }

export class MemoryStore implements Store {
	windowMs!: number

	previous = Buffer.alloc(0)
	current = Buffer.alloc(0)
	previousIndex = new Map<string, number>()
	currentIndex = new Map<string, number>()

	interval?: NodeJS.Timeout

	localKeys = true

	init(options: Options): void {
		this.windowMs = options.windowMs

		if (this.interval) clearInterval(this.interval)

		this.interval = setInterval(() => {
			this.clearExpired()
		}, this.windowMs)

		if (this.interval.unref) this.interval.unref()
	}
	async get(key: string): Promise<ClientRateLimitInfo | undefined> {
		const client = this.getClientFromStorage(key)
		return client ? { totalHits: client.totalHits, resetTime: client.resetTime } : undefined
	}

	async increment(key: string): Promise<ClientRateLimitInfo> {
		const client = this.getClient(key)

		const now = Date.now()
		if (client.resetTime.getTime() <= now) {
			this.resetClient(client, now)
		}

		client.totalHits++
		this.setClient(key, client)
		return { totalHits: client.totalHits, resetTime: client.resetTime }
	}

	async decrement(key: string): Promise<void> {
		const client = this.getClient(key)

		if (client.totalHits > 0) {
			client.totalHits--
			this.setClient(key, client)
		}
	}

	async resetKey(key: string): Promise<void> {
		this.deleteClient(key, 'current')
		this.deleteClient(key, 'previous')
	}

	async resetAll(): Promise<void> {
		this.current = Buffer.alloc(0)
		this.previous = Buffer.alloc(0)
		this.currentIndex.clear()
		this.previousIndex.clear()
	}

	shutdown(): void {
		clearInterval(this.interval)
		void this.resetAll()
	}
	private resetClient(client: Client, now = Date.now()): Client {
		client.totalHits = 0
		client.resetTime.setTime(now + this.windowMs)
		return client
	}

	private getClient(key: string): Client {
		let client = this.getClientFromStorage(key)
		
		if (!client) {
			client = { totalHits: 0, resetTime: new Date() }
			this.resetClient(client)
		}

		return client
	}

	private getClientFromStorage(key: string): Client | undefined {
		// Check current storage first
		if (this.currentIndex.has(key)) {
			return this.deserializeClient(this.current, this.currentIndex.get(key)!)
		}
		
		// Check previous storage
		if (this.previousIndex.has(key)) {
			const client = this.deserializeClient(this.previous, this.previousIndex.get(key)!)
			// Move from previous to current
			this.deleteClient(key, 'previous')
			this.setClient(key, client)
			return client
		}

		return undefined
	}

	private setClient(key: string, client: Client): void {
		const serialized = this.serializeClient(client)
		const keyBuffer = Buffer.from(key, 'utf8')
		const keyLengthBuffer = Buffer.allocUnsafe(4)
		keyLengthBuffer.writeUInt32BE(keyBuffer.length, 0)
		
		const entryBuffer = Buffer.concat([keyLengthBuffer, keyBuffer, serialized])
		
		// Remove existing entry if it exists
		this.deleteClient(key, 'current')
		
		// Append new entry
		this.current = Buffer.concat([this.current, entryBuffer])
		this.currentIndex.set(key, this.current.length - entryBuffer.length)
	}

	private deleteClient(key: string, storage: 'current' | 'previous'): void {
		const index = storage === 'current' ? this.currentIndex : this.previousIndex
		const buffer = storage === 'current' ? this.current : this.previous
		
		if (!index.has(key)) return
		
		const position = index.get(key)!
		
		// Read the entry to get its size
		const keyLength = buffer.readUInt32BE(position)
		const entrySize = 4 + keyLength + 16 // 4 bytes for key length + key + 16 bytes for client data
		
		// Create new buffer without this entry
		const beforeEntry = buffer.subarray(0, position)
		const afterEntry = buffer.subarray(position + entrySize)
		const newBuffer = Buffer.concat([beforeEntry, afterEntry])
		
		// Update buffer and rebuild index
		if (storage === 'current') {
			this.current = newBuffer
			this.rebuildIndex('current')
		} else {
			this.previous = newBuffer
			this.rebuildIndex('previous')
		}
	}

	private serializeClient(client: Client): Buffer {
		const buffer = Buffer.allocUnsafe(16)
		buffer.writeUInt32BE(client.totalHits, 0)
		buffer.writeBigUInt64BE(BigInt(client.resetTime.getTime()), 4)
		return buffer
	}

	private deserializeClient(buffer: Buffer, position: number): Client {
		// Skip key length and key to get to client data
		const keyLength = buffer.readUInt32BE(position)
		const clientDataPosition = position + 4 + keyLength
		
		const totalHits = buffer.readUInt32BE(clientDataPosition)
		const resetTimeMs = Number(buffer.readBigUInt64BE(clientDataPosition + 4))
		
		return {
			totalHits,
			resetTime: new Date(resetTimeMs)
		}
	}

	private rebuildIndex(storage: 'current' | 'previous'): void {
		const index = storage === 'current' ? this.currentIndex : this.previousIndex
		const buffer = storage === 'current' ? this.current : this.previous
		
		index.clear()
		
		let position = 0
		while (position < buffer.length) {
			const keyLength = buffer.readUInt32BE(position)
			const key = buffer.subarray(position + 4, position + 4 + keyLength).toString('utf8')
			
			index.set(key, position)
			position += 4 + keyLength + 16 // Move to next entry
		}
	}

	private clearExpired(): void {
		this.previous = this.current
		this.previousIndex = this.currentIndex
		this.current = Buffer.alloc(0)
		this.currentIndex = new Map()
	}
}