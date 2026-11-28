# Current SDK release evidence

- The original shared SDK feature commit `5d716b6c` is an ancestor of `theme.tools` main. At revision `456ddd806`, the SDK manifest declared `@theme.tools/sdk@1.0.4`. The historical `1.0.1` target is no longer the current source version.
- The npm group and hosted registry metadata requests each returned HTTP 403. The public npm registry returned 404. Those observations do not determine which versions the private registry serves to an authorized consumer.
- GitHub still reports the historical qualification job `139061810526` as failed with zero steps. Listing runs for `release-publish-oidc.yml` returned an empty list, so this audit found no current qualification receipt through that query.
- Tasks 8.3–8.5 remain open. The release chain needs authoritative metadata, bytes bound to the shared source revision, and evidence that the intended consumer installs and exercises an eligible published artifact.

## GitHub-hosted release qualification

At `theme.tools` main revision `3bebd89116b9d64e10da3ea4bc8ca723d6b09eb4`, the package distribution qualification job failed before its first step. The job's check-run annotation reports that recent account payments failed or the spending limit needs to be increased. GitHub's billing settings are needed to distinguish those cases. The checked-in release workflow also uses a GitHub-hosted `ubuntu-latest` job. A fresh dispatch has no qualification value until hosted jobs can start. After billing access is restored, qualify the current revision through the release workflow's `dry_run=true` path before attempting publication. [Package distribution job](https://github.com/heymegabyte/theme.tools/actions/runs/46124804501/job/140916948519)

## Current source and release checks

At `theme.tools` revision `d1229ba51ac75c3b57e872bd7c5f9ec05de946b3`, the SDK manifest still declares `1.0.4`. The clean main checkout passed all 20 tests in `pnpm --filter @theme.tools/sdk test`, including the tests that require an observed publication before a release claim and ordered evidence before an adoption claim.

The latest package qualification job again stopped before its first step with GitHub's billing annotation. Both Nexus npm metadata URLs redirected to Cloudflare Access sign-in and returned HTML when followed. The response bodies provided no package version or integrity metadata. The SDK tests establish source conformance. Publication and consumer adoption still require authenticated registry evidence and an observed consumer run. [Latest qualification job](https://github.com/heymegabyte/theme.tools/actions/runs/46129188140/job/140930407282)

## Built SDK import

During local qualification of `d1229ba5`, the distribution build produced the SDK. With the pinned Node `22.23.5`, a package self-reference imported `@theme.tools/sdk/release-lineage` from the built export and called `evaluateSharedCapabilityReleaseChain`. An adoption claim with no evidence was rejected, and the result identified `source-validation` as the first required stage. This is a workspace build smoke check. The separate qualification process was still running its UI typecheck when observed. A packed consumer and hosted registry verification remain open.

## Qualified private bundle and standalone consumer

The clean `theme.tools` source at `d1229ba51ac75c3b57e872bd7c5f9ec05de946b3` (tree `e7ecd97cdb67bf258df88d4ffc3b60328a8dcd74`) produced 44 distribution archives under Node `22.23.5` and pnpm `11.28.2`. The six fresh provenance checks passed with Python 3.13 for pinned Semgrep and public npm configured for pnpm consumer dependency resolution. The local bundle materializer verified the fresh receipt and generated a local SLSA-format manifest.

- Fresh provenance receipt SHA-256: `ef598fb57da1975846d1a1542c27acb239992df9e69fd94da6f005e356d9bc33`.
- Local bundle manifest SHA-256: `a45fd3dd365855e14da6d0065170993e40ec73f6d86dd46191187afe4a4403a2`.
- `@theme.tools/sdk@1.0.4` archive SHA-256: `10289c0349adbaaf3f1c55aad559cad238a8b4d65712ef2ad881abb006e4d22a` (matches the manifest subject).
- Standalone consumer result SHA-256: `67fa44a45907481a1db2854fe1cc2930f8596694f9979274b568346c037995c6`. The consumer gate pinned the manifest digest, checked all 44 archives, passed all 23 results, and reported no workspace aliases or issues.

The bundle, provenance receipt, and logs are retained in the local qualification evidence directory. The standalone fixture verifies installation from exact packaged bytes. Hosted registry publication and adoption by the intended repository remain unverified.

An isolated consumer with one direct dependency on the verified SDK archive used the bundle's local dependency overrides and generated a lockfile. From that installation, Node loaded `@theme.tools/sdk/release-lineage` and rejected an evidence-free adoption claim for `agent-skills`, returning `source-validation` as the next required stage. Lockfile SHA-256 `f00033150a9cd47476d5650dcfb554d1fa40bf8c5dd3ff675bc4a852e2a9d990`. Runtime result SHA-256 `82c8320b206ae5bec9f82acc0645bfffac0d1df7a331c3b42b8707dbb6b69a7d`. The actual `agent-skills` manifest currently has no SDK dependency. The release prerequisite for changing it remains open.
