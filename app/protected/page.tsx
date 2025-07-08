import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Protected Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome! This is your protected dashboard area.
      </p>
      {/* Content will be built here */}
    </div>
  );
}
