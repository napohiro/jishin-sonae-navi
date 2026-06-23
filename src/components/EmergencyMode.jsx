import { useState, useEffect } from "react";

const LOCATIONS = [
  { key: "home",     label: "自宅",         icon: "🏠" },
  { key: "outdoor",  label: "屋外",         icon: "🌳" },
  { key: "car",      label: "車の中",       icon: "🚗" },
  { key: "elevator", label: "エレベーター", icon: "🔳" },
];

const ACTIONS = {
  home: [
    {
      icon: "🙋",
      text: "頭を守る",
      sub: "クッション・バッグ・座布団などで頭部を保護する",
    },
    {
      icon: "🪑",
      text: "家具・ガラスから離れる",
      sub: "倒れそうな棚・テレビ・ガラス扉から距離を取る",
    },
    {
      icon: "🚪",
      text: "揺れている間は外に出ない",
      sub: "慌てて飛び出すとガラスや看板の落下で危険",
    },
    {
      icon: "🔥",
      text: "火を無理に消さない",
      sub: "強い揺れの最中は火元に近づかない。揺れが収まってから対処する",
    },
    {
      icon: "🚶",
      text: "揺れが収まったら出口を確認",
      sub: "扉が歪む前に出口・避難経路を確保する",
    },
    {
      icon: "📞",
      text: "安否確認は171・メッセージで",
      sub: "災害用伝言ダイヤル171またはSMS・SNSを活用する",
    },
  ],
  outdoor: [
    {
      icon: "🙋",
      text: "頭を守る",
      sub: "かばんや手で頭部を保護する",
    },
    {
      icon: "🏢",
      text: "建物・塀から離れる",
      sub: "ビル外壁・ブロック塀・自動販売機の転倒に注意",
    },
    {
      icon: "🌄",
      text: "広い場所へ移動する",
      sub: "落下物に注意しながら公園・広場など開けた場所へ",
    },
    {
      icon: "⛰️",
      text: "崖・川沿いに近づかない",
      sub: "土砂崩れや液状化の危険がある場所から離れる",
    },
    {
      icon: "🚶",
      text: "揺れが収まってから移動する",
      sub: "状況を確認してから次の行動を決める",
    },
    {
      icon: "📞",
      text: "安否確認は171・メッセージで",
      sub: "災害用伝言ダイヤル171またはSMS・SNSを活用する",
    },
  ],
  car: [
    {
      icon: "🚗",
      text: "ハザードをつけ左側に停車",
      sub: "徐々に減速してエンジンを切る。キーは差したまま",
    },
    {
      icon: "📻",
      text: "ラジオ・カーナビで情報収集",
      sub: "揺れが収まったらラジオ等で被害状況を確認する",
    },
    {
      icon: "🌊",
      text: "高架・海岸付近からは離れる",
      sub: "津波の恐れがある場合は車を置いて高台へ避難",
    },
    {
      icon: "🔑",
      text: "避難時は鍵を抜かない",
      sub: "緊急車両の通行確保のためキーはつけたまま車を置く",
    },
    {
      icon: "🚶",
      text: "揺れが収まったら状況確認",
      sub: "道路のひび割れ・陥没に注意して移動する",
    },
    {
      icon: "📞",
      text: "安否確認は171・メッセージで",
      sub: "災害用伝言ダイヤル171またはSMS・SNSを活用する",
    },
  ],
  elevator: [
    {
      icon: "🔢",
      text: "全ての階のボタンを押す",
      sub: "最初に停止した階で降りる",
    },
    {
      icon: "🆘",
      text: "扉が開かない場合は非常ボタン",
      sub: "インターフォン・非常電話で管理室や救助に状況を伝える",
    },
    {
      icon: "🚫",
      text: "扉をこじ開けようとしない",
      sub: "落下・挟まれの危険がある",
    },
    {
      icon: "⏳",
      text: "落ち着いて救助を待つ",
      sub: "空気は確保されているので慌てない",
    },
    {
      icon: "💡",
      text: "低い姿勢で壁や手すりにつかまる",
      sub: "停電しても非常灯がある。揺れが収まるまで待機する",
    },
    {
      icon: "📞",
      text: "救助後に家族へ連絡",
      sub: "171やSMS・SNSで安否を伝える",
    },
  ],
};

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

  const actions = ACTIONS[activeTab];

  return (
    <div
      className="emergency-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="緊急時の行動確認"
    >
      {/* ヘッダー */}
      <div className="emergency-header">
        <div className="emergency-title-row">
          <span className="emergency-header-icon">⚠️</span>
          <div>
            <h2 className="emergency-title">揺れている間の行動</h2>
            <p className="emergency-subtitle">落ち着いて確認してください</p>
          </div>
        </div>
        <button
          className="emergency-close-x"
          onClick={onClose}
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>

      {/* 場所タブ */}
      <div className="emergency-tabs" role="tablist">
        {LOCATIONS.map(({ key, label, icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeTab === key}
            className={`emergency-tab${activeTab === key ? " emergency-tab--active" : ""}`}
            onClick={() => setActiveTab(key)}
          >
            <span className="emergency-tab-icon">{icon}</span>
            <span className="emergency-tab-label">{label}</span>
          </button>
        ))}
      </div>

      {/* 行動リスト */}
      <div className="emergency-body" role="tabpanel">
        <ol className="emergency-action-list">
          {actions.map(({ icon, text, sub }, i) => (
            <li key={i} className="emergency-action-item">
              <span className="emergency-action-num">{i + 1}</span>
              <span className="emergency-action-icon">{icon}</span>
              <div className="emergency-action-texts">
                <p className="emergency-action-text">{text}</p>
                <p className="emergency-action-sub">{sub}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* フッター */}
      <div className="emergency-footer">
        <p className="emergency-disclaimer">
          これは地震予知・地震速報ではありません。揺れた時の行動確認のための画面です。
        </p>
        <button className="emergency-close-btn" onClick={onClose}>
          閉じる（画面を戻る）
        </button>
      </div>
    </div>
  );
}
