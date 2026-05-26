// J-SHIS（地震ハザードステーション）API連携モジュール
// Vercel Serverless Function (/api/jshis) 経由でJ-SHIS APIを呼び出す（CORS回避）
// このアプリは地震予知・地震予報を行うものではありません。
// 取得するのは「長期地震リスク」の参考情報です。

const TIMEOUT_MS = 10000;

// 小数値（例: 0.123456）を1桁の%値（例: 12.3）へ変換
const toPercent = (v) => (v != null ? parseFloat((v * 100).toFixed(1)) : null);

/**
 * 緯度・経度からJ-SHIS長期地震リスクを取得する。
 * 失敗時は { source: "demo", failReason: string } を返す。
 *
 * @param {number} lat 緯度（WGS84）
 * @param {number} lng 経度（WGS84）
 * @returns {Promise<{
 *   source: "jshis" | "demo",
 *   failReason?: string,
 *   risk30year?: number,
 *   intensities?: { i45: number|null, i50: number|null, i55: number|null, i60: number|null },
 *   meshCode?: string|null
 * }>}
 */
export async function fetchJshisRisk(lat, lng) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const url = `/api/jshis?lat=${lat.toFixed(4)}&lon=${lng.toFixed(4)}`;
    console.log("[jshis client] Calling proxy:", url);

    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.message ?? `HTTP ${res.status}`);
    }
    const data = await res.json();

    if (data?.status !== "success") {
      throw new Error(data?.message ?? `proxy status: ${data?.status}`);
    }

    const d = data.data;
    if (!d || d.t30_i55 == null) throw new Error("t30_i55 missing");

    return {
      source: "jshis",
      risk30year: Math.round(d.t30_i55 * 100), // メイン表示用（整数%）
      intensities: {
        i45: toPercent(d.t30_i45),
        i50: toPercent(d.t30_i50),
        i55: toPercent(d.t30_i55),
        i60: toPercent(d.t30_i60),
      },
      meshCode: data.meshCode ?? null,
    };
  } catch (err) {
    const failReason = err?.name === "AbortError" ? "timeout" : (err?.message ?? String(err));
    console.warn("[jshis client] Failed:", failReason);
    return { source: "demo", failReason };
  } finally {
    clearTimeout(timer);
  }
}
