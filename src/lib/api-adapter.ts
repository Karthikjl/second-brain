import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireAdmin as checkAdmin } from './api-auth';

interface HandlerOptions {
  auth?: boolean;
  admin?: boolean;
}

export function createHandler(
  controllerFn: (req: any, res: any) => Promise<any> | any,
  options: HandlerOptions = { auth: true }
) {
  return async function (
    req: NextRequest,
    context?: { params?: Promise<Record<string, string>> | Record<string, string> }
  ) {
    let resolvedParams: Record<string, string> = {};
    if (context?.params) {
      resolvedParams = await Promise.resolve(context.params);
    }

    const queryObj: Record<string, any> = {};
    req.nextUrl.searchParams.forEach((val, key) => {
      queryObj[key] = val;
    });

    let bodyObj: any = {};
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      try {
        const text = await req.text();
        if (text) {
          bodyObj = JSON.parse(text);
        }
      } catch (e) {
        // empty or non-json body
      }
    }

    const customReq: any = {
      method: req.method,
      url: req.url,
      nextUrl: req.nextUrl,
      headers: Object.fromEntries(req.headers.entries()),
      query: queryObj,
      params: resolvedParams,
      body: bodyObj,
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1',
    };

    if (options.auth !== false) {
      const { user, errorResponse } = getAuthUser(req);
      if (errorResponse) {
        return errorResponse;
      }
      if (options.admin) {
        const adminErr = checkAdmin(user!);
        if (adminErr) return adminErr;
      }
      customReq.userId = user!.userId;
      customReq.profileId = user!.profileId;
      customReq.userRole = user!.userRole;
      customReq.user = user!;
    }

    let nextResponse: NextResponse | null = null;

    const customRes = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(data: any) {
        nextResponse = NextResponse.json(data, { status: this.statusCode });
        return nextResponse;
      },
      send(data?: any) {
        if (this.statusCode === 204) {
          nextResponse = new NextResponse(null, { status: 204 });
        } else if (typeof data === 'object') {
          nextResponse = NextResponse.json(data, { status: this.statusCode });
        } else {
          nextResponse = new NextResponse(data, { status: this.statusCode });
        }
        return nextResponse;
      },
      end() {
        nextResponse = new NextResponse(null, { status: this.statusCode });
        return nextResponse;
      },
    };

    try {
      await controllerFn(customReq, customRes);
      return nextResponse || NextResponse.json({ ok: true }, { status: customRes.statusCode });
    } catch (err: any) {
      console.error('API Handler unhandled error:', err);
      return NextResponse.json(
        { error: err?.message || 'Something went wrong. Please try again.' },
        { status: 500 }
      );
    }
  };
}
