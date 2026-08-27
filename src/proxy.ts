import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createHmac, timingSafeEqual } from "crypto";
import { CLIENT_SESSION_COOKIE } from "@/lib/auth/client-session";

// Proxy (formerly "middleware") always runs on Node.js — safe to use Node's `crypto`
// module here for the client-session HMAC check below.
function hasValidClientSessionCookie(request: NextRequest): boolean {
  const token = request.cookies.get(CLIENT_SESSION_COOKIE)?.value;
  if (!token) return false;
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return false;

  const expected = createHmac("sha256", process.env.CLIENT_SESSION_SECRET!)
    .update(payloadB64)
    .digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Step 1 of the route guard order (§3): cheap "is anyone logged in" check for /app/*.
// Steps 2-5 (role, project scope, module scope, action permission) need DB lookups and
// happen in guard() (src/lib/auth/guard.ts) at the top of each route/server component.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !hasValidClientSessionCookie(request)) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*"],
};
