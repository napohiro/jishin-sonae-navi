import { useState } from "react";
import { recentEarthquakes, mapZones } from "../data/earthquakeData";
import DisclaimerBanner from "../components/DisclaimerBanner";

export default function RiskMap() {
  const [selectedZone, setSelectedZone] = useState(null);

  const getIntensityColor = (intensity) => {
    const val = intensity.toString();
    if (val === "7") return "#c0392b";
    if (val.startsWith("6")) return "#e67e22";
    if (val.startsWith("5")) return "#f39c12";
    if (val === "4") return "#3498db";
    return "#27ae60";
  };

  const getIntensityBg = (intensity) => {
    const val = intensity.toString();
    if (val === "7") return "#fdecea";
    if (val.startsWith("6")) return "#fef0e3";
    if (val.startsWith("5")) return "#fef9e3";
    if (val === "4") return "#ebf5fb";
    return "#eafaf1";
  };

  return (
    <div className="page">
      <DisclaimerBanner />

      <div className="page-hero">
        <h2 className="page-hero-title">🗺️ 地域リスクマップ</h2>
        <p className="page-hero-desc">
          デモ用の揺れやすさ分布と近年の地震記録を確認できます。
        </p>
      </div>

      {/* 地図エリア */}
      <section className="card map-card">
        <div className="card-header">
          <span className="card-icon">🗾</span>
          <h2 className="card-title">揺れやすさ分布（デモ）</h2>
        </div>

        <div className="map-container">
          {/* 背景グリッド */}
          <div className="map-bg">
            {/* グリッド線 */}
            {[...Array(6)].map((_, i) => (
              <div
                key={`h${i}`}
                className="map-grid-h"
                style={{ top: `${(i + 1) * (100 / 7)}%` }}
              />
            ))}
            {[...Array(6)].map((_, i) => (
              <div
                key={`v${i}`}
                className="map-grid-v"
                style={{ left: `${(i + 1) * (100 / 7)}%` }}
              />
            ))}

            {/* ゾーン */}
            {mapZones.map((zone) => (
              <button
                key={zone.id}
                className={`map-zone ${selectedZone === zone.id ? "map-zone--selected" : ""}`}
                style={{
                  left: `${zone.x}%`,
                  top: `${zone.y}%`,
                  backgroundColor: zone.color + "55",
                  borderColor: zone.color,
                }}
                onClick={() =>
                  setSelectedZone(selectedZone === zone.id ? null : zone.id)
                }
              >
                <span className="map-zone-label">{zone.label}</span>
              </button>
            ))}

            {/* 現在地マーカー */}
            <div className="map-current-location">
              <div className="map-marker-pulse" />
              <div className="map-marker-dot" />
              <span className="map-marker-label">現在地（デモ）</span>
            </div>
          </div>

          {/* 選択ゾーン情報 */}
          {selectedZone && (
            <div className="map-zone-info">
              {(() => {
                const zone = mapZones.find((z) => z.id === selectedZone);
                const riskLabels = { high: "揺れやすい", medium: "中程度", low: "比較的安定" };
                return (
                  <>
                    <strong>{zone.label}</strong>：{riskLabels[zone.risk]}
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* 凡例 */}
        <div className="map-legend">
          <span className="legend-title">揺れやすさ</span>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: "#e67e22" }} />
              <span>揺れやすい</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: "#f39c12" }} />
              <span>中程度</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: "#27ae60" }} />
              <span>比較的安定</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot map-marker-legend" />
              <span>現在地</span>
            </div>
          </div>
        </div>

        <p className="map-note">
          ※ このマップはデモ用の模式図です。実際の地盤データは
          <a href="https://www.j-shis.bosai.go.jp/" target="_blank" rel="noopener noreferrer" className="source-link">
            J-SHIS
          </a>
          でご確認ください。
        </p>
      </section>

      {/* 近年の地震記録 */}
      <section className="card">
        <div className="card-header">
          <span className="card-icon">📋</span>
          <h2 className="card-title">近年の主な地震記録</h2>
        </div>
        <p className="earthquake-list-note">
          ⚠ サンプルデータです。過去の地震を参考として掲載しています。今後の地震予測ではありません。
        </p>
        <div className="earthquake-list">
          {recentEarthquakes.map((eq) => (
            <div key={eq.id} className="earthquake-item">
              <div className="earthquake-date">{eq.date}</div>
              <div className="earthquake-main">
                <div className="earthquake-epicenter">📍 {eq.epicenter}</div>
                <div className="earthquake-stats">
                  <span className="earthquake-mag">M {eq.magnitude}</span>
                  <span
                    className="earthquake-intensity"
                    style={{
                      color: getIntensityColor(eq.maxIntensity),
                      backgroundColor: getIntensityBg(eq.maxIntensity),
                    }}
                  >
                    最大震度 {eq.maxIntensity}
                  </span>
                  <span className="earthquake-depth">深さ {eq.depth}km</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="earthquake-source">
          参考：正式版では気象庁等の公的データ連携を予定（現在はサンプルデータ）
        </p>
      </section>

      {/* 外部リンク */}
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
