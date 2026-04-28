import Link from "next/link";
import Header from "@/app/components/Header";
import AdminForm from "@/app/admin/AdminForm";
import { isAdmin } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await isAdmin();
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">관리자</h2>
          <Link href="/" className="text-sm text-slate-500 hover:underline">
            ← 목록
          </Link>
        </div>

        {admin ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-semibold">이미 로그인되어 있습니다.</p>
            <p className="mt-1 text-xs text-emerald-700">
              상단 메뉴의 “관리자 로그아웃”을 통해 세션을 종료할 수 있습니다.
              로그인 상태에서는 운행일지 항목 옆에 삭제 버튼이 표시됩니다.
            </p>
          </div>
        ) : (
          <AdminForm />
        )}
      </main>
    </>
  );
}
