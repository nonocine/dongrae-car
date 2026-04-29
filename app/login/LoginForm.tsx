"use client";

import { useState, useTransition } from "react";
import { loginDriver } from "@/app/actions";
import { useDriverSession } from "@/app/components/DriverSession";

const labelCls = "block text-sm font-medium text-slate-700";
const inputCls =
  "mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[color:var(--brand)] focus:outline-none focus:ring-1 focus:ring-[color:var(--brand)]";

export default function LoginForm() {
  const { signIn } = useDriverSession();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const password = String(formData.get("password") ?? "");
          const res = await loginDriver(formData);
          if (!res.ok) {
            setError(res.message);
            return;
          }
          signIn({ id: res.driver.id, name: res.driver.name, password });
          window.location.href = "/";
        });
      }}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div>
        <label htmlFor="name" className={labelCls}>
          이름
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoFocus
          autoComplete="username"
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor="password" className={labelCls}>
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputCls}
        />
      </div>

      {error && (
        <p className="rounded-md bg-[color:var(--accent-soft)] px-3 py-2 text-sm text-[color:var(--accent)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-[color:var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[color:var(--brand-strong)] disabled:opacity-60"
      >
        {pending ? "확인 중…" : "로그인"}
      </button>

      <p className="text-xs text-slate-500">
        계정이 없다면 관리자에게 등록을 요청해주세요.
      </p>
    </form>
  );
}
