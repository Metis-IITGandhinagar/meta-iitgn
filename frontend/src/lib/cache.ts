import { type Table } from "dexie";
import { db } from "./db";

export interface LoadCachedCollectionOptions<T, R = any> {
  key: string;
  table: Table<T, any>;
  serverInfo: { last_updated: string | number; count: number } | null | undefined;
  fetcher: () => Promise<R>;
  mapper?: (data: R) => T[];
  onDataLoaded: (data: T[]) => void;
  forceRefresh?: boolean;
}

/**
 * Checks if the cached metadata in Dexie matches the server metadata.
 */
export async function isCacheValid(
  key: string,
  serverInfo: { last_updated: string | number; count: number } | null | undefined
): Promise<boolean> {
  if (!serverInfo) return false;
  const localMeta = await db.meta.get(key);
  if (!localMeta) return false;

  const serverLastUpdated =
    typeof serverInfo.last_updated === "string"
      ? new Date(serverInfo.last_updated).getTime()
      : Number(serverInfo.last_updated);

  const localLastUpdated =
    typeof localMeta.last_updated === "string"
      ? new Date(localMeta.last_updated).getTime()
      : Number(localMeta.last_updated);

  return (
    localLastUpdated === serverLastUpdated &&
    Number(localMeta.count) === Number(serverInfo.count)
  );
}

/**
 * Updates metadata in Dexie for a collection.
 */
export async function updateMeta(
  key: string,
  serverInfo: { last_updated: string | number; count: number } | null | undefined
): Promise<void> {
  if (serverInfo) {
    const last_updated =
      typeof serverInfo.last_updated === "string"
        ? new Date(serverInfo.last_updated).getTime()
        : Number(serverInfo.last_updated);

    await db.meta.put({
      key,
      last_updated,
      count: Number(serverInfo.count),
    });
  }
}

/**
 * Loads a collection using Stale-While-Revalidate pattern.
 * Instantly loads cached Dexie data, and only contacts the server if metadata has changed or refresh is forced.
 */
export async function loadCachedCollection<T, R = any>({
  key,
  table,
  serverInfo,
  fetcher,
  mapper,
  onDataLoaded,
  forceRefresh = false,
}: LoadCachedCollectionOptions<T, R>): Promise<T[]> {
  // 1. Load from Dexie immediately and notify callback
  const cachedData = await table.toArray();
  onDataLoaded(cachedData);

  // 2. Check cache validity
  const valid = !forceRefresh && (await isCacheValid(key, serverInfo));

  if (!valid) {
    try {
      // 3. Fetch from server
      const rawData = await fetcher();
      // 4. Map data if mapper is provided
      const mappedData = mapper ? mapper(rawData) : (rawData as any as T[]);

      // 5. Update Dexie table
      await table.clear();
      if (mappedData.length > 0) {
        await table.bulkAdd(mappedData);
      }

      // 6. Update meta in Dexie
      await updateMeta(key, serverInfo);

      // 7. Notify callback with fresh data
      onDataLoaded(mappedData);
      return mappedData;
    } catch (error) {
      console.error(`Failed to refresh cache for collection "${key}":`, error);
    }
  }

  return cachedData;
}
