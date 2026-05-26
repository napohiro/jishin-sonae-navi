import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { regionRiskData } from "../data/earthquakeData";
import DisclaimerBanner from "../components/DisclaimerBanner";

export default function Home() {
  const [selectedRegion, setSelectedRegion] = useState(() => {
    return localStorage.getItem("selectedRegion") || "tokyo";
  });

  const region = regionRiskData[selectedRegion];

  useEffect(() => {
    localStorage.setItem("selectedRegion", selectedRegion);
  }, [selectedRegion]);

  const getRiskColor = (risk) => {
    if (risk >= 70) return "#e67e22";
    if (risk >= 40) return "#f39c12";
    return "#27ae60";
  };

  const getRiskLabel = (risk) => {
    if (risk >= 70) return "高い";
    if (risk >= 40) return "やや高い";
    if (risk >= 20) return "中程度";
    return "比較的低い";
  };

  const getGroundLabel = (index) => {
    if (index === 1) return { label: "比較的硬い", color: "#27ae60", icon: "🟢" };
    if (index === 2) return { label: "中程度", color: "#f39c12", icon: "🟡" };
    return { label: "軟弱地盤", color: "#e67e22", icon: "🟠" };
  };

  const ground = getGroundLabel(region.groundIndex);
  const riskColor = getRiskColor(region.risk30year);

  const checklistCount = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem("prepChecklist") || "{}");
      return Object.values(saved).filter(Boolean).length;
    } catch {
      return 0;
    }
  })();

  const totalItems = 13;
  const prepPercent = Math.round((checklistCount / totalItems) * 100);

  return (
    <div className="page">
      <DisclaimerBanner />

      {/* 地域選択 */}
      <section className="card region-card">
        <div className="card-header">
          <span className="card-icon">📍</span>
          <h2 className="card-title">地域を選択</h2>
        </div>
        <select
          className="region-select"
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
        >
          {Object.entries(regionRiskData).map(([key, val]) => (
            <option key={key} value={key}>
              {val.name}
            </option>
          ))}
        </select>
        <p className="region-note">※ デモ用データです。正確なリスクは J-SHIS でご確認ください。</p>
      </section>

      {/* 長期地震リスク */}
      <section className="card risk-card">
        <div className="card-header">
          <span className="card-icon">📊</span>
          <h2 className="card-title">長期地震リスク（デモ）</h2>
        </div>
        <p className="risk-subtitle">今後30年以内に震度6弱以上の揺れが起きる確率</p>
        <div className="risk-display">
          <div
            className="risk-circle"
            style={{ borderColor: riskColor, color: riskColor }}
          >
            <span className="risk-percent">{region.risk30year}</span>
            <span className="risk-unit">%</span>
          </div>
          <div className="risk-info">
            <div className="risk-level" style={{ color: riskColor }}>
              リスク：{getRiskLabel(region.risk30year)}
            </div>
            <div className="risk-region">{region.name}</div>
          </div>
        </div>
        <div className="risk-bar-wrap">
          <div
            className="risk-bar"
            style={{
              width: `${Math.min(region.risk30year, 100)}%`,
              backgroundColor: riskColor,
            }}
          />
        </div>
        <p className="risk-source">
          出典：
          <a
            href="https://www.j-shis.bosai.go.jp/"
            target="_blank"
            rel="noopener noreferrer"
            className="source-link"
          >
            J-SHIS 地震ハザードステーション（防災科学技術研究所）
          </a>
          のデータに基づくデモ値
        </p>
      </section>

      {/* 揺れやすさ */}
      <section className="card ground-card">
        <div className="card-header">
          <span className="card-icon">🌍</span>
          <h2 className="card-title">揺れやすさ</h2>
        </div>
        <div className="ground-display">
          <span className="ground-icon-large">{ground.icon}</span>
          <div>
            <div className="ground-label" style={{ color: ground.color }}>
              {ground.label}
            </div>
            <div className="ground-type">{region.groundType}</div>
          </div>
        </div>
        <p className="ground-desc">
          地盤の柔らかさは揺れの大きさに影響します。軟弱地盤ほど揺れが増幅されやすくなります。
        </p>
      </section>

      {/* 近くの避難所 */}
      <section className="card shelter-card">
        <div className="card-header">
          <span className="card-icon">🏫</span>
          <h2 className="card-title">近くの避難所（デモ）</h2>
        </div>
        <div className="shelter-info">
          <div className="shelter-name">{region.nearestShelter}</div>
          <div className="shelter-note">
            ※ 実際の避難所は自治体のハザードマップでご確認ください
          </div>
        </div>
        <a
          href="https://disaportal.gsi.go.jp/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
        >
          国土交通省 ハザードマップポータルで確認 →
        </a>
      </section>

      {/* 備えチェック */}
      <section className="card prep-card">
        <div className="card-header">
          <span className="card-icon">🎒</span>
          <h2 className="card-title">備えチェック</h2>
        </div>
        <div className="prep-progress-wrap">
          <div className="prep-progress-header">
            <span className="prep-progress-label">準備度</span>
            <span className="prep-progress-value" style={{ color: prepPercent >= 70 ? "#27ae60" : prepPercent >= 40 ? "#f39c12" : "#e67e22" }}>
              {prepPercent}%
            </span>
          </div>
          <div className="prep-progress-bar-bg">
            <div
              className="prep-progress-bar"
              style={{
                width: `${prepPercent}%`,
                backgroundColor: prepPercent >= 70 ? "#27ae60" : prepPercent >= 40 ? "#f39c12" : "#e67e22",
              }}
            />
          </div>
          <p className="prep-progress-desc">
            {checklistCount} / {totalItems} 項目チェック済み
          </p>
        </div>
        <Link to="/prep-check" className="btn btn-primary">
          備えチェックリストを確認する →
        </Link>
      </section>

      {/* フッター免責 */}
      <footer className="home-footer">
        <div className="footer-disclaimer">
          <p>
            🛡️ <strong>地震そなえナビ</strong>は地震予知・地震予報を行うものではありません。
          </p>
          <p>
            公的機関等のデータをもとに、地域リスクの把握と日頃の備えを支援するアプリです。
            表示されるリスク値はデモデータであり、実際の確率は J-SHIS 等の公式サービスでご確認ください。
          </p>
          <p>個人情報は収集していません。データは端末内（localStorage）にのみ保存されます。</p>
        </div>
        <p className="footer-copy">© 2025 地震そなえナビ（デモアプリ）</p>
      </footer>
    </div>
  );
}
