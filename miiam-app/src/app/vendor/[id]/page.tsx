import { redirect } from "next/navigation";

export default function VendorPage({ params }: { params: Promise<{ id: string }> }) {
  redirect(`/app/vendor/${params.id}`);
}
