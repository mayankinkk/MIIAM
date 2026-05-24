import { NextRequest, NextResponse } from 'next/server';
import { query as dbQuery } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { table, method, filters, data, orderBy, limit: limitVal, range, single } = body;

    let sql: string;
    let params: any[] = [];
    let paramIndex = 1;

    const whereClause = (filters: any[]) => {
      if (!filters || filters.length === 0) return '';
      const conditions = filters.map((f: any) => {
        if (f.op === 'or') {
          const orConditions = f.conditions.map((subF: any) => {
            const p = `$${paramIndex++}`;
            params.push(subF.val);
            return `${subF.col} ${subF.negated ? '!=' : '='} ${p}`;
          });
          return `(${orConditions.join(' OR ')})`;
        }
        const p = `$${paramIndex++}`;
        params.push(f.val);
        switch (f.op) {
          case 'eq': return `${f.col} = ${p}`;
          case 'neq': return `${f.col} != ${p}`;
          case 'gt': return `${f.col} > ${p}`;
          case 'gte': return `${f.col} >= ${p}`;
          case 'lt': return `${f.col} < ${p}`;
          case 'lte': return `${f.col} <= ${p}`;
          case 'is': return `${f.col} IS ${f.val === null ? 'NULL' : p}`;
          case 'in': {
            params.pop();
            const placeholders = f.val.map((_: any, i: number) => `$${paramIndex++}`).join(',');
            params.push(...f.val);
            return `${f.col} IN (${placeholders})`;
          }
          case 'ilike': return `${f.col} ILIKE ${p}`;
          case 'contains': return `${f.col}::text ILIKE ${p}`;
          case 'textSearch': return `to_tsvector('english', ${f.col}) @@ plainto_tsquery('english', ${p})`;
          case 'not': return `NOT (${f.col} = ${p})`;
          default: return `${f.col} = ${p}`;
        }
      });
      return ' WHERE ' + conditions.join(' AND ');
    };

    switch (method) {
      case 'select': {
        sql = `SELECT * FROM ${table}`;
        sql += whereClause(filters || []);
        if (orderBy) {
          const dir = orderBy.ascending === false ? 'DESC' : 'ASC';
          sql += ` ORDER BY "${orderBy.column}" ${dir}`;
        }
        if (limitVal) sql += ` LIMIT ${limitVal}`;
        if (range) sql += ` OFFSET ${range.start || 0}`;
        break;
      }
      case 'insert': {
        if (!data || data.length === 0) {
          return NextResponse.json({ data: null, error: { message: 'No data provided' } });
        }
        const items = Array.isArray(data) ? data : [data];
        const results: any[] = [];
        for (const item of items) {
          const cols = Object.keys(item);
          const vals = Object.values(item);
          const placeholders = vals.map((_, i) => `$${i + 1}`).join(',');
          const colsStr = cols.map(c => `"${c}"`).join(',');
          const { rows } = await dbQuery(
            `INSERT INTO ${table} (${colsStr}) VALUES (${placeholders}) RETURNING *`,
            vals
          );
          results.push(rows[0]);
        }
        return NextResponse.json({ data: results.length === 1 ? results[0] : results, error: null });
      }
      case 'update': {
        if (!data || Object.keys(data).length === 0) {
          return NextResponse.json({ data: null, error: { message: 'No data provided' } });
        }
        const cols = Object.keys(data);
        const vals = Object.values(data);
        const setClause = cols.map((c, i) => `"${c}" = $${i + 1}`).join(',');
        params = [...vals];
        sql = `UPDATE ${table} SET ${setClause}`;
        const where = whereClause(filters || []);
        sql += where;
        sql += ' RETURNING *';
        break;
      }
      case 'delete': {
        sql = `DELETE FROM ${table}`;
        sql += whereClause(filters || []);
        sql += ' RETURNING *';
        break;
      }
      case 'upsert': {
        if (!data) {
          return NextResponse.json({ data: null, error: { message: 'No data provided' } });
        }
        const cols = Object.keys(data);
        const vals = Object.values(data);
        const placeholders = vals.map((_, i) => `$${i + 1}`).join(',');
        const colsStr = cols.map(c => `"${c}"`).join(',');
        const updateStr = cols.map((c, i) => `"${c}" = EXCLUDED."${c}"`).join(',');
        const { rows } = await dbQuery(
          `INSERT INTO ${table} (${colsStr}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${updateStr} RETURNING *`,
          vals
        );
        return NextResponse.json({ data: rows[0], error: null });
      }
      default:
        return NextResponse.json({ data: null, error: { message: `Unknown method: ${method}` } });
    }

    const { rows } = await dbQuery(sql, params);
    return NextResponse.json({
      data: single ? (rows[0] || null) : rows,
      error: null,
    });
  } catch (error: any) {
    return NextResponse.json({ data: null, error: { message: error.message } });
  }
}
