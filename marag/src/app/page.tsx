import { DashboardLayout } from "@/components/dashboard-layout";

export default function Home() {
  return (
    <DashboardLayout>
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <h2 className="text-2xl font-semibold mb-2">Welcome to Robin Store</h2>
          <p>Your dashboard content will appear here.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
