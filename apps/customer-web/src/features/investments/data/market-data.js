import {
  BadgeIndianRupee,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  LineChart,
  PiggyBank,
  ShieldCheck
} from "lucide-react";

export const indices = [
  ["NIFTY", "24,128.45", "284.60 (1.19%)"],
  ["SENSEX", "77,482.10", "1,018.45 (1.33%)"],
  ["BANKNIFTY", "58,740.25", "1,144.20 (1.99%)"],
  ["MIDCPNIFTY", "14,632.80", "82.25 (0.56%)"],
  ["FINNIFTY", "26,914.35", "132.05 (0.49%)"],
  ["NIFTY IT", "38,420.75", "312.90 (0.82%)"],
  ["NIFTY AUTO", "25,118.30", "-116.40 (0.46%)"]
];

export const amcAccounts = [
  { bankName: "HDFC Bank", accountNumber: "AMC0001002001", ifsc: "HDFC0007777", accountHolder: "Finboard Asset Management Collection", upiId: "finboardamc@hdfcbank" },
  { bankName: "ICICI Bank", accountNumber: "AMC0001002002", ifsc: "ICIC0008899", accountHolder: "SBI Bluechip AMC Collection", upiId: "sbibluechip@icici" },
  { bankName: "Axis Bank", accountNumber: "AMC0001002003", ifsc: "UTIB0004561", accountHolder: "Axis Midcap AMC Collection", upiId: "axismidcap@axis" },
  { bankName: "Kotak Mahindra Bank", accountNumber: "AMC0001002004", ifsc: "KKBK0002211", accountHolder: "Parag Parikh Fund Collection", upiId: "ppfas@kotak" },
  { bankName: "State Bank of India", accountNumber: "AMC0001002005", ifsc: "SBIN0007771", accountHolder: "Nippon Large Cap Collection", upiId: "nipponmf@sbi" }
];

const stockSeeds = [
  ["Reliance Industries", "RELI", 2918.45, "Energy", "up"],
  ["Tata Consultancy Services", "TCS", 3894.2, "IT", "up"],
  ["Infosys", "INFY", 1514.8, "IT", "down"],
  ["HDFC Bank", "HDFB", 1682.35, "Banking", "up"],
  ["ICICI Bank", "ICIC", 1168.95, "Banking", "up"],
  ["ITC", "ITC", 436.25, "FMCG", "down"],
  ["Bharti Airtel", "AIRT", 1438.75, "Telecom", "up"],
  ["Larsen & Toubro", "LT", 3562.4, "Infrastructure", "up"],
  ["State Bank of India", "SBI", 842.9, "Banking", "down"],
  ["Tata Motors", "TAMO", 972.15, "Auto", "up"],
  ["Sun Pharma", "SUNP", 1568.7, "Pharma", "up"],
  ["Asian Paints", "ASPN", 2892.3, "Consumer", "down"],
  ["Mahindra & Mahindra", "MNM", 2844.9, "Auto", "up"],
  ["Maruti Suzuki", "MARS", 12482.1, "Auto", "down"],
  ["Hindustan Unilever", "HUL", 2478.65, "FMCG", "up"],
  ["Axis Bank", "AXIS", 1244.55, "Banking", "up"],
  ["Kotak Mahindra Bank", "KOTK", 1795.3, "Banking", "down"],
  ["Bajaj Finance", "BAJF", 7194.25, "Financials", "up"],
  ["HCL Technologies", "HCLT", 1468.2, "IT", "up"],
  ["Wipro", "WIPR", 518.45, "IT", "down"],
  ["Titan Company", "TITN", 3518.8, "Retail", "up"],
  ["UltraTech Cement", "ULTC", 10942.5, "Cement", "down"],
  ["NTPC", "NTPC", 364.3, "Power", "up"],
  ["Power Grid Corp", "PWGR", 326.9, "Power", "up"],
  ["ONGC", "ONGC", 274.55, "Energy", "down"],
  ["Coal India", "COAL", 486.25, "Mining", "up"],
  ["Adani Ports", "ADAP", 1422.4, "Logistics", "up"],
  ["JSW Steel", "JSWS", 918.75, "Metals", "down"],
  ["Tata Steel", "TATS", 168.4, "Metals", "up"],
  ["Grasim Industries", "GRAS", 2474.95, "Materials", "up"],
  ["Nestle India", "NEST", 2518.6, "FMCG", "down"],
  ["Bharat Electronics", "BEL", 308.7, "Defence", "up"],
  ["Hindustan Aeronautics", "HAL", 4384.5, "Defence", "down"],
  ["Zomato", "ZOMA", 196.8, "Consumer Tech", "up"],
  ["InterGlobe Aviation", "INDG", 4268.35, "Aviation", "up"],
  ["Eicher Motors", "EICH", 4928.9, "Auto", "down"],
  ["Dr Reddy's Labs", "DRRD", 6185.1, "Pharma", "up"],
  ["Cipla", "CIPL", 1462.4, "Pharma", "down"],
  ["Tech Mahindra", "TECHM", 1396.85, "IT", "up"],
  ["Hero MotoCorp", "HERO", 5144.55, "Auto", "up"],
  ["SBI Life Insurance", "SBIL", 1514.3, "Insurance", "down"],
  ["HDFC Life", "HDFL", 642.1, "Insurance", "up"],
  ["Bajaj Auto", "BAJA", 9831.0, "Auto", "down"],
  ["Siemens India", "SIEM", 3594.9, "Industrial", "down"],
  ["IRFC Logistics", "IRFC", 93.7, "Rail Finance", "down"],
  ["CG Digital Grid", "CGDG", 921.9, "Power Equipment", "down"],
  ["NovaGrid Energy", "NGE", 418.6, "Power", "up"],
  ["BluePeak Finance", "BPF", 1260.2, "Financials", "down"],
  ["Astra Foods", "ASF", 312.75, "FMCG", "up"],
  ["Zenith Motors", "ZMO", 892.1, "Auto", "up"]
];

export const instruments = stockSeeds.map(([name, symbol, price, sector, trend], index) => {
  const magnitude = ((index % 9) + 2) / 100;
  const changeValue = Number((price * magnitude * (trend === "up" ? 1 : -1)).toFixed(2));
  const percent = Math.abs(magnitude * 100).toFixed(2);
  return {
    type: "stock",
    name,
    symbol,
    exchange: index % 3 === 0 ? "BSE" : "NSE",
    price,
    change: `${changeValue > 0 ? "" : "-"}${Math.abs(changeValue).toFixed(2)} (${percent}%)`,
    trend,
    low: Number((price * 0.965).toFixed(2)),
    high: Number((price * 1.034).toFixed(2)),
    sector,
    volume: `${((index + 3) * 71843).toLocaleString("en-IN")}`,
    marketCap: `${(15 + index * 8.7).toFixed(1)}K Cr`,
    pe: Number((18 + (index % 12) * 2.15).toFixed(2)),
    dividendYield: Number((0.3 + (index % 7) * 0.22).toFixed(2)),
    account: {
      bankName: index % 2 ? "Axis Bank" : "ICICI Bank",
      accountNumber: `CMP${String(700000000000 + index)}`,
      ifsc: index % 2 ? "UTIB0009911" : "ICIC0009911",
      accountHolder: `${name} Treasury Collection`,
      upiId: `${symbol.toLowerCase()}-treasury@finboard`
    }
  };
});

export const mutualFunds = [
  ["SBI Bluechip Fund", "SBIBF", 84.42, "Large Cap", "Very High", 7.4, 18.2, 16.8, "R. Srinivasan", amcAccounts[1]],
  ["ICICI Prudential Bluechip", "IPBF", 72.15, "Large Cap", "Very High", 8.1, 17.4, 15.9, "Sankaran Naren", amcAccounts[0]],
  ["HDFC Flexi Cap", "HDFCFC", 151.9, "Flexi Cap", "Very High", 11.3, 21.1, 18.5, "Rahul Baijal", amcAccounts[0]],
  ["Nippon India Large Cap", "NILC", 93.24, "Large Cap", "High", 9.4, 19.8, 17.9, "Sailesh Raj Bhan", amcAccounts[4]],
  ["Axis Midcap Fund", "AXMID", 118.35, "Mid Cap", "Very High", 18.8, 24.6, 21.3, "Shreyash Devalkar", amcAccounts[2]],
  ["Parag Parikh Flexi Cap", "PPFC", 78.92, "Flexi Cap", "Very High", 13.9, 22.7, 20.8, "Rajeev Thakkar", amcAccounts[3]],
  ["Kotak Equity Opportunities", "KEOF", 64.7, "Large & Mid Cap", "Very High", 10.5, 20.1, 18.2, "Harsha Upadhyaya", amcAccounts[3]],
  ["Mirae Asset Emerging Bluechip", "MAEB", 132.1, "Large & Mid Cap", "Very High", 12.1, 23.8, 21.9, "Neelesh Surana", amcAccounts[0]],
  ["UTI Nifty 50 Index Fund", "UTINF", 162.35, "Index", "High", 9.2, 16.4, 15.2, "Sharwan Goyal", amcAccounts[1]],
  ["Aditya Birla Balanced Advantage", "ABBAL", 48.66, "Hybrid", "Moderate", 8.8, 13.7, 12.6, "Mohit Sharma", amcAccounts[2]],
  ["DSP Short Duration Fund", "DSPSD", 39.22, "Debt", "Low", 7.1, 7.8, 7.2, "Vikram Chopra", amcAccounts[0]],
  ["Canara Robeco ELSS Tax Saver", "CRELSS", 124.52, "ELSS", "High", 14.5, 20.9, 18.1, "Shridatta Bhandwaldar", amcAccounts[4]]
].map(([name, symbol, nav, category, risk, oneYear, threeYear, fiveYear, manager, account], index) => ({
  type: "mutual_fund",
  name,
  symbol,
  exchange: "AMC",
  price: nav,
  nav,
  change: `3Y return ${threeYear}%`,
  trend: index % 4 === 10 ? "down" : "up",
  low: Number((nav * 0.98).toFixed(2)),
  high: Number((nav * 1.03).toFixed(2)),
  sector: category,
  volume: "SIP Ready",
  aum: `${(4200 + index * 1850).toLocaleString("en-IN")} Cr`,
  risk,
  expenseRatio: Number((0.42 + (index % 5) * 0.11).toFixed(2)),
  oneYear,
  threeYear,
  fiveYear,
  fundManager: manager,
  account
}));

export const tabs = {
  stocks: {
    label: "Stocks",
    eyebrow: "Equity market",
    heading: "NIFTY 50 style market simulation",
    subheading: "Explore seeded Indian equities with animated charts, company treasury accounts, sector breadth, and KYC-gated order placement.",
    button: "View",
    products: [
      ["IPO", "6 open", BriefcaseBusiness],
      ["ETFs", "18 baskets", BarChart3],
      ["Stocks SIP", "monthly", CalendarDays],
      ["Stock Screener", "new filters", LineChart]
    ],
    cards: instruments,
    movers: instruments.slice(30, 40).map((item) => [item.name, `Rs. ${item.price}`, item.change, item.volume, item.symbol]),
    sectors: [
      ["Banking", 18, 8, "+1.74%"],
      ["IT Services", 11, 13, "-0.42%"],
      ["Auto", 16, 7, "+2.08%"],
      ["Pharma", 9, 4, "+1.16%"],
      ["Power", 13, 3, "+2.52%"],
      ["FMCG", 7, 9, "-0.31%"]
    ]
  },
  fo: {
    label: "F&O",
    eyebrow: "Derivatives",
    heading: "Derivative screens and risk desk",
    subheading: "Mock option and futures contracts for a market-like experience. Real trading is intentionally disabled.",
    button: "View",
    products: [
      ["Index Futures", "4 active", LineChart],
      ["Options Chain", "live strikes", BarChart3],
      ["Hedge Builder", "strategy", ShieldCheck],
      ["Expiry Calendar", "weekly", CalendarDays]
    ],
    cards: instruments.slice(0, 12).map((item) => ({ ...item, symbol: `${item.symbol}F`, name: `${item.name} Futures`, type: "stock" })),
    movers: [
      ["Resistance Breakouts", "Bullish", "+18 signals", "NIFTY 100", "NFUT"],
      ["MACD above signal", "Bullish", "+11 signals", "Large Cap", "TCSF"],
      ["RSI overbought", "Bearish", "7 alerts", "Mid Cap", "HALF"],
      ["OI Buildup", "Neutral", "22 contracts", "Weekly", "SBIF"]
    ],
    sectors: [
      ["Index Options", 118, 76, "+1.82%"],
      ["Banking Futures", 42, 31, "+1.14%"],
      ["IT Options", 37, 49, "-0.64%"],
      ["Auto Futures", 29, 21, "+0.88%"]
    ]
  },
  "mutual-funds": {
    label: "Mutual Funds",
    eyebrow: "RTA-AMC simulation",
    heading: "Mutual funds, SIPs, folios, and AMC accounts",
    subheading: "Simulate investor orders moving from verified bank account to AMC collection accounts, with folio numbers and SIP schedules.",
    button: "Open Fund",
    products: [
      ["SIP Planner", "monthly", PiggyBank],
      ["ELSS Funds", "tax saver", ShieldCheck],
      ["Liquid Funds", "low risk", BadgeIndianRupee],
      ["Fund Screener", "returns", BarChart3]
    ],
    cards: mutualFunds,
    movers: mutualFunds.slice(0, 8).map((item) => [item.name, `Rs. ${item.nav} NAV`, item.risk, `${item.threeYear}% 3Y`, item.symbol]),
    sectors: [
      ["Equity Funds", 84, 26, "+2.12%"],
      ["Hybrid Funds", 42, 9, "+1.24%"],
      ["Debt Funds", 31, 3, "+0.42%"],
      ["Tax Saver", 20, 7, "+1.86%"]
    ]
  }
};

export const allInstruments = [...instruments, ...mutualFunds, ...tabs.fo.cards];

export function findInstrument(symbol) {
  return allInstruments.find((item) => item.symbol.toLowerCase() === String(symbol || "").toLowerCase());
}
