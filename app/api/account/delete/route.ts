import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    let token = authHeader?.replace(/^Bearer\s+/i, "")?.trim();

    if (!token) {
      // Also attempt reading from request body
      try {
        const body = await req.json();
        if (body && body.token) {
          token = body.token;
        }
      } catch {}
    }

    if (!token) {
      return NextResponse.json(
        { error: "Missing authorization bearer token." },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { error: "Supabase environment not configured." },
        { status: 500 }
      );
    }

    // Verify caller identity using anon key
    const anonClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
    });
    const {
      data: { user },
      error: userError,
    } = await anonClient.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired authorization token." },
        { status: 401 }
      );
    }

    // Admin deletion of the verified auth user via server-only service-role client
    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Server admin service-role key not configured." },
        { status: 500 }
      );
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account and auth records deleted successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error during account deletion." },
      { status: 500 }
    );
  }
}

