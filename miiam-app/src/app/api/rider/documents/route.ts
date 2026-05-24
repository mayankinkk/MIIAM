import { query } from "@/lib/db";
import { uploadFile } from "@/lib/storage";
import { NextRequest, NextResponse } from "next/server";

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
    
    const publicUrl = await uploadFile(buffer, fileName, file.type);

    const { rows: existingRows } = await query(
      "SELECT id FROM rider_documents WHERE rider_id = $1 AND doc_type = $2",
      [rider_id, doc_type]
    );
    const existingDoc = existingRows[0];

    let doc;
    if (existingDoc) {
      const { rows } = await query(
        "UPDATE rider_documents SET document_number = $1, document_url = $2, expiry_date = $3, status = $4, updated_at = $5 WHERE id = $6 RETURNING *",
        [formData.get("document_number") || null, publicUrl, formData.get("expiry_date") || null, "pending", new Date().toISOString(), existingDoc.id]
      );
      doc = rows[0];
    } else {
      const { rows } = await query(
        "INSERT INTO rider_documents (rider_id, doc_type, document_number, document_url, expiry_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [rider_id, doc_type, formData.get("document_number") || null, publicUrl, formData.get("expiry_date") || null, "pending"]
      );
      doc = rows[0];
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

  const { rows: documents } = await query(
    "SELECT * FROM rider_documents WHERE rider_id = $1 ORDER BY created_at DESC",
    [rider_id]
  );

  return NextResponse.json({ documents: documents || [] });
}