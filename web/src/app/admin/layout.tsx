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
        <div className="mx-auto max-w-7xl px-3 pb-8 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
