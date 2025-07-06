export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container grid place-items-center py-header">
      {children}
    </div>
  );
}
