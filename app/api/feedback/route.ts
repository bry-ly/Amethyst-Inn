import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const queryString = searchParams.toString();
    
    const url = `${BACKEND_URL}/api/feedback${queryString ? `?${queryString}` : ''}`;
    
    // Forward auth headers if present
    const authHeader = request.headers.get('authorization');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
    
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const response = await fetch(`${BACKEND_URL}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create feedback' },
      { status: 500 }
    );
  }
}
