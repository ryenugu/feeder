import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="safe-top mx-auto min-h-screen max-w-lg pb-24 pt-4">
        {children}
      </main>
      <Navbar />
    </>
  );
}
