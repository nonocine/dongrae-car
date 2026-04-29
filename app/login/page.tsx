import Link from "next/link";
import Header from "@/app/components/Header";
import LoginForm from "@/app/login/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">운전자 로그인</h2>
          <Link href="/" className="text-sm text-slate-500 hover:underline">
            ← 목록
          </Link>
        </div>
        <LoginFormShell searchParams={searchParams} />
      </main>
    </>
  );
}

async function LoginFormShell({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const next = typeof sp.next === "string" ? sp.next : "/new";
  return <LoginForm next={next} />;
}
