"use client";

import { useState } from "react";
import { Search, Calendar, FileText, ArrowUpRight } from "lucide-react";
import DecodeText from "@/components/DecodeText";

type Article = {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  imageUrl: string;
  tag: string;
};

const ARTICLES: Article[] = [
  {
    id: "gold-breakout-2026",
    title: "Sinyal Breakout Emas (XAUUSD): Target $2,500 Terbuka Lebar?",
    date: "18.JUL.2026",
    excerpt: "Kenaikan inflasi global dan ketegangan geopolitik baru memicu lonjakan masif komoditas safe-haven...",
    imageUrl: "https://images.unsplash.com/photo-1610374792793-f016b77ca51a?w=400&auto=format&fit=crop&q=60",
    tag: "#GOLD",
  },
  {
    id: "btc-dominance-62",
    title: "Bitcoin Dominance Sentuh 62%, Altcoin Season Tertunda?",
    date: "17.JUL.2026",
    excerpt: "Likuiditas pasar kripto kembali terserap ke BTC seiring pengujian level resistensi makro terkuat...",
    imageUrl: "https://images.unsplash.com/photo-1516245834210-c4c142787335?w=400&auto=format&fit=crop&q=60",
    tag: "#CRYPTO",
  },
  {
    id: "boj-scalping-strategy",
    title: "Strategi Scalping Forex Menghadapi Keputusan Suku Bunga BoJ",
    date: "16.JUL.2026",
    excerpt: "Panduan taktis memanfaatkan volatilitas tinggi pasangan mata uang USDJPY saat rilis pengumuman BoJ...",
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&auto=format&fit=crop&q=60",
    tag: "#FOREX",
  },
  {
    id: "eth-gas-fees-low",
    title: "Ethereum Gas Fees Sentuh Rekor Terendah, Saatnya Akumulasi?",
    date: "15.JUL.2026",
    excerpt: "Data on-chain menunjukkan aktivitas akumulasi whale mulai meningkat pesat di zona diskon historis...",
    imageUrl: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&auto=format&fit=crop&q=60",
    tag: "#ETH",
  },
  {
    id: "solana-lsd-guide",
    title: "Mengenal Liquid Staking Derivatives (LSD) di Ekosistem Solana",
    date: "14.JUL.2026",
    excerpt: "Optimalkan capital efficiency portofolio Anda menggunakan protokol restaking terbaru di jaringan Solana...",
    imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&auto=format&fit=crop&q=60",
    tag: "#SOLANA",
  },
  {
    id: "trading-psychology-fomo",
    title: "Psikologi Trading: Mengatasi FOMO Saat Pasar Mengalami Parabolic Run",
    date: "13.JUL.2026",
    excerpt: "Langkah-langkah menjaga disiplin eksekusi trading plan di tengah euphoria dan histeria massal...",
    imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&auto=format&fit=crop&q=60",
    tag: "#EDUCATION",
  },
];

export default function BlogClient() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredArticles = ARTICLES.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* CLI-styled Command Line Search Bar */}
      <div className="relative flex items-center border-b border-cyan-500/30 pb-2 focus-within:border-cyan-400 transition-colors">
        <span className="font-mono text-cyan-300 text-[11px] mr-2 select-none">
          SYS_SEARCH:~$
        </span>
        <span className="cursor-blink font-mono text-cyan-300 text-[12px] mr-1 select-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Enter search query..."
          className="bg-transparent text-white font-mono text-[12px] focus:outline-none w-full placeholder:text-zinc-600 tracking-wide"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-[10px] text-zinc-500 hover:text-cyan-300 font-mono px-1 select-none"
          >
            [CLEAR]
          </button>
        )}
      </div>

      {/* Query status line */}
      <div className="flex justify-between items-center text-[9.5px] font-mono text-zinc-500 border-b border-zinc-800/60 pb-1.5">
        <span>LOG_COUNT: {filteredArticles.length} RECORDS FOUND</span>
        <span className="text-cyan-400/70 select-none">SYSTEM_OK // SECURE_LINK</span>
      </div>

      {/* Single column mobile-first list */}
      <div className="flex flex-col gap-4">
        {filteredArticles.length > 0 ? (
          filteredArticles.map((article) => (
            <div
              key={article.id}
              className="hud-card chamfer border border-zinc-800/40 bg-[#0b0f18]/80 flex p-3.5 gap-4 hover:border-cyan-400/35 transition-all group relative overflow-hidden"
            >
              {/* Left Side: Thumbnail (35% width) */}
              <div className="w-[35%] aspect-[4/5] relative overflow-hidden flex-shrink-0 border border-zinc-800/60">
                {/* Cyan Monochrome Overlay Layer */}
                <div className="absolute inset-0 bg-cyan-500/10 z-10 pointer-events-none mix-blend-color" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent z-10 pointer-events-none" />
                {/* Grayscale/Monochrome Image */}
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{
                    filter: "grayscale(0.8) brightness(0.85) contrast(1.1) hue-rotate(180deg)",
                  }}
                  loading="lazy"
                />
                {/* Small overlay label inside thumbnail */}
                <div className="absolute bottom-1.5 left-1.5 z-20 font-mono text-[8px] bg-black/70 border border-cyan-400/30 px-1 py-0.5 text-cyan-300">
                  {article.tag}
                </div>
              </div>

              {/* Right Side: Info (65% width) */}
              <div className="w-[65%] flex flex-col justify-between py-0.5 gap-2">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[9px]">
                    <Calendar size={10} className="text-zinc-500" />
                    <span>{article.date}</span>
                  </div>

                  {/* Scrambled Decode Text Title on tap/hover */}
                  <h3 className="font-display font-semibold text-[13.5px] leading-snug text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                    <DecodeText text={article.title} />
                  </h3>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-zinc-500 text-[10.5px] leading-relaxed line-clamp-1 font-sans">
                    {article.excerpt}
                  </p>

                  <div className="flex items-center gap-1 text-[9.5px] text-cyan-300/75 font-mono select-none group-hover:text-cyan-300">
                    <FileText size={10} className="text-cyan-400/60" />
                    <span>READ_LOG</span>
                    <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto text-cyan-400" />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 border border-dashed border-zinc-800 text-center flex flex-col items-center justify-center gap-2">
            <span className="font-mono text-zinc-600 text-xs uppercase tracking-wider">
              No matching archive logs found.
            </span>
            <span className="font-mono text-[10px] text-cyan-500/50">
              ERR_CODE // QUERY_EMPTY
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
