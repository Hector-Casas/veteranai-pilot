import Nav from "@/components/landing/Nav";

export default function DemosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      {children}
    </>
  );
}
