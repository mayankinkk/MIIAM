import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

// Debug endpoint: diagnoses exactly why bookings are failing
// GET /api/admin/debug-bookings — returns diagnostic info (admin only)
export async function GET(request: NextRequest) {
  const diagnostics: Record<string, unknown> = {};

  try {
    // 1. Check if createClient works (cookie-based auth)
    diagnostics.step = "createClient";
    const supabase = await createClient();
    diagnostics.createClientOk = true;

    // 2. Check if user is authenticated
    diagnostics.step = "getUser";
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    diagnostics.userAuthenticated = !!user;
    diagnostics.authError = authError?.message ?? null;

    if (!user) {
      return NextResponse.json({ ...diagnostics, conclusion: "User not authenticated. Cookie might not be sent." });
    }

    // 3. Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Check if createAdminClient works
    diagnostics.step = "createAdminClient";
    let adminClient: ReturnType<typeof createAdminClient>;
    try {
      adminClient = createAdminClient();
      diagnostics.createAdminClientOk = true;
    } catch (e) {
      diagnostics.createAdminClientOk = false;
      diagnostics.createAdminClientError = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ ...diagnostics, conclusion: "createAdminClient() crashed — SUPABASE_SERVICE_ROLE_KEY missing?" });
    }

    // 4. Check if profiles table is accessible
    diagnostics.step = "checkProfilesTable";
    const { data: profileData, error: profileError } = await adminClient
      .from("profiles")
      .select("id, role, full_name, email")
      .eq("id", user.id)
      .maybeSingle();
    diagnostics.profileExists = !!profileData;
    diagnostics.profileData = profileData ? { role: profileData.role, hasName: !!profileData.full_name, hasEmail: !!profileData.email } : null;
    diagnostics.profileError = profileError?.message ?? null;

    // 5. Check if service_bookings table exists
    diagnostics.step = "checkServiceBookingsTable";
    const { data: tableCheck, error: tableError } = await adminClient
      .from("service_bookings")
      .select("id")
      .limit(1);
    diagnostics.serviceBookingsTableExists = !tableError;
    diagnostics.serviceBookingsTableError = tableError ? { code: tableError.code, message: tableError.message, hint: tableError.hint } : null;
    diagnostics.existingBookingsCount = tableCheck?.length ?? 0;

    // 6. Try a test insert and immediately delete it
    diagnostics.step = "testInsert";
    const testPayload = {
      service_type: "DEBUG_TEST",
      sub_service: "debug_test",
      user_id: user.id,
      user_name: "Debug Test",
      user_phone: "0000000000",
      address: "Test Address",
      scheduled_date: "2099-01-01",
      scheduled_time: "00:00 AM",
      amount: 0,
      status: "pending",
    };
    const { data: testBooking, error: insertError } = await adminClient
      .from("service_bookings")
      .insert(testPayload)
      .select("id")
      .single();
    diagnostics.testInsertOk = !!testBooking;
    diagnostics.testInsertError = insertError ? { code: insertError.code, message: insertError.message, details: insertError.details, hint: insertError.hint } : null;

    // Clean up the test row
    if (testBooking) {
      await adminClient.from("service_bookings").delete().eq("id", testBooking.id);
      diagnostics.testRowCleaned = true;
    }

    // 7. Check getClientIp and checkIpRateLimit imports
    diagnostics.step = "checkImports";
    try {
      const { getClientIp, checkIpRateLimit } = await import("@/lib/security");
      const ip = getClientIp(request);
      diagnostics.ipDetected = ip;
      const rateLimitOk = await checkIpRateLimit(ip, 30, 60_000);
      diagnostics.rateLimitOk = rateLimitOk;
    } catch (e) {
      diagnostics.securityImportError = e instanceof Error ? e.message : String(e);
    }

    // 8. Check email import
    diagnostics.step = "checkEmailImport";
    try {
      const emailModule = await import("@/lib/email");
      diagnostics.emailModuleLoaded = !!emailModule.sendBookingConfirmationEmail;
    } catch (e) {
      diagnostics.emailModuleError = e instanceof Error ? e.message : String(e);
    }

    // Conclusion
    if (diagnostics.testInsertOk) {
      diagnostics.conclusion = "Everything works! The test insert succeeded. The issue might be with the specific data being sent from the booking form.";
    } else if (insertError?.code === "23503") {
      diagnostics.conclusion = "Foreign key violation — your user profile doesn't exist in the profiles table, or provider_id is invalid.";
    } else if (insertError?.code === "42P01") {
      diagnostics.conclusion = "Table service_bookings does not exist! Run the migration SQL.";
    } else {
      diagnostics.conclusion = `Insert failed with: ${insertError?.message}`;
    }

    return NextResponse.json(diagnostics);
  } catch (error) {
    diagnostics.crash = true;
    diagnostics.crashError = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(diagnostics, { status: 500 });
  }
}
