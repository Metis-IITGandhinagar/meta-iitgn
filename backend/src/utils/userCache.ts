class UserCache {
  private cache = new Map<number, { data: any; expiry: number }>();
  private ttl = 15000; // 15 seconds

  get(userId: number) {
    const cached = this.cache.get(userId);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    return null;
  }

  set(userId: number, data: any) {
    this.cache.set(userId, { data, expiry: Date.now() + this.ttl });
  }

  delete(userId: number) {
    this.cache.delete(userId);
  }

  clear() {
    this.cache.clear();
  }
}

export const userCache = new UserCache();
