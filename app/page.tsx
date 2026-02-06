import { ConnectionStatus } from "@/features/auth/components/connection-status";
import { UserInfo } from "@/features/user/components/user-info";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-8 px-6 py-12">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Alien Miniapp
        </h1>
        <ConnectionStatus />
        <UserInfo />
      </main>
    </div>
  );
}
