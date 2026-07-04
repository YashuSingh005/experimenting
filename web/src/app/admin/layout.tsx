import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black">
      <AdminSidebar />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl p-4 pt-16 lg:pt-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
