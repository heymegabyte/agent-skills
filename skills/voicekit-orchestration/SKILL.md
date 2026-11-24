---
name: voicekit-orchestration
description: Orchestrate VoiceKit ($17,000 startup credits tier) for real-time voice agents, two-host podcast conversations, high-fidelity TTS, and phone/WebRTC intake — replacing ElevenLabs everywhere alongside Cloudflare Workers AI MeloTTS and Piper OSS fallback.
metadata:
  version: "1.0.0"
---
# VoiceKit ($17,000 Credits Tier) Voice Agents, Podcast Studio & TTS Orchestration

## Core Directive (Replaces ElevenLabs Everywhere)

- **VoiceKit (`voicekit` / `voicekit-mcp`) is our primary hosted voice platform**, backed by **$17,000 in VoiceKit credits**.
- **Never use ElevenLabs (`elevenlabs` is disabled in OpenClaw and deprecated across `agent-skills` and `@theme.tools`)**.
- **Canonical Audio & Voice Provider Chain**:
  1. **VoiceKit (`https://api.voicekit.ai/v1`, `$17,000` Credits Tier)** — Primary hosted platform for real-time phone/WebRTC voice agents (`VOICEKIT_AGENT_ID`), two-host conversational podcasts (`host_a: "sage"`, `host_b: "river"`), brand voice cloning, and high-fidelity streaming TTS (`VOICEKIT_API_KEY`).
  2. **MeloTTS on Cloudflare Workers AI (`@cf/myshell-ai/melotts`, MIT)** — Zero-infrastructure edge-native OSS TTS (`env.AI.run`) cached in Cloudflare R2 for high-volume page-audio narration on Cloudflare Workers.
  3. **Piper (`rhasspy/piper`, MIT)** — Self-hosted container OSS TTS fallback for offline/local workstation synthesis.

## MCP Tools (`voicekit-mcp` via `paperclip-mcp-stdio-runner.mjs`)

- `voicekit_credits_status`: Inspect the `$17,000` VoiceKit credit grant runway, active voice IDs (`sage`, `river`), provider chain, and ElevenLabs deprecation status.
- `voicekit_synthesize_speech`: Build and dispatch a VoiceKit TTS synthesis request with R2/Cloudflare edge cache headers and MeloTTS fallback metadata.
- `voicekit_create_podcast_conversation`: Build a two-host conversational podcast job (`mode: "conversation"`, `host_a: "sage"`, `host_b: "river"`) for the `12-media-orchestration/notebooklm-pipeline.md` workflow.
- `voicekit_deploy_voice_agent`: Build a VoiceKit real-time phone/Twilio/WebRTC intake agent configuration (`POST /webhook/voicekit`, bearer-gated on `VOICEKIT_TOOL_BEARER`).

## Environment & Secret Keys

- `VOICEKIT_API_KEY`: API key resolved via Infisical / `get-secret VOICEKIT_API_KEY`.
- `VOICEKIT_AGENT_ID`: Real-time conversational intake agent ID for `@theme.tools/workflows` (`voice-ai-intake`).
- `VOICEKIT_TOOL_BEARER`: Bearer secret authenticating VoiceKit server-side tool webhooks (`/webhook/voicekit`, `/tools/capture-intent`, `/tools/book`, `/tools/schedule-callback`).
- `VOICEKIT_VOICE_HOST_A`: Default primary host voice (`sage`).
- `VOICEKIT_VOICE_HOST_B`: Default co-host voice (`river`).

## `@theme.tools` Upstream Libraries & Paperclip Quotas Integration

- **`@theme.tools/media-video`** (`packages/media-video/src/contracts.ts` & `core.ts`):
  - `buildVoiceKitTtsRequest(input: VoiceKitSynthesisInput)` — Deterministic VoiceKit (`$17,000` credits tier) TTS request builder with Cloudflare Workers AI MeloTTS (`@cf/myshell-ai/melotts`) + local Piper ONNX fallback metadata.
  - `buildVoiceKitPodcastStudioRequest(input: VoiceKitPodcastConversationInput)` — Deterministic VoiceKit Studio two-host conversational podcast builder (`voicekit-sage` + `voicekit-river`, `-16 LUFS`).
- **`@theme.tools/workflows`** (`packages/workflows/src/field-service/worker/features/voice-ai-intake`):
  - Real-time phone/Twilio/WebRTC intake (`POST /webhook/voicekit` + legacy alias `/webhook/elevenlabs`, `VOICEKIT_AGENT_ID`, `VOICEKIT_TOOL_BEARER`).
- **`paperclip.fleet-usage-observatory`** (`/home/professormanhattan/paperclip-plugins/fleet-usage-observatory`):
  - Surfaces the `$17,000.00 USD` VoiceKit credit wallet (`key-voicekit-voice-brian`) and the `pathway-hyperframes-voicekit-pexels-4k` zero-out-of-pocket 4K video narration pathway.
