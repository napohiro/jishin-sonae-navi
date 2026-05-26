import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { regionRiskData } from "../data/earthquakeData";
import DisclaimerBanner from "../components/DisclaimerBanner";
import { fetchJshisRisk } from "../lib/jshis";

const regionKeywords = {
  tokyo:     ["東京", "23区", "千代田", "新宿", "渋谷", "港区", "品川", "世田谷", "練馬", "豊島", "杉並"],
  osaka:     ["大阪", "梅田", "難波", "堺"],
  nagoya:    ["名古屋", "愛知", "豊田", "豊橋"],
  sapporo:   ["札幌", "北海道", "函館", "旭川"],
  fukuoka:   ["福岡", "博多", "北九州"],
  hiroshima: ["広島", "呉", "福山"],
  sendai:    ["仙台", "宮城"],
  shizuoka:  ["静岡", "浜松", "沼津"],
  kobe:      ["神戸", "兵庫", "加古川", "姫路", "西宮", "尼崎", "明石", "宝塚"],
};

const regionCoords = {
  tokyo:     { lat: 35.69, lng: 139.69 },
  osaka:     { lat: 34.69, lng: 135.50 },
  nagoya:    { lat: 35.18, lng: 136.91 },
  sapporo:   { lat: 43.06, lng: 141.35 },
  fukuoka:   { lat: 33.59, lng: 130.40 },
  hiroshima: { lat: 34.38, lng: 132.45 },
  sendai:    { lat: 38.27, lng: 140.87 },
  shizuoka:  { lat: 34.98, lng: 138.38 },
  kobe:      { lat: 34.69, lng: 135.19 },
};

function matchRegionByKeyword(text) {
  for (const [key, kws] of Object.entries(regionKeywords)) {
    if (kws.some((kw) => text.includes(kw))) return key;
  }
  return "other";
}

function findClosestRegion(lat, lng) {
  let minDist = Infinity;
  let closest = "other";
  for (const [key, c] of Object.entries(regionCoords)) {
    const dist = Math.hypot(lat - c.lat, lng - c.lng);
    if (dist < minDist) { minDist = dist; closest = key; }
  }
  return closest;
}

export default function Home() {
  const [regionKey, setRegionKey] = useState(() => {
    return localStorage.getItem("regionKey")
      || localStorage.getItem("selectedRegion")
      || "tokyo";
  });
  const [regionLabel, setRegionLabel] = useState(() => {
    const saved = localStorage.getItem("regionLabel");
    if (saved) return saved;
    const key = localStorage.getItem("regionKey")
      || localStorage.getItem("selectedRegion")
      || "tokyo";
    return regionRiskData[key]?.name ?? regionRiskData.tokyo.name;
  });
  const [geoState, setGeoState] = useState("idle"); // 'idle' | 'confirm' | 'loading' | 'error'
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState("");
  const [riskData, setRiskData] = useState(null);  // null = demo, {source:"jshis",...} = 公的データ
  const [riskLoading, setRiskLoading] = useState(false);

  const region = regionRiskData[regionKey] ?? regionRiskData.other;

  useEffect(() => {
    localStorage.setItem("regionKey", regionKey);
    localStorage.setItem("regionLabel", regionLabel);
  }, [regionKey, regionLabel]);

  // 初回起動時: 保存済み座標があればJ-SHIS取得を試みる
  useEffect(() => {
    const lat = parseFloat(localStorage.getItem("regionLat"));
    const lng = parseFloat(localStorage.getItem("regionLng"));
    if (!isNaN(lat) && !isNaN(lng)) {
      setRiskLoading(true);
      fetchJshisRisk(lat, lng).then((d) => { setRiskData(d); setRiskLoading(false); });
      return;
    }
    const key = localStorage.getItem("regionKey") || localStorage.getItem("selectedRegion") || "tokyo";
    const coords = regionCoords[key];
    if (coords && key !== "other") {
      setRiskLoading(true);
      fetchJshisRisk(coords.lat, coords.lng).then((d) => { setRiskData(d); setRiskLoading(false); });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGeoRequest = () => {
    if (!navigator.geolocation) { setGeoState("error"); return; }
    setGeoState("confirm");
  };

  const handleGeoConfirm = () => {
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        const key = findClosestRegion(latitude, longitude);
        setRegionKey(key);
        setRegionLabel(regionRiskData[key].name + "（現在地周辺）");
        setGeoState("idle");
        localStorage.setItem("regionLat", latitude.toString());
        localStorage.setItem("regionLng", longitude.toString());
        setRiskLoading(true);
        setRiskData(null);
        fetchJshisRisk(latitude, longitude).then((d) => { setRiskData(d); setRiskLoading(false); });
      },
      () => setGeoState("error"),
      { timeout: 10000 }
    );
  };

  const handleSearch = () => {
    const text = inputText.trim();
    if (!text) return;
    const key = matchRegionByKeyword(text);
    setRegionKey(key);
    setRegionLabel(text);
    setShowInput(false);
    setInputText("");
    const coords = regionCoords[key];
    if (coords) {
      localStorage.setItem("regionLat", coords.lat.toString());
      localStorage.setItem("regionLng", coords.lng.toString());
      setRiskLoading(true);
      setRiskData(null);
      fetchJshisRisk(coords.lat, coords.lng).then((d) => { setRiskData(d); setRiskLoading(false); });
    } else {
      setRiskData(null);
    }
  };

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
  const isJshis = riskData?.source === "jshis";
  const displayRisk30 = isJshis ? riskData.risk30year : region.risk30year;
  const riskColor = getRiskColor(displayRisk30);

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

        <div className="region-current">
          <span className="region-current-label">選択地域：</span>
          <strong className="region-current-name">{regionLabel}</strong>
        </div>

        {geoState === "idle" && !showInput && (
          <div className="region-actions">
            <button className="btn btn-geo" onClick={handleGeoRequest}>
              📡 現在地から調べる
            </button>
            <button className="btn btn-outline" onClick={() => setShowInput(true)}>
              🔍 市区町村を入力
            </button>
          </div>
        )}

        {geoState === "confirm" && (
          <div className="geo-consent">
            <p className="geo-consent-text">
              現在地情報は端末内で地域リスク表示にのみ使用します。個人を特定する目的では使用しません。
            </p>
            <div className="region-actions">
              <button className="btn btn-primary" onClick={handleGeoConfirm}>
                現在地を取得する
              </button>
              <button className="btn btn-ghost" onClick={() => setGeoState("idle")}>
                キャンセル
              </button>
            </div>
          </div>
        )}

        {geoState === "loading" && (
          <p className="geo-status-text">📡 現在地を取得中…</p>
        )}

        {geoState === "error" && (
          <div className="geo-consent">
            <p className="geo-consent-text">現在地の取得に失敗しました。市区町村を入力して調べることができます。</p>
            <div className="region-actions">
              <button
                className="btn btn-outline"
                onClick={() => { setGeoState("idle"); setShowInput(true); }}
              >
                市区町村を入力して調べる
              </button>
              <button className="btn btn-ghost" onClick={() => setGeoState("idle")}>
                閉じる
              </button>
            </div>
          </div>
        )}

        {showInput && geoState === "idle" && (
          <div className="region-input-wrap">
            <input
              className="region-input"
              type="text"
              placeholder="例：兵庫県加古川市"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              autoFocus
            />
            <div className="region-actions">
              <button className="btn btn-primary" onClick={handleSearch}>
                調べる
              </button>
              <button className="btn btn-ghost" onClick={() => { setShowInput(false); setInputText(""); }}>
                キャンセル
              </button>
            </div>
          </div>
        )}

        <p className="region-note">※ 入力した地域の周辺を参考に表示しています。正確なリスクは公式サービスでご確認ください。</p>
      </section>

      {/* 長期地震リスク */}
      <section className="card risk-card">
        <div className="card-header">
          <span className="card-icon">📊</span>
          <h2 className="card-title">長期地震リスク（デモ）</h2>
        </div>
        <p className="risk-subtitle">地域の長期地震リスク指標（30年スケール参考値）</p>
        {!isJshis && !riskLoading && (
          <p className="risk-demo-note">⚠ 現在はデモ用サンプル値です</p>
        )}
        <div className="risk-datasource">
          データ種別：
          {riskLoading ? (
            <span className="datasource-badge">取得中…</span>
          ) : isJshis ? (
            <span className="datasource-badge datasource-badge--jshis">✓ J-SHIS公的データ</span>
          ) : (
            <span className="datasource-badge datasource-badge--demo">デモ用サンプル</span>
          )}
        </div>
        <div className="risk-display">
          <div
            className="risk-circle"
            style={{ borderColor: riskColor, color: riskColor }}
          >
            <span className="risk-percent">{displayRisk30}</span>
            <span className="risk-unit">%</span>
          </div>
          <div className="risk-info">
            <div className="risk-level" style={{ color: riskColor }}>
              リスク：{getRiskLabel(displayRisk30)}
            </div>
            <div className="risk-region">{regionLabel}</div>
          </div>
        </div>
        <div className="risk-bar-wrap">
          <div
            className="risk-bar"
            style={{
              width: `${Math.min(displayRisk30, 100)}%`,
              backgroundColor: riskColor,
            }}
          />
        </div>
        <p className="risk-source">
          {isJshis ? (
            <>
              出典：
              <a
                href="https://www.j-shis.bosai.go.jp/"
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
              >
                J-SHIS 地震ハザードステーション（防災科学技術研究所）
              </a>
            </>
          ) : (
            <>
              参考：正式版では
              <a
                href="https://www.j-shis.bosai.go.jp/"
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
              >
                J-SHIS 地震ハザードステーション
              </a>
              等の公的データ連携を予定（現在はサンプル値）
            </>
          )}
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
            現在はデモ用サンプルデータを表示しています。正式版ではJ-SHIS等の公的情報との連携を予定しています。実際の地域リスクは公式サービスでご確認ください。
          </p>
          <p>個人情報は収集していません。データは端末内（localStorage）にのみ保存されます。</p>
        </div>
        <p className="footer-copy">© 2025 地震そなえナビ（デモアプリ）</p>
      </footer>
    </div>
  );
}
