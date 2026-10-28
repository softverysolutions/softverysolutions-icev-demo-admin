class DataCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.TTL = 5 * 60 * 1000;
  }

  set(key, data) {
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now());
  }

  get(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp || Date.now() - timestamp > this.TTL) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  has(key) {
    return this.cache.has(key) && this.get(key) !== null;
  }
}

export const dataCache = new DataCache();
export default dataCache;
