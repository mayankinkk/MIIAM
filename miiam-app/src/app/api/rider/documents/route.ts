import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const rider_id = formData.get("rider_id") as string;
    const doc_type = formData.get("doc_type") as string;
    const file = formData.get("file") as File;

    if (!rider_id || !doc_type || !file) {
      return NextResponse.json({ 
        error: "Missing required fields: rider_id, doc_type, file" 
      }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Allowed: JPEG, PNG, WebP, PDF" 
      }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "File too large. Maximum 5MB allowed" 
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const fileName = `${rider_id}/${doc_type}_${Date.now()}.${file.name.split(".").pop()}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("rider-documents")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from("rider-documents")
      .getPublicUrl(fileName);

    const { data: existingDoc } = await supabase
      .from("rider_documents")
      .select("id")
      .eq("rider_id", rider_id)
      .eq("doc_type", doc_type)
      .single();

    let doc;
    if (existingDoc) {
      const { data } = await supabase
        .from("rider_documents")
        .update({
          document_number: formData.get("document_number") || null,
          document_url: publicUrl,
          expiry_date: formData.get("expiry_date") || null,
          status: "pending",
          updated_at: new Date().toISOString()
        })
        .eq("id", existingDoc.id)
        .select()
        .single();
      doc = data;
    } else {
      const { data } = await supabase
        .from("rider_documents")
        .insert({
          rider_id,
          doc_type,
          document_number: formData.get("document_number") || null,
          document_url: publicUrl,
          expiry_date: formData.get("expiry_date") || null,
          status: "pending"
        })
        .select()
        .single();
      doc = data;
    }

    return NextResponse.json({
      success: true,
      document: doc,
      url: publicUrl
    });

  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rider_id = searchParams.get("rider_id");

  if (!rider_id) {
    return NextResponse.json({ error: "rider_id required" }, { status: 400 });
  }

  const { data: documents } = await supabase
    .from("rider_documents")
    .select("*")
    .eq("rider_id", rider_id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ documents: documents || [] });
}