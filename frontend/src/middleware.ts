import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Check if this is an SSE endpoint
    if (request.nextUrl.pathname.includes('/upload/stream')) {
        // For SSE endpoints, we need to ensure no compression or buffering
        const response = NextResponse.next();

        // Set headers to prevent buffering and compression
        response.headers.set('X-Accel-Buffering', 'no');
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.headers.set('Content-Encoding', 'identity');

        return response;
    }

    return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
    matcher: '/api/v1/:path*',
};
