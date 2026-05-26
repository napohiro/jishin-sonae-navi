// Vercel Serverless Function — J-SHIS 表層地盤情報プロキシ
// 取得項目: JNAME（微地形区分名）/ AVS（表層30m平均S波速度）/ ARV（最大速度増幅率）
// API参考: https://www.j-shis.bosai.go.jp/api

const JSHIS_GROUND_BASE =
  "https://www.j-shis.bosai.go.jp/map/api/smph/Y2012/meshinfo.geojson";
const ATTRS = "JNAME,AVS,ARV";
const TIMEOUT_MS = 10000;

export default async function handler(req, res) {
  const { lat, lon } = req.query;

  console.log("[jshis-ground] Request: lat=%s lon=%s", lat, lon);

  if (!lat || !lon) {
    return res.status(400).json({ status: "error", message: "lat と lon が必要です" });
  }

  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);
  if (isNaN(latNum) || isNaN(lonNum)) {
    return res.status(400).json({ status: "error", message: "lat/lon が数値ではありません" });
  }

  // 日本国内範囲外はAPIを呼ばずにフォールバック
  if (latNum < 20 || latNum > 46 || lonNum < 122 || lonNum > 154) {
    console.warn("[jshis-ground] Out of Japan bounds");
    return res.status(200).json({ status: "error", message: "日本国内の座標ではありません" });
  }

  // J-SHIS仕様: position は「経度,緯度」の順（URLSearchParams 不使用でカンマをエスケープさせない）
  const pos = `${lonNum.toFixed(4)},${latNum.toFixed(4)}`;
  const requestUrl = `${JSHIS_GROUND_BASE}?position=${pos}&epsg=4326&attr=${ATTRS}`;

  console.log("[jshis-ground] Fetching: %s", requestUrl);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const upstream = await fetch(requestUrl, {
      signal: ctrl.signal,
      headers: { "User-Agent": "jishin-sonae-navi/1.0" },
    });

    console.log("[jshis-ground] HTTP status: %d", upstream.status);

    if (!upstream.ok) {
      const responseText = await upstream.text().catch(() => "(読み取り失敗)");
      console.error("[jshis-ground] Error: HTTP %d\n%s\n%s", upstream.status, requestUrl, responseText);
      return res.status(502).json({
        status: "error",
        reason: `J-SHIS HTTP ${upstream.status}`,
        debug: { requestUrl, responseText },
      });
    }

    const data = await upstream.json();
    console.log("[jshis-ground] Response: status=%s features=%d", data?.status, data?.features?.length ?? 0);

    if (data?.status !== "Success") {
      console.error("[jshis-ground] Status not Success: %s", data?.status);
      return res.status(502).json({
        status: "error",
        reason: `J-SHIS status: ${data?.status}`,
        debug: { requestUrl },
      });
    }

    const props = data.features?.[0]?.properties;
    if (!props) {
      console.error("[jshis-ground] No features");
      return res.status(502).json({
        status: "error",
        reason: "no features",
        debug: { requestUrl },
      });
    }

    console.log("[jshis-ground] Success: JNAME=%s AVS=%s ARV=%s", props.JNAME, props.AVS, props.ARV);

    return res.status(200).json({
      status: "success",
      source: "J-SHIS",
      meshCode: data.features?.[0]?.id ?? null,
      data: {
        jname: props.JNAME ?? null,
        avs: props.AVS ?? null,
        arv: props.ARV ?? null,
      },
    });
  } catch (err) {
    const reason = err?.name === "AbortError" ? "timeout" : (err?.message ?? String(err));
    console.error("[jshis-ground] Exception: %s", reason);
    return res.status(502).json({ status: "error", reason });
  } finally {
    clearTimeout(timer);
  }
}
