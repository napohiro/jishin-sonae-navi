// J-SHIS（地震ハザードステーション）API連携モジュール
// API仕様: https://www.j-shis.bosai.go.jp/
// 正式連携時は実際のAPIドキュメントに従ってエンドポイントを確認してください

const API_ENDPOINT = "https://www.j-shis.bosai.go.jp/api/ppf/point";
const TIMEOUT_MS = 8000;

/**
 * 緯度・経度からJ-SHIS長期地震リスクを取得する。
 * 失敗時（CORS・タイムアウト・データ欠損）は { source: "demo" } を返す。
 *
 * 主な取得フィールド:
 *   T30_I45_PS  30年間で震度5弱以上となる確率
 *   T30_I50_PS  30年間で震度5強以上となる確率
 *   T30_I55_PS  30年間で震度6弱以上となる確率  ← リスク表示に使用
 *   T30_I60_PS  30年間で震度6強以上となる確率
 *
 * @param {number} lat 緯度
 * @param {number} lng 経度
 * @returns {Promise<{source:"jshis"|"demo", risk30year?:number, intensities?:object}>}
 */
export async function fetchJshisRisk(lat, lng) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const url = `${API_ENDPOINT}?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`;
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const risk55 = data?.T30_I55_PS;
    if (risk55 == null) throw new Error("Required fields missing in response");

    return {
      source: "jshis",
      risk30year: Math.round(risk55 * 100),
      intensities: {
        i45: data.T30_I45_PS != null ? Math.round(data.T30_I45_PS * 100) : null,
        i50: data.T30_I50_PS != null ? Math.round(data.T30_I50_PS * 100) : null,
        i55: Math.round(risk55 * 100),
        i60: data.T30_I60_PS != null ? Math.round(data.T30_I60_PS * 100) : null,
      },
    };
  } catch {
    return { source: "demo" };
  } finally {
    clearTimeout(timer);
  }
}
