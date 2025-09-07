// Mock for AsyncLocalStorage in browser environment
export class AsyncLocalStorage {
	constructor() {
		this.store = new Map();
	}

	run(store, callback) {
		const previousStore = this.store;
		this.store = store || new Map();
		try {
			return callback();
		} finally {
			this.store = previousStore;
		}
	}

	getStore() {
		return this.store;
	}

	enterWith(store) {
		this.store = store || new Map();
	}

	exit(callback) {
		const previousStore = this.store;
		this.store = new Map();
		try {
			return callback();
		} finally {
			this.store = previousStore;
		}
	}
}

export default AsyncLocalStorage;
