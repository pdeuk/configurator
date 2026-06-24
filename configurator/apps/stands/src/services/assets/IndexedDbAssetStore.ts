import type { AssetDocument } from "./AssetDocument";

const DB_NAME = "configurator-assets";
const DB_VERSION = 1;
const STORE_NAME = "assets";

function openAssetDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            reject(request.error ?? new Error("Unable to open asset database."));
        };

        request.onupgradeneeded = () => {
            const database = request.result;

            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
        };

        request.onsuccess = () => {
            resolve(request.result);
        };
    });
}

function runTransaction<T>(
    mode: IDBTransactionMode,
    handler: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
    return openAssetDatabase().then(database =>
        new Promise<T>((resolve, reject) => {
            const transaction = database.transaction(STORE_NAME, mode);
            const store = transaction.objectStore(STORE_NAME);
            const request = handler(store);

            request.onerror = () => {
                reject(request.error ?? new Error("Asset database request failed."));
            };

            transaction.oncomplete = () => {
                resolve(request.result);
            };

            transaction.onerror = () => {
                reject(transaction.error ?? new Error("Asset database transaction failed."));
            };
        })
    );
}

export class IndexedDbAssetStore {
    save(asset: AssetDocument): Promise<AssetDocument> {
        return runTransaction("readwrite", store => store.put(asset)).then(() => asset);
    }

    get(id: string): Promise<AssetDocument | undefined> {
        return runTransaction("readonly", store => store.get(id));
    }

    delete(id: string): Promise<void> {
        return runTransaction("readwrite", store => store.delete(id)).then(() => undefined);
    }

    list(): Promise<AssetDocument[]> {
        return runTransaction("readonly", store => store.getAll());
    }
}

export const indexedDbAssetStore = new IndexedDbAssetStore();
