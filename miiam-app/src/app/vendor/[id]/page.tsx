import { redirect } from "next/navigation";

export default async function VendorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/app/vendor/${id}`);
}
