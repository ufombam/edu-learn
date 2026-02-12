
const DB_NAME = 'EduLearnDB';
const DB_VERSION = 1;
const STORE_NAME = 'pendingQuizAttempts';

export const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => reject('Database error: ' + (event.target as IDBOpenDBRequest).error);

        request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
};

export const storeInIndexedDB = async (storeName: string, data: any) => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(data);

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject('Store error: ' + (event.target as IDBRequest).error);
    });
};

export const getAllFromIndexedDB = async (storeName: string): Promise<any[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject('Get all error: ' + (event.target as IDBRequest).error);
    });
};

export const removeFromIndexedDB = async (storeName: string, id: number) => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject('Delete error: ' + (event.target as IDBRequest).error);
    });
};
