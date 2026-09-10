import { NextRequest, NextResponse } from 'next/server';
import { createRequire } from 'module';
const requireModule = createRequire(import.meta.url);
const { verifyAccessToken } = requireModule('../utils/jwt');

export interface AuthenticatedUser {
  userId: string;
  profileId: string;
  userRole: string;
  name?: string;
  username?: string;
  mustResetPassword?: boolean;
  impersonatedBy?: string | null;
}

export function getAuthUser(req: NextRequest): { user?: AuthenticatedUser; errorResponse?: NextResponse } {
  const authHeader = req.headers.get('authorization');
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice('Bearer '.length);
  } else {
    // Also check cookies
    const cookieToken = req.cookies.get('accessToken')?.value;
    if (cookieToken) token = cookieToken;
  }

  if (!token) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Missing or malformed Authorization header.' },
        { status: 401 }
      ),
    };
  }

  try {
    const payload = verifyAccessToken(token) as any;
    const user: AuthenticatedUser = {
      userId: payload.sub,
      profileId: payload.profile_id,
      userRole: payload.role || 'USER',
      name: payload.name,
      username: payload.username,
      mustResetPassword: Boolean(payload.must_reset_password),
      impersonatedBy: payload.impersonated_by,
    };

    if (user.mustResetPassword) {
      const pathname = req.nextUrl.pathname;
      const isAllowed = pathname.includes('/auth/password') || pathname.includes('/auth/logout');
      if (!isAllowed) {
        return {
          errorResponse: NextResponse.json(
            {
              error: 'Password reset required. You must change your password before accessing the panel.',
              must_reset_password: true,
            },
            { status: 403 }
          ),
        };
      }
    }

    return { user };
  } catch (err) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Invalid or expired access token.' },
        { status: 401 }
      ),
    };
  }
}

export function requireAdmin(user: AuthenticatedUser): NextResponse | null {
  if (user.userRole !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Access denied. Admin privileges required.' },
      { status: 403 }
    );
  }
  return null;
}
