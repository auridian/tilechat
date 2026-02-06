import { ConnectionStatus } from "@/features/auth/components/connection-status";
import { UserInfo } from "@/features/user/components/user-info";

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-md flex-col items-center justify-center gap-8 px-6 pb-24 pt-12">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Profile
        </h1>
        <ConnectionStatus />
        <UserInfo />
      </main>
    </div>
  );
}
