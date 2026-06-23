import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { regionRiskData } from "../data/earthquakeData";
import { checklistItems, categories } from "../data/checklistItems";
import DisclaimerBanner from "../components/DisclaimerBanner";
import { fetchJshisRisk, fetchJshisSurfaceGround } from "../lib/jshis";

// 揺れやすさ5段階定義（ARVベースのレベル1〜5）
const GROUND_LEVELS = [
  { level: 1, label: "揺れにくい",     color: "#27ae60", icon: "🟢",
    shortDesc: "地盤による揺れの増幅が比較的小さい",
    desc: "地盤による揺れの増幅が比較的小さい地域です。基本的な備えは引き続き大切です。" },
  { level: 2, label: "やや揺れにくい", color: "#5aab61", icon: "🟡",
    shortDesc: "平均より少し揺れにくい",
    desc: "平均より少し揺れにくい地域です。家具固定や避難場所の確認など基本的な備えをお勧めします。" },
  { level: 3, label: "中程度",         color: "#f39c12", icon: "🟡",
    shortDesc: "標準的な揺れやすさ",
    desc: "標準的な揺れやすさです。安全を意味するわけではないため、家具固定や避難場所の確認など基本的な備えが大切です。" },
  { level: 4, label: "やや揺れやすい", color: "#e07b39", icon: "🟠",
    shortDesc: "揺れがやや大きくなりやすい",
    desc: "揺れがやや大きくなりやすい地域です。家具固定や建物の耐震性の確認をしっかり行いましょう。" },
  { level: 5, label: "揺れやすい",     color: "#e67e22", icon: "🔴",
    shortDesc: "地盤による揺れの増幅が大きくなりやすい",
    desc: "地盤による揺れの増幅が大きくなりやすい地域です。家具固定や建物の耐震性の確認など、備えをしっかり確認しておきましょう。" },
];

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
  const [riskData, setRiskData] = useState(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [geoCoords, setGeoCoords] = useState(() => {
    const lat = parseFloat(localStorage.getItem("regionLat"));
    const lng = parseFloat(localStorage.getItem("regionLng"));
    return (!isNaN(lat) && !isNaN(lng)) ? { lat, lng } : null;
  });
  const [showGroundScale, setShowGroundScale] = useState(false);
  const [groundData, setGroundData] = useState(null);
  const [familyMemo, setFamilyMemo] = useState(() => {
    try { return JSON.parse(localStorage.getItem("familyMemo") || "{}"); }
    catch { return {}; }
  });
  const [inputMode, setInputMode] = useState(() => {
    const saved = localStorage.getItem("regionMode");
    if (saved === "geo" || saved === "text") return saved;
    // 旧バージョン互換: regionMode キーが未保存の場合は regionLabel で判定
    const label = localStorage.getItem("regionLabel");
    if (label === "現在地周辺") return "geo";
    if (label && label !== regionRiskData.tokyo.name) return "text";
    return "initial";
  });

  // 新規状態
  const [shelterData, setShelterData] = useState(null);
  const [shelterLoading, setShelterLoading] = useState(false);
  const [memoSaved, setMemoSaved] = useState(false);
  const [showMemo, setShowMemo] = useState(false);
  const [showCampDetail, setShowCampDetail] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const [showFooterDetail, setShowFooterDetail] = useState(false);
  const memoTimerRef = useRef(null);

  const region = regionRiskData[regionKey] ?? regionRiskData.other;
  const hasGeo = geoCoords !== null && inputMode === "geo";

  const fetchShelters = async (lat, lng) => {
    setShelterLoading(true);
    setShelterData(null);
    try {
      const res = await fetch(`/api/shelters?lat=${lat}&lon=${lng}`);
      setShelterData(await res.json());
    } catch {
      setShelterData({ status: "error", items: [] });
    } finally {
      setShelterLoading(false);
    }
  };

  const fetchRegionName = async (lat, lng) => {
    try {
      const res = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lng}`);
      const data = await res.json().catch(() => ({}));
      if (data?.status === "success" && data?.label) {
        const name = `${data.label}周辺`;
        setRegionLabel(name);
        localStorage.setItem("regionLabel", name);
      }
      // 失敗時は「現在地周辺」のまま表示
    } catch {
      // 「現在地周辺」のままにする
    }
  };

  useEffect(() => {
    if (riskData?.source === "jshis" && riskData?.risk30year != null) {
      localStorage.setItem("cachedRiskData", JSON.stringify({
        source: "jshis",
        risk30year: riskData.risk30year,
      }));
    }
  }, [riskData]);

  useEffect(() => {
    localStorage.setItem("regionKey", regionKey);
    localStorage.setItem("regionLabel", regionLabel);
  }, [regionKey, regionLabel]);

  useEffect(() => {
    if (inputMode !== "geo") return;
    const lat = parseFloat(localStorage.getItem("regionLat"));
    const lng = parseFloat(localStorage.getItem("regionLng"));
    if (isNaN(lat) || isNaN(lng)) return;
    setRiskLoading(true);
    fetchJshisRisk(lat, lng).then((d) => { setRiskData(d); setRiskLoading(false); });
    fetchJshisSurfaceGround(lat, lng).then((d) => setGroundData(d));
    fetchShelters(lat, lng);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGeoRequest = () => {
    if (!navigator.geolocation) { setGeoState("error"); return; }
    setGeoState("confirm");
  };

  const handleGeoConfirm = () => {
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setRegionKey("other");
        setRegionLabel("現在地周辺");
        setGeoCoords({ lat: latitude, lng: longitude });
        setInputMode("geo");
        setGeoState("idle");
        localStorage.setItem("regionLat", latitude.toString());
        localStorage.setItem("regionLng", longitude.toString());
        localStorage.setItem("regionMode", "geo");
        setRiskLoading(true);
        setRiskData(null);
        setGroundData(null);
        // 地域名を逆ジオコーディングで取得（非同期・失敗時は現在地周辺のまま）
        fetchRegionName(latitude, longitude);
        fetchJshisRisk(latitude, longitude).then((d) => { setRiskData(d); setRiskLoading(false); });
        fetchJshisSurfaceGround(latitude, longitude).then((d) => setGroundData(d));
        fetchShelters(latitude, longitude);
      },
      () => setGeoState("error"),
      { timeout: 10000 }
    );
  };

  const handleSearch = () => {
    const text = inputText.trim();
    if (!text) return;
    setGeoCoords(null);
    setInputMode("text");
    setRiskData(null);
    const key = matchRegionByKeyword(text);
    setRegionKey(key);
    setRegionLabel(text);
    setShowInput(false);
    setInputText("");
    localStorage.setItem("regionMode", "text");
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

  const getGroundByIndex = (index) => {
    const level = index === 1 ? 1 : index === 2 ? 3 : 5;
    return GROUND_LEVELS.find((g) => g.level === level) ?? GROUND_LEVELS[2];
  };

  const isJshisGround = groundData?.source === "jshis";
  const currentGroundLevel = isJshisGround
    ? groundData.groundLevel
    : (region.groundIndex === 1 ? 1 : region.groundIndex === 2 ? 3 : 5);
  const ground = isJshisGround
    ? (GROUND_LEVELS.find((g) => g.level === groundData.groundLevel) ?? GROUND_LEVELS[2])
    : getGroundByIndex(region.groundIndex);
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

  const totalItems = 17;
  const prepPercent = Math.round((checklistCount / totalItems) * 100);

  const categoryProgress = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem("prepChecklist") || "{}");
      return categories.map((cat) => {
        const items = checklistItems.filter((item) => item.category === cat);
        const done = items.filter((item) => saved[item.id]).length;
        return { cat, done, total: items.length };
      });
    } catch {
      return categories.map((cat) => {
        const items = checklistItems.filter((item) => item.category === cat);
        return { cat, done: 0, total: items.length };
      });
    }
  })();

  const updateMemo = (key, value) => {
    setFamilyMemo((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem("familyMemo", JSON.stringify(next));
      return next;
    });
    setMemoSaved(true);
    if (memoTimerRef.current) clearTimeout(memoTimerRef.current);
    memoTimerRef.current = setTimeout(() => setMemoSaved(false), 2000);
  };

  const getRiskProposal = (risk) => {
    if (risk < 3)  return "長期地震リスクは比較的低めです。ただし、地震が起きないという意味ではありません。基本の備えを整えておきましょう。";
    if (risk < 10) return "長期地震リスクはやや意識しておきたい水準です。家具固定・飲料水・非常食・停電対策を確認しましょう。";
    if (risk < 26) return "長期地震リスクは中程度です。家庭内の安全対策と避難場所の確認を優先しましょう。";
    return "長期地震リスクは相対的に高めです。家具固定、家族の集合場所、停電対策、非常用品の見直しを早めに行いましょう。";
  };

  const getGroundProposal = (level) => {
    if (level >= 4) return "地盤によって揺れが大きくなりやすい可能性があります。寝室やリビングの家具固定を優先しましょう。";
    if (level === 3) return "標準的な揺れやすさですが、家具固定や避難経路の確認は必要です。";
    return null;
  };

  const getPrepProposal = (percent) => {
    if (percent <= 30) return "まずは飲料水・非常食・モバイルバッテリーの3つから始めましょう。";
    if (percent <= 70) return "基本の備えは進んでいます。家具固定や家族の連絡手段も確認しましょう。";
    return "備えはかなり進んでいます。定期的に期限切れや電池残量を確認しましょう。";
  };

  const riskProposal   = getRiskProposal(displayRisk30);
  const groundProposal = getGroundProposal(currentGroundLevel);
  const prepProposal   = getPrepProposal(prepPercent);

  const getFirstThings = () => {
    const items = [];
    if (prepPercent <= 30) {
      items.push({ icon: "💧", text: "飲料水・非常食・モバイルバッテリーの3つを今すぐ準備しましょう。" });
    } else if (prepPercent <= 70) {
      items.push({ icon: "🎒", text: "基本の備えが進んでいます。家族の連絡手段と集合場所を確認しましょう。" });
    } else {
      items.push({ icon: "✅", text: "備えはよく進んでいます。食料・電池の期限を定期的に確認しましょう。" });
    }
    if (currentGroundLevel >= 4) {
      items.push({ icon: "🪑", text: "揺れやすい地盤です。寝室・リビングの家具固定を優先しましょう。" });
    } else {
      items.push({ icon: "🪑", text: "家具の固定と避難場所の確認を行っておきましょう。" });
    }
    if (displayRisk30 >= 26) {
      items.push({ icon: "🏫", text: "長期地震リスクが高めです。避難場所・避難経路を家族で確認してください。" });
    } else {
      items.push({ icon: "📞", text: "災害用伝言ダイヤル（171）の使い方を家族で確認しておきましょう。" });
    }
    return items;
  };

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

        {geoCoords !== null && inputMode === "geo" && (
          <p className="geo-coords-note">
            取得位置：緯度 {geoCoords.lat.toFixed(3)} / 経度 {geoCoords.lng.toFixed(3)}
          </p>
        )}

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
              現在地から地域名を表示するために位置情報を利用します。地域名変換のため、位置情報はOpenStreetMap（Nominatim）へ送信されます。取得した情報は端末内での地域リスク表示にのみ使用し、個人を特定する目的では使用しません。
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

      {/* 防災サマリー */}
      <section className="card summary-card">
        <div className="card-header">
          <span className="card-icon">🛡️</span>
          <h2 className="card-title">防災サマリー</h2>
        </div>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">選択地域</span>
            <span className="summary-value">{regionLabel}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">震度6弱以上 30年</span>
            <span className="summary-value" style={{ color: riskLoading ? undefined : riskColor }}>
              {riskLoading ? "取得中…" : `${displayRisk30}%`}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">リスク判定</span>
            <span className="summary-value" style={{ color: riskLoading ? undefined : riskColor }}>
              {riskLoading ? "—" : getRiskLabel(displayRisk30)}
            </span>
          </div>
          {!riskLoading && getRiskLabel(displayRisk30) === "比較的低い" && (
            <div className="summary-item summary-item--note">
              <span className="risk-low-note">※ 比較的低い＝地震が起きないという意味ではありません</span>
            </div>
          )}
          <div className="summary-item">
            <span className="summary-label">データ</span>
            <span className="summary-value">
              {riskLoading ? "—" : isJshis ? (
                <span className="datasource-badge datasource-badge--jshis">✓ J-SHIS</span>
              ) : (
                <span className="datasource-badge datasource-badge--demo">サンプル</span>
              )}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">揺れやすさ</span>
            <span className="summary-value" style={{ color: ground.color }}>
              {ground.icon} {ground.label}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">備え進捗</span>
            <span
              className="summary-value"
              style={{ color: prepPercent >= 70 ? "#27ae60" : prepPercent >= 40 ? "#f39c12" : "#e67e22" }}
            >
              {checklistCount}/{totalItems}項目
            </span>
          </div>
        </div>
      </section>

      {/* まずやること */}
      <section className="card firstthings-card">
        <div className="card-header">
          <span className="card-icon">✅</span>
          <h2 className="card-title">まずやること</h2>
        </div>
        <div className="firstthings-list">
          {getFirstThings().map(({ icon, text }, i) => (
            <div key={i} className="firstthing-item">
              <span className="firstthing-num">{i + 1}</span>
              <span className="firstthing-icon">{icon}</span>
              <span className="firstthing-text">{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 長期地震リスク */}
      <section className="card risk-card">
        <div className="card-header">
          <span className="card-icon">📊</span>
          <h2 className="card-title">長期地震リスク</h2>
        </div>
        <p className="risk-subtitle">
          {isJshis
            ? "今後30年以内に震度6弱以上の揺れに見舞われる確率"
            : "地域の長期地震リスク指標（30年スケール参考値）"}
        </p>
        {!isJshis && !riskLoading && inputMode !== "initial" && (
          <p className="risk-demo-note">⚠ 現在はデモ用サンプル値です</p>
        )}
        <div className="risk-datasource">
          データ種別：
          {riskLoading ? (
            <span className="datasource-badge">取得中…</span>
          ) : isJshis ? (
            <span className="datasource-badge datasource-badge--jshis">✓ J-SHIS</span>
          ) : (
            <span className="datasource-badge datasource-badge--demo">デモ用サンプル</span>
          )}
        </div>
        {inputMode === "geo" && riskData?.source === "demo" && !riskLoading && (
          <>
            <p className="risk-api-fail-note">
              J-SHISデータの取得に失敗したため、サンプル値を表示しています。
            </p>
            {riskData?.failReason && (
              <div className="risk-api-fail-debug">
                <p className="risk-api-fail-reason">取得失敗理由：{riskData.failReason}</p>
                {riskData?.failDebug?.requestUrl && (
                  <p className="risk-api-fail-reason">リクエストURL：{riskData.failDebug.requestUrl}</p>
                )}
                {riskData?.failDebug?.responseText && (
                  <p className="risk-api-fail-reason">J-SHISエラー本文：{riskData.failDebug.responseText}</p>
                )}
              </div>
            )}
          </>
        )}
        {inputMode === "text" && !riskLoading && (
          <p className="risk-text-input-note">
            市区町村名入力時は参考サンプル値を表示しています。現在地取得時はJ-SHIS公的データを使用します。
          </p>
        )}
        <div className="risk-display">
          <div
            className="risk-circle"
            style={{ borderColor: riskColor, color: riskColor }}
          >
            <span className="risk-percent">{displayRisk30}</span>
            <span className="risk-unit">%</span>
          </div>
          <div className="risk-info">
            <div className="risk-level-label">リスク判定</div>
            <div className="risk-level" style={{ color: riskColor }}>
              {getRiskLabel(displayRisk30)}
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
              参考：
              <a
                href="https://www.j-shis.bosai.go.jp/"
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
              >
                J-SHIS 地震ハザードステーション
              </a>
              等の公的情報（現在はサンプル値）
            </>
          )}
        </p>
        {isJshis && riskData.intensities && (
          <div className="risk-intensities">
            <p className="risk-intensities-title">長期地震リスク詳細（J-SHIS公的データ）</p>
            <div className="risk-intensities-grid">
              {[
                { label: "震度6弱以上（30年）", val: riskData.intensities.i55 },
              ].filter(({ val }) => val != null).map(({ label, val }) => (
                <div key={label} className="risk-intensity-item">
                  <span className="risk-intensity-label">{label}</span>
                  <span className="risk-intensity-value">{val}%</span>
                </div>
              ))}
            </div>
            {riskData.meshCode && (
              <p className="risk-mesh-note">メッシュコード：{riskData.meshCode}</p>
            )}
          </div>
        )}
      </section>

      {/* あなたへの備え提案 */}
      <section className="card proposal-card">
        <div className="card-header">
          <span className="card-icon">💡</span>
          <h2 className="card-title">あなたへの備え提案</h2>
        </div>
        <div className="proposal-items">
          <div className="proposal-item">
            <span className="proposal-icon">📊</span>
            <p className="proposal-text">{riskProposal}</p>
          </div>
          {groundProposal && (
            <div className="proposal-item">
              <span className="proposal-icon">🌍</span>
              <p className="proposal-text">{groundProposal}</p>
            </div>
          )}
          <div className="proposal-item">
            <span className="proposal-icon">🎒</span>
            <p className="proposal-text">{prepProposal}</p>
          </div>
        </div>
        <Link to="/prep-check" className="btn btn-primary proposal-btn">
          備えチェックリストを確認する →
        </Link>
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
        <div className="prep-category-progress">
          {categoryProgress.map(({ cat, done, total }) => (
            <div key={cat} className="prep-cat-item">
              <span className="prep-cat-name">{cat}</span>
              <span
                className="prep-cat-count"
                style={{ color: done === total ? "#27ae60" : done > 0 ? "#f39c12" : undefined }}
              >
                {done}/{total}
              </span>
            </div>
          ))}
        </div>
        <Link to="/prep-check" className="btn btn-primary">
          備えチェックリストを確認する →
        </Link>
      </section>

      {/* 揺れやすさ */}
      <section className="card ground-card">
        <div className="card-header">
          <span className="card-icon">🌍</span>
          <h2 className="card-title">揺れやすさ</h2>
        </div>
        <div className="ground-datasource">
          データ種別：
          {isJshisGround ? (
            <span className="datasource-badge datasource-badge--jshis">✓ J-SHIS表層地盤データ</span>
          ) : (
            <span className="datasource-badge datasource-badge--demo">デモ用参考値</span>
          )}
        </div>
        {!isJshisGround && (
          <p className="risk-demo-note">⚠ 揺れやすさはデモ用参考値です</p>
        )}
        <div className="ground-display">
          <span className="ground-icon-large">{ground.icon}</span>
          <div>
            <div className="ground-label" style={{ color: ground.color }}>
              {ground.label}
            </div>
            {isJshisGround && groundData?.jname ? (
              <div className="ground-type">微地形：{groundData.jname}</div>
            ) : (
              <div className="ground-type">{region.groundType}</div>
            )}
          </div>
        </div>
        {isJshisGround && groundData?.arv != null && (
          <p className="ground-arv-note">
            地盤増幅率：ARV {groundData.arv.toFixed(2)}
          </p>
        )}
        <p className="ground-level-desc">{ground.desc}</p>
        <p className="ground-desc">
          「揺れやすさ」は、同じ地震の揺れが来たときに、地盤によってどれくらい揺れが大きくなりやすいかの目安です。地盤が柔らかい地域ほど、揺れが増幅されやすくなります。
        </p>
        <button
          className="ground-scale-toggle"
          onClick={() => setShowGroundScale((v) => !v)}
          aria-expanded={showGroundScale}
        >
          {showGroundScale ? "▲ 目安を閉じる" : "▼ 5段階の目安を見る"}
        </button>
        {showGroundScale && (
          <div className="ground-scale">
            {GROUND_LEVELS.map(({ level, icon, label, shortDesc }) => (
              <div
                key={level}
                className={`ground-scale-item${currentGroundLevel === level ? " ground-scale-item--current" : ""}`}
              >
                <span className="ground-scale-icon">{icon}</span>
                <span className="ground-scale-label">{label}</span>
                <span className="ground-scale-desc">{shortDesc}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 近くの避難先候補 */}
      <section className="card shelter-card">
        <div className="card-header">
          <span className="card-icon">🏫</span>
          <h2 className="card-title">近くの避難先候補</h2>
        </div>

        {!hasGeo ? (
          <>
            <p className="shelter-no-geo">
              「現在地から調べる」を実行すると、近くの避難先候補を表示できます。
            </p>
            <a
              href="https://disaportal.gsi.go.jp/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              ハザードマップポータルで確認 →
            </a>
          </>
        ) : shelterLoading ? (
          <p className="shelter-loading">📡 避難所データを取得中…</p>
        ) : shelterData?.status === "success" && shelterData.items.length > 0 ? (
          <>
            <p className="shelter-disclaimer">
              ⚠ 表示される避難先は参考情報です。災害種別・開設状況によって利用できない場合があります。実際の避難判断は自治体・ハザードマップ等の公式情報をご確認ください。
            </p>
            <div className="shelter-list">
              {shelterData.items.map((item, i) => (
                <div key={i} className="shelter-item">
                  <div className="shelter-item-header">
                    <span className="shelter-item-name">{item.name}</span>
                    <span className="shelter-item-distance">約{item.distanceKm}km</span>
                  </div>
                  <div className="shelter-item-type">{item.type}</div>
                  {item.address && (
                    <div className="shelter-item-address">📍 {item.address}</div>
                  )}
                  {item.disasterTypes.length > 0 && (
                    <div className="shelter-disaster-tags">
                      {item.disasterTypes.map((t) => (
                        <span
                          key={t}
                          className={`shelter-disaster-tag${t === "地震" ? " shelter-disaster-tag--eq" : ""}`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${item.lat}&mlon=${item.lon}&zoom=16`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shelter-map-link"
                  >
                    地図で確認 →
                  </a>
                </div>
              ))}
            </div>
            <p className="shelter-source">
              出典：
              <a
                href="https://www.gsi.go.jp/bousai/hinanbasho.html"
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
              >
                国土地理院 指定緊急避難場所・指定避難所データ
              </a>
            </p>
            <a
              href="https://disaportal.gsi.go.jp/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline shelter-portal-btn"
            >
              ハザードマップポータルで詳しく確認 →
            </a>
          </>
        ) : (
          <>
            <p className="shelter-error">
              近くの避難先候補を取得できませんでした。自治体のハザードマップや国土地理院の情報をご確認ください。
            </p>
            <div className="shelter-fallback-links">
              <a
                href="https://disaportal.gsi.go.jp/"
                target="_blank"
                rel="noopener noreferrer"
                className="external-link-btn"
              >
                🗺️ 国土交通省 ハザードマップポータル
              </a>
              <a
                href="https://www.gsi.go.jp/bousai/hinanbasho.html"
                target="_blank"
                rel="noopener noreferrer"
                className="external-link-btn"
              >
                🗾 国土地理院 指定緊急避難場所データ
              </a>
            </div>
          </>
        )}
      </section>

      {/* キャンプ用品の防災転用 */}
      <section className="card camp-card">
        <div className="card-header">
          <span className="card-icon">⛺</span>
          <h2 className="card-title">キャンプ用品は防災にも使えます</h2>
        </div>
        <button
          className="ground-scale-toggle"
          onClick={() => setShowCampDetail((v) => !v)}
          aria-expanded={showCampDetail}
        >
          {showCampDetail ? "▲ 閉じる" : "▼ 詳しく見る"}
        </button>
        {showCampDetail && (
          <>
            <p className="camp-desc">
              ランタン・寝袋・ウォータータンク・カセットコンロ・ポータブル電源などは、停電や避難時にも役立ちます。普段使っている道具を、防災目線でも確認しておきましょう。
            </p>
            <div className="camp-items">
              {[
                { icon: "🏮", label: "LEDランタン" },
                { icon: "🛌", label: "寝袋" },
                { icon: "🍳", label: "カセットコンロ" },
                { icon: "🪣", label: "ウォータータンク" },
                { icon: "⚡", label: "ポータブル電源" },
              ].map(({ icon, label }) => (
                <div key={label} className="camp-item">
                  <span className="camp-item-icon">{icon}</span>
                  <span className="camp-item-label">{label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* 家族の防災メモ */}
      <section className="card memo-card">
        <div className="card-header">
          <span className="card-icon">📝</span>
          <h2 className="card-title">家族の防災メモ</h2>
        </div>
        <p className="memo-privacy-note">
          🔒 この端末に自動保存されます
        </p>
        {!showMemo ? (
          <button
            className="ground-scale-toggle memo-expand-btn"
            onClick={() => setShowMemo(true)}
          >
            ▼ 入力する
          </button>
        ) : (
          <>
            <p className="memo-privacy-sub">
              共有端末では個人情報を書きすぎないようご注意ください。
            </p>
            {[
              { key: "meetingPlace",      label: "家族の集合場所",            placeholder: "例：○○公園・○○小学校" },
              { key: "emergencyContact",  label: "緊急連絡先メモ",            placeholder: "例：母 090-XXXX-XXXX" },
              { key: "parentsEvacuation", label: "実家・親の避難場所",         placeholder: "例：△△市△△小学校" },
              { key: "specialNotes",      label: "ペット・薬・持病などのメモ", placeholder: "例：犬あり / 血圧の薬" },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="memo-field">
                <label className="memo-label">{label}</label>
                <textarea
                  className="memo-input"
                  rows={2}
                  placeholder={placeholder}
                  value={familyMemo[key] ?? ""}
                  onChange={(e) => updateMemo(key, e.target.value)}
                />
              </div>
            ))}
            {memoSaved && (
              <p className="memo-saved-note">✓ 保存しました</p>
            )}
            <button
              className="ground-scale-toggle memo-collapse-btn"
              onClick={() => setShowMemo(false)}
            >
              ▲ 閉じる
            </button>
          </>
        )}
      </section>

      {/* 公式情報リンク */}
      <section className="card link-card">
        <div className="card-header">
          <span className="card-icon">🔗</span>
          <h2 className="card-title">公式情報リンク</h2>
        </div>
        <button
          className="ground-scale-toggle"
          onClick={() => setShowLinks((v) => !v)}
          aria-expanded={showLinks}
        >
          {showLinks ? "▲ 閉じる" : "▼ 公式サイトを見る"}
        </button>
        {showLinks && (
          <div className="external-links">
            {[
              { icon: "🗾", label: "J-SHIS 地震ハザードステーション",  url: "https://www.j-shis.bosai.go.jp/" },
              { icon: "🌤️", label: "気象庁 地震情報",                  url: "https://www.jma.go.jp/jma/index.html" },
              { icon: "🗺️", label: "ハザードマップポータルサイト",      url: "https://disaportal.gsi.go.jp/" },
              { icon: "🏛️", label: "内閣府 防災情報のページ",           url: "https://www.bousai.go.jp/" },
            ].map(({ icon, label, url }) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="external-link-btn">
                {icon} {label}
              </a>
            ))}
          </div>
        )}
      </section>

      {/* フッター免責 */}
      <footer className="home-footer">
        <p className="footer-main-note">
          🛡️ <strong>地震そなえナビ</strong>は地震予知・地震予報を行うものではありません。
        </p>
        <button
          className="ground-scale-toggle footer-detail-toggle"
          onClick={() => setShowFooterDetail((v) => !v)}
          aria-expanded={showFooterDetail}
        >
          {showFooterDetail ? "▲ 詳細免責事項を閉じる" : "▼ 詳細免責事項を見る"}
        </button>
        {showFooterDetail && (
          <div className="footer-disclaimer">
            <p>
              現在地取得時の長期地震リスクは、J-SHIS等の公的情報を参考に表示しています。一部の表示や避難所情報はデモ用サンプルを含みます。
            </p>
            <p>
              実際の防災判断は、自治体・気象庁・J-SHIS等の公式情報をご確認ください。
            </p>
            <p>個人情報は収集していません。データは端末内（localStorage）にのみ保存されます。</p>
          </div>
        )}
        <p className="footer-copy">© 2025 地震そなえナビ</p>
      </footer>
    </div>
  );
}
