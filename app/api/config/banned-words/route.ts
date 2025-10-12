import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Read backend config file directly from repo to keep single source of truth
    // process.cwd() returns the frontend directory, go up one level to repo root
    const jsonPath = path.join(process.cwd(), '..', 'backend', 'config', 'banned-words.json');
    const data = fs.readFileSync(jsonPath, 'utf8');
    const parsed = JSON.parse(data);
    return NextResponse.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Failed to read banned-words.json:', err?.message, 'Tried path:', path.join(process.cwd(), '..', 'backend', 'config', 'banned-words.json'));
    return NextResponse.json({ success: false, error: 'Failed to read banned words' }, { status: 500 });
  }
}
