// Vercel Serverless Function — 国土地理院 指定緊急避難場所タイルAPIプロキシ
// cyberjapandata.gsi.go.jp の optimal_bousaishelter ベクタータイルをサーバーサイドで取得し、
// 指定座標から近い順に返す（ブラウザからの直接アクセスに備えCORSを付与）

const TILE_BASE = "https://cyberjapandata.gsi.go.jp/xyz/optimal_bousaishelter";
const ZOOM = 14;             // 1タイル ≒ 2.5km × 2.5km（日本中緯度）
const MAX_RADIUS_KM = 3;
const MAX_RESULTS = 5;
const TIMEOUT_MS = 12000;

function latLonToTile(lat, lon, zoom) {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lon + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const y = Math.floor(
    (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n
  );
  return { x, y };
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseShelter(feature, userLat, userLon) {
  const g = feature.geometry;
  if (!g?.coordinates) return null;
  const [sLon, sLat] = g.coordinates;
  if (!Number.isFinite(sLat) || !Number.isFinite(sLon)) return null;

  const dist = haversineKm(userLat, userLon, sLat, sLon);
  if (dist > MAX_RADIUS_KM) return null;

  const p = feature.properties || {};

  // 国土交通省 位置参照情報 P20 系のプロパティ名に対応
  // タイルフォーマットによっては短縮名が使われる場合があるため複数パターンを試みる
  const name    = p.P20_002 || p.name    || p["施設・場所名称"] || "（名称不明）";
  const address = p.P20_003 || p.address || p["住所"]           || "";

  const flag = (v) => v === 1 || v === "1" || v === true;
  const isEvac  = flag(p.P20_006) || flag(p["指定避難所"]);
  const isEmerg = flag(p.P20_007) || flag(p["指定緊急避難場所"]);

  const DISASTER_MAP = [
    ["P20_008", "洪水"],
    ["P20_009", "土砂災害"],
    ["P20_010", "高潮"],
    ["P20_011", "地震"],
    ["P20_012", "津波"],
    ["P20_013", "大規模火事"],
    ["P20_014", "内水氾濫"],
    ["P20_015", "火山現象"],
  ];
  const disasterTypes = DISASTER_MAP
    .filter(([key]) => flag(p[key]))
    .map(([, label]) => label);

  let type = "避難施設";
  if (isEmerg && isEvac) type = "指定避難所・指定緊急避難場所";
  else if (isEmerg)      type = "指定緊急避難場所";
  else if (isEvac)       type = "指定避難所";

  return {
    name,
    type,
    address,
    lat: sLat,
    lon: sLon,
    distanceKm: Math.round(dist * 10) / 10,
    disasterTypes,
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const latNum = parseFloat(req.query.lat);
  const lonNum = parseFloat(req.query.lon);

  if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)
    || latNum < 20 || latNum > 46 || lonNum < 122 || lonNum > 154) {
    return res.status(400).json({ status: "error", reason: "座標が不正です" });
  }

  const { x, y } = latLonToTile(latNum, lonNum, ZOOM);

  // 中心タイルを含む3×3グリッドを並列取得（カバー範囲 ≒ 半径3.5km）
  const offsets = [-1, 0, 1];
  const tileUrls = offsets.flatMap((dy) =>
    offsets.map((dx) => `${TILE_BASE}/${ZOOM}/${x + dx}/${y + dy}.geojson`)
  );

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const tileResults = await Promise.all(
      tileUrls.map((url) =>
        fetch(url, { signal: controller.signal })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    );
    clearTimeout(timer);

    const shelters = [];
    for (const tile of tileResults) {
      if (!tile?.features) continue;
      for (const feature of tile.features) {
        const s = parseShelter(feature, latNum, lonNum);
        if (s) shelters.push(s);
      }
    }

    shelters.sort((a, b) => a.distanceKm - b.distanceKm);
    const items = shelters.slice(0, MAX_RESULTS);

    return res.status(200).json({
      status: "success",
      source: "国土地理院 指定緊急避難場所・指定避難所データ",
      count: items.length,
      items,
    });
  } catch (err) {
    clearTimeout(timer);
    return res.status(200).json({
      status: "error",
      reason: err.name === "AbortError" ? "タイムアウト" : (err.message ?? "不明なエラー"),
      items: [],
    });
  }
}
