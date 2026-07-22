import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-utils";
import { createRouteLogger } from "@/lib/logger";
import { z } from "zod";

const logger = createRouteLogger("riders");

const createRiderSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone must be at least 10 digits").max(15, "Phone must be at most 15 digits"),
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be at most 100 characters"),
  vehicle_type: z.string().min(1, "Vehicle type is required").max(50),
  vehicle_number: z.string().max(20).optional().default(""),
  id_proof_type: z.string().min(1, "ID proof type is required").max(50),
});

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Unauthorized" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return { error: "Forbidden" };
  return null;
}

export const POST = withRateLimit(async function POST(request: Request) {
  const authErr = await requireAdmin();
  if (authErr) return NextResponse.json(authErr, { status: authErr.error === "Unauthorized" ? 401 : 403 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });
  }
  
  const adminClient = createAdminClient();
  
  const formData = await request.formData();
  const raw = {
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    full_name: formData.get("full_name") as string,
    vehicle_type: formData.get("vehicle_type") as string,
    vehicle_number: formData.get("vehicle_number") as string,
    id_proof_type: formData.get("id_proof_type") as string,
  };
  
  const parsed = createRiderSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  
  const { email, phone, full_name, vehicle_type, vehicle_number, id_proof_type } = parsed.data;
  const profile_photo = formData.get("profile_photo") as File | null;
  const id_proof_image = formData.get("id_proof_image") as File | null;
  
  let userId = "";

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    phone,
    email_confirm: true,
  });
  
  if (authError) {
    if (authError.code === "email_exists" || authError.code === "phone_exists") {
      // Query profiles table directly to find existing user
      let existingUserId = null;
      if (authError.code === "email_exists") {
        const { data } = await adminClient
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();
        existingUserId = data?.id;
      } else {
        const { data } = await adminClient
          .from("profiles")
          .select("id")
          .eq("phone", phone)
          .maybeSingle();
        existingUserId = data?.id;
      }
      
      if (existingUserId) {
        userId = existingUserId;
      } else {
        return NextResponse.json({ error: "User exists but could not be retrieved" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Failed to create user" }, { status: 400 });
    }
  } else if (authData.user) {
    userId = authData.user.id;
  } else {
    return NextResponse.json({ error: "Failed to create user" }, { status: 400 });
  }
  
  let profilePhotoUrl = "";
  let idProofUrl = "";
  
  try {
    if (profile_photo && profile_photo.size > 0) {
      const fileExt = profile_photo.name.split(".").pop();
      const filePath = `${userId}/profile.${fileExt}`;
      const { error: uploadError } = await adminClient.storage
        .from("riders")
        .upload(filePath, profile_photo, { upsert: true });
      
      if (!uploadError) {
        const { data: { publicUrl } } = adminClient.storage.from("riders").getPublicUrl(filePath);
        profilePhotoUrl = publicUrl;
      } else {
        logger.error({ err: uploadError }, "Profile photo upload error");
      }
    }

    if (id_proof_image && id_proof_image.size > 0) {
      const fileExt = id_proof_image.name.split(".").pop();
      const filePath = `${userId}/id_proof.${fileExt}`;
      const { error: uploadError } = await adminClient.storage
        .from("riders")
        .upload(filePath, id_proof_image, { upsert: true });
      
      if (!uploadError) {
        const { data: { publicUrl } } = adminClient.storage.from("riders").getPublicUrl(filePath);
        idProofUrl = publicUrl;
      } else {
        logger.error({ err: uploadError }, "ID proof upload error");
      }
    }
  } catch (e) {
    logger.error({ err: e }, "Upload error");
  }
  
  try {
    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: userId,
      full_name,
      email,
      phone,
      role: "rider",
      avatar_url: profilePhotoUrl || undefined,
    }, { onConflict: 'id' });
    
    if (profileError) {
      logger.error({ err: profileError }, "Profile error");
      return NextResponse.json({ error: "Failed to update profile" }, { status: 400 });
    }
  } catch (e: unknown) {
    logger.error({ err: e }, "Profile catch error");
    return NextResponse.json({ error: "Failed to update profile" }, { status: 400 });
  }
  
  try {
    const { error: riderError } = await adminClient.from("riders").upsert({
      id: userId,
      user_id: userId,
      phone,
      vehicle_type,
      vehicle_number: vehicle_number || "",
      id_proof_type,
      id_proof_image: idProofUrl,
      is_online: false,
      total_deliveries: 0,
      rating: 5.0,
      total_earned: 0,
      tips: 0,
      balance: 0,
    });
    
    if (riderError) {
      logger.error({ err: riderError }, "Rider error");
      return NextResponse.json({ error: "Failed to update rider" }, { status: 400 });
    }
  } catch (e: unknown) {
    logger.error({ err: e }, "Rider catch error");
  }
  
  return NextResponse.json({ success: true, userId: userId });
});

export const DELETE = withRateLimit(async function DELETE(request: Request) {
  const authErr = await requireAdmin();
  if (authErr) return NextResponse.json(authErr, { status: authErr.error === "Unauthorized" ? 401 : 403 });

  const { searchParams } = new URL(request.url);
  const riderId = searchParams.get("id");
  
  if (!riderId) {
    return NextResponse.json({ error: "Rider ID required" }, { status: 400 });
  }
  
  const adminClient = createAdminClient();
  
  const { error: riderError } = await adminClient.from("riders").delete().eq("id", riderId);
  
  if (riderError) {
    return NextResponse.json({ error: "Failed to delete rider" }, { status: 400 });
  }
  
  const { error: profileError } = await adminClient.from("profiles").delete().eq("id", riderId);
  
  if (profileError) {
    logger.error({ err: profileError }, "Profile delete error");
  }
  
  try {
    await adminClient.auth.admin.deleteUser(riderId);
  } catch (e) {
    logger.error({ err: e }, "Auth delete error");
  }
  
  return NextResponse.json({ success: true });
});
