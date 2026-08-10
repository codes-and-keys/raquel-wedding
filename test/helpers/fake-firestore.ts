/**
 * Fake mínimo do Firestore Admin SDK usado nos testes de payments/webhook.
 * Cobre só a superfície realmente usada pelo código: doc get/set/update,
 * runTransaction, e where('campo', '==', valor).limit(n).get() (usado pelo cron).
 */

class Increment {
  constructor(public readonly n: number) {}
}
class ArrayUnion {
  constructor(public readonly items: unknown[]) {}
}
class ServerTimestamp {
  private readonly ms = Date.now();
  toMillis() { return this.ms; }
  toDate() { return new Date(this.ms); }
}

export const FakeFieldValue = {
  increment: (n: number) => new Increment(n),
  arrayUnion: (...items: unknown[]) => new ArrayUnion(items),
  serverTimestamp: () => new ServerTimestamp(),
};

function applyPatch(current: Record<string, unknown> | undefined, patch: Record<string, unknown>) {
  const result: Record<string, unknown> = { ...(current ?? {}) };
  for (const [key, value] of Object.entries(patch)) {
    if (value instanceof Increment) {
      const base = typeof current?.[key] === 'number' ? (current[key] as number) : 0;
      result[key] = base + value.n;
    } else if (value instanceof ArrayUnion) {
      const existing = Array.isArray(current?.[key]) ? (current[key] as unknown[]) : [];
      const additions = value.items.filter(
        (item) => !existing.some((e) => JSON.stringify(e) === JSON.stringify(item)),
      );
      result[key] = [...existing, ...additions];
    } else {
      result[key] = value;
    }
  }
  return result;
}

type DocRef = {
  id: string;
  __key: string;
  get: () => Promise<{ exists: boolean; id: string; data: () => Record<string, unknown> | undefined }>;
  set: (data: Record<string, unknown>) => Promise<void>;
  update: (patch: Record<string, unknown>) => Promise<void>;
  delete: () => Promise<void>;
};

export function createFakeFirestore(seed: Record<string, Record<string, unknown>> = {}) {
  const store = new Map<string, Record<string, unknown>>();
  for (const [key, value] of Object.entries(seed)) {
    store.set(key, { ...value });
  }
  let autoIdCounter = 0;

  function docRef(collectionName: string, id: string): DocRef {
    const key = `${collectionName}/${id}`;
    return {
      id,
      __key: key,
      get: async () => {
        const data = store.get(key);
        return { exists: data !== undefined, id, data: () => data };
      },
      set: async (data) => {
        store.set(key, applyPatch(undefined, data));
      },
      update: async (patch) => {
        store.set(key, applyPatch(store.get(key), patch));
      },
      delete: async () => {
        store.delete(key);
      },
    };
  }

  function matchDocs(collectionName: string, field: string, value: unknown) {
    return [...store.entries()]
      .filter(([key]) => key.startsWith(`${collectionName}/`))
      .filter(([, data]) => data[field] === value)
      .map(([key, data]) => ({ id: key.slice(collectionName.length + 1), data: () => data, exists: true }));
  }

  const adminDb = {
    collection: (name: string) => ({
      doc: (id?: string) => docRef(name, id ?? `auto-${++autoIdCounter}`),
      where: (field: string, op: string, value: unknown) => {
        if (op !== '==') throw new Error(`FakeFirestore: operador "${op}" não suportado nos testes`);
        return {
          limit: (n: number) => ({
            get: async () => {
              const docs = matchDocs(name, field, value).slice(0, n);
              return { empty: docs.length === 0, size: docs.length, docs, forEach: (fn: (d: unknown) => void) => docs.forEach(fn) };
            },
          }),
          get: async () => {
            const docs = matchDocs(name, field, value);
            return { empty: docs.length === 0, size: docs.length, docs, forEach: (fn: (d: unknown) => void) => docs.forEach(fn) };
          },
        };
      },
    }),
    runTransaction: async <T>(fn: (tx: {
      get: (ref: DocRef) => ReturnType<DocRef['get']>;
      update: (ref: DocRef, patch: Record<string, unknown>) => void;
      set: (ref: DocRef, data: Record<string, unknown>) => void;
    }) => Promise<T>): Promise<T> => {
      const tx = {
        get: (ref: DocRef) => ref.get(),
        update: (ref: DocRef, patch: Record<string, unknown>) => {
          store.set(ref.__key, applyPatch(store.get(ref.__key), patch));
        },
        set: (ref: DocRef, data: Record<string, unknown>) => {
          store.set(ref.__key, applyPatch(undefined, data));
        },
      };
      return fn(tx);
    },
  };

  return {
    adminDb,
    getDoc: (collectionName: string, id: string) => store.get(`${collectionName}/${id}`),
    setDoc: (collectionName: string, id: string, data: Record<string, unknown>) => store.set(`${collectionName}/${id}`, { ...data }),
  };
}
