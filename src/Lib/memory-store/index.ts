import type { Store, Options, ClientRateLimitInfo } from './types'

type Client = {
	totalHits: number
	resetTime: Date
}

export class MemoryStore implements Store {
	windowMs!: number

	previous = new Map<string, Client>()
	current = new Map<string, Client>()

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
		return this.current.get(key) ?? this.previous.get(key)
	}

	async increment(key: string): Promise<ClientRateLimitInfo> {
		const client = this.getClient(key)

		const now = Date.now()
		if (client.resetTime.getTime() <= now) {
			this.resetClient(client, now)
		}

		client.totalHits++
		return client
	}

	async decrement(key: string): Promise<void> {
		const client = this.getClient(key)

		if (client.totalHits > 0) client.totalHits--
	}

	async resetKey(key: string): Promise<void> {
		this.current.delete(key)
		this.previous.delete(key)
	}

	async resetAll(): Promise<void> {
		this.current.clear()
		this.previous.clear()
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
		if (this.current.has(key)) return this.current.get(key)!

		let client
		if (this.previous.has(key)) {
			client = this.previous.get(key)!
			this.previous.delete(key)
		} else {
			client = { totalHits: 0, resetTime: new Date() }
			this.resetClient(client)
		}

		this.current.set(key, client)
		return client
	}

	private clearExpired(): void {
		this.previous = this.current
		this.current = new Map()
	}
}