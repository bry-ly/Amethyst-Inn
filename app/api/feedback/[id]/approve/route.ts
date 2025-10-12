import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const response = await fetch(`${BACKEND_URL}/api/feedback/${params.id}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error approving feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to approve feedback' },
      { status: 500 }
    );
  }
}
