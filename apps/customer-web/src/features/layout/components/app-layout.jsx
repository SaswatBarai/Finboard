import Footer from "./footer";
import MarketTicker from "./market-ticker";
import Navbar from "./navbar";

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <MarketTicker />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
      <Footer />
    </div>
  );
}
