import { useState, useEffect } from "react";

// 全場所共通：まず最初にやること（3項目に絞る）
const TOP_ACTIONS = [
  "頭を守る",
  "家具・ガラスから離れる",
  "揺れが収まるまで外へ出ない",
];

const TABS = [
  { key: "home",     label: "自宅",         icon: "🏠" },
  { key: "outdoor",  label: "屋外",         icon: "🌳" },
  { key: "car",      label: "車の中",       icon: "🚗" },
  { key: "elevator", label: "エレベーター", icon: "🔳" },
];

// 場所別 3〜4項目（短く・横書きで読めるように）
const TAB_ACTIONS = {
  home: [
    { icon: "🙋", text: "頭を守る" },
    { icon: "🪑", text: "倒れそうな家具・ガラスから離れる" },
    { icon: "🔥", text: "火を無理に消そうとしない" },
    { icon: "🚪", text: "揺れが収まるまで外へ飛び出さない" },
  ],
  outdoor: [
    { icon: "🙋", text: "頭を守る（かばん・手で）" },
    { icon: "🏢", text: "ビル・塀・自販機から離れる" },
    { icon: "🌄", text: "広い場所へ移動する" },
    { icon: "⛰️", text: "崖・川沿いに近づかない" },
  ],
  car: [
    { icon: "🚗", text: "ハザードをつけ左側に停車" },
    { icon: "🌊", text: "海岸・高架付近から離れる" },
    { icon: "🔑", text: "避難時は鍵を抜かない" },
    { icon: "📻", text: "ラジオ等で情報収集する" },
  ],
  elevator: [
    { icon: "🔢", text: "全ての階のボタンを押す" },
    { icon: "🆘", text: "扉が開かない場合は非常ボタン" },
    { icon: "🚫", text: "扉をこじ開けない" },
    { icon: "⏳", text: "落ち着いて救助を待つ" },
  ],
};

// 揺れが収まったら（スクロール後に表示）
const AFTER_ACTIONS = [
  {
    icon: "📞",
    text: "171（災害用伝言ダイヤル）で家族の安否確認",
    sub: "1で録音・2で再生",
  },
  {
    icon: "🚶",
    text: "出口・避難経路を確認する",
    sub: "扉が歪む前に逃げ道を確保する",
  },
  {
    icon: "🏫",
    text: "必要に応じて避難場所へ移動",
    sub: "自治体・ハザードマップで場所を確認",
  },
  {
    icon: "📱",
    text: "SNS・メッセージで状況を共有",
    sub: "音声電話は繋がりにくい場合がある",
  },
];

export default function EmergencyMode({ onClose }) {
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="emg-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="緊急時の行動確認"
    >
      {/* スティッキーヘッダー：常にタップできる */}
      <div className="emg-header">
        <div className="emg-header-left">
          <span className="emg-header-icon" aria-hidden="true">⚠️</span>
          <div className="emg-header-text">
            <h2 className="emg-title">揺れている間の行動</h2>
            <p className="emg-subtitle">落ち着いて、まず身の安全を守ってください</p>
          </div>
        </div>
        <button
          className="emg-close-btn"
          onClick={onClose}
          aria-label="緊急時モードを閉じる"
        >
          ✕ 閉じる
        </button>
      </div>

      {/* スクロール可能な本体 */}
      <div className="emg-body">

        {/* ① 今すぐやること */}
        <p className="emg-section-label">今すぐやること</p>
        <div className="emg-top-list">
          {TOP_ACTIONS.map((text, i) => (
            <div key={i} className="emg-top-item">
              <span className="emg-top-num" aria-hidden="true">{i + 1}</span>
              <span className="emg-top-text">{text}</span>
            </div>
          ))}
        </div>

        {/* ② 場所別タブ */}
        <p className="emg-section-label">今いる場所は？</p>
        <div className="emg-tabs" role="tablist">
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              role="tab"
              aria-selected={activeTab === key}
              className={`emg-tab${activeTab === key ? " emg-tab--active" : ""}`}
              onClick={() => setActiveTab(key)}
            >
              <span aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="emg-loc-list" role="tabpanel">
          {TAB_ACTIONS[activeTab].map(({ icon, text }, i) => (
            <div key={i} className="emg-loc-item">
              <span className="emg-loc-num" aria-hidden="true">{i + 1}</span>
              <span className="emg-loc-icon" aria-hidden="true">{icon}</span>
              <span className="emg-loc-text">{text}</span>
            </div>
          ))}
        </div>

        {/* ③ 揺れが収まったら（スクロールして確認） */}
        <p className="emg-section-label emg-section-label--after">揺れが収まったら</p>
        <div className="emg-after-list">
          {AFTER_ACTIONS.map(({ icon, text, sub }, i) => (
            <div key={i} className="emg-after-item">
              <span className="emg-after-icon" aria-hidden="true">{icon}</span>
              <div className="emg-after-texts">
                <p className="emg-after-text">{text}</p>
                <p className="emg-after-sub">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="emg-disclaimer">
          この画面は地震予知・地震速報ではありません。揺れた時の行動確認のための画面です。
        </p>
      </div>
    </div>
  );
}
