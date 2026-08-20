import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SessionProvider } from "@/components/auth/session-provider";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session) redirect(`/${locale}/login?callbackUrl=/${locale}/dashboard`);

  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-cream-100">
        <DashboardSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardTopbar />
          <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
