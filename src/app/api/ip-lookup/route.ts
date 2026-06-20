import { NextResponse } from "next/server";
import type { IpLookup } from "@/types";

const IPV4_PATTERN =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ip = searchParams.get("ip")?.trim() ?? "";

  if (!IPV4_PATTERN.test(ip)) {
    return NextResponse.json({ error: "Invalid IP address" }, { status: 400 });
  }

  const fields = [
    "status",
    "country",
    "countryCode",
    "region",
    "regionName",
    "city",
    "zip",
    "lat",
    "lon",
    "timezone",
    "isp",
    "org",
    "as",
    "query",
    "message",
  ].join(",");

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=${fields}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Lookup failed" }, { status: 502 });
    }

    const payload = (await response.json()) as Partial<IpLookup> & {
      status?: string;
      message?: string;
    };

    if (payload.status !== "success") {
      return NextResponse.json(
        { error: payload.message || "Lookup failed" },
        { status: 502 }
      );
    }

    const result: IpLookup = {
      country: String(payload.country ?? ""),
      countryCode: String(payload.countryCode ?? ""),
      region: String(payload.region ?? ""),
      regionName: String(payload.regionName ?? ""),
      city: String(payload.city ?? ""),
      zip: String(payload.zip ?? ""),
      lat: Number(payload.lat ?? 0),
      lon: Number(payload.lon ?? 0),
      timezone: String(payload.timezone ?? ""),
      isp: String(payload.isp ?? ""),
      org: String(payload.org ?? ""),
      as: String(payload.as ?? ""),
      query: String(payload.query ?? ip),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("IP lookup failed:", error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
