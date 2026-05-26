// J-SHIS（地震ハザードステーション）API連携モジュール
// API仕様: https://www.j-shis.bosai.go.jp/
// このアプリは地震予知・地震予報を行うものではありません。
// 取得するのは「長期地震リスク」の参考情報です。

const API_BASE =
  "https://www.j-shis.bosai.go.jp/map/api/pshm/Y2024/AVR/TTL_MTTL/meshinfo.geojson";
const ATTRS = "T30_I45_PS,T30_I50_PS,T30_I55_PS,T30_I60_PS";
const TIMEOUT_MS = 10000;

// 小数値（例: 0.123456）を1桁の%値（例: 12.3）へ変換
const toPercent = (v) => (v != null ? parseFloat((v * 100).toFixed(1)) : null);

/**
 * 緯度・経度からJ-SHIS長期地震リスクを取得する。
 * 失敗時（CORS・タイムアウト・データ欠損・status≠Success）は { source: "demo" } を返す。
 *
 * positionは「経度,緯度」の順序（J-SHIS API仕様）。
 *
 * @param {number} lat 緯度（WGS84）
 * @param {number} lng 経度（WGS84）
 * @returns {Promise<{
 *   source: "jshis" | "demo",
 *   risk30year?: number,
 *   intensities?: { i45: number|null, i50: number|null, i55: number|null, i60: number|null },
 *   meshCode?: string|null
 * }>}
 */
export async function fetchJshisRisk(lat, lng) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const pos = `${lng.toFixed(4)},${lat.toFixed(4)}`; // 経度,緯度の順
    const url = `${API_BASE}?position=${pos}&epsg=4326&attr=${ATTRS}`;
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data?.status !== "Success") throw new Error(`API status: ${data?.status}`);
    const props = data.features?.[0]?.properties;
    if (!props) throw new Error("No feature data in response");

    const risk55 = props.T30_I55_PS;
    if (risk55 == null) throw new Error("T30_I55_PS missing");

    return {
      source: "jshis",
      risk30year: Math.round(risk55 * 100), // メイン表示用（整数%）
      intensities: {
        i45: toPercent(props.T30_I45_PS),
        i50: toPercent(props.T30_I50_PS),
        i55: toPercent(props.T30_I55_PS),
        i60: toPercent(props.T30_I60_PS),
      },
      meshCode: data.features?.[0]?.id ?? null,
    };
  } catch {
    return { source: "demo" };
  } finally {
    clearTimeout(timer);
  }
}
