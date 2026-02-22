// Next.js 16 middleware (note: rename to proxy.ts to avoid deprecation warning in Next 16)
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({ request: { headers: request.headers } });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return request.cookies.getAll(); },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    response = NextResponse.next({ request: { headers: request.headers } });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const path = request.nextUrl.pathname;

    const publicRoutes = ['/login', '/auth/callback', '/'];
    const isPublic = publicRoutes.some(r => path.startsWith(r));

    // Not logged in → redirect to login
    if (!user && !isPublic) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (user) {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role, is_active')
            .eq('id', user.id)
            .single();

        if (!profile?.is_active) {
            return NextResponse.redirect(new URL('/login?error=inactive', request.url));
        }

        const role = profile?.role;

        // Role-based route protection
        if (path.startsWith('/admin') && role !== 'admin') {
            return NextResponse.redirect(new URL(
                role === 'teacher' ? '/teacher/dashboard' :
                    role === 'student' ? '/student/dashboard' :
                        role === 'parent' ? '/parent/dashboard' : '/login',
                request.url
            ));
        }
        if (path.startsWith('/teacher') && role !== 'teacher' && role !== 'admin') {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        if (path.startsWith('/student') && role !== 'student' && role !== 'admin') {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        if (path.startsWith('/parent') && role !== 'parent' && role !== 'admin') {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Root redirect
        if (path === '/' || path === '/login') {
            const dest = role === 'admin' ? '/admin' :
                role === 'teacher' ? '/teacher/dashboard' :
                    role === 'student' ? '/student/dashboard' :
                        role === 'parent' ? '/parent/dashboard' : '/login';
            return NextResponse.redirect(new URL(dest, request.url));
        }
    }

    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
