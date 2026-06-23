import { Link, useLocation } from "react-router-dom";

export default function Header() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "ホーム", icon: "🏠" },
    { path: "/risk-map", label: "リスクマップ", icon: "🗺️" },
    { path: "/prep-check", label: "備えチェック", icon: "✅" },
  ];

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-brand">
          <div>
            <h1 className="header-title">地震そなえナビ</h1>
            <p className="header-subtitle">地域のリスク確認と備え</p>
          </div>
        </div>
      </div>
      <nav className="header-nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? "nav-item--active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </header>
  );
}
