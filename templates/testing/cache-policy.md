# Test cache policy

Cache deterministic builds/static/unit/component/isolated integration work only when keys cover source, transitive dependencies, tools, lockfile, test data, config, compatibility date, runtime, harness, instrumentation, and environment identity. Separate trust domains; untrusted changes never write protected release cache. Report cache hits as reused evidence.

Never cache mutable live E2E, provider checks, production synthetics, or live-model evaluations. Invalidate after selector, harness, source-map, coverage-provenance, dependency, or environment changes. Do not introduce a paid cache or deprecated shared-bucket Nx cache plugin.
