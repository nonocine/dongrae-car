import { compare, hash } from "bcryptjs";
import { createHash, timingSafeEqual } from "node:crypto";

// drivers.password 는 출장일지(dongrae-business-trip) 앱과 공유되는 컬럼이다.
// 저장 형식이 bcrypt 해시로 일괄 전환되는 중이라, 읽기 경로는 두 형식을 모두
// 받아들이되 "해시 → bcrypt 검증" 방향으로만 분기한다.
// 해시 형태인 값이 평문 비교로 넘어가는 경로는 존재해서는 안 된다.

const BCRYPT_ROUNDS = 10;

/** bcrypt 해시 식별자($2, $2a, $2b, $2y ...) */
export function isBcryptHash(stored: string): boolean {
  return /^\$2[abxy]?\$/.test(stored);
}

/** 길이를 먼저 비교하고 내용은 상수 시간으로 비교한다. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * 입력한 비밀번호가 저장값과 일치하는지 검사한다.
 *  - 저장값이 bcrypt 해시면 bcrypt.compare 만 사용한다(실패해도 평문으로 폴백하지 않는다).
 *  - 저장값이 평문(아직 미전환 계정)일 때만 상수 시간 문자열 비교로 폴백한다.
 */
export async function verifyPassword(
  input: string,
  stored: string
): Promise<boolean> {
  if (isBcryptHash(stored)) {
    try {
      return await compare(input, stored);
    } catch {
      // 해시가 손상된 경우에도 평문 비교로 내려가지 않는다.
      return false;
    }
  }
  return safeEqual(input, stored);
}

/** 저장용 bcrypt 해시를 만든다. */
export function hashPassword(plain: string): Promise<string> {
  return hash(plain, BCRYPT_ROUNDS);
}

/**
 * 세션 쿠키에 넣을 검증자.
 * 비밀번호(평문/해시) 자체를 브라우저에 내려보내지 않으면서도,
 * 비밀번호가 바뀌면 기존 세션이 자동으로 무효화되도록 저장값에서 파생시킨다.
 */
export function sessionVerifier(storedPassword: string): string {
  return createHash("sha256").update(storedPassword, "utf8").digest("hex");
}

/** 세션 검증자 비교(상수 시간). */
export function verifierMatches(stored: string, fromCookie: string): boolean {
  return safeEqual(sessionVerifier(stored), fromCookie);
}
