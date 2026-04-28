"use client";

import { useTransition } from "react";
import { deleteDrivingLog } from "@/app/actions";

export default function DeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        if (!confirm("이 운행일지를 삭제하시겠습니까?")) return;
        startTransition(() => deleteDrivingLog(formData));
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-red-600 hover:underline disabled:opacity-50"
      >
        {pending ? "삭제 중…" : "삭제"}
      </button>
    </form>
  );
}
