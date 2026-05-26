// J-SHIS（地震ハザードステーション）API連携モジュール
// Vercel Serverless Function (/api/jshis) 経由でJ-SHIS APIを呼び出す（CORS回避）
// このアプリは地震予知・地震予報を行うものではありません。
// 取得するのは「長期地震リスク」の参考情報です。

const TIMEOUT_MS = 10000;

// 小数値（例: 0.123456）を1桁の%値（例: 12.3）へ変換
const toPercent = (v) => (v != null ? parseFloat((v * 100).toFixed(1)) : null);

/**
 * 緯度・経度からJ-SHIS長期地震リスクを取得する。
 * 失敗時は { source: "demo", failReason, failDebug } を返す。
 *
 * @param {number} lat 緯度（WGS84）
 * @param {number} lng 経度（WGS84）
 */
export async function fetchJshisRisk(lat, lng) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const url = `/api/jshis?lat=${lat.toFixed(4)}&lon=${lng.toFixed(4)}`;
    console.log("[jshis client] Calling proxy:", url);

    const res = await fetch(url, { signal: ctrl.signal });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.status !== "success") {
      const failReason = data?.reason ?? data?.message ?? `HTTP ${res.status}`;
      const failDebug = data?.debug ?? null;
      console.warn("[jshis client] Failed:", failReason, failDebug);
      return { source: "demo", failReason, failDebug };
    }

    const d = data.data;
    if (!d || d.t30_i55 == null) {
      console.warn("[jshis client] t30_i55 missing in response");
      return { source: "demo", failReason: "t30_i55 missing" };
    }

    return {
      source: "jshis",
      risk30year: Math.round(d.t30_i55 * 100),
      intensities: {
        i55: toPercent(d.t30_i55),
      },
      meshCode: data.meshCode ?? null,
    };
  } catch (err) {
    const failReason = err?.name === "AbortError" ? "timeout" : (err?.message ?? String(err));
    console.warn("[jshis client] Exception:", failReason);
    return { source: "demo", failReason };
  } finally {
    clearTimeout(timer);
  }
}
