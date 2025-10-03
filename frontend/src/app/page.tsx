import { redirect } from "next/navigation";

/**
 * Root Page - Redirects to the default chat page
 * This ensures users always land on /chat when visiting the root URL
 */
export default function Home() {
  redirect("/chat");
}
