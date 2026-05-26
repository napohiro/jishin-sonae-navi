import { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { majorEarthquakes } from "../data/majorEarthquakes";
import DisclaimerBanner from "../components/DisclaimerBanner";

// LocalStorageから現在地情報を取得
function readGeoInfo() {
  const lat = parseFloat(localStorage.getItem("regionLat"));
  const lng = parseFloat(localStorage.getItem("regionLng"));
  const label = localStorage.getItem("regionLabel");
  const hasGeo = !isNaN(lat) && !isNaN(lng) && label === "現在地周辺";
  return { lat, lng, label, hasGeo };
}

// LocalStorageからキャッシュしたリスクデータを取得
function readCachedRisk() {
  try { return JSON.parse(localStorage.getItem("cachedRiskData") || "null"); }
  catch { return null; }
}

const INITIAL_COUNT = 5;

// 震度文字列に応じた表示スタイル
function getIntensityStyle(intensity) {
  if (intensity.includes("震度7"))  return { color: "#e07b39", bg: "#fef0e3" };
  if (intensity.includes("6強"))    return { color: "#e07b39", bg: "#fef0e3" };
  if (intensity.includes("6弱"))    return { color: "#f39c12", bg: "#fef9e3" };
  if (intensity.includes("5"))      return { color: "#1a6fa8", bg: "#e8f4fd" };
  return { color: "#27ae60", bg: "#eafaf1" };
}

export default function RiskMap() {
  const [showAll, setShowAll] = useState(false);

  const { lat, lng, label, hasGeo } = readGeoInfo();
  const cachedRisk = readCachedRisk();

  const mapCenter = hasGeo ? [lat, lng] : [36.0, 137.5];
  const mapZoom   = hasGeo ? 13 : 5;

  const displayed = showAll
    ? majorEarthquakes
    : majorEarthquakes.slice(0, INITIAL_COUNT);

  return (
    <div className="page">
      <DisclaimerBanner />

      <div className="page-hero">
        <h2 className="page-hero-title">🗺️ 地域リスクマップ</h2>
        <p className="page-hero-desc">
          現在地周辺の地図と、近年の主な地震記録を確認できます。
        </p>
      </div>

      {/* ===== 地図エリア ===== */}
      <section className="card map-card">
        <div className="card-header">
          <span className="card-icon">🗾</span>
          <h2 className="card-title">現在地マップ</h2>
        </div>

        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className="leaflet-map"
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hasGeo && (
            <CircleMarker
              center={[lat, lng]}
              radius={14}
              pathOptions={{
                color: "#1a6fa8",
                fillColor: "#3498db",
                fillOpacity: 0.75,
                weight: 2,
              }}
            >
              <Popup>
                <div className="map-popup">
                  <strong>{label ?? "現在地周辺"}</strong>
                  {cachedRisk?.risk30year != null && (
                    <div>震度6弱以上（30年）：{cachedRisk.risk30year}%</div>
                  )}
                  <div>
                    データ種別：
                    {cachedRisk?.source === "jshis"
                      ? "J-SHIS公的データ"
                      : "デモ用サンプル"}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )}
        </MapContainer>

        {/* 地図下の情報サマリー */}
        {hasGeo ? (
          <div className="map-info-card">
            <div className="map-info-row">
              <span className="map-info-label">地域</span>
              <span className="map-info-value">{label}</span>
            </div>
            {cachedRisk?.risk30year != null && (
              <div className="map-info-row">
                <span className="map-info-label">震度6弱以上（30年）</span>
                <span className="map-info-value">{cachedRisk.risk30year}%</span>
              </div>
            )}
            <div className="map-info-row">
              <span className="map-info-label">データ種別</span>
              <span className="map-info-value">
                {cachedRisk?.source === "jshis" ? (
                  <span className="datasource-badge datasource-badge--jshis">✓ J-SHIS公的データ</span>
                ) : (
                  <span className="datasource-badge datasource-badge--demo">デモ用サンプル</span>
                )}
              </span>
            </div>
          </div>
        ) : (
          <p className="map-no-geo-note">
            ホーム画面で「現在地から調べる」を実行すると、現在地を地図で確認できます。
          </p>
        )}
      </section>

      {/* ===== 近年の主な地震記録 ===== */}
      <section className="card">
        <div className="card-header">
          <span className="card-icon">📋</span>
          <h2 className="card-title">近年の主な地震記録</h2>
        </div>

        <p className="earthquake-disclaimer">
          ⚠ この一覧は主な過去地震の記録です。リアルタイムの地震情報ではありません。最新の地震情報は
          <a
            href="https://www.jma.go.jp/jma/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="source-link"
          >
            気象庁
          </a>
          等の公式情報をご確認ください。
        </p>

        <div className="earthquake-list">
          {displayed.map((eq, i) => {
            const style = getIntensityStyle(eq.maxIntensity);
            return (
              <div key={i} className="earthquake-item">
                <div className="earthquake-date">{eq.date}</div>
                <div className="earthquake-main">
                  <div className="earthquake-name">{eq.name}</div>
                  <div className="earthquake-area">📍 {eq.area}</div>
                  <div className="earthquake-stats">
                    <span className="earthquake-mag">{eq.magnitude}</span>
                    <span
                      className="earthquake-intensity"
                      style={{ color: style.color, backgroundColor: style.bg }}
                    >
                      {eq.maxIntensity}
                    </span>
                  </div>
                  {eq.note && (
                    <div className="earthquake-note">{eq.note}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {majorEarthquakes.length > INITIAL_COUNT && (
          <button
            className="btn btn-outline earthquake-more-btn"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll
              ? "▲ 閉じる"
              : `▼ もっと見る（残り${majorEarthquakes.length - INITIAL_COUNT}件）`}
          </button>
        )}

        <p className="earthquake-source">
          参考：気象庁・防災科学技術研究所等の公的情報をもとに編集
        </p>
      </section>

      {/* ===== 公式リンク ===== */}
      <section className="card link-card">
        <div className="card-header">
          <span className="card-icon">🔗</span>
          <h2 className="card-title">公式情報へのリンク</h2>
        </div>
        <div className="external-links">
          <a href="https://www.j-shis.bosai.go.jp/" target="_blank" rel="noopener noreferrer" className="external-link-btn">
            🗾 J-SHIS 地震ハザードステーション
          </a>
          <a href="https://www.jma.go.jp/jma/index.html" target="_blank" rel="noopener noreferrer" className="external-link-btn">
            🌤️ 気象庁 地震情報
          </a>
          <a href="https://disaportal.gsi.go.jp/" target="_blank" rel="noopener noreferrer" className="external-link-btn">
            🗺️ ハザードマップポータルサイト
          </a>
        </div>
      </section>
    </div>
  );
}
