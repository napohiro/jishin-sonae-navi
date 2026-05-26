// Vercel Serverless Function — J-SHIS APIプロキシ
// ブラウザからのCORS制約を回避するため、サーバーサイドでJ-SHIS APIを呼び出す

const JSHIS_BASE =
  "https://www.j-shis.bosai.go.jp/map/api/pshm/Y2024/AVR/TTL_MTTL/meshinfo.geojson";
// ※ カンマをURLエンコードしないようテンプレートリテラルで直接結合する
const ATTRS = "T30_I55_PS"; // まず1属性だけで疎通確認（成功後に複数へ拡張）
const TIMEOUT_MS = 10000;

export default async function handler(req, res) {
  const { lat, lon } = req.query;

  console.log("[jshis] Request received: lat=%s lon=%s", lat, lon);

  if (!lat || !lon) {
    console.error("[jshis] Missing lat/lon in query");
    return res.status(400).json({ status: "error", message: "lat と lon が必要です" });
  }

  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);
  if (isNaN(latNum) || isNaN(lonNum)) {
    console.error("[jshis] lat/lon is not a number: lat=%s lon=%s", lat, lon);
    return res.status(400).json({ status: "error", message: "lat/lon が数値ではありません" });
  }

  // 日本国内範囲外はAPIを呼ばずにフォールバック
  if (latNum < 20 || latNum > 46 || lonNum < 122 || lonNum > 154) {
    console.warn("[jshis] Out of Japan bounds: lat=%s lon=%s", latNum, lonNum);
    return res.status(200).json({ status: "error", message: "日本国内の座標ではありません" });
  }

  // J-SHIS仕様: position は「経度,緯度」の順
  // ※ URLSearchParams は使わない（カンマが %2C にエンコードされるため）
  const pos = `${lonNum.toFixed(4)},${latNum.toFixed(4)}`;
  const requestUrl = `${JSHIS_BASE}?position=${pos}&epsg=4326&attr=${ATTRS}`;

  console.log("[jshis] Fetching J-SHIS URL: %s", requestUrl);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const upstream = await fetch(requestUrl, {
      signal: ctrl.signal,
      headers: { "User-Agent": "jishin-sonae-navi/1.0" },
    });

    console.log("[jshis] J-SHIS HTTP status: %d", upstream.status);

    if (!upstream.ok) {
      // エラー時もレスポンス本文を取得してログに出す
      const responseText = await upstream.text().catch(() => "(読み取り失敗)");
      console.error(
        "[jshis] J-SHIS upstream error: HTTP %d\nURL: %s\nBody: %s",
        upstream.status,
        requestUrl,
        responseText
      );
      return res.status(502).json({
        status: "error",
        message: "J-SHISデータの取得に失敗しました",
        reason: `J-SHIS HTTP ${upstream.status}`,
        debug: {
          requestUrl,
          responseText,
          lat: latNum,
          lon: lonNum,
        },
      });
    }

    const data = await upstream.json();

    console.log(
      "[jshis] J-SHIS response: status=%s features=%d",
      data?.status,
      data?.features?.length ?? 0
    );

    if (data?.status !== "Success") {
      console.error("[jshis] J-SHIS status not Success: %s", data?.status);
      return res.status(502).json({
        status: "error",
        message: "J-SHISデータの取得に失敗しました",
        reason: `J-SHIS status: ${data?.status}`,
        debug: { requestUrl, lat: latNum, lon: lonNum },
      });
    }

    const props = data.features?.[0]?.properties;
    if (!props) {
      console.error("[jshis] No features in J-SHIS response");
      return res.status(502).json({
        status: "error",
        message: "J-SHISデータの取得に失敗しました",
        reason: "no features",
        debug: { requestUrl, lat: latNum, lon: lonNum },
      });
    }

    if (props.T30_I55_PS == null) {
      console.error("[jshis] T30_I55_PS missing in props: %j", props);
      return res.status(502).json({
        status: "error",
        message: "J-SHISデータの取得に失敗しました",
        reason: "T30_I55_PS missing",
        debug: { requestUrl, lat: latNum, lon: lonNum },
      });
    }

    console.log(
      "[jshis] Success: meshCode=%s T30_I55_PS=%s",
      data.features?.[0]?.id,
      props.T30_I55_PS
    );

    return res.status(200).json({
      status: "success",
      source: "J-SHIS",
      meshCode: data.features?.[0]?.id ?? null,
      data: {
        t30_i55: props.T30_I55_PS,
      },
    });
  } catch (err) {
    const reason = err?.name === "AbortError" ? "timeout" : (err?.message ?? String(err));
    console.error("[jshis] Fetch exception: %s", reason);
    return res.status(502).json({
      status: "error",
      message: "J-SHISデータの取得に失敗しました",
      reason,
      debug: { requestUrl, lat: latNum, lon: lonNum },
    });
  } finally {
    clearTimeout(timer);
  }
}
