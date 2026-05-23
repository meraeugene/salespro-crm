import { NextResponse } from "next/server";
import { handleError, requireUser } from "@/lib/api";

type IpLookup = {
  success?: boolean;
  city?: string;
  region?: string;
  country?: string;
  connection?: {
    isp?: string;
    org?: string;
  };
};

function firstHeaderIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  return forwarded || realIp || cfIp || null;
}

function isPublicIp(ip: string | null) {
  if (!ip) return false;
  if (ip === "127.0.0.1" || ip === "::1") return false;
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(ip)) return false;
  return true;
}

async function lookupIp(ip: string | null) {
  if (!isPublicIp(ip)) return { location: ip ? "Private network" : null, network: ip ? "Local network" : null };
  const response = await fetch(`https://ipwho.is/${ip}`, { cache: "no-store" });
  if (!response.ok) return { location: null, network: null };
  const data = (await response.json()) as IpLookup;
  if (data.success === false) return { location: null, network: null };
  const location = [data.city, data.region, data.country].filter(Boolean).join(", ") || null;
  return { location, network: data.connection?.isp ?? data.connection?.org ?? null };
}

export async function POST(request: Request) {
  try {
    const { supabase, user, error } = await requireUser();
    if (error || !user) return error;

    const ip = firstHeaderIp(request);
    const ipData = await lookupIp(ip);
    const now = new Date().toISOString();

    const { error: dbError } = await supabase
      .from("profiles")
      .update({
        last_login_at: now,
        last_login_ip: ip,
        last_login_location: ipData.location,
        last_login_network: ipData.network,
        updated_at: now,
      })
      .eq("id", user.id);

    if (dbError) throw dbError;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
