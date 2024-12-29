import { NetworkLog } from "@/app/(app)/(demo)/network/network-log";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-indigo-900 p-4">
      <NetworkLog variant="modern" />
    </div>
  );
}
