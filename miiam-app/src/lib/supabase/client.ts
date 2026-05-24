import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';
import { uploadFile } from '@/lib/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

class QueryBuilder {
  private table: string;
  private method: string = 'select';
  private filters: any[] = [];
  private orderBy: any = null;
  private limitVal: number | null = null;
  private rangeVal: { start: number; end: number } | null = null;
  private singleResult: boolean = false;
  private maybeSingleResult: boolean = false;
  private insertData: any = null;
  private updateData: any = null;
  private returning: boolean = false;
  private orConditions: any[] | null = null;
  private abortController: AbortController | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(_columns?: string) { this.method = 'select'; return this; }
  insert(data: any) { this.method = 'insert'; this.insertData = data; return this; }
  update(data: any) { this.method = 'update'; this.updateData = data; return this; }
  delete() { this.method = 'delete'; return this; }

  eq(col: string, val: any) { this.filters.push({ op: 'eq', col, val }); return this; }
  neq(col: string, val: any) { this.filters.push({ op: 'neq', col, val }); return this; }
  gt(col: string, val: any) { this.filters.push({ op: 'gt', col, val }); return this; }
  gte(col: string, val: any) { this.filters.push({ op: 'gte', col, val }); return this; }
  lt(col: string, val: any) { this.filters.push({ op: 'lt', col, val }); return this; }
  lte(col: string, val: any) { this.filters.push({ op: 'lte', col, val }); return this; }
  is(col: string, val: any) { this.filters.push({ op: 'is', col, val }); return this; }
  in(col: string, vals: any[]) { this.filters.push({ op: 'in', col, val: vals }); return this; }
  contains(col: string, val: string) { this.filters.push({ op: 'contains', col, val }); return this; }
  ilike(col: string, val: string) { this.filters.push({ op: 'ilike', col, val }); return this; }
  textSearch(col: string, query: string) { this.filters.push({ op: 'textSearch', col, val: query }); return this; }
  not(col: string, val: any) { this.filters.push({ op: 'not', col, val }); return this; }

  order(column: string, opts?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: opts?.ascending !== false };
    return this;
  }
  limit(n: number) { this.limitVal = n; return this; }
  range(start: number, end: number) { this.rangeVal = { start, end }; return this; }
  single() { this.singleResult = true; return this; }
  maybeSingle() { this.maybeSingleResult = true; return this; }
  abortSignal() { this.abortController = new AbortController(); return this.abortController.signal; }

  or(filters: string) {
    const parts = filters.split(',').map(f => f.trim());
    this.orConditions = parts.map(p => {
      const match = p.match(/(\w+)\.(\w+)\.(\w+)/);
      if (match) return { col: match[1], op: match[2], val: match[3] };
      const m2 = p.match(/(\w+)\.eq\.(.+)/);
      if (m2) return { col: m2[1], op: 'eq', val: m2[2] };
      return null;
    }).filter(Boolean);
    return this;
  }

  upsert(data: any) { this.method = 'upsert'; this.insertData = data; return this; }

  private async execute(): Promise<{ data: any; error: any }> {
    try {
      const body: any = {
        table: this.table,
        method: this.method,
        filters: this.filters,
      };
      if (this.orConditions) body.filters.push({ op: 'or', conditions: this.orConditions });
      if (this.orderBy) body.orderBy = this.orderBy;
      if (this.limitVal) body.limit = this.limitVal;
      if (this.rangeVal) body.range = this.rangeVal;
      if (this.singleResult) body.single = true;
      if (this.insertData) body.data = this.insertData;
      if (this.updateData) body.data = this.updateData;

      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: this.abortController?.signal,
      });
      const json = await res.json();
      let { data, error } = json;

      if (this.singleResult && Array.isArray(data)) data = data[0] || null;
      if (this.maybeSingleResult && Array.isArray(data)) data = data[0] || null;

      return { data, error };
    } catch (error: any) {
      if (error.name === 'AbortError') return { data: null, error: null };
      return { data: null, error: { message: error.message } };
    }
  }

  then(resolve?: any, reject?: any) {
    return this.execute().then(resolve, reject);
  }
}

class StorageCompat {
  private bucketName: string = '';
  from(bucket: string) {
    this.bucketName = bucket;
    return this;
  }
  async upload(path: string, file: File) {
    try {
      const buffer = await file.arrayBuffer();
      const url = await uploadFile(Buffer.from(buffer), path, file.type);
      return { data: { path, fullPath: path }, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }
  getPublicUrl(path: string) {
    const bucket = process.env.NEXT_PUBLIC_GCS_BUCKET || 'miiam-storage-bucket';
    return { data: { publicUrl: `https://storage.googleapis.com/${bucket}/${path}` } };
  }
}

class AuthCompat {
  async getUser() {
    const user = auth.currentUser;
    if (user) {
      return { data: { user: { id: user.uid, email: user.email, user_metadata: user.providerData } }, error: null };
    }
    return new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, (u) => {
        unsub();
        if (u) {
          resolve({ data: { user: { id: u.uid, email: u.email, user_metadata: u.providerData } }, error: null });
        } else {
          resolve({ data: { user: null }, error: null });
        }
      });
    });
  }
  async getSession() {
    const user = auth.currentUser;
    const accessToken = await user?.getIdToken();
    return {
      data: {
        session: {
          access_token: accessToken,
          user: user ? { id: user.uid, email: user.email } : null,
        },
      },
      error: null,
    };
  }
  async signInWithPassword(opts: { email: string; password: string }) {
    try {
      const cred = await signInWithEmailAndPassword(auth, opts.email, opts.password);
      return {
        data: { user: { id: cred.user.uid, email: cred.user.email }, session: { access_token: await cred.user.getIdToken() } },
        error: null,
      };
    } catch (error: any) {
      return { data: { user: null, session: null }, error: { message: error.message } };
    }
  }
  async signOut() {
    await fbSignOut(auth);
    return { error: null };
  }
  async resetPasswordForEmail(email: string) {
    const { sendPasswordResetEmail } = await import('firebase/auth');
    try {
      await sendPasswordResetEmail(auth, email);
      return { data: {}, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const unsub = onAuthStateChanged(auth, (user) => {
      callback('SIGNED_IN', user ? { user: { id: user.uid, email: user.email } } : null);
    });
    return { data: { subscription: { unsubscribe: unsub } } };
  }
  get admin() {
    return {
      async listUsers() {
        return { data: { users: [] }, error: { message: 'Admin API not available on client' } };
      },
    };
  }
  async signInWithOAuth() { return { data: {}, error: { message: 'OAuth not configured' } }; }
}

class ChannelCompat {
  private table: string;
  private callback: Function | null = null;
  private filter: string = '*';
  private event: string = '*';
  private interval: any = null;

  constructor(private name: string) { this.table = name; }

  on(event: string, opts: { filter?: string; schema?: string; table?: string }, callback: Function) {
    this.event = event;
    this.table = opts.table || this.table;
    this.callback = callback;
    return this;
  }

  subscribe(callback?: (status: string) => void) {
    callback?.('SUBSCRIBED');
    if (this.event !== '*' && this.table && this.callback) {
      this.interval = setInterval(async () => {
        try {
          const res = await fetch('/api/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: this.table, method: 'select', filters: [] }),
          });
          const json = await res.json();
          if (json.data) this.callback?.(json.data);
        } catch {}
      }, 5000);
    }
    return this;
  }

  unsubscribe() {
    if (this.interval) clearInterval(this.interval);
  }
}

export function createClient(): any {
  return {
    from: (table: string) => new QueryBuilder(table),
    channel: (name: string) => new ChannelCompat(name),
    removeChannel: (channel: ChannelCompat) => { channel.unsubscribe(); },
    auth: new AuthCompat(),
    storage: new StorageCompat(),
    rpc: async (fn: string, params?: any) => {
      try {
        const res = await fetch('/api/rpc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fn, params }),
        });
        return await res.json();
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    },
    functions: {
      invoke: async (_name: string, _opts?: any) => {
        return { data: null, error: { message: 'Edge functions not available' } };
      },
    },
  };
}
