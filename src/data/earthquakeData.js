// サンプルデータ: 実際のアプリでは J-SHIS API 等から取得
export const regionRiskData = {
  tokyo: {
    name: "東京都（23区中心部）",
    risk30year: 85,
    groundType: "軟弱地盤",
    groundIndex: 2, // 1:硬, 2:中, 3:軟弱
    nearestShelter: "新宿区立新宿小学校（約350m）",
  },
  osaka: {
    name: "大阪市（中心部）",
    risk30year: 60,
    groundType: "中程度",
    groundIndex: 2,
    nearestShelter: "大阪市立南小学校（約420m）",
  },
  nagoya: {
    name: "名古屋市（中心部）",
    risk30year: 46,
    groundType: "中程度",
    groundIndex: 2,
    nearestShelter: "名古屋市立栄小学校（約510m）",
  },
  sapporo: {
    name: "札幌市（中心部）",
    risk30year: 3,
    groundType: "比較的硬い",
    groundIndex: 1,
    nearestShelter: "札幌市立中央小学校（約280m）",
  },
  fukuoka: {
    name: "福岡市（中心部）",
    risk30year: 8,
    groundType: "比較的硬い",
    groundIndex: 1,
    nearestShelter: "福岡市立博多小学校（約390m）",
  },
  hiroshima: {
    name: "広島市（中心部）",
    risk30year: 10,
    groundType: "中程度",
    groundIndex: 2,
    nearestShelter: "広島市立本川小学校（約450m）",
  },
  sendai: {
    name: "仙台市（中心部）",
    risk30year: 14,
    groundType: "中程度",
    groundIndex: 2,
    nearestShelter: "仙台市立片平丁小学校（約320m）",
  },
  shizuoka: {
    name: "静岡市（中心部）",
    risk30year: 70,
    groundType: "軟弱地盤",
    groundIndex: 3,
    nearestShelter: "静岡市立安東小学校（約400m）",
  },
};

export const recentEarthquakes = [
  {
    id: 1,
    date: "2024年1月1日 16:10",
    epicenter: "石川県能登地方",
    magnitude: 7.6,
    maxIntensity: "7",
    depth: 16,
  },
  {
    id: 2,
    date: "2024年4月17日 23:14",
    epicenter: "愛媛県南予",
    magnitude: 6.6,
    maxIntensity: "6弱",
    depth: 39,
  },
  {
    id: 3,
    date: "2024年8月8日 16:43",
    epicenter: "日向灘",
    magnitude: 7.1,
    maxIntensity: "6弱",
    depth: 31,
  },
  {
    id: 4,
    date: "2024年11月26日 18:04",
    epicenter: "茨城県南部",
    magnitude: 5.0,
    maxIntensity: "4",
    depth: 50,
  },
  {
    id: 5,
    date: "2025年1月13日 08:09",
    epicenter: "石川県能登地方",
    magnitude: 4.9,
    maxIntensity: "4",
    depth: 10,
  },
];

// 地図表示用サンプルエリア（相対座標）
export const mapZones = [
  { id: 1, label: "A地区", x: 20, y: 15, risk: "high", color: "#e67e22" },
  { id: 2, label: "B地区", x: 45, y: 25, risk: "medium", color: "#f39c12" },
  { id: 3, label: "C地区", x: 70, y: 20, risk: "low", color: "#27ae60" },
  { id: 4, label: "D地区", x: 30, y: 55, risk: "medium", color: "#f39c12" },
  { id: 5, label: "E地区", x: 60, y: 60, risk: "high", color: "#e67e22" },
  { id: 6, label: "F地区", x: 80, y: 70, risk: "low", color: "#27ae60" },
];
