"use server";

import { kv } from "@vercel/kv";
import { createClient } from "redis";

const isDev = process.env.NODE_ENV === "development";

export interface Cache {
	get(key: string): Promise<string | null>;
	set(key: string, value: string): Promise<void>;
	hget(key: string, field: string): Promise<string | null>;
	hset(key: string, field: string, value: string): Promise<void>;
}

class LocalCache implements Cache {
	private client: any = null;
	private url: string;

	constructor(url: string) {
		this.url = url;
	}

	private async getClient() {
		if (!this.client) {
			this.client = createClient({ url: this.url });
			await this.client.connect();
		}
		return this.client;
	}

	async get(key: string) {
		const client = await this.getClient();
		return client.get(key);
	}

	async set(key: string, value: string) {
		const client = await this.getClient();
		await client.set(key, value);
	}

	async hget(key: string, field: string) {
		const client = await this.getClient();
		return client.hGet(key, field);
	}

	async hset(key: string, field: string, value: string) {
		const client = await this.getClient();
		await client.hSet(key, field, value);
	}
}

class ProdCache implements Cache {
	async get(key: string) {
		return kv.get<string>(key);
	}

	async set(key: string, value: string) {
		await kv.set(key, value);
	}

	async hget(key: string, field: string) {
		return kv.hget<string>(key, field);
	}

	async hset(key: string, field: string, value: string) {
		await kv.hset(key, { [field]: value });
	}
}

export const getCache = async (): Promise<Cache> => {
	if (isDev) {
		return new LocalCache(process.env.REDIS_URL!);
	}
	return new ProdCache();
};
