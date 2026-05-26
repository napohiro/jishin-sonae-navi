import { useState, useEffect } from "react";
import { checklistItems, categories } from "../data/checklistItems";
import DisclaimerBanner from "../components/DisclaimerBanner";

const STORAGE_KEY = "prepChecklist";

export default function PrepCheck() {
  const [checked, setChecked] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  });

  const [activeCategory, setActiveCategory] = useState("すべて");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  }, [checked]);

  const toggle = (id) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const total = checklistItems.length;
  const percent = Math.round((checkedCount / total) * 100);

  const getProgressColor = (p) => {
    if (p >= 70) return "#27ae60";
    if (p >= 40) return "#f39c12";
    return "#e67e22";
  };

  const getProgressMessage = (p) => {
    if (p === 100) return "🎉 完璧な備えです！定期的に見直しましょう。";
    if (p >= 70) return "👍 よく備えられています。残りも確認しましょう。";
    if (p >= 40) return "⚠️ まだ備えが必要な項目があります。";
    return "🔴 備えが不十分です。できることから始めましょう。";
  };

  const displayItems =
    activeCategory === "すべて"
      ? checklistItems
      : checklistItems.filter((item) => item.category === activeCategory);

  const progressColor = getProgressColor(percent);

  return (
    <div className="page">
      <DisclaimerBanner />

      <div className="page-hero">
        <h2 className="page-hero-title">✅ 備えチェックリスト</h2>
        <p className="page-hero-desc">
          地震に備えて、日頃から準備しておきたい項目を確認しましょう。
        </p>
      </div>

      {/* 進捗サマリー */}
      <section className="card progress-summary-card">
        <div className="progress-summary-header">
          <div className="progress-summary-circle" style={{ borderColor: progressColor }}>
            <span className="progress-summary-percent" style={{ color: progressColor }}>
              {percent}
            </span>
            <span className="progress-summary-unit" style={{ color: progressColor }}>%</span>
          </div>
          <div className="progress-summary-info">
            <div className="progress-summary-title">準備度</div>
            <div className="progress-summary-count">
              {checkedCount} / {total} 項目完了
            </div>
            <div className="progress-summary-message" style={{ color: progressColor }}>
              {getProgressMessage(percent)}
            </div>
          </div>
        </div>
        <div className="progress-bar-bg">
          <div
            className="progress-bar"
            style={{ width: `${percent}%`, backgroundColor: progressColor }}
          />
        </div>
      </section>

      {/* カテゴリフィルター */}
      <div className="category-filter">
        {["すべて", ...categories].map((cat) => (
          <button
            key={cat}
            className={`category-btn ${activeCategory === cat ? "category-btn--active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* チェックリスト */}
      <section className="checklist">
        {categories
          .filter((cat) => activeCategory === "すべて" || activeCategory === cat)
          .map((cat) => {
            const items = checklistItems.filter((item) => item.category === cat);
            const catChecked = items.filter((item) => checked[item.id]).length;

            return (
              <div key={cat} className="checklist-category">
                <div className="checklist-category-header">
                  <h3 className="checklist-category-title">{cat}</h3>
                  <span className="checklist-category-count">
                    {catChecked}/{items.length}
                  </span>
                </div>
                <div className="checklist-items">
                  {items.map((item) => (
                    <label
                      key={item.id}
                      className={`checklist-item ${checked[item.id] ? "checklist-item--checked" : ""}`}
                    >
                      <div className="checklist-checkbox-wrap">
                        <input
                          type="checkbox"
                          className="checklist-checkbox-input"
                          checked={!!checked[item.id]}
                          onChange={() => toggle(item.id)}
                        />
                        <div className={`checklist-checkbox ${checked[item.id] ? "checklist-checkbox--checked" : ""}`}>
                          {checked[item.id] && <span className="checklist-checkmark">✓</span>}
                        </div>
                      </div>
                      <span className="checklist-item-icon">{item.icon}</span>
                      <div className="checklist-item-content">
                        <div className={`checklist-item-label ${checked[item.id] ? "checklist-item-label--checked" : ""}`}>
                          {item.label}
                        </div>
                        <div className="checklist-item-desc">{item.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
      </section>

      {/* リセットボタン */}
      <div className="checklist-reset-wrap">
        <button
          className="btn btn-outline btn-danger"
          onClick={() => {
            if (window.confirm("チェックをすべてリセットしますか？")) {
              setChecked({});
            }
          }}
        >
          チェックをリセット
        </button>
      </div>

      <div className="prep-tips">
        <h3 className="prep-tips-title">💡 備えのコツ</h3>
        <ul className="prep-tips-list">
          <li>非常用持ち出し袋は、玄関近くの取り出しやすい場所に置きましょう。</li>
          <li>食料・水は「ローリングストック法」で日常的に使いながら補充するのが効果的です。</li>
          <li>家族全員で避難経路と集合場所を確認しておきましょう。</li>
          <li>災害用伝言ダイヤル（171）の使い方を事前に練習しておきましょう。</li>
        </ul>
      </div>
    </div>
  );
}
