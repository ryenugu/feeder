import Navbar from "@/components/Navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="mx-auto min-h-screen max-w-lg pb-20 pt-4">
        {children}
      </main>
      <Navbar />
    </>
  );
}
