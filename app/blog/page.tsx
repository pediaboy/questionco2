import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogClient from "./BlogClient";

export const metadata = {
  title: "INTEL & NEWS LOGS — LASTQUESTION.CO",
  description: "Searchable terminal logs, intelligence briefings, and strategy guides from the LASTQUESTION.CO trading community.",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#05080F]">
      <Header />
      <main className="pt-[104px] px-5 pb-6">
        <div className="text-center mb-6">
          <p className="text-[10.5px] tracking-[0.3em] font-semibold mb-2 text-cyan-400">
            [ ARCHIVE_LOGS // TERMINAL_FEED ]
          </p>
          <h1 className="font-display font-bold text-white text-[24px] leading-tight uppercase tracking-wide">
            Intel & News Logs
          </h1>
          <p className="text-white/45 text-[12px] mt-1.5 max-w-[300px] mx-auto leading-relaxed">
            Community dossiers, breaking market intelligence, and system updates.
          </p>
        </div>

        <BlogClient />
      </main>
      <Footer />
    </div>
  );
}
