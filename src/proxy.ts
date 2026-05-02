import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Edge middleware:
 * - Protects /dashboard and /admin routes (redirect to /login if not authenticated)
 * - Redirects admin users from /dashboard to /admin (optional)
 * - Demo mode: if NEXT_PUBLIC_AUTH_MODE=demo, skip real auth checks
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // In demo mode, allow all routes
  if (process.env.NEXT_PUBLIC_AUTH_MODE === "demo") {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
