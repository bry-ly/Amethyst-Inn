import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Read backend config file directly from repo to keep single source of truth
    const jsonPath = path.join(process.cwd(), '..', '..', 'backend', 'config', 'banned-words.json');
    const data = fs.readFileSync(jsonPath, 'utf8');
    const parsed = JSON.parse(data);
    return NextResponse.json({ success: true, data: parsed });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to read banned words' }, { status: 500 });
  }
}
