import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { protectedRoutes } from "@/constants/navigation";
import { canAccessRoute, defaultRouteForRole } from "@/lib/auth";
import { updateSession } from "@/lib/supabase/proxy";
import type { Role } from "@/types/crm";

const authRoutes = ["/auth/login", "/auth/forgot-password"];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname === "/auth/register") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  const { response, user, supabase } = await updateSession(request);
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && authRoutes.includes(pathname)) {
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const role = (data?.role ?? user.user_metadata.role) as Role | undefined;
    const url = request.nextUrl.clone();
    url.pathname = defaultRouteForRole(role);
    return NextResponse.redirect(url);
  }

  if (user && isProtected) {
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const role = (data?.role ?? user.user_metadata.role) as Role | undefined;
    if (!canAccessRoute(role, pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = defaultRouteForRole(role);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
