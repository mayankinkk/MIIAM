import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });
  }
  
  const adminClient = createAdminClient();
  
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const full_name = formData.get("full_name") as string;
  const vehicle_type = formData.get("vehicle_type") as string;
  const vehicle_number = formData.get("vehicle_number") as string;
  const id_proof_type = formData.get("id_proof_type") as string;
  const profile_photo = formData.get("profile_photo") as File | null;
  const id_proof_image = formData.get("id_proof_image") as File | null;
  
  if (!email || !phone || !full_name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    phone,
    email_confirm: true,
  });
  
  let userId = "";

  if (authError) {
    if (authError.message.toLowerCase().includes("email") || authError.message.toLowerCase().includes("phone") || authError.code === "email_exists" || authError.code === "phone_exists") {
      const { data: users } = await adminClient.auth.admin.listUsers();
      const existingUser = users.users.find(u => u.email === email || u.phone === phone);
      if (existingUser) {
        userId = existingUser.id;
      } else {
        return NextResponse.json({ error: "User already exists" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: authError.message || "Failed to create user" }, { status: 400 });
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
        console.error("Profile photo upload error:", uploadError);
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
        console.error("ID proof upload error:", uploadError);
      }
    }
  } catch (e) {
    console.error("Upload error:", e);
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
      console.error("Profile error:", profileError);
      return NextResponse.json({ error: "Failed to update profile: " + profileError.message }, { status: 400 });
    }
  } catch (e: any) {
    console.error("Profile catch error:", e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
  
  try {
    const { error: riderError } = await adminClient.from("riders").insert({
      user_id: userId,
      name: full_name,
      phone,
      email,
      vehicle_type,
      vehicle_number: vehicle_number || "",
      status: "pending",
    });
    
    if (riderError) {
      console.error("Rider error:", riderError);
      return NextResponse.json({ error: "Failed to create rider: " + riderError.message }, { status: 400 });
    }
  } catch (e: any) {
    console.error("Rider catch error:", e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
  
  return NextResponse.json({ success: true, userId: userId });
}