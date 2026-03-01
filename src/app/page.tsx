"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { CopilotKitCSSProperties, CopilotSidebar } from "@copilotkit/react-ui";
import { useState } from "react";

export default function CopilotKitPage() {
  const [themeColor, setThemeColor] = useState("#0f172a");

  useCopilotAction({
    name: "setThemeColor",
    parameters: [{
      name: "themeColor",
      description: "The theme color to set.",
      required: true,
    }],
    handler({ themeColor }) {
      setThemeColor(themeColor);
    },
  });

  return (
    <main style={{ "--copilot-kit-primary-color": "#6366f1" } as CopilotKitCSSProperties}>
      <MainContent themeColor={themeColor} />
      <CopilotSidebar
        clickOutsideToClose={false}
        defaultOpen={true}
        labels={{
          title: "Market Intelligence",
          initial: "👋 Hey! I'm your market intelligence agent.\n\nTry asking:\n- **\"What's the Bitcoin price?\"**\n- **\"What's moving in crypto today?\"**\n- **\"How's the Solana network doing?\"**\n- **\"What's the market sentiment right now?\"**\n- **\"Any news on Ethereum?\"**\n\nI have real-time data on prices, on-chain stats, top movers, news, and the Fear & Greed index.",
        }}
      />
    </main>
  );
}

function MainContent({ themeColor }: { themeColor: string }) {
  return (
    <div
      style={{ backgroundColor: themeColor }}
      className="h-screen w-screen flex justify-center items-center flex-col transition-colors duration-300"
    >
      <div className="bg-white/10 backdrop-blur-md p-10 rounded-2xl shadow-2xl max-w-2xl w-full text-center">
        {/* Logo / icon */}
        <div className="flex justify-center mb-4">
          <span className="text-5xl">📊</span>
        </div>

        <h1 className="text-4xl font-bold text-white mb-2">Market Intelligence</h1>
        <p className="text-gray-300 text-lg italic mb-6">
          Real-time crypto insights powered by AI
        </p>

        <hr className="border-white/20 my-6" />

        <div className="grid grid-cols-2 gap-3 text-left mb-6">
          {[
            { icon: "💰", label: "Live Prices", desc: "Any coin, real-time" },
            { icon: "🚀", label: "Top Movers", desc: "Biggest gainers & losers" },
            { icon: "⛓️", label: "Solana On-Chain", desc: "TPS, epoch, slot height" },
            { icon: "😱", label: "Fear & Greed", desc: "Market sentiment index" },
            { icon: "📰", label: "Crypto News", desc: "Latest headlines" },
            { icon: "🤖", label: "AI Analysis", desc: "Context, not just numbers" },
          ].map(({ icon, label, desc }) => (
            <div key={label} className="bg-white/10 rounded-xl p-3 flex items-start gap-3">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="text-white font-semibold text-sm">{label}</p>
                <p className="text-gray-400 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-gray-400 text-sm">
          Open the chat panel → and ask anything about the markets.
        </p>
      </div>
    </div>
  );
}
