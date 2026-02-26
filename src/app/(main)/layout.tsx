import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main
        className="safe-x mx-auto min-h-dvh max-w-lg pb-24"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
      >
        {children}
      </main>
      <Navbar />
    </>
  );
}
