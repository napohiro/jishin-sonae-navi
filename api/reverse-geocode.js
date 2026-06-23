// Vercel Serverless Function — 逆ジオコーディング（Nominatim/OpenStreetMap経由）
// 緯度経度から都道府県・市区町村名を取得する
// ブラウザから直接 Nominatim を叩かないようサーバーサイドでプロキシする

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const TIMEOUT_MS = 8000;

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

  // 日本国内のみ対応
  if (latNum < 20 || latNum > 46 || lonNum < 122 || lonNum > 154) {
    return res.status(200).json({ status: "error", message: "日本国内の座標ではありません" });
  }

  const url = `${NOMINATIM_URL}?format=json&lat=${latNum}&lon=${lonNum}&accept-language=ja&zoom=14`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const upstream = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "jishin-sonae-navi/1.0",
        "Accept": "application/json",
      },
    });

    console.log("[reverse-geocode] Nominatim HTTP status: %d", upstream.status);

    if (!upstream.ok) {
      console.error("[reverse-geocode] Nominatim error: HTTP %d", upstream.status);
      return res.status(200).json({ status: "error", message: "地域名の取得に失敗しました" });
    }

    const data = await upstream.json();
    const address = data?.address;

    if (!address) {
      return res.status(200).json({ status: "error", message: "住所情報が取得できませんでした" });
    }

    // 都道府県名
    const prefecture = address.state || address.province || "";

    // 市区町村名（複数のキーを順に試みる）
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.suburb ||
      address.county ||
      "";

    if (!prefecture) {
      console.warn("[reverse-geocode] Prefecture not found in address: %j", address);
      return res.status(200).json({ status: "error", message: "都道府県名が取得できませんでした" });
    }

    const label = city ? `${prefecture}${city}` : prefecture;

    console.log("[reverse-geocode] Success: prefecture=%s city=%s label=%s", prefecture, city, label);

    return res.status(200).json({
      status: "success",
      prefecture,
      city: city || null,
      label,
    });
  } catch (err) {
    const reason = err?.name === "AbortError" ? "timeout" : (err?.message ?? String(err));
    console.error("[reverse-geocode] Exception: %s", reason);
    return res.status(200).json({ status: "error", message: "地域名の取得に失敗しました" });
  } finally {
    clearTimeout(timer);
  }
}
