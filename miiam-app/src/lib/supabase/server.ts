import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { query as dbQuery } from '@/lib/db';

let adminApp: any;
try {
  adminApp = getApps().length ? getApp() : initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
} catch {}

function getAdminAuth() {
  return getAuth(adminApp);
}

class ServerQueryBuilder {
  private table: string;
  private method: string = 'select';
  private filters: any[] = [];
  private orderBy: any = null;
  private limitVal: number | null = null;
  private singleResult: boolean = false;
  private maybeSingleResult: boolean = false;
  private insertData: any = null;
  private updateData: any = null;

  constructor(table: string) { this.table = table; }

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
  not(col: string, val: any) { this.filters.push({ op: 'not', col, val }); return this; }
  order(column: string, opts?: { ascending?: boolean }) { this.orderBy = { column, ascending: opts?.ascending !== false }; return this; }
  limit(n: number) { this.limitVal = n; return this; }
  single() { this.singleResult = true; return this; }
  maybeSingle() { this.maybeSingleResult = true; return this; }
  upsert(data: any) { this.method = 'upsert'; this.insertData = data; return this; }

  private async execute(): Promise<{ data: any; error: any }> {
    try {
      let sql: string;
      let params: any[] = [];
      let pIdx = 1;
      const where = (fs: any[]) => {
        if (!fs.length) return '';
        return ' WHERE ' + fs.map((f: any) => {
          const p = `$${pIdx++}`;
          params.push(f.val);
          switch (f.op) {
            case 'eq': return `"${f.col}" = ${p}`;
            case 'neq': return `"${f.col}" != ${p}`;
            case 'gt': return `"${f.col}" > ${p}`;
            case 'gte': return `"${f.col}" >= ${p}`;
            case 'lt': return `"${f.col}" < ${p}`;
            case 'lte': return `"${f.col}" <= ${p}`;
            case 'is': params[params.length-1] = f.val; return `"${f.col}" IS ${f.val === null ? 'NULL' : p}`;
            case 'in': {
              params.pop();
              const ps = f.val.map((_: any) => `$${pIdx++}`).join(',');
              params.push(...f.val);
              return `"${f.col}" IN (${ps})`;
            }
            case 'ilike': return `"${f.col}"::text ILIKE ${p}`;
            case 'contains': return `"${f.col}"::text ILIKE ${p}`;
            default: return `"${f.col}" = ${p}`;
          }
        }).join(' AND ');
      };

      switch (this.method) {
        case 'select': {
          sql = `SELECT * FROM "${this.table}"`;
          sql += where(this.filters);
          if (this.orderBy) sql += ` ORDER BY "${this.orderBy.column}" ${this.orderBy.ascending ? 'ASC' : 'DESC'}`;
          if (this.limitVal) sql += ` LIMIT ${this.limitVal}`;
          break;
        }
        case 'insert': {
          if (!this.insertData) return { data: null, error: { message: 'No data' } };
          const items = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
          const results: any[] = [];
          for (const item of items) {
            const cols = Object.keys(item);
            const vals = Object.values(item);
            const phs = vals.map((_, i) => `$${i + 1}`).join(',');
            const { rows } = await dbQuery(`INSERT INTO "${this.table}" (${cols.map(c => `"${c}"`).join(',')}) VALUES (${phs}) RETURNING *`, vals);
            results.push(rows[0]);
          }
          return { data: results.length === 1 ? results[0] : results, error: null };
        }
        case 'update': {
          if (!this.updateData) return { data: null, error: { message: 'No data' } };
          const cols = Object.keys(this.updateData);
          params = Object.values(this.updateData);
          const setClause = cols.map((c, i) => `"${c}" = $${i + 1}`).join(',');
          pIdx = params.length + 1;
          sql = `UPDATE "${this.table}" SET ${setClause}`;
          sql += where(this.filters);
          sql += ' RETURNING *';
          break;
        }
        case 'delete': {
          sql = `DELETE FROM "${this.table}"`;
          sql += where(this.filters);
          sql += ' RETURNING *';
          break;
        }
        case 'upsert': {
          if (!this.insertData) return { data: null, error: { message: 'No data' } };
          const cols = Object.keys(this.insertData);
          const vals = Object.values(this.insertData);
          const phs = vals.map((_, i) => `$${i + 1}`).join(',');
          const upd = cols.map(c => `"${c}" = EXCLUDED."${c}"`).join(',');
          const { rows } = await dbQuery(
            `INSERT INTO "${this.table}" (${cols.map(c => `"${c}"`).join(',')}) VALUES (${phs}) ON CONFLICT (id) DO UPDATE SET ${upd} RETURNING *`,
            vals
          );
          return { data: rows[0], error: null };
        }
        default:
          return { data: null, error: { message: 'Unknown method' } };
      }

      const { rows } = await dbQuery(sql, params);
      let data = rows;
      if (this.singleResult) data = rows[0] || null;
      if (this.maybeSingleResult) data = rows[0] || null;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  then(resolve?: any, reject?: any) {
    return this.execute().then(resolve as any, reject);
  }
}

class ServerAuthCompat {
  async getUser() {
    try {
      const { getAuth } = await import('firebase-admin/auth');
      // For server context, read Authorization header or cookie
      return { data: { user: null }, error: null };
    } catch {
      return { data: { user: null }, error: null };
    }
  }
  async getSession() {
    return { data: { session: null }, error: null };
  }
  async signOut() { return { error: null }; }
}

export async function createClient(): Promise<any> {
  return {
    from: (table: string) => new ServerQueryBuilder(table),
    auth: new ServerAuthCompat(),
    channel: () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }), unsubscribe: () => {} }),
    removeChannel: () => {},
    rpc: async (fn: string, params?: any) => {
      try {
        const res = await dbQuery(`SELECT * FROM ${fn}(${params ? Object.values(params).map((_, i) => `$${i+1}`).join(',') : ''})`, params ? Object.values(params) : []);
        return { data: res.rows, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    },
  };
}

export function createAdminClient(): any {
  const pool = new (require('pg').Pool)({ connectionString: process.env.DATABASE_URL });
  return {
    from: (table: string) => new ServerQueryBuilder(table),
    auth: {
      async getUser() { return { data: { user: null }, error: null }; },
      async getSession() { return { data: { session: null }, error: null }; },
    },
  };
}
