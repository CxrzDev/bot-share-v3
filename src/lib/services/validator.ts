// SERVER-SIDE ONLY — never import in client components
// Tokens and cookies are validated here and never exposed to the client

export type ValidateResult = {
  valid: boolean;
  resolvedName?: string;
  error?: string;
};

export async function validateFacebookCredential(
  credential: string
): Promise<ValidateResult> {
  if (!credential || credential.trim().length < 10) {
    return { valid: false, error: "Cookie หรือ Token สั้นเกินไป" };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/me?fields=id,name&access_token=${encodeURIComponent(credential.trim())}`,
      { cache: "no-store", signal: AbortSignal.timeout(8000) }
    );

    const data = (await res.json()) as {
      id?: string;
      name?: string;
      error?: { message: string; code: number };
    };

    if (data.error) {
      return {
        valid: false,
        error: `Token ไม่ถูกต้อง: ${data.error.message}`,
      };
    }

    if (data.id && data.name) {
      return { valid: true, resolvedName: data.name };
    }

    return { valid: false, error: "ไม่สามารถยืนยัน Token ได้" };
  } catch (err) {
    // Network error or timeout — save account as ERROR, don't block the user
    const message =
      err instanceof Error && err.name === "TimeoutError"
        ? "Facebook API ตอบสนองช้าเกินไป"
        : "ไม่สามารถเชื่อมต่อกับ Facebook API ได้ในขณะนี้";
    return { valid: false, error: message };
  }
}

export async function validateLineToken(token: string): Promise<ValidateResult> {
  if (!token || token.trim().length < 10) {
    return { valid: false, error: "Channel Access Token สั้นเกินไป" };
  }

  try {
    const res = await fetch("https://api.line.me/v2/bot/info", {
      headers: { Authorization: `Bearer ${token.trim()}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return {
        valid: false,
        error:
          res.status === 401
            ? "Channel Access Token ไม่ถูกต้องหรือหมดอายุแล้ว"
            : `LINE API ตอบกลับ: ${res.status}`,
      };
    }

    const data = (await res.json()) as { displayName?: string };
    return { valid: true, resolvedName: data.displayName };
  } catch (err) {
    const message =
      err instanceof Error && err.name === "TimeoutError"
        ? "LINE API ตอบสนองช้าเกินไป"
        : "ไม่สามารถเชื่อมต่อกับ LINE API ได้ในขณะนี้";
    return { valid: false, error: message };
  }
}
