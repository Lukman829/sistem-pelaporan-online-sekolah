import { redirect } from "next/navigation";
import { checkAuth } from "@/lib/admin-auth";

export default async function AdminPage() {
  // Check authentication
  const auth = await checkAuth();
  
  if (!auth.authenticated) {
    // Redirect to login if not authenticated
    redirect("/login");
  }
  
  // Already authenticated, redirect to dashboard
  redirect("/dashboard");
}

