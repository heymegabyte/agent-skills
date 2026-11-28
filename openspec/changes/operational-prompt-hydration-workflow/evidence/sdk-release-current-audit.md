# Current SDK release evidence

- The original shared SDK feature commit `5d716b6c` is an ancestor of `theme.tools` main. At revision `456ddd806`, the SDK manifest declared `@theme.tools/sdk@1.0.4`. The historical `1.0.1` target is no longer the current source version.
- The npm group and hosted registry metadata requests each returned HTTP 403. The public npm registry returned 404. Those observations do not determine which versions the private registry serves to an authorized consumer.
- GitHub still reports the historical qualification job `139061810526` as failed with zero steps. Listing runs for `release-publish-oidc.yml` returned an empty list, so this audit found no current qualification receipt through that query.
- Tasks 8.3–8.5 remain open. The release chain needs authoritative metadata, bytes bound to the shared source revision, and evidence that the intended consumer installs and exercises an eligible published artifact.
