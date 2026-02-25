import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="safe-top safe-x mx-auto min-h-dvh max-w-lg pb-24 pt-4">
        {children}
      </main>
      <Navbar />
    </>
  );
}
