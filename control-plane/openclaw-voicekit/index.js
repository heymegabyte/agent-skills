export default {
  id: "voicekit",
  name: "VoiceKit ($17k Credits Voice Agents & TTS)",
  description:
    "Primary hosted Voice Agents, Two-Host Podcast Studio, High-Fidelity TTS, and Speech-to-Speech via VoiceKit ($17,000 startup credits grant) with Cloudflare Workers AI MeloTTS and Piper fallback.",
  configSchema: {
    type: "object",
    additionalProperties: true,
    properties: {
      apiBaseUrl: { type: "string", default: "https://api.voicekit.ai/v1" },
      creditsTierUsd: { type: "number", default: 17000 },
      defaultVoiceHostA: { type: "string", default: "sage" },
      defaultVoiceHostB: { type: "string", default: "river" },
      fallbackChain: {
        type: "array",
        items: { type: "string" },
        default: ["voicekit", "melotts-workers-ai", "piper-local"],
      },
    },
  },
  register(api) {
    if (typeof api?.registerProvider === "function") {
      try {
        api.registerProvider({
          id: "voicekit",
          label: "VoiceKit ($17k Credits Voice & TTS)",
          capabilities: ["tts", "voice-agent", "podcast-studio", "stt"],
        });
      } catch {
        // ignore if provider registration signature differs across minor versions
      }
    }
  },
};
