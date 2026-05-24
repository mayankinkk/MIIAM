import { NextRequest, NextResponse } from 'next/server';
import { query as dbQuery } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { fn, params } = await req.json();

    if (!fn) {
      return NextResponse.json({ data: null, error: { message: 'No function name provided' } });
    }

    const paramValues = params ? Object.values(params) : [];
    const paramPlaceholders = paramValues.map((_, i) => `$${i + 1}`).join(', ');

    const { rows } = await dbQuery(`SELECT * FROM ${fn}(${paramPlaceholders})`, paramValues);

    return NextResponse.json({ data: rows, error: null });
  } catch (error: any) {
    return NextResponse.json({ data: null, error: { message: error.message } });
  }
}
