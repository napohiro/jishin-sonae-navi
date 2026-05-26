// Vercel Serverless Function — J-SHIS APIプロキシ
// ブラウザからのCORS制約を回避するため、サーバーサイドでJ-SHIS APIを呼び出す

const JSHIS_BASE =
  "https://www.j-shis.bosai.go.jp/map/api/pshm/Y2024/AVR/TTL_MTTL/meshinfo.geojson";
const ATTRS = "T30_I45_PS,T30_I50_PS,T30_I55_PS,T30_I60_PS";
const TIMEOUT_MS = 10000;

export default async function handler(req, res) {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ status: "error", message: "lat と lon が必要です" });
  }

  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);
  if (isNaN(latNum) || isNaN(lonNum)) {
    return res.status(400).json({ status: "error", message: "lat/lon が数値ではありません" });
  }

  const pos = `${lonNum.toFixed(4)},${latNum.toFixed(4)}`; // 経度,緯度の順（J-SHIS仕様）
  const url = `${JSHIS_BASE}?position=${pos}&epsg=4326&attr=${ATTRS}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const upstream = await fetch(url, { signal: ctrl.signal });
    if (!upstream.ok) {
      return res
        .status(502)
        .json({ status: "error", message: `J-SHIS HTTP ${upstream.status}` });
    }
    const data = await upstream.json();

    if (data?.status !== "Success") {
      return res
        .status(502)
        .json({ status: "error", message: `J-SHIS status: ${data?.status}` });
    }

    const props = data.features?.[0]?.properties;
    if (!props || props.T30_I55_PS == null) {
      return res.status(502).json({ status: "error", message: "J-SHISデータなし" });
    }

    return res.status(200).json({
      status: "success",
      source: "J-SHIS",
      meshCode: data.features?.[0]?.id ?? null,
      data: {
        t30_i45: props.T30_I45_PS,
        t30_i50: props.T30_I50_PS,
        t30_i55: props.T30_I55_PS,
        t30_i60: props.T30_I60_PS,
      },
    });
  } catch {
    return res
      .status(502)
      .json({ status: "error", message: "J-SHISデータの取得に失敗しました" });
  } finally {
    clearTimeout(timer);
  }
}
