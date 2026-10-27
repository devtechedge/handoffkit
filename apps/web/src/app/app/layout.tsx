import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { requireAccount } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const account = await requireAccount();
  return (
    <>
      <AppHeader account={account} />
      <main id="main" className="app-main">
        <div className="container">{children}</div>
      </main>
    </>
  );
}
