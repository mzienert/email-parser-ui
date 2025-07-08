import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmailUploadWrapper } from "@/components/email-upload-wrapper";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-6 p-6">
      <div className="mt-8">
        <EmailUploadWrapper />
      </div>
    </div>
  );
}
