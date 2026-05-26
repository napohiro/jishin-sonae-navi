// J-SHIS（地震ハザードステーション）API連携モジュール
// Vercel Serverless Function 経由でJ-SHIS APIを呼び出す（CORS回避）
// このアプリは地震予知・地震予報を行うものではありません。
// 取得するのは「長期地震リスク」「表層地盤情報」の参考情報です。

const TIMEOUT_MS = 10000;

// 小数値（例: 0.123456）を1桁の%値（例: 12.3）へ変換
const toPercent = (v) => (v != null ? parseFloat((v * 100).toFixed(1)) : null);

/**
 * ARV（最大速度増幅率）から揺れやすさレベル（1〜5）を返す。
 * この判定はアプリ内の参考目安であり、断定するものではありません。
 */
export function arvToGroundLevel(arv) {
  if (arv < 1.2) return 1;  // 揺れにくい
  if (arv < 1.4) return 2;  // やや揺れにくい
  if (arv < 1.6) return 3;  // 中程度
  if (arv < 2.0) return 4;  // やや揺れやすい
  return 5;                  // 揺れやすい
}

/**
 * 緯度・経度からJ-SHIS長期地震リスクを取得する（/api/jshis プロキシ経由）。
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
      console.warn("[jshis client] t30_i55 missing");
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

/**
 * 緯度・経度からJ-SHIS表層地盤情報を取得する（/api/jshis-ground プロキシ経由）。
 * ARV（最大速度増幅率）をもとに揺れやすさレベル（1〜5）を返す。
 * 失敗時は { source: "demo", failReason } を返す。
 *
 * @param {number} lat 緯度（WGS84）
 * @param {number} lng 経度（WGS84）
 * @returns {Promise<{
 *   source: "jshis" | "demo",
 *   jname?: string|null,
 *   avs?: number|null,
 *   arv?: number|null,
 *   groundLevel?: number,
 *   meshCode?: string|null,
 *   failReason?: string,
 * }>}
 */
export async function fetchJshisSurfaceGround(lat, lng) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const url = `/api/jshis-ground?lat=${lat.toFixed(4)}&lon=${lng.toFixed(4)}`;
    console.log("[jshis-ground client] Calling proxy:", url);

    const res = await fetch(url, { signal: ctrl.signal });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.status !== "success") {
      const failReason = data?.reason ?? data?.message ?? `HTTP ${res.status}`;
      console.warn("[jshis-ground client] Failed:", failReason);
      return { source: "demo", failReason };
    }

    const d = data.data;
    if (!d || d.arv == null) {
      console.warn("[jshis-ground client] ARV missing");
      return { source: "demo", failReason: "ARV missing" };
    }

    return {
      source: "jshis",
      jname: d.jname ?? null,
      avs: d.avs ?? null,
      arv: d.arv,
      groundLevel: arvToGroundLevel(d.arv),
      meshCode: data.meshCode ?? null,
    };
  } catch (err) {
    const failReason = err?.name === "AbortError" ? "timeout" : (err?.message ?? String(err));
    console.warn("[jshis-ground client] Exception:", failReason);
    return { source: "demo", failReason };
  } finally {
    clearTimeout(timer);
  }
}
