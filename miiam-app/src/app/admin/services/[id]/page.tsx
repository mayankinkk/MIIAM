"use client";
import { useParams } from "next/navigation";
import AdminServiceDetail from "@/components/admin/AdminServiceDetail";

export default function ServiceDetailPage() {
  const params = useParams();
  return <AdminServiceDetail serviceKey={params.id as string} />;
}
