import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Terminal, KeyRound, BookOpen, Code2 } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "API REFERENCE // LASTQUESTION.CO",
};

export default function ApiDocsPage() {
  const curlExampleHeader = `curl -X GET "https://lastquestion.store/api/v1/signals" \\
  -H "x-api-key: YOUR_API_KEY"`;

  const curlExampleQuery = `curl -X GET "https://lastquestion.store/api/v1/signals?api_key=YOUR_API_KEY"`;

  const jsonResponseVip = `{
  "success": true,
  "tier": "vip",
  "signals": [
    {
      "pair": "BTCUSDT",
      "direction": "LONG",
      "entry": 67500,
      "stop_loss": 66200,
      "take_profit": 68800,
      "tp2": 69500,
      "tp3": 70500,
      "tp4": 72000,
      "status": "ACTIVE",
      "source": "ALGO_V4_BTC",
      "audience": "vip",
      "created_at": "2026-07-20T05:00:00.000Z"
    },
    {
      "pair": "ETHUSDT",
      "direction": "SHORT",
      "entry": 3480,
      "stop_loss": 3560,
      "take_profit": 3410,
      "tp2": 3350,
      "tp3": 3280,
      "tp4": 3150,
      "status": "ACTIVE",
      "source": "ALGO_V4_ETH",
      "audience": "public",
      "created_at": "2026-07-20T04:45:00.000Z"
    }
  ]
}`;

  const jsonResponseErrorMissing = `{
  "success": false,
  "message": "Missing API key..."
}`;

  const jsonResponseErrorInvalid = `{
  "success": false,
  "message": "Invalid API key"
}`;

  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#030712]">
      <Header />
      <main className="pt-[104px] px-5 pb-6">
        <div className="text-center mb-6">
          <p className="text-[10.5px] tracking-[0.3em] font-semibold text-cyan-400 mb-2">
            [ TECHNICAL DOCUMENTATION // V1 ]
          </p>
          <h1 className="font-display font-bold text-white text-[26px] leading-tight uppercase tracking-wide">
            API REFERENCE
          </h1>
          <p className="text-white/45 text-[12.5px] mt-2 max-w-[300px] mx-auto leading-relaxed">
            Technical integration specifications for querying live signals. Authenticate via header or query parameters.
          </p>
        </div>

        {/* Section: Authentication */}
        <div className="mb-8">
          <h2 className="text-[11px] tracking-[0.2em] font-mono text-cyan-400/70 uppercase mb-3 flex items-center gap-2">
            <KeyRound size={12} className="text-cyan-400" /> [ AUTHENTICATION ]
          </h2>
          <div className="hud-card chamfer border border-cyan-400/20 bg-[#0b0f18]/80 p-4 text-[12.5px] leading-relaxed">
            <p className="text-white/70 mb-3">
              To query the database, you must authenticate using a member API key. Generate your key on the{" "}
              <Link href="/profile" className="text-cyan-400 underline hover:text-cyan-300 font-mono">
                [ /profile ]
              </Link>{" "}
              page (which sends a <code className="bg-black/40 text-cyan-400 px-1 py-0.5 rounded text-[11px] font-mono">POST /api/profile/api-key</code> request).
            </p>
            <p className="text-white/70 mb-3">
              Your key can be provided in your HTTP requests in one of two ways:
            </p>
            <ul className="list-disc list-inside text-white/60 space-y-1.5 pl-1 text-[12px] font-mono">
              <li>
                Request header: <code className="bg-black/40 text-cyan-300 px-1 py-0.5 rounded text-[11px]">x-api-key: YOUR_API_KEY</code>
              </li>
              <li>
                Query param: <code className="bg-black/40 text-cyan-300 px-1 py-0.5 rounded text-[11px]">?api_key=YOUR_API_KEY</code>
              </li>
            </ul>
          </div>
        </div>

        {/* Section: GET /api/v1/signals */}
        <div className="mb-8">
          <h2 className="text-[11px] tracking-[0.2em] font-mono text-cyan-400/70 uppercase mb-3 flex items-center gap-2">
            <Terminal size={12} className="text-cyan-400" /> [ GET SIGNALS ]
          </h2>
          <div className="hud-card chamfer border border-cyan-400/20 bg-[#0b0f18]/80 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-sm font-mono text-[10px] font-bold">
                GET
              </span>
              <span className="font-mono text-white text-[11px] overflow-x-auto select-all">
                https://lastquestion.store/api/v1/signals
              </span>
            </div>

            <p className="text-white/70 text-[12.5px] leading-relaxed mb-4">
              Returns the last 20 signals from the LASTQUESTION intelligence engine. Tier filtering applies depending on your API key level:
            </p>
            <ul className="list-disc list-inside text-white/60 text-[12px] space-y-1.5 mb-4 pl-1">
              <li>
                <span className="text-white font-bold">VIP Tier:</span> Accesses all 20 signals including public and exclusive VIP-only signals.
              </li>
              <li>
                <span className="text-white font-bold">Free Tier:</span> Returns up to 20 signals but filters for <code className="text-cyan-300 font-mono text-[11px]">audience: "public"</code> signals only.
              </li>
            </ul>

            {/* Example cURL */}
            <p className="text-white/80 text-[11px] font-mono mb-1.5 uppercase tracking-wider">
              // EXAMPLE CURL (HEADER AUTH)
            </p>
            <pre className="bg-black/60 border border-white/10 p-3 font-mono text-[11px] text-cyan-300 overflow-x-auto rounded-sm mb-4">
              <code>{curlExampleHeader}</code>
            </pre>

            <p className="text-white/80 text-[11px] font-mono mb-1.5 uppercase tracking-wider">
              // EXAMPLE CURL (QUERY AUTH)
            </p>
            <pre className="bg-black/60 border border-white/10 p-3 font-mono text-[11px] text-cyan-300 overflow-x-auto rounded-sm mb-4">
              <code>{curlExampleQuery}</code>
            </pre>

            {/* Response JSON */}
            <p className="text-white/80 text-[11px] font-mono mb-1.5 uppercase tracking-wider">
              // SUCCESS RESPONSE (200 OK)
            </p>
            <pre className="bg-black/60 border border-white/10 p-3 font-mono text-[11px] text-cyan-300 overflow-x-auto rounded-sm">
              <code>{jsonResponseVip}</code>
            </pre>
          </div>
        </div>

        {/* Section: Error Responses */}
        <div className="mb-8">
          <h2 className="text-[11px] tracking-[0.2em] font-mono text-cyan-400/70 uppercase mb-3 flex items-center gap-2">
            <BookOpen size={12} className="text-cyan-400" /> [ ERROR HANDLING ]
          </h2>
          <div className="hud-card chamfer border border-cyan-400/20 bg-[#0b0f18]/80 p-4 space-y-4">
            <p className="text-white/70 text-[12.5px] leading-relaxed">
              When authentication fails, the server responds with a standard <span className="text-red-400 font-bold font-mono">401 Unauthorized</span> status and a JSON payload detailing the rejection reason.
            </p>

            <div>
              <p className="text-white/80 text-[11px] font-mono mb-1.5 uppercase tracking-wider">
                // ERROR: MISSING API KEY
              </p>
              <pre className="bg-black/60 border border-white/10 p-3 font-mono text-[11px] text-cyan-300 overflow-x-auto rounded-sm">
                <code>{jsonResponseErrorMissing}</code>
              </pre>
            </div>

            <div>
              <p className="text-white/80 text-[11px] font-mono mb-1.5 uppercase tracking-wider">
                // ERROR: INVALID API KEY
              </p>
              <pre className="bg-black/60 border border-white/10 p-3 font-mono text-[11px] text-cyan-300 overflow-x-auto rounded-sm">
                <code>{jsonResponseErrorInvalid}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Section: Rate Limits */}
        <div className="mb-8">
          <h2 className="text-[11px] tracking-[0.2em] font-mono text-cyan-400/70 uppercase mb-3 flex items-center gap-2">
            <Code2 size={12} className="text-cyan-400" /> [ RATE LIMITS ]
          </h2>
          <div className="hud-card chamfer border border-cyan-400/20 bg-[#0b0f18]/80 p-4">
            <p className="text-white/70 text-[12.5px] leading-relaxed">
              Currently, there is <span className="text-cyan-400 font-bold">no hard rate limit</span> enforced on the API signals endpoint. However, to ensure stable platform access and resource availability, developers are kindly requested to poll responsibly.
            </p>
            <div className="mt-3 p-3 bg-cyan-950/20 border border-cyan-500/20 text-cyan-300 text-[11.5px] rounded-sm font-mono leading-relaxed">
              [ NOTICE ] Please poll no faster than once every 10 to 30 seconds. The core LASTQUESTION signal engine runs on a 5-minute cadence, meaning signals will not update faster than this window regardless of polling frequency.
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/developer-hub"
            className="text-[11px] tracking-widest text-cyan-300/80 font-semibold font-mono hover:text-cyan-300 transition-colors"
          >
            [ &lt;- BACK TO DEVELOPER HUB ]
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
