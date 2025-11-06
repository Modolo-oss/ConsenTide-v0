import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'DELETE')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PATCH')
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    const path = pathSegments.join('/')
    const url = `${BACKEND_URL}/api/v1/${path}`
    
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      if (!key.toLowerCase().startsWith('host') && 
          !key.toLowerCase().startsWith('connection')) {
        headers[key] = value
      }
    })

    const queryString = request.nextUrl.search
    const fullUrl = queryString ? `${url}${queryString}` : url

    let body = undefined
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        body = await request.text()
      } catch {
        body = undefined
      }
    }

    const response = await fetch(fullUrl, {
      method,
      headers,
      body: body || undefined,
    })

    const data = await response.text()
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { 
        code: 'PROXY_ERROR', 
        message: 'Failed to connect to backend API',
        timestamp: Date.now()
      },
      { status: 502 }
    )
  }
}
