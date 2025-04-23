import { NextRequest, NextResponse } from 'next/server';
import type { NextMiddleware } from 'next/server';
import jwt from 'jsonwebtoken';

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|images|assets).*)',
    ],
};

type MiddlewareOptions = {
    localeDetection?: boolean;
    protectedPaths?: string[];
    blockedIfAuthenticated?: string[];
};

// Tipagem para os papéis de usuário
type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';

// Rotas públicas que não requerem autenticação
const publicPaths = [
    '/email_recovery_password',
    '/email_recovery_password_user_ecommerce',
    '/register',
    '/not-found',
    '/recover_password',
    '/recover_password_user_ecommerce'
];

// Configuração de permissões por role
const rolePermissions: Record<UserRole, string[]> = {
    SUPER_ADMIN: [
        '/unauthorized',
        '/'
    ],
    ADMIN: [
        '/unauthorized',
        '/',
    ],
    EMPLOYEE: [
        '/unauthorized',
        '/',
    ]
};

export const middleware: NextMiddleware = async (req: NextRequest) => {
    const { pathname } = req.nextUrl;
    const options: MiddlewareOptions = {
        localeDetection: true,
        protectedPaths: Object.values(rolePermissions).flat(),
        blockedIfAuthenticated: ['/login', '/register']
    };

    try {
        console.log(`[Middleware] ${req.method} ${req.url}`);
        const authToken = req.cookies.get('@ecommerce.token')?.value;

        // 1. Verificar se é uma rota pública
        const isPublicPath = publicPaths.some(publicPath => {
            const regex = new RegExp(`^${publicPath.replace(/\[.*?\]/g, '.*')}$`);
            return regex.test(pathname);
        });

        if (isPublicPath) {
            return NextResponse.next();
        }

        // 2. Redirecionar rotas bloqueadas para autenticados
        if (authToken && options.blockedIfAuthenticated?.some(path => pathname.startsWith(path))) {
            return NextResponse.redirect(new URL('/', req.url));
        }

        // 3. Verificação de autenticação e permissões
        if (authToken) {
            try {
                const decoded = jwt.decode(authToken) as { role: UserRole };
                const userRole = decoded?.role;

                if (!userRole || !rolePermissions[userRole]) {
                    return NextResponse.redirect(new URL('/unauthorized', req.url));
                }

                const hasPermission = rolePermissions[userRole].some(allowedPath =>
                    pathname.startsWith(allowedPath)
                );

                if (!hasPermission) {
                    return NextResponse.redirect(new URL('/unauthorized', req.url));
                }

            } catch (error) {
                console.error('Token inválido:', error);
                return NextResponse.redirect(new URL('/login', req.url));
            }
        }

        // 4. Verificar rotas protegidas para não autenticados
        const isProtectedRoute = options.protectedPaths?.some(path =>
            pathname.startsWith(path)
        );

        if (isProtectedRoute && !authToken) {
            const loginUrl = new URL('/login', req.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }

        // 4. Headers de segurança
        const headers = new Headers(req.headers);
        headers.set('X-Content-Type-Options', 'nosniff');
        headers.set('X-Frame-Options', 'DENY');

        // 5. Rate Limiting
        const ip = req.headers.get('x-real-ip') ||
            req.headers.get('x-forwarded-for')?.split(',')[0] ||
            'anonymous';
        const rateLimit = await checkRateLimit(ip);

        if (rateLimit.isLimited) {
            return new NextResponse('Too Many Requests', {
                status: 429,
                headers: { 'Retry-After': rateLimit.retryAfter.toString() },
            });
        }

        // 6. Preparar resposta
        const response = NextResponse.next({ request: { headers } });

        // 7. Internacionalização
        if (options.localeDetection) {
            const locale = req.cookies.get('NEXT_LOCALE')?.value || 'pt-br';
            response.cookies.set('NEXT_LOCALE', locale);
        }

        // 8. Configuração de CORS
        if (pathname.startsWith('/api/')) {
            response.headers.set('Access-Control-Allow-Origin', '*');
            response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        }

        // 9. Cache para arquivos estáticos
        if (pathname.startsWith('/_next/static')) {
            response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        }

        return response;

    } catch (error) {
        console.error('[Middleware Error]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function checkRateLimit(key: string) {
    // Implementação real com Redis ou similar
    return { isLimited: false, retryAfter: 60 };
}

declare module 'next/server' {
    interface NextRequest {
        parsedUrl?: URL;
    }
}