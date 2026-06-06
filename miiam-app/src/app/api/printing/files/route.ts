import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const PRINT_BUCKET = "print-files";
const LEGACY_BUCKET = "menu-images";
const SIGNED_URL_EXPIRY = 3600; // 1 hour

function extractBucketAndPath(url: string): { bucket: string; path: string } | null {
  if (!url) return null;
  for (const bucket of [PRINT_BUCKET, LEGACY_BUCKET]) {
    const marker = `/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      return { bucket, path: url.slice(idx + marker.length) };
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin or vendor role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.role === "admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { urls } = await req.json();
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "urls array is required" }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const signedUrls: { original: string; signed: string | null; error?: string }[] = [];

    for (const url of urls) {
      const info = extractBucketAndPath(url);
      if (!info) {
        signedUrls.push({ original: url, signed: null, error: "Could not parse storage path" });
        continue;
      }

      const { data, error } = await adminClient.storage
        .from(info.bucket)
        .createSignedUrl(info.path, SIGNED_URL_EXPIRY);

      if (error) {
        console.error("[print-files] Signed URL error:", error);
        signedUrls.push({ original: url, signed: null, error: error.message });
      } else {
        signedUrls.push({ original: url, signed: data.signedUrl });
      }
    }

    return NextResponse.json({ urls: signedUrls });
  } catch (err: any) {
    console.error("[print-files] error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
