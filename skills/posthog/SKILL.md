---
name: posthog
description: "PostHog API API skill — auto-forged from OpenAPI 1.0.0. "
triggers: ["posthog API", "working with PostHog API"]
version: 1.0.0
forged-from: openapi
api-title: PostHog API
api-version: 1.0.0
---

# PostHog API API Skill

<!-- commands-collapsed -->
> **Per-endpoint pages collapsed.** The 1655 `commands/*.md` files (one per endpoint) were removed to cut file count — they were forge-generated, unrouted, and reproduce what Co...
> Restore full offline curl/param detail any time: `node bin/forge-skill-from-openapi.mjs <spec-url> skills/posthog --name posthog`.


Auto-forged from the PostHog API OpenAPI spec (v1.0.0).

## What this skill provides

- **1715 slash commands** — one per API endpoint, with curl examples and typed guidance
- **`types.ts`** — TypeScript types auto-generated from OpenAPI schemas
- **`client.ts`** — Typed fetch-based API client (zero deps, Workers-compatible)

## Slash Commands

- `/get-api-code-invites-check-access` — Check access
- `/post-api-code-invites-redeem` — Redeem invite code
- `/get-api-environments-environment-id-alerts` — GET /api/environments/{environment_id}/alerts/
- `/post-api-environments-environment-id-alerts` — POST /api/environments/{environment_id}/alerts/
- `/get-api-environments-environment-id-alerts-id` — GET /api/environments/{environment_id}/alerts/{id}/
- `/put-api-environments-environment-id-alerts-id` — PUT /api/environments/{environment_id}/alerts/{id}/
- `/patch-api-environments-environment-id-alerts-id` — PATCH /api/environments/{environment_id}/alerts/{id}/
- `/delete-api-environments-environment-id-alerts-id` — DELETE /api/environments/{environment_id}/alerts/{id}/
- `/post-api-environments-environment-id-alerts-simulate` — Simulate a detector on an insight's historical data. Read-only — no...
- `/get-api-environments-environment-id-batch-exports` — GET /api/environments/{environment_id}/batch_exports/
- `/post-api-environments-environment-id-batch-exports` — POST /api/environments/{environment_id}/batch_exports/
- `/get-api-environments-environment-id-batch-exports-batch-export-i` — ViewSet for BatchExportBackfill models.

Allows creating and reading backfills, but not updating or deleting them.
- `/post-api-environments-environment-id-batch-exports-batch-export-i` — Create a new backfill for a BatchExport.
- `/get-api-environments-environment-id-batch-exports-batch-export-i` — ViewSet for BatchExportBackfill models.

Allows creating and reading backfills, but not updating or deleting them.
- `/post-api-environments-environment-id-batch-exports-batch-export-i` — Cancel a batch export backfill.
- `/get-api-environments-environment-id-batch-exports-batch-export-i` — GET /api/environments/{environment_id}/batch_exports/{b...
- `/get-api-environments-environment-id-batch-exports-batch-export-i` — GET /api/environments/{environment_id}/batch_exports/{b...
- `/post-api-environments-environment-id-batch-exports-batch-export-i` — Cancel a batch export run.
- `/get-api-environments-environment-id-batch-exports-batch-export-i` — GET /api/environments/{environment_id}/batch_exports/{b...
- `/post-api-environments-environment-id-batch-exports-batch-export-i` — Retry a batch export run.

We use the same underlying mechanism as when backfilling a batch export, as retrying
a run is the same as backfilling one run.
- `/get-api-environments-environment-id-batch-exports-id` — GET /api/environments/{environment_id}/batch_exports/{id}/
- `/put-api-environments-environment-id-batch-exports-id` — PUT /api/environments/{environment_id}/batch_exports/{id}/
- `/patch-api-environments-environment-id-batch-exports-id` — PATCH /api/environments/{environment_id}/batch_exports/{id}/
- `/delete-api-environments-environment-id-batch-exports-id` — DELETE /api/environments/{environment_id}/batch_exports/{id}/
- `/get-api-environments-environment-id-batch-exports-id-logs` — GET /api/environments/{environment_id}/batch_exports/{id}/logs/
- `/post-api-environments-environment-id-batch-exports-id-pause` — Pause a BatchExport.
- `/post-api-environments-environment-id-batch-exports-id-run-test-st` — POST /api/environments/{environment_id}/batch_exports/...
- `/post-api-environments-environment-id-batch-exports-id-unpause` — Unpause a BatchExport.
- `/post-api-environments-environment-id-batch-exports-run-test-step-` — POST /api/environments/{environment_id}/batch_exports/...
- `/get-api-environments-environment-id-batch-exports-test` — GET /api/environments/{environment_id}/batch_exports/test/
- `/get-api-environments-environment-id-dashboards` — GET /api/environments/{environment_id}/dashboards/
- `/post-api-environments-environment-id-dashboards` — POST /api/environments/{environment_id}/dashboards/
- `/get-api-environments-environment-id-dashboards-dashboard-id-coll` — GET /api/environments/{environment_id}/dashboards/{dash...
- `/post-api-environments-environment-id-dashboards-dashboard-id-coll` — POST /api/environments/{environment_id}/dashboards/{da...
- `/delete-api-environments-environment-id-dashboards-dashboard-id-coll` — DELETE /api/environments/{environment_id}/dashboards...
- `/get-api-environments-environment-id-dashboards-dashboard-id-shar` — GET /api/environments/{environment_id}/dashboards/{dash...
- `/post-api-environments-environment-id-dashboards-dashboard-id-shar` — Create a new password for the sharing configuration.
- `/delete-api-environments-environment-id-dashboards-dashboard-id-shar` — Delete a password from the sharing configuration.
- `/post-api-environments-environment-id-dashboards-dashboard-id-shar` — POST /api/environments/{environment_id}/dashboards/{da...
- `/get-api-environments-environment-id-dashboards-id` — GET /api/environments/{environment_id}/dashboards/{id}/
- `/put-api-environments-environment-id-dashboards-id` — PUT /api/environments/{environment_id}/dashboards/{id}/
- `/patch-api-environments-environment-id-dashboards-id` — PATCH /api/environments/{environment_id}/dashboards/{id}/
- `/delete-api-environments-environment-id-dashboards-id` — Hard delete of this model is not allowed. Use a patch API call to s...
- `/post-api-environments-environment-id-dashboards-id-analyze-refres` — Generate AI analysis comparing before/after dashboard ...
Expects cache_key in request body pointing to the stored 'before' state.
- `/post-api-environments-environment-id-dashboards-id-copy-tile` — Copy an existing dashboard tile to another dashboard (insig...
- `/post-api-environments-environment-id-dashboards-id-create-text-ti` — Add a markdown text tile to a dashboard.

Text tiles render as markdown blocks on the dashboard — useful as section headings, dividers,
or annotations between insight tiles to give the dashboard structure.
- `/patch-api-environments-environment-id-dashboards-id-move-tile` — PATCH /api/environments/{environment_id}/dashboards/{id}/m...
- `/post-api-environments-environment-id-dashboards-id-reorder-tiles` — POST /api/environments/{environment_id}/dashboards/{id}...
- `/get-api-environments-environment-id-dashboards-id-run-insights` — Run all insights on a dashboard and return their results.
- `/post-api-environments-environment-id-dashboards-id-snapshot` — Snapshot the current dashboard state (from cache) for AI ana...
Returns a cache_key representing the 'before' state, to be used with analyze_refresh_result.
- `/get-api-environments-environment-id-dashboards-id-stream-tiles` — Stream dashboard metadata and tiles via Server-Sent Event...
- `/post-api-environments-environment-id-dashboards-id-update-text-ti` — Update the markdown body, layout, or color of an exist...
- `/post-api-environments-environment-id-dashboards-bulk-update-tags` — Bulk update tags on multiple objects.

PAT access: this action has no ``required_scopes=`` on the decorator —
inheriting viewsets must add ``"bulk_update_tags"`` to their
``scope_object_write_actions`` list to accept personal API keys.
Without that opt-in, ``APIScopePermission`` rejects PAT requests with
"This action does not support personal API key access". Done per-viewset
so granting ``<scope>:write`` for one resource doesn't leak access to
sibling resources that share this mixin.

Accepts:
- {"ids": [...], "action": "add"|"remove"|"set", "tags": ["tag1", "tag2"]}

Actions:
- "add": Add tags to existing tags on each object
- "remove": Remove specific tags from each object
- "set": Replace all tags on each object with the provided list
- `/post-api-environments-environment-id-dashboards-create-from-templ` — POST /api/environments/{environment_id}/dashboards/cre...
- `/post-api-environments-environment-id-dashboards-create-unlisted-d` — Creates an unlisted dashboard from template by tag.
Enforces uniqueness (one per tag per team).
Returns 409 if unlisted dashboard with this tag already exists.
- `/get-api-environments-environment-id-data-color-themes` — GET /api/environments/{environment_id}/data_color_themes/
- `/post-api-environments-environment-id-data-color-themes` — POST /api/environments/{environment_id}/data_color_themes/
- `/get-api-environments-environment-id-data-color-themes-id` — GET /api/environments/{environment_id}/data_color_themes/{id}/
- `/put-api-environments-environment-id-data-color-themes-id` — PUT /api/environments/{environment_id}/data_color_themes/{id}/
- `/patch-api-environments-environment-id-data-color-themes-id` — PATCH /api/environments/{environment_id}/data_color_themes/{id}/
- `/delete-api-environments-environment-id-data-color-themes-id` — DELETE /api/environments/{environment_id}/data_color_themes/...
- `/get-api-environments-environment-id-data-modeling-jobs` — List data modeling jobs which are "runs" for our saved queries.
- `/get-api-environments-environment-id-data-modeling-jobs-id` — List data modeling jobs which are "runs" for our saved queries.
- `/get-api-environments-environment-id-data-modeling-jobs-recent` — Get the most recent non-running job for each saved query f...
- `/get-api-environments-environment-id-data-modeling-jobs-running` — Get all currently running jobs from the v2 backend.
- `/get-api-environments-environment-id-data-warehouse-check-databas` — Check if a database name is available.
- `/get-api-environments-environment-id-data-warehouse-completed-act` — Returns completed/non-running activities (jobs with sta...
Supports pagination and cutoff time filtering.
- `/get-api-environments-environment-id-data-warehouse-data-health-i` — Returns failed/disabled data pipeline items for the Pip...
Includes: materializations, syncs, sources, destinations, and transformations.
- `/get-api-environments-environment-id-data-warehouse-data-ops-dash` — Returns the data ops overview dashboard ID for this tea...
- `/post-api-environments-environment-id-data-warehouse-deprovision` — Start deprovisioning the managed warehouse for this team.
- `/get-api-environments-environment-id-data-warehouse-job-stats` — Returns success and failed job statistics for the last 1, 7...
Query parameter 'days' can be 1, 7, or 30 (default: 7).
- `/get-api-environments-environment-id-data-warehouse-property-valu` — API endpoints for data warehouse aggregate statistics a...
- `/post-api-environments-environment-id-data-warehouse-provision` — Start provisioning a managed warehouse for this team.
- `/post-api-environments-environment-id-data-warehouse-reset-passwor` — Reset the root password for the managed warehouse.
- `/get-api-environments-environment-id-data-warehouse-running-activ` — Returns currently running activities (jobs with status ...
Supports pagination and cutoff time filtering.
- `/get-api-environments-environment-id-data-warehouse-total-rows-st` — Returns aggregated statistics for the data warehouse to...
Used by the frontend data warehouse scene to display usage information.
- `/get-api-environments-environment-id-data-warehouse-warehouse-sta` — Get the current provisioning status of the managed ware...
- `/get-api-environments-environment-id-dataset-items` — GET /api/environments/{environment_id}/dataset_items/
- `/post-api-environments-environment-id-dataset-items` — POST /api/environments/{environment_id}/dataset_items/
- `/get-api-environments-environment-id-dataset-items-id` — GET /api/environments/{environment_id}/dataset_items/{id}/
- `/put-api-environments-environment-id-dataset-items-id` — PUT /api/environments/{environment_id}/dataset_items/{id}/
- `/patch-api-environments-environment-id-dataset-items-id` — PATCH /api/environments/{environment_id}/dataset_items/{id}/
- `/delete-api-environments-environment-id-dataset-items-id` — Hard delete of this model is not allowed. Use a patch API call t...
- `/get-api-environments-environment-id-datasets` — GET /api/environments/{environment_id}/datasets/
- `/post-api-environments-environment-id-datasets` — POST /api/environments/{environment_id}/datasets/
- `/get-api-environments-environment-id-datasets-id` — GET /api/environments/{environment_id}/datasets/{id}/
- `/put-api-environments-environment-id-datasets-id` — PUT /api/environments/{environment_id}/datasets/{id}/
- `/patch-api-environments-environment-id-datasets-id` — PATCH /api/environments/{environment_id}/datasets/{id}/
- `/delete-api-environments-environment-id-datasets-id` — Hard delete of this model is not allowed. Use a patch API call to set...
- `/get-api-environments-environment-id-elements` — GET /api/environments/{environment_id}/elements/
- `/post-api-environments-environment-id-elements` — POST /api/environments/{environment_id}/elements/
- `/get-api-environments-environment-id-elements-id` — GET /api/environments/{environment_id}/elements/{id}/
- `/put-api-environments-environment-id-elements-id` — PUT /api/environments/{environment_id}/elements/{id}/
- `/patch-api-environments-environment-id-elements-id` — PATCH /api/environments/{environment_id}/elements/{id}/
- `/delete-api-environments-environment-id-elements-id` — DELETE /api/environments/{environment_id}/elements/{id}/
- `/get-api-environments-environment-id-elements-stats` — The original version of this API always and only returned $autocaptur...
If no include query parameter is sent this remains true.
Now, you can pass a combination of include query parameters to get different types of elements
Currently only $autocapture and $rageclick and $dead_click are supported
- `/get-api-environments-environment-id-elements-values` — GET /api/environments/{environment_id}/elements/values/
- `/get-api-environments-environment-id-endpoints` — List all endpoints for the team.
- `/post-api-environments-environment-id-endpoints` — Create a new endpoint.
- `/get-api-environments-environment-id-endpoints-name` — Retrieve an endpoint, or a specific version via ?version=N.
- `/put-api-environments-environment-id-endpoints-name` — Update an existing endpoint. Parameters are optional. Pass version in...
- `/patch-api-environments-environment-id-endpoints-name` — Update an existing endpoint.
- `/delete-api-environments-environment-id-endpoints-name` — Delete an endpoint and clean up materialized query.
- `/post-api-environments-environment-id-endpoints-name-materializati` — Preview the materialization transform for an endpoint....
- `/get-api-environments-environment-id-endpoints-name-materializati` — Get materialization status for an endpoint. Supports ?v...
- `/get-api-environments-environment-id-endpoints-name-openapi-json` — Get OpenAPI 3.0 specification for this endpoint. Use thi...
- `/get-api-environments-environment-id-endpoints-name-run` — Execute endpoint with optional materialization. Supports version ...
- `/post-api-environments-environment-id-endpoints-name-run` — Execute endpoint with optional materialization. Supports version...
- `/get-api-environments-environment-id-endpoints-name-versions` — List all versions for an endpoint.
- `/post-api-environments-environment-id-endpoints-last-execution-tim` — Get the last execution times in the past 6 months for ...
- `/get-api-environments-environment-id-error-tracking-releases` — GET /api/environments/{environment_id}/error_tracking/releases/
- `/post-api-environments-environment-id-error-tracking-releases` — POST /api/environments/{environment_id}/error_tracking/rele...
- `/get-api-environments-environment-id-error-tracking-releases-id` — GET /api/environments/{environment_id}/error_tracking/rel...
- `/put-api-environments-environment-id-error-tracking-releases-id` — PUT /api/environments/{environment_id}/error_tracking/rel...
- `/patch-api-environments-environment-id-error-tracking-releases-id` — PATCH /api/environments/{environment_id}/error_tracking...
- `/delete-api-environments-environment-id-error-tracking-releases-id` — DELETE /api/environments/{environment_id}/error_tracki...
- `/get-api-environments-environment-id-error-tracking-releases-hash` — GET /api/environments/{environment_id}/error_tracking/r...
- `/get-api-environments-environment-id-error-tracking-symbol-sets` — GET /api/environments/{environment_id}/error_tracking/sym...
- `/get-api-environments-environment-id-error-tracking-symbol-sets-i` — GET /api/environments/{environment_id}/error_tracking/s...
- `/delete-api-environments-environment-id-error-tracking-symbol-sets-i` — DELETE /api/environments/{environment_id}/error_trac...
- `/get-api-environments-environment-id-error-tracking-symbol-sets-i` — Return a presigned URL for downloading the symbol set's...
- `/put-api-environments-environment-id-error-tracking-symbol-sets-i` — PUT /api/environments/{environment_id}/error_tracking/s...
- `/post-api-environments-environment-id-error-tracking-symbol-sets-b` — POST /api/environments/{environment_id}/error_tracking...
- `/post-api-environments-environment-id-error-tracking-symbol-sets-b` — POST /api/environments/{environment_id}/error_tracking...
- `/post-api-environments-environment-id-error-tracking-symbol-sets-b` — POST /api/environments/{environment_id}/error_tracking...
- `/get-api-environments-environment-id-events` — 
        This endpoint allows you to list and filter events.
        It is effectively deprecated and is kept only for backwards compatibility.
        If you ever ask about it you will be advised to not use it...
        If you want to ad-hoc list or aggregate events, use the Query endpoint instead.
        If you want to export all events or many pages of events you should use our CDP/Batch Exports products instead.
        
- `/get-api-environments-environment-id-events-id` — GET /api/environments/{environment_id}/events/{id}/
- `/get-api-environments-environment-id-events-values` — GET /api/environments/{environment_id}/events/values/
- `/get-api-environments-environment-id-exports` — GET /api/environments/{environment_id}/exports/
- `/post-api-environments-environment-id-exports` — POST /api/environments/{environment_id}/exports/
- `/get-api-environments-environment-id-exports-id` — GET /api/environments/{environment_id}/exports/{id}/
- `/get-api-environments-environment-id-exports-id-content` — GET /api/environments/{environment_id}/exports/{id}/content/
- `/get-api-environments-environment-id-external-data-schemas` — GET /api/environments/{environment_id}/external_data_schemas/
- `/post-api-environments-environment-id-external-data-schemas` — POST /api/environments/{environment_id}/external_data_schemas/
- `/get-api-environments-environment-id-external-data-schemas-id` — GET /api/environments/{environment_id}/external_data_schema...
- `/put-api-environments-environment-id-external-data-schemas-id` — PUT /api/environments/{environment_id}/external_data_schema...
- `/patch-api-environments-environment-id-external-data-schemas-id` — PATCH /api/environments/{environment_id}/external_data_sc...
- `/delete-api-environments-environment-id-external-data-schemas-id` — DELETE /api/environments/{environment_id}/external_data_...
- `/post-api-environments-environment-id-external-data-schemas-id-can` — POST /api/environments/{environment_id}/external_data_...
- `/delete-api-environments-environment-id-external-data-schemas-id-del` — DELETE /api/environments/{environment_id}/external_d...
- `/post-api-environments-environment-id-external-data-schemas-id-inc` — POST /api/environments/{environment_id}/external_data_...
- `/post-api-environments-environment-id-external-data-schemas-id-rel` — POST /api/environments/{environment_id}/external_data_...
- `/post-api-environments-environment-id-external-data-schemas-id-res` — POST /api/environments/{environment_id}/external_data_...
- `/get-api-environments-environment-id-external-data-sources` — Create, Read, Update and Delete External data Sources.
- `/post-api-environments-environment-id-external-data-sources` — Create, Read, Update and Delete External data Sources.
- `/get-api-environments-environment-id-external-data-sources-id` — Create, Read, Update and Delete External data Sources.
- `/put-api-environments-environment-id-external-data-sources-id` — Create, Read, Update and Delete External data Sources.
- `/patch-api-environments-environment-id-external-data-sources-id` — Create, Read, Update and Delete External data Sources.
- `/delete-api-environments-environment-id-external-data-sources-id` — Create, Read, Update and Delete External data Sources.
- `/patch-api-environments-environment-id-external-data-sources-id-bul` — Create, Read, Update and Delete External data Sources.
- `/post-api-environments-environment-id-external-data-sources-id-cre` — Create, Read, Update and Delete External data Sources.
- `/post-api-environments-environment-id-external-data-sources-id-del` — Create, Read, Update and Delete External data Sources.
- `/get-api-environments-environment-id-external-data-sources-id-job` — Create, Read, Update and Delete External data Sources.
- `/post-api-environments-environment-id-external-data-sources-id-ref` — Fetch current schema/table list from the source and cr...
- `/post-api-environments-environment-id-external-data-sources-id-rel` — Create, Read, Update and Delete External data Sources.
- `/patch-api-environments-environment-id-external-data-sources-id-rev` — Update the revenue analytics configuration and return...
- `/post-api-environments-environment-id-external-data-sources-id-upd` — Create, Read, Update and Delete External data Sources.
- `/get-api-environments-environment-id-external-data-sources-id-web` — Create, Read, Update and Delete External data Sources.
- `/post-api-environments-environment-id-external-data-sources-check-` — Validate CDC prerequisites against a live Postgres con...

Used by the source wizard to surface ✅/❌ checks before source creation,
and by the self-managed setup popup to verify user-created publications.
- `/get-api-environments-environment-id-external-data-sources-connec` — Create, Read, Update and Delete External data Sources.
- `/post-api-environments-environment-id-external-data-sources-databa` — Create, Read, Update and Delete External data Sources.
- `/post-api-environments-environment-id-external-data-sources-source` — Create, Read, Update and Delete External data Sources.
- `/get-api-environments-environment-id-external-data-sources-wizard` — Create, Read, Update and Delete External data Sources.
- `/get-api-environments-environment-id-file-download-batch-exports` — GET /api/environments/{environment_id}/file_download_bat...
- `/post-api-environments-environment-id-file-download-batch-exports` — Create and start a batch export on demand run to downlo...
- `/get-api-environments-environment-id-file-download-batch-exports-` — Get a batch export on demand run.

If the underlying batch export run has completed, we return keys to the
generated file downloads so that users may download them by making a request
to /download.
- `/post-api-environments-environment-id-file-download-batch-exports-` — Cancel an ongoing file-download batch export.
- `/get-api-environments-environment-id-file-download-batch-exports-` — Download a file (or a part) from this batch export run.

Users can provide a part component with an id or index, or no part component at
all:
* If part id is included: The file download matching the id is downloaded.
* If part index is included: The file download matching the index (as ordered
    by key) is downloaded.
* If no part component is present: If there is only one file downloaded, that
    is downloaded. Otherwise the first one as sorted by key is downloaded.
- `/get-api-environments-environment-id-file-download-batch-exports-` — GET /api/environments/{environment_id}/file_download_ba...
- `/get-api-environments-environment-id-file-system` — GET /api/environments/{environment_id}/file_system/
- `/post-api-environments-environment-id-file-system` — POST /api/environments/{environment_id}/file_system/
- `/get-api-environments-environment-id-file-system-id` — GET /api/environments/{environment_id}/file_system/{id}/
- `/put-api-environments-environment-id-file-system-id` — PUT /api/environments/{environment_id}/file_system/{id}/
- `/patch-api-environments-environment-id-file-system-id` — PATCH /api/environments/{environment_id}/file_system/{id}/
- `/delete-api-environments-environment-id-file-system-id` — DELETE /api/environments/{environment_id}/file_system/{id}/
- `/post-api-environments-environment-id-file-system-id-count` — Get count of all files in a folder.
- `/post-api-environments-environment-id-file-system-id-link` — POST /api/environments/{environment_id}/file_system/{id}/link/
- `/post-api-environments-environment-id-file-system-id-move` — POST /api/environments/{environment_id}/file_system/{id}/move/
- `/post-api-environments-environment-id-file-system-count-by-path` — Get count of all files in a folder.
- `/get-api-environments-environment-id-file-system-log-view` — GET /api/environments/{environment_id}/file_system/log_view/
- `/post-api-environments-environment-id-file-system-log-view` — POST /api/environments/{environment_id}/file_system/log_view/
- `/post-api-environments-environment-id-file-system-undo-delete` — POST /api/environments/{environment_id}/file_system/undo_de...
- `/get-api-environments-environment-id-file-system-unfiled` — GET /api/environments/{environment_id}/file_system/unfiled/
- `/get-api-environments-environment-id-file-system-shortcut` — GET /api/environments/{environment_id}/file_system_shortcut/
- `/post-api-environments-environment-id-file-system-shortcut` — POST /api/environments/{environment_id}/file_system_shortcut/
- `/get-api-environments-environment-id-file-system-shortcut-id` — GET /api/environments/{environment_id}/file_system_shortcut/...
- `/put-api-environments-environment-id-file-system-shortcut-id` — PUT /api/environments/{environment_id}/file_system_shortcut/...
- `/patch-api-environments-environment-id-file-system-shortcut-id` — PATCH /api/environments/{environment_id}/file_system_short...
- `/delete-api-environments-environment-id-file-system-shortcut-id` — DELETE /api/environments/{environment_id}/file_system_sho...
- `/post-api-environments-environment-id-file-system-shortcut-reorder` — Set the display order of the current user's shortcuts....
- `/get-api-environments-environment-id-groups` — List all groups of a specific group type. You must pass ?group_type_index= in...
To get a list of valid group types, call /api/:project_id/groups_types/.

Uses forward-only keyset pagination via the `cursor` parameter.
The `previous` field in the response envelope is always null.
- `/post-api-environments-environment-id-groups` — POST /api/environments/{environment_id}/groups/
- `/get-api-environments-environment-id-groups-activity` — GET /api/environments/{environment_id}/groups/activity/
- `/post-api-environments-environment-id-groups-delete-property` — POST /api/environments/{environment_id}/groups/delete_property/
- `/get-api-environments-environment-id-groups-find` — GET /api/environments/{environment_id}/groups/find/
- `/get-api-environments-environment-id-groups-property-definitions` — GET /api/environments/{environment_id}/groups/property_d...
- `/get-api-environments-environment-id-groups-property-values` — GET /api/environments/{environment_id}/groups/property_values/
- `/get-api-environments-environment-id-groups-related` — GET /api/environments/{environment_id}/groups/related/
- `/post-api-environments-environment-id-groups-update-property` — POST /api/environments/{environment_id}/groups/update_property/
- `/get-api-environments-environment-id-heatmap-screenshots-id-conte` — GET /api/environments/{environment_id}/heatmap_screensh...
- `/get-api-environments-environment-id-heatmaps` — GET /api/environments/{environment_id}/heatmaps/
- `/get-api-environments-environment-id-heatmaps-events` — GET /api/environments/{environment_id}/heatmaps/events/
- `/get-api-environments-environment-id-hog-flows` — GET /api/environments/{environment_id}/hog_flows/
- `/post-api-environments-environment-id-hog-flows` — POST /api/environments/{environment_id}/hog_flows/
- `/get-api-environments-environment-id-hog-flows-id` — GET /api/environments/{environment_id}/hog_flows/{id}/
- `/put-api-environments-environment-id-hog-flows-id` — PUT /api/environments/{environment_id}/hog_flows/{id}/
- `/patch-api-environments-environment-id-hog-flows-id` — PATCH /api/environments/{environment_id}/hog_flows/{id}/
- `/delete-api-environments-environment-id-hog-flows-id` — DELETE /api/environments/{environment_id}/hog_flows/{id}/
- `/get-api-environments-environment-id-hog-flows-id-batch-jobs` — GET /api/environments/{environment_id}/hog_flows/{id}/batch_...
- `/post-api-environments-environment-id-hog-flows-id-batch-jobs` — POST /api/environments/{environment_id}/hog_flows/{id}/batc...
- `/post-api-environments-environment-id-hog-flows-id-invocations` — POST /api/environments/{environment_id}/hog_flows/{id}/inv...
- `/get-api-environments-environment-id-hog-flows-id-logs` — GET /api/environments/{environment_id}/hog_flows/{id}/logs/
- `/get-api-environments-environment-id-hog-flows-id-metrics` — GET /api/environments/{environment_id}/hog_flows/{id}/metrics/
- `/get-api-environments-environment-id-hog-flows-id-metrics-totals` — GET /api/environments/{environment_id}/hog_flows/{id}/me...
- `/get-api-environments-environment-id-hog-flows-id-schedules` — GET /api/environments/{environment_id}/hog_flows/{id}/schedules/
- `/post-api-environments-environment-id-hog-flows-id-schedules` — POST /api/environments/{environment_id}/hog_flows/{id}/sched...
- `/patch-api-environments-environment-id-hog-flows-id-schedules-sched` — PATCH /api/environments/{environment_id}/hog_flows/{i...
- `/delete-api-environments-environment-id-hog-flows-id-schedules-sched` — DELETE /api/environments/{environment_id}/hog_flows/...
- `/post-api-environments-environment-id-hog-flows-bulk-delete` — POST /api/environments/{environment_id}/hog_flows/bulk_delete/
- `/post-api-environments-environment-id-hog-flows-user-blast-radius` — POST /api/environments/{environment_id}/hog_flows/user_...
- `/get-api-environments-environment-id-hog-functions` — GET /api/environments/{environment_id}/hog_functions/
- `/post-api-environments-environment-id-hog-functions` — POST /api/environments/{environment_id}/hog_functions/
- `/get-api-environments-environment-id-hog-functions-id` — GET /api/environments/{environment_id}/hog_functions/{id}/
- `/put-api-environments-environment-id-hog-functions-id` — PUT /api/environments/{environment_id}/hog_functions/{id}/
- `/patch-api-environments-environment-id-hog-functions-id` — PATCH /api/environments/{environment_id}/hog_functions/{id}/
- `/delete-api-environments-environment-id-hog-functions-id` — Hard delete of this model is not allowed. Use a patch API call t...
- `/post-api-environments-environment-id-hog-functions-id-enable-back` — POST /api/environments/{environment_id}/hog_functions/...
- `/post-api-environments-environment-id-hog-functions-id-invocations` — POST /api/environments/{environment_id}/hog_functions/...
- `/get-api-environments-environment-id-hog-functions-id-logs` — GET /api/environments/{environment_id}/hog_functions/{id}/logs/
- `/get-api-environments-environment-id-hog-functions-id-metrics` — GET /api/environments/{environment_id}/hog_functions/{id}/m...
- `/get-api-environments-environment-id-hog-functions-id-metrics-tot` — GET /api/environments/{environment_id}/hog_functions/{i...
- `/get-api-environments-environment-id-hog-functions-icon` — GET /api/environments/{environment_id}/hog_functions/icon/
- `/get-api-environments-environment-id-hog-functions-icons` — GET /api/environments/{environment_id}/hog_functions/icons/
- `/patch-api-environments-environment-id-hog-functions-rearrange` — Update the execution order of multiple HogFunctions.
- `/get-api-environments-environment-id-insight-variables` — GET /api/environments/{environment_id}/insight_variables/
- `/post-api-environments-environment-id-insight-variables` — POST /api/environments/{environment_id}/insight_variables/
- `/get-api-environments-environment-id-insight-variables-id` — GET /api/environments/{environment_id}/insight_variables/{id}/
- `/put-api-environments-environment-id-insight-variables-id` — PUT /api/environments/{environment_id}/insight_variables/{id}/
- `/patch-api-environments-environment-id-insight-variables-id` — PATCH /api/environments/{environment_id}/insight_variables/{id}/
- `/delete-api-environments-environment-id-insight-variables-id` — DELETE /api/environments/{environment_id}/insight_variables/...
- `/get-api-environments-environment-id-insights` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/post-api-environments-environment-id-insights` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/get-api-environments-environment-id-insights-insight-id-sharing` — GET /api/environments/{environment_id}/insights/{insight...
- `/post-api-environments-environment-id-insights-insight-id-sharing-` — Create a new password for the sharing configuration.
- `/delete-api-environments-environment-id-insights-insight-id-sharing-` — Delete a password from the sharing configuration.
- `/post-api-environments-environment-id-insights-insight-id-sharing-` — POST /api/environments/{environment_id}/insights/{insi...
- `/get-api-environments-environment-id-insights-insight-id-threshol` — GET /api/environments/{environment_id}/insights/{insigh...
- `/get-api-environments-environment-id-insights-insight-id-threshol` — GET /api/environments/{environment_id}/insights/{insigh...
- `/get-api-environments-environment-id-insights-id` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/put-api-environments-environment-id-insights-id` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/patch-api-environments-environment-id-insights-id` — DRF ViewSet mixin that gates coalesced responses behind permission che...

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/delete-api-environments-environment-id-insights-id` — Hard delete of this model is not allowed. Use a patch API call to set...
- `/get-api-environments-environment-id-insights-id-activity` — Audit trail for a single insight — every change made to it, by ...
- `/get-api-environments-environment-id-insights-id-analyze` — DRF ViewSet mixin that gates coalesced responses behind permissi...

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/get-api-environments-environment-id-insights-id-suggestions` — DRF ViewSet mixin that gates coalesced responses behind perm...

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/post-api-environments-environment-id-insights-id-suggestions` — DRF ViewSet mixin that gates coalesced responses behind per...

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/get-api-environments-environment-id-insights-activity` — Project-wide audit trail across all insights — who created, edited...
- `/post-api-environments-environment-id-insights-bulk-update-tags` — Bulk update tags on multiple objects.

PAT access: this action has no ``required_scopes=`` on the decorator —
inheriting viewsets must add ``"bulk_update_tags"`` to their
``scope_object_write_actions`` list to accept personal API keys.
Without that opt-in, ``APIScopePermission`` rejects PAT requests with
"This action does not support personal API key access". Done per-viewset
so granting ``<scope>:write`` for one resource doesn't leak access to
sibling resources that share this mixin.

Accepts:
- {"ids": [...], "action": "add"|"remove"|"set", "tags": ["tag1", "tag2"]}

Actions:
- "add": Add tags to existing tags on each object
- "remove": Remove specific tags from each object
- "set": Replace all tags on each object with the provided list
- `/post-api-environments-environment-id-insights-cancel` — DRF ViewSet mixin that gates coalesced responses behind permission ...

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/post-api-environments-environment-id-insights-generate-metadata` — Generate an AI-suggested name and description for an ins...
- `/get-api-environments-environment-id-insights-my-last-viewed` — Returns basic details about the last 5 insights viewed by th...
- `/get-api-environments-environment-id-insights-trending` — Returns insights ranked by view count over the last N days (defaul...
- `/post-api-environments-environment-id-insights-viewed` — Record that the current user has just viewed one or more insights. ...
- `/get-api-environments-environment-id-integrations` — GET /api/environments/{environment_id}/integrations/
- `/post-api-environments-environment-id-integrations` — POST /api/environments/{environment_id}/integrations/
- `/get-api-environments-environment-id-integrations-id` — GET /api/environments/{environment_id}/integrations/{id}/
- `/delete-api-environments-environment-id-integrations-id` — DELETE /api/environments/{environment_id}/integrations/{id}/
- `/get-api-environments-environment-id-integrations-id-anthropic-ma` — GET /api/environments/{environment_id}/integrations/{id...
- `/get-api-environments-environment-id-integrations-id-anthropic-ma` — GET /api/environments/{environment_id}/integrations/{id...
- `/get-api-environments-environment-id-integrations-id-anthropic-ma` — GET /api/environments/{environment_id}/integrations/{id...
- `/get-api-environments-environment-id-integrations-id-channels` — GET /api/environments/{environment_id}/integrations/{id}/ch...
- `/get-api-environments-environment-id-integrations-id-clickup-list` — GET /api/environments/{environment_id}/integrations/{id...
- `/get-api-environments-environment-id-integrations-id-clickup-spac` — GET /api/environments/{environment_id}/integrations/{id...
- `/get-api-environments-environment-id-integrations-id-clickup-work` — GET /api/environments/{environment_id}/integrations/{id...
- `/patch-api-environments-environment-id-integrations-id-email` — PATCH /api/environments/{environment_id}/integrations/{id}/e...
- `/post-api-environments-environment-id-integrations-id-email-verify` — POST /api/environments/{environment_id}/integrations/{...
- `/get-api-environments-environment-id-integrations-id-github-branc` — GET /api/environments/{environment_id}/integrations/{id...
- `/get-api-environments-environment-id-integrations-id-github-repos` — GET /api/environments/{environment_id}/integrations/{id...
- `/post-api-environments-environment-id-integrations-id-github-repos` — POST /api/environments/{environment_id}/integrations/{...
- `/get-api-environments-environment-id-integrations-id-github-teams` — GET /api/environments/{environment_id}/integrations/{id...
- `/get-api-environments-environment-id-integrations-id-google-acces` — GET /api/environments/{environment_id}/integrations/{id...
- `/get-api-environments-environment-id-integrations-id-google-conve` — GET /api/environments/{environment_id}/integrations/{id...
- `/get-api-environments-environment-id-integrations-id-jira-project` — GET /api/environments/{environment_id}/integrations/{id...
- `/get-api-environments-environment-id-integrations-id-linear-teams` — GET /api/environments/{environment_id}/integrations/{id...
- `/get-api-environments-environment-id-integrations-id-linkedin-ads` — GET /api/environments/{environment_id}/integrations/{id...
- `/get-api-environments-environment-id-integrations-id-linkedin-ads` — GET /api/environments/{environment_id}/integrations/{id...
- `/get-api-environments-environment-id-integrations-id-twilio-phone` — GET /api/environments/{environment_id}/integrations/{id...
- `/get-api-environments-environment-id-integrations-authorize` — GET /api/environments/{environment_id}/integrations/authorize/
- `/post-api-environments-environment-id-integrations-domain-connect-` — Unified endpoint for generating Domain Connect apply U...

Accepts a context ("email" or "proxy") and the relevant resource ID.
The backend resolves the domain, template variables, and service ID
based on context, then builds the signed apply URL.
- `/get-api-environments-environment-id-integrations-domain-connect-` — GET /api/environments/{environment_id}/integrations/dom...
- `/post-api-environments-environment-id-integrations-github-link-exi` — Reuse a GitHub installation already linked to a siblin...
- `/post-api-environments-environment-id-integrations-github-oauth-au` — Mint a User OAuth URL to bootstrap a fresh `code` when...
- `/get-api-environments-environment-id-logs-alerts` — GET /api/environments/{environment_id}/logs/alerts/
- `/post-api-environments-environment-id-logs-alerts` — POST /api/environments/{environment_id}/logs/alerts/
- `/get-api-environments-environment-id-logs-alerts-id` — GET /api/environments/{environment_id}/logs/alerts/{id}/
- `/put-api-environments-environment-id-logs-alerts-id` — PUT /api/environments/{environment_id}/logs/alerts/{id}/
- `/patch-api-environments-environment-id-logs-alerts-id` — PATCH /api/environments/{environment_id}/logs/alerts/{id}/
- `/delete-api-environments-environment-id-logs-alerts-id` — DELETE /api/environments/{environment_id}/logs/alerts/{id}/
- `/post-api-environments-environment-id-logs-alerts-id-destinations` — Create a notification destination for this alert. One H...
- `/post-api-environments-environment-id-logs-alerts-id-destinations-` — Delete a notification destination by deleting its HogF...
- `/get-api-environments-environment-id-logs-alerts-id-events` — Paginated event history for this alert, newest first. Returns ...
- `/post-api-environments-environment-id-logs-alerts-id-reset` — Reset a broken alert. Clears the consecutive-failure counter a...
- `/post-api-environments-environment-id-logs-alerts-simulate` — Simulate a logs alert on historical data using the full state ...
- `/get-api-environments-environment-id-logs-attributes` — GET /api/environments/{environment_id}/logs/attributes/
- `/post-api-environments-environment-id-logs-count` — POST /api/environments/{environment_id}/logs/count/
- `/post-api-environments-environment-id-logs-count-ranges` — POST /api/environments/{environment_id}/logs/count-ranges/
- `/post-api-environments-environment-id-logs-export` — POST /api/environments/{environment_id}/logs/export/
- `/get-api-environments-environment-id-logs-has-logs` — GET /api/environments/{environment_id}/logs/has_logs/
- `/post-api-environments-environment-id-logs-query` — POST /api/environments/{environment_id}/logs/query/
- `/get-api-environments-environment-id-logs-sampling-rules` — GET /api/environments/{environment_id}/logs/sampling_rules/
- `/post-api-environments-environment-id-logs-sampling-rules` — POST /api/environments/{environment_id}/logs/sampling_rules/
- `/get-api-environments-environment-id-logs-sampling-rules-id` — GET /api/environments/{environment_id}/logs/sampling_rules/{id}/
- `/put-api-environments-environment-id-logs-sampling-rules-id` — PUT /api/environments/{environment_id}/logs/sampling_rules/{id}/
- `/patch-api-environments-environment-id-logs-sampling-rules-id` — PATCH /api/environments/{environment_id}/logs/sampling_rule...
- `/delete-api-environments-environment-id-logs-sampling-rules-id` — DELETE /api/environments/{environment_id}/logs/sampling_ru...
- `/post-api-environments-environment-id-logs-sampling-rules-id-simul` — Dry-run estimate for how much volume this rule would r...
- `/post-api-environments-environment-id-logs-sampling-rules-reorder` — Atomically reassign priorities so the given ID order ma...
- `/post-api-environments-environment-id-logs-services` — POST /api/environments/{environment_id}/logs/services/
- `/post-api-environments-environment-id-logs-sparkline` — POST /api/environments/{environment_id}/logs/sparkline/
- `/get-api-environments-environment-id-logs-values` — GET /api/environments/{environment_id}/logs/values/
- `/get-api-environments-environment-id-metrics-has-metrics` — GET /api/environments/{environment_id}/metrics/has_metrics/
- `/post-api-environments-environment-id-metrics-query` — POST /api/environments/{environment_id}/metrics/query/
- `/get-api-environments-environment-id-metrics-values` — Distinct metric names for the team. Backs the picker UI.
- `/get-api-environments-environment-id-persisted-folder` — GET /api/environments/{environment_id}/persisted_folder/
- `/post-api-environments-environment-id-persisted-folder` — POST /api/environments/{environment_id}/persisted_folder/
- `/get-api-environments-environment-id-persisted-folder-id` — GET /api/environments/{environment_id}/persisted_folder/{id}/
- `/put-api-environments-environment-id-persisted-folder-id` — PUT /api/environments/{environment_id}/persisted_folder/{id}/
- `/patch-api-environments-environment-id-persisted-folder-id` — PATCH /api/environments/{environment_id}/persisted_folder/{id}/
- `/delete-api-environments-environment-id-persisted-folder-id` — DELETE /api/environments/{environment_id}/persisted_folder/{id}/
- `/get-api-environments-environment-id-persons` — This endpoint is meant for reading and deleting persons. To create or update...
- `/get-api-environments-environment-id-persons-id` — This endpoint is meant for reading and deleting persons. To create or upd...
- `/put-api-environments-environment-id-persons-id` — Only for setting properties on the person. "properties" from the request ...
This means that only the properties listed will be updated, but other properties won't be removed nor updated.
If you would like to remove a property use the `delete_property` endpoint.
- `/patch-api-environments-environment-id-persons-id` — This endpoint is meant for reading and deleting persons. To create or u...
- `/get-api-environments-environment-id-persons-id-activity` — This endpoint is meant for reading and deleting persons. To crea...
- `/post-api-environments-environment-id-persons-id-delete-property` — This endpoint is meant for reading and deleting persons....
- `/get-api-environments-environment-id-persons-id-properties-timeli` — This endpoint is meant for reading and deleting persons...
- `/post-api-environments-environment-id-persons-id-split` — This endpoint is meant for reading and deleting persons. To create...
- `/post-api-environments-environment-id-persons-id-update-property` — This endpoint is meant for reading and deleting persons....
- `/get-api-environments-environment-id-persons-activity` — This endpoint is meant for reading and deleting persons. To create ...
- `/post-api-environments-environment-id-persons-batch-by-distinct-id` — This endpoint is meant for reading and deleting person...
- `/post-api-environments-environment-id-persons-batch-by-uuids` — This endpoint is meant for reading and deleting persons. To ...
- `/post-api-environments-environment-id-persons-bulk-delete` — This endpoint allows you to bulk delete persons, either by the ...
- `/get-api-environments-environment-id-persons-cohorts` — This endpoint is meant for reading and deleting persons. To create o...
- `/get-api-environments-environment-id-persons-deletion-status` — List the status of queued event deletions for persons. When ...
- `/get-api-environments-environment-id-persons-funnel` — This endpoint is meant for reading and deleting persons. To create or...
- `/post-api-environments-environment-id-persons-funnel` — This endpoint is meant for reading and deleting persons. To create o...
- `/get-api-environments-environment-id-persons-funnel-correlation` — This endpoint is meant for reading and deleting persons. ...
- `/post-api-environments-environment-id-persons-funnel-correlation` — This endpoint is meant for reading and deleting persons....
- `/get-api-environments-environment-id-persons-lifecycle` — This endpoint is meant for reading and deleting persons. To create...
- `/get-api-environments-environment-id-persons-properties-at-time` — Get person properties as they existed at a specific point...

This endpoint reconstructs person properties by querying ClickHouse events
for $set and $set_once operations up to the specified timestamp.

Query parameters:
- distinct_id: The distinct_id of the person
- timestamp: ISO datetime string for the point in time (e.g., "2023-06-15T14:30:00Z")
- include_set_once: Whether to handle $set_once operations (default: false)
- `/post-api-environments-environment-id-persons-reset-person-distinc` — Reset a distinct_id for a deleted person. This allows ...
- `/get-api-environments-environment-id-persons-trends` — This endpoint is meant for reading and deleting persons. To create or...
- `/get-api-environments-environment-id-persons-values` — This endpoint is meant for reading and deleting persons. To create or...
- `/get-api-environments-environment-id-plugin-configs-plugin-config` — GET /api/environments/{environment_id}/plugin_configs/{...
- `/get-api-environments-environment-id-project-secret-api-keys` — GET /api/environments/{environment_id}/project_secret_api_keys/
- `/post-api-environments-environment-id-project-secret-api-keys` — POST /api/environments/{environment_id}/project_secret_api_...
- `/get-api-environments-environment-id-project-secret-api-keys-id` — GET /api/environments/{environment_id}/project_secret_api...
- `/put-api-environments-environment-id-project-secret-api-keys-id` — PUT /api/environments/{environment_id}/project_secret_api...
- `/patch-api-environments-environment-id-project-secret-api-keys-id` — PATCH /api/environments/{environment_id}/project_secret...
- `/delete-api-environments-environment-id-project-secret-api-keys-id` — DELETE /api/environments/{environment_id}/project_secr...
- `/post-api-environments-environment-id-project-secret-api-keys-id-r` — Roll a project secret API key
- `/post-api-environments-environment-id-query` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/get-api-environments-environment-id-query-id` — (Experimental)
- `/delete-api-environments-environment-id-query-id` — (Experimental)
- `/get-api-environments-environment-id-query-id-log` — Get query log details from query_log_archive table for a specific query...
- `/post-api-environments-environment-id-query-query-kind` — DRF ViewSet mixin that gates coalesced responses behind permission...

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/post-api-environments-environment-id-query-check-auth-for-async` — DRF ViewSet mixin that gates coalesced responses behind ...

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/get-api-environments-environment-id-query-draft-sql` — DRF ViewSet mixin that gates coalesced responses behind permission c...

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/post-api-environments-environment-id-query-upgrade` — Upgrades a query without executing it. Returns a query with all nodes...
- `/get-api-environments-environment-id-saved` — GET /api/environments/{environment_id}/saved/
- `/post-api-environments-environment-id-saved` — POST /api/environments/{environment_id}/saved/
- `/get-api-environments-environment-id-saved-short-id` — GET /api/environments/{environment_id}/saved/{short_id}/
- `/patch-api-environments-environment-id-saved-short-id` — PATCH /api/environments/{environment_id}/saved/{short_id}/
- `/delete-api-environments-environment-id-saved-short-id` — Hard delete of this model is not allowed. Use a patch API call to ...
- `/post-api-environments-environment-id-saved-short-id-regenerate` — POST /api/environments/{environment_id}/saved/{short_id}/...
- `/get-api-environments-environment-id-session-recording-playlists` — Override list to include synthetic playlists
- `/post-api-environments-environment-id-session-recording-playlists` — POST /api/environments/{environment_id}/session_recordi...
- `/get-api-environments-environment-id-session-recording-playlists-` — GET /api/environments/{environment_id}/session_recordin...
- `/put-api-environments-environment-id-session-recording-playlists-` — PUT /api/environments/{environment_id}/session_recordin...
- `/patch-api-environments-environment-id-session-recording-playlists-` — PATCH /api/environments/{environment_id}/session_reco...
- `/delete-api-environments-environment-id-session-recording-playlists-` — Hard delete of this model is not allowed. Use a patc...
- `/get-api-environments-environment-id-session-recording-playlists-` — GET /api/environments/{environment_id}/session_recordin...
- `/post-api-environments-environment-id-session-recording-playlists-` — POST /api/environments/{environment_id}/session_record...
- `/delete-api-environments-environment-id-session-recording-playlists-` — DELETE /api/environments/{environment_id}/session_re...
- `/get-api-environments-environment-id-session-recordings` — GET /api/environments/{environment_id}/session_recordings/
- `/get-api-environments-environment-id-session-recordings-id` — GET /api/environments/{environment_id}/session_recordings/{id}/
- `/put-api-environments-environment-id-session-recordings-id` — PUT /api/environments/{environment_id}/session_recordings/{id}/
- `/patch-api-environments-environment-id-session-recordings-id` — PATCH /api/environments/{environment_id}/session_recordings/...
- `/delete-api-environments-environment-id-session-recordings-id` — DELETE /api/environments/{environment_id}/session_recording...
- `/get-api-environments-environment-id-session-recordings-recording` — GET /api/environments/{environment_id}/session_recordin...
- `/post-api-environments-environment-id-session-recordings-recording` — Create a new password for the sharing configuration.
- `/delete-api-environments-environment-id-session-recordings-recording` — Delete a password from the sharing configuration.
- `/post-api-environments-environment-id-session-recordings-recording` — POST /api/environments/{environment_id}/session_record...
- `/get-api-environments-environment-id-sessions-property-definition` — GET /api/environments/{environment_id}/sessions/propert...
- `/get-api-environments-environment-id-sessions-values` — GET /api/environments/{environment_id}/sessions/values/
- `/get-api-environments-environment-id-subscriptions` — GET /api/environments/{environment_id}/subscriptions/
- `/post-api-environments-environment-id-subscriptions` — POST /api/environments/{environment_id}/subscriptions/
- `/get-api-environments-environment-id-subscriptions-id` — GET /api/environments/{environment_id}/subscriptions/{id}/
- `/put-api-environments-environment-id-subscriptions-id` — PUT /api/environments/{environment_id}/subscriptions/{id}/
- `/patch-api-environments-environment-id-subscriptions-id` — PATCH /api/environments/{environment_id}/subscriptions/{id}/
- `/delete-api-environments-environment-id-subscriptions-id` — Hard delete of this model is not allowed. Use a patch API call t...
- `/post-api-environments-environment-id-subscriptions-id-test-delive` — POST /api/environments/{environment_id}/subscriptions/...
- `/get-api-environments-environment-id-subscriptions-summary-quota` — GET /api/environments/{environment_id}/subscriptions/sum...
- `/get-api-environments-environment-id-warehouse-saved-queries` — Create, Read, Update and Delete Warehouse Tables.
- `/post-api-environments-environment-id-warehouse-saved-queries` — Create, Read, Update and Delete Warehouse Tables.
- `/get-api-environments-environment-id-warehouse-saved-queries-id` — Create, Read, Update and Delete Warehouse Tables.
- `/put-api-environments-environment-id-warehouse-saved-queries-id` — Create, Read, Update and Delete Warehouse Tables.
- `/patch-api-environments-environment-id-warehouse-saved-queries-id` — Create, Read, Update and Delete Warehouse Tables.
- `/delete-api-environments-environment-id-warehouse-saved-queries-id` — Create, Read, Update and Delete Warehouse Tables.
- `/get-api-environments-environment-id-warehouse-saved-queries-id-a` — Create, Read, Update and Delete Warehouse Tables.
- `/post-api-environments-environment-id-warehouse-saved-queries-id-a` — Return the ancestors of this saved query.

By default, we return the immediate parents. The `level` parameter can be used to
look further back into the ancestor tree. If `level` overshoots (i.e. points to only
ancestors beyond the root), we return an empty list.
- `/post-api-environments-environment-id-warehouse-saved-queries-id-c` — Cancel a running saved query workflow.
- `/get-api-environments-environment-id-warehouse-saved-queries-id-d` — Return the count of immediate upstream and downstream d...
- `/post-api-environments-environment-id-warehouse-saved-queries-id-d` — Return the descendants of this saved query.

By default, we return the immediate children. The `level` parameter can be used to
look further ahead into the descendants tree. If `level` overshoots (i.e. points to only
descendants further than a leaf), we return an empty list.
- `/post-api-environments-environment-id-warehouse-saved-queries-id-m` — Enable materialization for this saved query with a 24-...
- `/post-api-environments-environment-id-warehouse-saved-queries-id-r` — Undo materialization, revert back to the original view.
(i.e. delete the materialized table and the schedule)
- `/post-api-environments-environment-id-warehouse-saved-queries-id-r` — Run this saved query.
- `/get-api-environments-environment-id-warehouse-saved-queries-id-r` — Return the recent run history (up to 5 most recent) for...
- `/post-api-environments-environment-id-warehouse-saved-queries-resu` — Resume paused materialization schedules for multiple m...

Accepts a list of view IDs in the request body: {"view_ids": ["id1", "id2", ...]}
This endpoint is idempotent - calling it on already running or non-existent schedules is safe.
- `/get-api-environments-environment-id-warehouse-saved-query-folder` — GET /api/environments/{environment_id}/warehouse_saved_...
- `/post-api-environments-environment-id-warehouse-saved-query-folder` — POST /api/environments/{environment_id}/warehouse_save...
- `/get-api-environments-environment-id-warehouse-saved-query-folder` — GET /api/environments/{environment_id}/warehouse_saved_...
- `/patch-api-environments-environment-id-warehouse-saved-query-folder` — PATCH /api/environments/{environment_id}/warehouse_sa...
- `/delete-api-environments-environment-id-warehouse-saved-query-folder` — DELETE /api/environments/{environment_id}/warehouse_...
- `/get-api-environments-environment-id-warehouse-tables` — Create, Read, Update and Delete Warehouse Tables.
- `/post-api-environments-environment-id-warehouse-tables` — Create, Read, Update and Delete Warehouse Tables.
- `/get-api-environments-environment-id-warehouse-tables-id` — Create, Read, Update and Delete Warehouse Tables.
- `/put-api-environments-environment-id-warehouse-tables-id` — Create, Read, Update and Delete Warehouse Tables.
- `/patch-api-environments-environment-id-warehouse-tables-id` — Create, Read, Update and Delete Warehouse Tables.
- `/delete-api-environments-environment-id-warehouse-tables-id` — Create, Read, Update and Delete Warehouse Tables.
- `/post-api-environments-environment-id-warehouse-tables-id-refresh-` — Create, Read, Update and Delete Warehouse Tables.
- `/post-api-environments-environment-id-warehouse-tables-id-update-s` — Create, Read, Update and Delete Warehouse Tables.
- `/post-api-environments-environment-id-warehouse-tables-file` — Create, Read, Update and Delete Warehouse Tables.
- `/get-api-environments-environment-id-warehouse-view-link` — Create, Read, Update and Delete View Columns.
- `/post-api-environments-environment-id-warehouse-view-link` — Create, Read, Update and Delete View Columns.
- `/get-api-environments-environment-id-warehouse-view-link-id` — Create, Read, Update and Delete View Columns.
- `/put-api-environments-environment-id-warehouse-view-link-id` — Create, Read, Update and Delete View Columns.
- `/patch-api-environments-environment-id-warehouse-view-link-id` — Create, Read, Update and Delete View Columns.
- `/delete-api-environments-environment-id-warehouse-view-link-id` — Create, Read, Update and Delete View Columns.
- `/post-api-environments-environment-id-warehouse-view-link-validate` — Create, Read, Update and Delete View Columns.
- `/get-api-environments-environment-id-warehouse-view-links` — Create, Read, Update and Delete View Columns.
- `/post-api-environments-environment-id-warehouse-view-links` — Create, Read, Update and Delete View Columns.
- `/get-api-environments-environment-id-warehouse-view-links-id` — Create, Read, Update and Delete View Columns.
- `/put-api-environments-environment-id-warehouse-view-links-id` — Create, Read, Update and Delete View Columns.
- `/patch-api-environments-environment-id-warehouse-view-links-id` — Create, Read, Update and Delete View Columns.
- `/delete-api-environments-environment-id-warehouse-view-links-id` — Create, Read, Update and Delete View Columns.
- `/post-api-environments-environment-id-warehouse-view-links-validat` — Create, Read, Update and Delete View Columns.
- `/get-api-environments-project-id-accounts` — GET /api/environments/{project_id}/accounts/
- `/post-api-environments-project-id-accounts` — POST /api/environments/{project_id}/accounts/
- `/get-api-environments-project-id-accounts-account-id-notebooks` — GET /api/environments/{project_id}/accounts/{account_id}/n...
- `/post-api-environments-project-id-accounts-account-id-notebooks` — POST /api/environments/{project_id}/accounts/{account_id}...
- `/get-api-environments-project-id-accounts-account-id-notebooks-sh` — GET /api/environments/{project_id}/accounts/{account_id...
- `/delete-api-environments-project-id-accounts-account-id-notebooks-sh` — DELETE /api/environments/{project_id}/accounts/{acco...
- `/get-api-environments-project-id-accounts-id` — GET /api/environments/{project_id}/accounts/{id}/
- `/put-api-environments-project-id-accounts-id` — PUT /api/environments/{project_id}/accounts/{id}/
- `/patch-api-environments-project-id-accounts-id` — PATCH /api/environments/{project_id}/accounts/{id}/
- `/delete-api-environments-project-id-accounts-id` — DELETE /api/environments/{project_id}/accounts/{id}/
- `/get-api-environments-project-id-approval-policies` — GET /api/environments/{project_id}/approval_policies/
- `/post-api-environments-project-id-approval-policies` — POST /api/environments/{project_id}/approval_policies/
- `/get-api-environments-project-id-approval-policies-id` — GET /api/environments/{project_id}/approval_policies/{id}/
- `/put-api-environments-project-id-approval-policies-id` — PUT /api/environments/{project_id}/approval_policies/{id}/
- `/patch-api-environments-project-id-approval-policies-id` — PATCH /api/environments/{project_id}/approval_policies/{id}/
- `/delete-api-environments-project-id-approval-policies-id` — DELETE /api/environments/{project_id}/approval_policies/{id}/
- `/get-api-environments-project-id-change-requests` — GET /api/environments/{project_id}/change_requests/
- `/get-api-environments-project-id-change-requests-id` — GET /api/environments/{project_id}/change_requests/{id}/
- `/post-api-environments-project-id-change-requests-id-approve` — Approve a change request.
If quorum is reached, automatically applies the change immediately.
- `/post-api-environments-project-id-change-requests-id-cancel` — Cancel a change request.
Only the requester can cancel their own pending change request.
- `/post-api-environments-project-id-change-requests-id-reject` — Reject a change request.
- `/get-api-environments-project-id-conversations` — GET /api/environments/{project_id}/conversations/
- `/post-api-environments-project-id-conversations` — Unified endpoint that handles both conversation creation and streaming.

- If message is provided: Start new conversation processing
- If no message: Stream from existing conversation
- `/get-api-environments-project-id-conversations-conversation` — GET /api/environments/{project_id}/conversations/{conversation}/
- `/delete-api-environments-project-id-conversations-conversation` — Delete a conversation.
- `/post-api-environments-project-id-conversations-conversation-appen` — Appends a message to an existing conversation without ...
This is used for client-side generated messages that need to be persisted
(e.g., support ticket confirmation messages).
- `/patch-api-environments-project-id-conversations-conversation-cance` — PATCH /api/environments/{project_id}/conversations/{c...
- `/get-api-environments-project-id-conversations-conversation-queue` — GET /api/environments/{project_id}/conversations/{conve...
- `/post-api-environments-project-id-conversations-conversation-queue` — POST /api/environments/{project_id}/conversations/{con...
- `/patch-api-environments-project-id-conversations-conversation-queue` — PATCH /api/environments/{project_id}/conversations/{c...
- `/delete-api-environments-project-id-conversations-conversation-queue` — DELETE /api/environments/{project_id}/conversations/...
- `/post-api-environments-project-id-conversations-conversation-queue` — POST /api/environments/{project_id}/conversations/{con...
- `/get-api-environments-project-id-conversations-views` — GET /api/environments/{project_id}/conversations/views/
- `/post-api-environments-project-id-conversations-views` — POST /api/environments/{project_id}/conversations/views/
- `/get-api-environments-project-id-conversations-views-short-id` — GET /api/environments/{project_id}/conversations/views/{sho...
- `/delete-api-environments-project-id-conversations-views-short-id` — DELETE /api/environments/{project_id}/conversations/view...
- `/get-api-environments-project-id-customer-journeys` — GET /api/environments/{project_id}/customer_journeys/
- `/post-api-environments-project-id-customer-journeys` — POST /api/environments/{project_id}/customer_journeys/
- `/get-api-environments-project-id-customer-journeys-id` — GET /api/environments/{project_id}/customer_journeys/{id}/
- `/put-api-environments-project-id-customer-journeys-id` — PUT /api/environments/{project_id}/customer_journeys/{id}/
- `/patch-api-environments-project-id-customer-journeys-id` — PATCH /api/environments/{project_id}/customer_journeys/{id}/
- `/delete-api-environments-project-id-customer-journeys-id` — DELETE /api/environments/{project_id}/customer_journeys/{id}/
- `/get-api-environments-project-id-customer-profile-configs` — GET /api/environments/{project_id}/customer_profile_configs/
- `/post-api-environments-project-id-customer-profile-configs` — POST /api/environments/{project_id}/customer_profile_configs/
- `/get-api-environments-project-id-customer-profile-configs-id` — GET /api/environments/{project_id}/customer_profile_configs/...
- `/put-api-environments-project-id-customer-profile-configs-id` — PUT /api/environments/{project_id}/customer_profile_configs/...
- `/patch-api-environments-project-id-customer-profile-configs-id` — PATCH /api/environments/{project_id}/customer_profile_conf...
- `/delete-api-environments-project-id-customer-profile-configs-id` — DELETE /api/environments/{project_id}/customer_profile_co...
- `/get-api-environments-project-id-desktop-recordings` — RESTful API for managing desktop meeting recordings.

Standard CRUD operations plus transcript management as a subresource.
- `/post-api-environments-project-id-desktop-recordings` — Create a new recording and get Recall.ai upload token for the deskto...
- `/get-api-environments-project-id-desktop-recordings-id` — RESTful API for managing desktop meeting recordings.

Standard CRUD operations plus transcript management as a subresource.
- `/put-api-environments-project-id-desktop-recordings-id` — RESTful API for managing desktop meeting recordings.

Standard CRUD operations plus transcript management as a subresource.
- `/patch-api-environments-project-id-desktop-recordings-id` — RESTful API for managing desktop meeting recordings.

Standard CRUD operations plus transcript management as a subresource.
- `/delete-api-environments-project-id-desktop-recordings-id` — RESTful API for managing desktop meeting recordings.

Standard CRUD operations plus transcript management as a subresource.
- `/post-api-environments-project-id-desktop-recordings-id-append-seg` — Append transcript segments (supports batched real-time...
- `/get-api-environments-project-id-error-tracking-assignment-rules` — GET /api/environments/{project_id}/error_tracking/assign...
- `/post-api-environments-project-id-error-tracking-assignment-rules` — POST /api/environments/{project_id}/error_tracking/assi...
- `/get-api-environments-project-id-error-tracking-assignment-rules-` — GET /api/environments/{project_id}/error_tracking/assig...
- `/put-api-environments-project-id-error-tracking-assignment-rules-` — PUT /api/environments/{project_id}/error_tracking/assig...
- `/patch-api-environments-project-id-error-tracking-assignment-rules-` — PATCH /api/environments/{project_id}/error_tracking/a...
- `/delete-api-environments-project-id-error-tracking-assignment-rules-` — DELETE /api/environments/{project_id}/error_tracking...
- `/patch-api-environments-project-id-error-tracking-assignment-rules-` — PATCH /api/environments/{project_id}/error_tracking/a...
- `/get-api-environments-project-id-error-tracking-fingerprints` — GET /api/environments/{project_id}/error_tracking/fingerprints/
- `/get-api-environments-project-id-error-tracking-fingerprints-id` — GET /api/environments/{project_id}/error_tracking/fingerp...
- `/delete-api-environments-project-id-error-tracking-fingerprints-id` — Hard delete of this model is not allowed. Use a patch ...
- `/get-api-environments-project-id-error-tracking-git-provider-file` — GET /api/environments/{project_id}/error_tracking/git-p...
- `/get-api-environments-project-id-error-tracking-git-provider-file` — GET /api/environments/{project_id}/error_tracking/git-p...
- `/get-api-environments-project-id-error-tracking-grouping-rules` — GET /api/environments/{project_id}/error_tracking/grouping...
- `/post-api-environments-project-id-error-tracking-grouping-rules` — POST /api/environments/{project_id}/error_tracking/groupi...
- `/get-api-environments-project-id-error-tracking-grouping-rules-id` — GET /api/environments/{project_id}/error_tracking/group...
- `/put-api-environments-project-id-error-tracking-grouping-rules-id` — PUT /api/environments/{project_id}/error_tracking/group...
- `/patch-api-environments-project-id-error-tracking-grouping-rules-id` — PATCH /api/environments/{project_id}/error_tracking/g...
- `/delete-api-environments-project-id-error-tracking-grouping-rules-id` — DELETE /api/environments/{project_id}/error_tracking...
- `/patch-api-environments-project-id-error-tracking-grouping-rules-re` — PATCH /api/environments/{project_id}/error_tracking/g...
- `/get-api-environments-project-id-error-tracking-issues` — GET /api/environments/{project_id}/error_tracking/issues/
- `/post-api-environments-project-id-error-tracking-issues` — POST /api/environments/{project_id}/error_tracking/issues/
- `/get-api-environments-project-id-error-tracking-issues-id` — GET /api/environments/{project_id}/error_tracking/issues/{id}/
- `/put-api-environments-project-id-error-tracking-issues-id` — PUT /api/environments/{project_id}/error_tracking/issues/{id}/
- `/patch-api-environments-project-id-error-tracking-issues-id` — PATCH /api/environments/{project_id}/error_tracking/issues/{id}/
- `/delete-api-environments-project-id-error-tracking-issues-id` — Hard delete of this model is not allowed. Use a patch API ca...
- `/get-api-environments-project-id-error-tracking-issues-id-activit` — GET /api/environments/{project_id}/error_tracking/issue...
- `/patch-api-environments-project-id-error-tracking-issues-id-assign` — PATCH /api/environments/{project_id}/error_tracking/is...
- `/put-api-environments-project-id-error-tracking-issues-id-cohort` — PUT /api/environments/{project_id}/error_tracking/issues...
- `/post-api-environments-project-id-error-tracking-issues-id-merge` — POST /api/environments/{project_id}/error_tracking/issue...
- `/post-api-environments-project-id-error-tracking-issues-id-split` — POST /api/environments/{project_id}/error_tracking/issue...
- `/get-api-environments-project-id-error-tracking-issues-activity` — GET /api/environments/{project_id}/error_tracking/issues/...
- `/post-api-environments-project-id-error-tracking-issues-bulk` — POST /api/environments/{project_id}/error_tracking/issues/bulk/
- `/get-api-environments-project-id-error-tracking-issues-exists` — GET /api/environments/{project_id}/error_tracking/issues/ex...
- `/get-api-environments-project-id-error-tracking-issues-values` — GET /api/environments/{project_id}/error_tracking/issues/va...
- `/post-api-environments-project-id-error-tracking-query-issue` — Get compact error tracking issue details
- `/post-api-environments-project-id-error-tracking-query-issue-event` — List sampled exception events for an error tracking issue
- `/post-api-environments-project-id-error-tracking-query-issues` — List compact error tracking issues
- `/get-api-environments-project-id-error-tracking-recommendations` — GET /api/environments/{project_id}/error_tracking/recomme...
- `/post-api-environments-project-id-error-tracking-recommendations-i` — POST /api/environments/{project_id}/error_tracking/rec...
- `/post-api-environments-project-id-error-tracking-recommendations-i` — POST /api/environments/{project_id}/error_tracking/rec...
- `/post-api-environments-project-id-error-tracking-recommendations-i` — POST /api/environments/{project_id}/error_tracking/rec...
- `/get-api-environments-project-id-error-tracking-settings-retrieve` — GET /api/environments/{project_id}/error_tracking/setti...
- `/patch-api-environments-project-id-error-tracking-settings-update-s` — PATCH /api/environments/{project_id}/error_tracking/s...
- `/get-api-environments-project-id-error-tracking-spike-detection-c` — GET /api/environments/{project_id}/error_tracking/spike...
- `/patch-api-environments-project-id-error-tracking-spike-detection-c` — PATCH /api/environments/{project_id}/error_tracking/s...
- `/get-api-environments-project-id-error-tracking-spike-events` — GET /api/environments/{project_id}/error_tracking/spike_events/
- `/get-api-environments-project-id-error-tracking-stack-frames` — GET /api/environments/{project_id}/error_tracking/stack_frames/
- `/get-api-environments-project-id-error-tracking-stack-frames-id` — GET /api/environments/{project_id}/error_tracking/stack_f...
- `/delete-api-environments-project-id-error-tracking-stack-frames-id` — Hard delete of this model is not allowed. Use a patch ...
- `/post-api-environments-project-id-error-tracking-stack-frames-batc` — POST /api/environments/{project_id}/error_tracking/sta...
- `/get-api-environments-project-id-error-tracking-suppression-rules` — GET /api/environments/{project_id}/error_tracking/suppr...
- `/post-api-environments-project-id-error-tracking-suppression-rules` — POST /api/environments/{project_id}/error_tracking/sup...
- `/get-api-environments-project-id-error-tracking-suppression-rules` — GET /api/environments/{project_id}/error_tracking/suppr...
- `/put-api-environments-project-id-error-tracking-suppression-rules` — PUT /api/environments/{project_id}/error_tracking/suppr...
- `/patch-api-environments-project-id-error-tracking-suppression-rules` — PATCH /api/environments/{project_id}/error_tracking/s...
- `/delete-api-environments-project-id-error-tracking-suppression-rules` — DELETE /api/environments/{project_id}/error_tracking...
- `/patch-api-environments-project-id-error-tracking-suppression-rules` — PATCH /api/environments/{project_id}/error_tracking/s...
- `/post-api-environments-project-id-evaluation-runs` — Create a new evaluation run.

This endpoint validates the request and enqueues a Temporal workflow
to asynchronously execute the evaluation.
- `/get-api-environments-project-id-evaluations` — GET /api/environments/{project_id}/evaluations/
- `/post-api-environments-project-id-evaluations` — POST /api/environments/{project_id}/evaluations/
- `/get-api-environments-project-id-evaluations-id` — GET /api/environments/{project_id}/evaluations/{id}/
- `/put-api-environments-project-id-evaluations-id` — PUT /api/environments/{project_id}/evaluations/{id}/
- `/patch-api-environments-project-id-evaluations-id` — PATCH /api/environments/{project_id}/evaluations/{id}/
- `/delete-api-environments-project-id-evaluations-id` — Hard delete of this model is not allowed. Use a patch API call to set ...
- `/post-api-environments-project-id-evaluations-test-hog` — Test Hog evaluation code against sample events without saving.
- `/get-api-environments-project-id-event-filter` — Returns the event filter config for the team, or null if not yet created.
- `/post-api-environments-project-id-event-filter` — Create or update the event filter config.
- `/get-api-environments-project-id-event-filter-metrics` — Single event filter per team.
GET  /event_filter/ — returns the config (or null if not yet created)
POST /event_filter/ — creates or updates the config (upsert)
GET  /event_filter/metrics/ — time-series metrics
GET  /event_filter/metrics/totals/ — aggregate totals
- `/get-api-environments-project-id-event-filter-metrics-totals` — Single event filter per team.
GET  /event_filter/ — returns the config (or null if not yet created)
POST /event_filter/ — creates or updates the config (upsert)
GET  /event_filter/metrics/ — time-series metrics
GET  /event_filter/metrics/totals/ — aggregate totals
- `/get-api-environments-project-id-health-issues` — GET /api/environments/{project_id}/health_issues/
- `/get-api-environments-project-id-health-issues-id` — GET /api/environments/{project_id}/health_issues/{id}/
- `/patch-api-environments-project-id-health-issues-id` — PATCH /api/environments/{project_id}/health_issues/{id}/
- `/post-api-environments-project-id-health-issues-id-resolve` — POST /api/environments/{project_id}/health_issues/{id}/resolve/
- `/post-api-environments-project-id-health-issues-refresh` — POST /api/environments/{project_id}/health_issues/refresh/
- `/get-api-environments-project-id-health-issues-summary` — GET /api/environments/{project_id}/health_issues/summary/
- `/get-api-environments-project-id-lineage-get-upstream` — GET /api/environments/{project_id}/lineage/get_upstream/
- `/get-api-environments-project-id-llm-analytics-clustering-config` — Team-level clustering configuration (event filters for a...
- `/post-api-environments-project-id-llm-analytics-clustering-config-` — Team-level clustering configuration (event filters for...
- `/get-api-environments-project-id-llm-analytics-clustering-jobs` — CRUD for clustering job configurations (max 5 per team).
- `/post-api-environments-project-id-llm-analytics-clustering-jobs` — CRUD for clustering job configurations (max 5 per team).
- `/get-api-environments-project-id-llm-analytics-clustering-jobs-id` — CRUD for clustering job configurations (max 5 per team).
- `/put-api-environments-project-id-llm-analytics-clustering-jobs-id` — CRUD for clustering job configurations (max 5 per team).
- `/patch-api-environments-project-id-llm-analytics-clustering-jobs-id` — CRUD for clustering job configurations (max 5 per team).
- `/delete-api-environments-project-id-llm-analytics-clustering-jobs-id` — CRUD for clustering job configurations (max 5 per te...
- `/get-api-environments-project-id-llm-analytics-evaluation-config` — Get the evaluation config for this team
- `/post-api-environments-project-id-llm-analytics-evaluation-config-` — Set the active provider key for evaluations
- `/get-api-environments-project-id-llm-analytics-evaluation-reports` — CRUD for evaluation report configurations + report run ...
- `/post-api-environments-project-id-llm-analytics-evaluation-reports` — CRUD for evaluation report configurations + report run...
- `/get-api-environments-project-id-llm-analytics-evaluation-reports` — CRUD for evaluation report configurations + report run ...
- `/put-api-environments-project-id-llm-analytics-evaluation-reports` — CRUD for evaluation report configurations + report run ...
- `/patch-api-environments-project-id-llm-analytics-evaluation-reports` — CRUD for evaluation report configurations + report ru...
- `/delete-api-environments-project-id-llm-analytics-evaluation-reports` — Hard delete of this model is not allowed. Use a patc...
- `/post-api-environments-project-id-llm-analytics-evaluation-reports` — Trigger immediate report generation.
- `/get-api-environments-project-id-llm-analytics-evaluation-reports` — List report runs (history) for this report.
- `/post-api-environments-project-id-llm-analytics-evaluation-summary` — 
Generate an AI-powered summary of evaluation results.

This endpoint analyzes evaluation runs and identifies patterns in passing
and failing evaluations, providing actionable recommendations.

Data is fetched server-side by evaluation ID to ensure data integrity.

**Use Cases:**
- Understand why evaluations are passing or failing
- Identify systematic issues in LLM responses
- Get recommendations for improving response quality
- Review patterns across many evaluation runs at once
        
- `/get-api-environments-project-id-llm-analytics-models` — List available models for a provider.
- `/post-api-environments-project-id-llm-analytics-offline-evaluation` — POST /api/environments/{project_id}/llm_analytics/offl...
- `/post-api-environments-project-id-llm-analytics-provider-key-valid` — Validate LLM provider API keys without persisting them
- `/get-api-environments-project-id-llm-analytics-provider-keys` — GET /api/environments/{project_id}/llm_analytics/provider_keys/
- `/post-api-environments-project-id-llm-analytics-provider-keys` — POST /api/environments/{project_id}/llm_analytics/provider_...
- `/get-api-environments-project-id-llm-analytics-provider-keys-id` — GET /api/environments/{project_id}/llm_analytics/provider...
- `/put-api-environments-project-id-llm-analytics-provider-keys-id` — PUT /api/environments/{project_id}/llm_analytics/provider...
- `/patch-api-environments-project-id-llm-analytics-provider-keys-id` — PATCH /api/environments/{project_id}/llm_analytics/prov...
- `/delete-api-environments-project-id-llm-analytics-provider-keys-id` — DELETE /api/environments/{project_id}/llm_analytics/pr...
- `/post-api-environments-project-id-llm-analytics-provider-keys-id-a` — Assign this key to evaluations and optionally re-enabl...
- `/get-api-environments-project-id-llm-analytics-provider-keys-id-d` — Get evaluations using this key and alternative keys for...
- `/post-api-environments-project-id-llm-analytics-provider-keys-id-v` — POST /api/environments/{project_id}/llm_analytics/prov...
- `/get-api-environments-project-id-llm-analytics-provider-keys-tria` — List enabled evaluations currently using trial credits ...
- `/get-api-environments-project-id-llm-analytics-review-queue-items` — GET /api/environments/{project_id}/llm_analytics/review...
- `/post-api-environments-project-id-llm-analytics-review-queue-items` — POST /api/environments/{project_id}/llm_analytics/revi...
- `/get-api-environments-project-id-llm-analytics-review-queue-items` — GET /api/environments/{project_id}/llm_analytics/review...
- `/patch-api-environments-project-id-llm-analytics-review-queue-items` — PATCH /api/environments/{project_id}/llm_analytics/re...
- `/delete-api-environments-project-id-llm-analytics-review-queue-items` — DELETE /api/environments/{project_id}/llm_analytics/...
- `/get-api-environments-project-id-llm-analytics-review-queues` — GET /api/environments/{project_id}/llm_analytics/review_queues/
- `/post-api-environments-project-id-llm-analytics-review-queues` — POST /api/environments/{project_id}/llm_analytics/review_qu...
- `/get-api-environments-project-id-llm-analytics-review-queues-id` — GET /api/environments/{project_id}/llm_analytics/review_q...
- `/patch-api-environments-project-id-llm-analytics-review-queues-id` — PATCH /api/environments/{project_id}/llm_analytics/revi...
- `/delete-api-environments-project-id-llm-analytics-review-queues-id` — DELETE /api/environments/{project_id}/llm_analytics/re...
- `/get-api-environments-project-id-llm-analytics-score-definitions` — GET /api/environments/{project_id}/llm_analytics/score_d...
- `/post-api-environments-project-id-llm-analytics-score-definitions` — POST /api/environments/{project_id}/llm_analytics/score...
- `/get-api-environments-project-id-llm-analytics-score-definitions-` — GET /api/environments/{project_id}/llm_analytics/score_...
- `/patch-api-environments-project-id-llm-analytics-score-definitions-` — PATCH /api/environments/{project_id}/llm_analytics/sc...
- `/post-api-environments-project-id-llm-analytics-score-definitions-` — POST /api/environments/{project_id}/llm_analytics/scor...
- `/post-api-environments-project-id-llm-analytics-sentiment` — POST /api/environments/{project_id}/llm_analytics/sentiment/
- `/post-api-environments-project-id-llm-analytics-sentiment-generati` — POST /api/environments/{project_id}/llm_analytics/sent...
- `/post-api-environments-project-id-llm-analytics-summarization` — 
Generate an AI-powered summary of an LLM trace or event.

This endpoint analyzes the provided trace/event, generates a line-numbered text
representation, and uses an LLM to create a concise summary with line references.

**Two ways to use this endpoint:**

1. **By ID (recommended):** Pass `trace_id` or `generation_id` with an optional `date_from`/`date_to`.
   The backend fetches the data automatically. `summarize_type` is inferred.
2. **By data:** Pass the full trace/event data blob in `data` with `summarize_type`.
   This is how the frontend uses it.

**Summary Format:**
- Title (concise, max 10 words)
- Mermaid flow diagram showing the main flow
- 3-10 summary bullets with line references
- "Interesting Notes" section for failures, successes, or unusual patterns
- Line references in [L45] or [L45-52] format pointing to relevant sections

The response includes the structured summary, the text representation, and metadata.
        
- `/post-api-environments-project-id-llm-analytics-summarization-batc` — 
Check which traces have cached summaries available.

This endpoint allows batch checking of multiple trace IDs to see which ones
have cached summaries. Returns only the traces that have cached summaries
with their titles.

**Use Cases:**
- Load cached summaries on session view load
- Avoid unnecessary LLM calls for already-summarized traces
- Display summary previews without generating new summaries
        
- `/post-api-environments-project-id-llm-analytics-text-repr` — 
Generate a human-readable text representation of an LLM trace event.

This endpoint converts AI observability events ($ai_generation, $ai_span, $ai_embedding, or $ai_trace)
into formatted text representations suitable for display, logging, or analysis.

**Supported Event Types:**
- `$ai_generation`: Individual LLM API calls with input/output messages
- `$ai_span`: Logical spans with state transitions
- `$ai_embedding`: Embedding generation events (text input → vector)
- `$ai_trace`: Full traces with hierarchical structure

**Options:**
- `max_length`: Maximum character count (default: 2000000)
- `truncated`: Enable middle-content truncation within events (default: true)
- `truncate_buffer`: Characters at start/end when truncating (default: 1000)
- `include_markers`: Use interactive markers vs plain text indicators (default: true)
  - Frontend: set true for `<<<TRUNCATED|base64|...>>>` markers
  - Backend/LLM: set false for `... (X chars truncated) ...` text
- `collapsed`: Show summary vs full trace tree (default: false)
- `include_hierarchy`: Include tree structure for traces (default: true)
- `max_depth`: Maximum depth for hierarchical rendering (default: unlimited)
- `tools_collapse_threshold`: Number of tools before auto-collapsing list (default: 5)
  - Tool lists >5 items show `<<<TOOLS_EXPANDABLE|...>>>` marker for frontend
  - Or `[+] AVAILABLE TOOLS: N` for backend when `include_markers: false`
- `include_line_numbers`: Prefix each line with line number like L001:, L010: (default: false)

**Use Cases:**
- Frontend display: `truncated: true, include_markers: true, include_line_numbers: true`
- Backend LLM context (summary): `truncated: true, include_markers: false, collapsed: true`
- Backend LLM context (full): `truncated: false`

The response includes the formatted text and metadata about the rendering.
        
- `/get-api-environments-project-id-llm-analytics-trace-reviews` — GET /api/environments/{project_id}/llm_analytics/trace_reviews/
- `/post-api-environments-project-id-llm-analytics-trace-reviews` — POST /api/environments/{project_id}/llm_analytics/trace_rev...
- `/get-api-environments-project-id-llm-analytics-trace-reviews-id` — GET /api/environments/{project_id}/llm_analytics/trace_re...
- `/patch-api-environments-project-id-llm-analytics-trace-reviews-id` — PATCH /api/environments/{project_id}/llm_analytics/trac...
- `/delete-api-environments-project-id-llm-analytics-trace-reviews-id` — DELETE /api/environments/{project_id}/llm_analytics/tr...
- `/post-api-environments-project-id-llm-analytics-translate` — Translate text to target language.
- `/get-api-environments-project-id-llm-prompts` — GET /api/environments/{project_id}/llm_prompts/
- `/post-api-environments-project-id-llm-prompts` — POST /api/environments/{project_id}/llm_prompts/
- `/get-api-environments-project-id-llm-prompts-name-prompt-name` — GET /api/environments/{project_id}/llm_prompts/name/{prompt...
- `/patch-api-environments-project-id-llm-prompts-name-prompt-name` — PATCH /api/environments/{project_id}/llm_prompts/name/{pr...
- `/post-api-environments-project-id-llm-prompts-name-prompt-name-arc` — POST /api/environments/{project_id}/llm_prompts/name/{...
- `/post-api-environments-project-id-llm-prompts-name-prompt-name-dup` — POST /api/environments/{project_id}/llm_prompts/name/{...
- `/get-api-environments-project-id-llm-prompts-resolve-name-prompt-` — GET /api/environments/{project_id}/llm_prompts/resolve/...
- `/get-api-environments-project-id-llm-skills` — GET /api/environments/{project_id}/llm_skills/
- `/post-api-environments-project-id-llm-skills` — POST /api/environments/{project_id}/llm_skills/
- `/get-api-environments-project-id-llm-skills-name-skill-name` — GET /api/environments/{project_id}/llm_skills/name/{skill_name}/
- `/patch-api-environments-project-id-llm-skills-name-skill-name` — PATCH /api/environments/{project_id}/llm_skills/name/{skill...
- `/post-api-environments-project-id-llm-skills-name-skill-name-archi` — POST /api/environments/{project_id}/llm_skills/name/{s...
- `/post-api-environments-project-id-llm-skills-name-skill-name-dupli` — POST /api/environments/{project_id}/llm_skills/name/{s...
- `/post-api-environments-project-id-llm-skills-name-skill-name-files` — POST /api/environments/{project_id}/llm_skills/name/{s...
- `/post-api-environments-project-id-llm-skills-name-skill-name-files` — POST /api/environments/{project_id}/llm_skills/name/{s...
- `/get-api-environments-project-id-llm-skills-name-skill-name-files` — GET /api/environments/{project_id}/llm_skills/name/{ski...
- `/delete-api-environments-project-id-llm-skills-name-skill-name-files` — DELETE /api/environments/{project_id}/llm_skills/nam...
- `/get-api-environments-project-id-llm-skills-resolve-name-skill-na` — GET /api/environments/{project_id}/llm_skills/resolve/n...
- `/post-api-environments-project-id-logs-explainlogwithai` — Explain a log entry using AI.

POST /api/environments/:id/logs/explainLogWithAI/
- `/get-api-environments-project-id-logs-views` — GET /api/environments/{project_id}/logs/views/
- `/post-api-environments-project-id-logs-views` — POST /api/environments/{project_id}/logs/views/
- `/get-api-environments-project-id-logs-views-short-id` — GET /api/environments/{project_id}/logs/views/{short_id}/
- `/put-api-environments-project-id-logs-views-short-id` — PUT /api/environments/{project_id}/logs/views/{short_id}/
- `/patch-api-environments-project-id-logs-views-short-id` — PATCH /api/environments/{project_id}/logs/views/{short_id}/
- `/delete-api-environments-project-id-logs-views-short-id` — DELETE /api/environments/{project_id}/logs/views/{short_id}/
- `/get-api-environments-project-id-managed-viewsets-kind` — Get all views associated with a specific managed viewset.
GET /api/environments/{team_id}/managed_viewsets/{kind}/
- `/put-api-environments-project-id-managed-viewsets-kind` — Enable or disable a managed viewset by kind.
PUT /api/environments/{team_id}/managed_viewsets/{kind}/ with body {"enabled": true/false}
- `/post-api-environments-project-id-max-tools-create-and-query-insig` — POST /api/environments/{project_id}/max_tools/create_a...
- `/get-api-environments-project-id-mcp-server-installations` — GET /api/environments/{project_id}/mcp_server_installations/
- `/post-api-environments-project-id-mcp-server-installations` — POST /api/environments/{project_id}/mcp_server_installations/
- `/get-api-environments-project-id-mcp-server-installations-id` — GET /api/environments/{project_id}/mcp_server_installations/...
- `/put-api-environments-project-id-mcp-server-installations-id` — PUT /api/environments/{project_id}/mcp_server_installations/...
- `/patch-api-environments-project-id-mcp-server-installations-id` — PATCH /api/environments/{project_id}/mcp_server_installati...
- `/delete-api-environments-project-id-mcp-server-installations-id` — DELETE /api/environments/{project_id}/mcp_server_installa...
- `/post-api-environments-project-id-mcp-server-installations-id-prox` — POST /api/environments/{project_id}/mcp_server_install...
- `/get-api-environments-project-id-mcp-server-installations-id-tool` — GET /api/environments/{project_id}/mcp_server_installat...
- `/patch-api-environments-project-id-mcp-server-installations-id-tool` — PATCH /api/environments/{project_id}/mcp_server_insta...
- `/post-api-environments-project-id-mcp-server-installations-id-tool` — POST /api/environments/{project_id}/mcp_server_install...
- `/get-api-environments-project-id-mcp-server-installations-authori` — Start (or re-start) an OAuth flow.

Pass ``template_id`` to (re)connect a catalog template, or
``installation_id`` to reconnect an existing custom install using its
cached metadata and per-user DCR creds.
- `/post-api-environments-project-id-mcp-server-installations-install` — POST /api/environments/{project_id}/mcp_server_install...
- `/post-api-environments-project-id-mcp-server-installations-install` — POST /api/environments/{project_id}/mcp_server_install...
- `/get-api-environments-project-id-mcp-servers` — Lists curated MCP server templates that users can install with one click.

Templates are seeded by PostHog operators and carry shared, encrypted
OAuth client credentials. Inactive templates are hidden from the catalog.
- `/post-api-environments-project-id-mcp-tools-tool-name` — Invoke an MCP tool by name.

This endpoint allows MCP callers to invoke Max AI tools directly
without going through the full LangChain conversation flow.

Scopes are resolved dynamically per tool via dangerously_get_required_scopes.
- `/post-api-environments-project-id-mcp-tools-docs-search` — Search PostHog documentation
- `/get-api-environments-project-id-property-access-controls` — Get all property access control rules for a property definition.
- `/post-api-environments-project-id-property-access-controls` — Create or update a property access control rule.
- `/delete-api-environments-project-id-property-access-controls` — Delete a property access control rule. The rule is identifie...
- `/get-api-environments-project-id-session-summaries-config` — Retrieve the team's session summaries configuration (product co...
- `/patch-api-environments-project-id-session-summaries-config` — Update the team's session summaries configuration (product co...
- `/post-api-environments-project-id-session-summaries-create-session` — Generate AI summary for a group of session recordings ...
- `/post-api-environments-project-id-session-summaries-create-session` — Generate AI individual summary for each session, witho...
- `/get-api-environments-project-id-subscriptions-subscription-id-de` — List subscription deliveries
- `/get-api-environments-project-id-subscriptions-subscription-id-de` — Retrieve subscription delivery
- `/get-api-environments-project-id-taggers` — GET /api/environments/{project_id}/taggers/
- `/post-api-environments-project-id-taggers` — POST /api/environments/{project_id}/taggers/
- `/get-api-environments-project-id-taggers-id` — GET /api/environments/{project_id}/taggers/{id}/
- `/put-api-environments-project-id-taggers-id` — PUT /api/environments/{project_id}/taggers/{id}/
- `/patch-api-environments-project-id-taggers-id` — PATCH /api/environments/{project_id}/taggers/{id}/
- `/delete-api-environments-project-id-taggers-id` — Hard delete of this model is not allowed. Use a patch API call to set "del...
- `/post-api-environments-project-id-taggers-test-hog` — Test Hog tagger code against sample events without saving.
- `/post-api-environments-project-id-tracing-spans-aggregate` — POST /api/environments/{project_id}/tracing/spans/aggregate/
- `/get-api-environments-project-id-tracing-spans-attributes` — GET /api/environments/{project_id}/tracing/spans/attributes/
- `/post-api-environments-project-id-tracing-spans-query` — POST /api/environments/{project_id}/tracing/spans/query/
- `/get-api-environments-project-id-tracing-spans-service-names` — GET /api/environments/{project_id}/tracing/spans/service-names/
- `/post-api-environments-project-id-tracing-spans-sparkline` — POST /api/environments/{project_id}/tracing/spans/sparkline/
- `/post-api-environments-project-id-tracing-spans-trace-trace-id` — POST /api/environments/{project_id}/tracing/spans/trace/{t...
- `/post-api-environments-project-id-tracing-spans-tree` — POST /api/environments/{project_id}/tracing/spans/tree/
- `/get-api-environments-project-id-tracing-spans-values` — GET /api/environments/{project_id}/tracing/spans/values/
- `/get-api-environments-project-id-user-interview-topics` — Planned user interview topics: who we want to target and what we w...
- `/post-api-environments-project-id-user-interview-topics` — Planned user interview topics: who we want to target and what we ...
- `/get-api-environments-project-id-user-interview-topics-id` — Planned user interview topics: who we want to target and what w...
- `/put-api-environments-project-id-user-interview-topics-id` — Planned user interview topics: who we want to target and what w...
- `/patch-api-environments-project-id-user-interview-topics-id` — Planned user interview topics: who we want to target and what...
- `/delete-api-environments-project-id-user-interview-topics-id` — Planned user interview topics: who we want to target and wha...
- `/post-api-environments-project-id-user-interview-topics-id-add-int` — Add a single interviewee to this topic. Email-shaped i...
- `/post-api-environments-project-id-user-interview-topics-id-generat` — Generate one public interview link per targeted interv...
- `/post-api-environments-project-id-user-interview-topics-id-links-c` — Same materialization as generate_links, returned as a ...
- `/post-api-environments-project-id-user-interview-topics-id-remove-` — Remove an interviewee from this topic. Drops the ident...
- `/post-api-environments-project-id-user-interview-topics-id-send-in` — Generate (if needed) and email a personalized public i...
- `/get-api-environments-project-id-user-interview-topics-id-test-li` — Return the calling user's personal dogfood interview li...
- `/get-api-environments-project-id-user-interview-topics-topic-id-i` — Per-interviewee extra context for a user interview topi...
- `/post-api-environments-project-id-user-interview-topics-topic-id-i` — Per-interviewee extra context for a user interview top...
- `/get-api-environments-project-id-user-interview-topics-topic-id-i` — Per-interviewee extra context for a user interview topi...
- `/put-api-environments-project-id-user-interview-topics-topic-id-i` — Per-interviewee extra context for a user interview topi...
- `/patch-api-environments-project-id-user-interview-topics-topic-id-i` — Per-interviewee extra context for a user interview to...
- `/delete-api-environments-project-id-user-interview-topics-topic-id-i` — Per-interviewee extra context for a user interview t...
- `/post-api-environments-project-id-user-interview-topics-topic-id-i` — Create up to 500 interviewee context rows for a topic ...
- `/get-api-environments-project-id-user-interviews` — GET /api/environments/{project_id}/user_interviews/
- `/post-api-environments-project-id-user-interviews` — POST /api/environments/{project_id}/user_interviews/
- `/get-api-environments-project-id-user-interviews-id` — GET /api/environments/{project_id}/user_interviews/{id}/
- `/put-api-environments-project-id-user-interviews-id` — PUT /api/environments/{project_id}/user_interviews/{id}/
- `/patch-api-environments-project-id-user-interviews-id` — PATCH /api/environments/{project_id}/user_interviews/{id}/
- `/delete-api-environments-project-id-user-interviews-id` — DELETE /api/environments/{project_id}/user_interviews/{id}/
- `/post-api-environments-project-id-user-interviews-search` — Search interview responses by semantic similarity
- `/get-api-environments-project-id-vision-observations` — Read-only access to a session's observations across every scanner th...
- `/get-api-environments-project-id-vision-observations-id` — Read-only access to a session's observations across every scanner...
- `/get-api-environments-project-id-vision-quota` — GET /api/environments/{project_id}/vision/quota/
- `/get-api-environments-project-id-vision-scanners` — CRUD for Replay Vision scanners.
- `/post-api-environments-project-id-vision-scanners` — CRUD for Replay Vision scanners.
- `/get-api-environments-project-id-vision-scanners-id` — CRUD for Replay Vision scanners.
- `/patch-api-environments-project-id-vision-scanners-id` — CRUD for Replay Vision scanners.
- `/delete-api-environments-project-id-vision-scanners-id` — CRUD for Replay Vision scanners.
- `/post-api-environments-project-id-vision-scanners-id-observe` — Apply this scanner to one specific session, on demand. Retur...
- `/get-api-environments-project-id-vision-scanners-scanner-id-obser` — Read-only access to observations produced by a scanner.
- `/get-api-environments-project-id-vision-scanners-scanner-id-obser` — Read-only access to observations produced by a scanner.
- `/post-api-environments-project-id-vision-scanners-estimate` — Estimate the observation volume a proposed scanner would gener...
- `/get-api-environments-project-id-web-analytics-weekly-digest` — Summarize web analytics
- `/get-api-environments-project-id-web-vitals` — Get web vitals for a specific pathname.
Toolbar accesses this via OAuth (handled by TeamAndOrgViewSetMixin.get_authenticators).
- `/get-api-llm-analytics-me-spend` — Return a structured personal LLM spend analysis for the requesting user. Pass `date_from`...
- `/get-api-organizations` — GET /api/organizations/
- `/post-api-organizations` — POST /api/organizations/
- `/get-api-organizations-id` — GET /api/organizations/{id}/
- `/put-api-organizations-id` — PUT /api/organizations/{id}/
- `/patch-api-organizations-id` — PATCH /api/organizations/{id}/
- `/delete-api-organizations-id` — DELETE /api/organizations/{id}/
- `/get-api-organizations-organization-id-advanced-activity-logs` — Organization-wide view of activity logs across every projec...

Mounted at /api/organizations/<organization_id>/advanced_activity_logs/.
Restricted to organization admins and owners.
- `/get-api-organizations-organization-id-advanced-activity-logs-ava` — Organization-wide view of activity logs across every pr...

Mounted at /api/organizations/<organization_id>/advanced_activity_logs/.
Restricted to organization admins and owners.
- `/post-api-organizations-organization-id-advanced-activity-logs-exp` — Organization-wide view of activity logs across every p...

Mounted at /api/organizations/<organization_id>/advanced_activity_logs/.
Restricted to organization admins and owners.
- `/get-api-organizations-organization-id-batch-exports` — GET /api/organizations/{organization_id}/batch_exports/
- `/post-api-organizations-organization-id-batch-exports` — POST /api/organizations/{organization_id}/batch_exports/
- `/get-api-organizations-organization-id-batch-exports-id` — GET /api/organizations/{organization_id}/batch_exports/{id}/
- `/put-api-organizations-organization-id-batch-exports-id` — PUT /api/organizations/{organization_id}/batch_exports/{id}/
- `/patch-api-organizations-organization-id-batch-exports-id` — PATCH /api/organizations/{organization_id}/batch_exports/{id}/
- `/delete-api-organizations-organization-id-batch-exports-id` — DELETE /api/organizations/{organization_id}/batch_exports/{id}/
- `/get-api-organizations-organization-id-batch-exports-id-logs` — GET /api/organizations/{organization_id}/batch_exports/{id}/...
- `/post-api-organizations-organization-id-batch-exports-id-pause` — Pause a BatchExport.
- `/post-api-organizations-organization-id-batch-exports-id-run-test-` — POST /api/organizations/{organization_id}/batch_export...
- `/post-api-organizations-organization-id-batch-exports-id-unpause` — Unpause a BatchExport.
- `/post-api-organizations-organization-id-batch-exports-run-test-ste` — POST /api/organizations/{organization_id}/batch_export...
- `/get-api-organizations-organization-id-batch-exports-test` — GET /api/organizations/{organization_id}/batch_exports/test/
- `/get-api-organizations-organization-id-cimd-verification-tokens` — Manage CIMD verification tokens for an organization.

A partner embeds the plaintext token in their CIMD metadata document under
`posthog_verification_token`. When PostHog fetches the metadata, matching
the token links the partner app to this organization and grants a higher
default rate limit for account provisioning.

The plaintext value is only available on creation; we store a hash.
- `/post-api-organizations-organization-id-cimd-verification-tokens` — Manage CIMD verification tokens for an organization.

A partner embeds the plaintext token in their CIMD metadata document under
`posthog_verification_token`. When PostHog fetches the metadata, matching
the token links the partner app to this organization and grants a higher
default rate limit for account provisioning.

The plaintext value is only available on creation; we store a hash.
- `/get-api-organizations-organization-id-cimd-verification-tokens-i` — Manage CIMD verification tokens for an organization.

A partner embeds the plaintext token in their CIMD metadata document under
`posthog_verification_token`. When PostHog fetches the metadata, matching
the token links the partner app to this organization and grants a higher
default rate limit for account provisioning.

The plaintext value is only available on creation; we store a hash.
- `/delete-api-organizations-organization-id-cimd-verification-tokens-i` — Manage CIMD verification tokens for an organization.

A partner embeds the plaintext token in their CIMD metadata document under
`posthog_verification_token`. When PostHog fetches the metadata, matching
the token links the partner app to this organization and grants a higher
default rate limit for account provisioning.

The plaintext value is only available on creation; we store a hash.
- `/get-api-organizations-organization-id-domains` — GET /api/organizations/{organization_id}/domains/
- `/post-api-organizations-organization-id-domains` — POST /api/organizations/{organization_id}/domains/
- `/get-api-organizations-organization-id-domains-id` — GET /api/organizations/{organization_id}/domains/{id}/
- `/put-api-organizations-organization-id-domains-id` — PUT /api/organizations/{organization_id}/domains/{id}/
- `/patch-api-organizations-organization-id-domains-id` — PATCH /api/organizations/{organization_id}/domains/{id}/
- `/delete-api-organizations-organization-id-domains-id` — DELETE /api/organizations/{organization_id}/domains/{id}/
- `/get-api-organizations-organization-id-domains-id-scim-logs` — GET /api/organizations/{organization_id}/domains/{id}/scim/logs/
- `/post-api-organizations-organization-id-domains-id-scim-token` — Regenerate SCIM bearer token.
- `/post-api-organizations-organization-id-domains-id-verify` — POST /api/organizations/{organization_id}/domains/{id}/verify/
- `/get-api-organizations-organization-id-integrations` — ViewSet for organization-level integrations.

Provides access to integrations that are scoped to the entire organization
(vs. project-level integrations). Examples include Vercel, AWS Marketplace, etc.

Creation is handled by the integration installation flows
(e.g., Vercel marketplace installation). Users can disconnect integrations
via the DELETE endpoint.
- `/get-api-organizations-organization-id-integrations-id` — ViewSet for organization-level integrations.

Provides access to integrations that are scoped to the entire organization
(vs. project-level integrations). Examples include Vercel, AWS Marketplace, etc.

Creation is handled by the integration installation flows
(e.g., Vercel marketplace installation). Users can disconnect integrations
via the DELETE endpoint.
- `/delete-api-organizations-organization-id-integrations-id` — ViewSet for organization-level integrations.

Provides access to integrations that are scoped to the entire organization
(vs. project-level integrations). Examples include Vercel, AWS Marketplace, etc.

Creation is handled by the integration installation flows
(e.g., Vercel marketplace installation). Users can disconnect integrations
via the DELETE endpoint.
- `/patch-api-organizations-organization-id-integrations-id-environmen` — ViewSet for organization-level integrations.

Provides access to integrations that are scoped to the entire organization
(vs. project-level integrations). Examples include Vercel, AWS Marketplace, etc.

Creation is handled by the integration installation flows
(e.g., Vercel marketplace installation). Users can disconnect integrations
via the DELETE endpoint.
- `/get-api-organizations-organization-id-invites` — GET /api/organizations/{organization_id}/invites/
- `/post-api-organizations-organization-id-invites` — POST /api/organizations/{organization_id}/invites/
- `/delete-api-organizations-organization-id-invites-id` — DELETE /api/organizations/{organization_id}/invites/{id}/
- `/post-api-organizations-organization-id-invites-bulk` — POST /api/organizations/{organization_id}/invites/bulk/
- `/post-api-organizations-organization-id-invites-delegate` — Create an onboarding delegation invite: an admin-level invite fl...
Sends a single dedicated delegation email and records the inviting user as having delegated.
- `/get-api-organizations-organization-id-legal-documents` — GET /api/organizations/{organization_id}/legal_documents/
- `/post-api-organizations-organization-id-legal-documents` — POST /api/organizations/{organization_id}/legal_documents/
- `/get-api-organizations-organization-id-legal-documents-id` — GET /api/organizations/{organization_id}/legal_documents/{id}/
- `/get-api-organizations-organization-id-legal-documents-id-downloa` — Short-lived redirect to the signed PDF in object storag...
envelope is still out for signature (or if the upload hasn't completed
yet). The underlying presigned URL expires in ~60s; clients should hit
this endpoint each time they want to view the PDF rather than caching.
- `/get-api-organizations-organization-id-members` — GET /api/organizations/{organization_id}/members/
- `/put-api-organizations-organization-id-members-user-uuid` — PUT /api/organizations/{organization_id}/members/{user__uuid}/
- `/patch-api-organizations-organization-id-members-user-uuid` — PATCH /api/organizations/{organization_id}/members/{user__uuid}/
- `/delete-api-organizations-organization-id-members-user-uuid` — DELETE /api/organizations/{organization_id}/members/{user__uu...
- `/get-api-organizations-organization-id-members-user-uuid-scoped-a` — GET /api/organizations/{organization_id}/members/{user_...
- `/get-api-organizations-organization-id-oauth-applications` — ViewSet for listing OAuth applications at the organization leve...
- `/get-api-organizations-organization-id-projects` — Projects for the current organization.
- `/post-api-organizations-organization-id-projects` — Projects for the current organization.
- `/get-api-organizations-organization-id-projects-id` — Retrieve a project and its settings.
- `/put-api-organizations-organization-id-projects-id` — Replace a project and its settings. Prefer the PATCH endpoint for part...
- `/patch-api-organizations-organization-id-projects-id` — Update one or more of a project's settings. Only the fields included...
- `/delete-api-organizations-organization-id-projects-id` — Projects for the current organization.
- `/get-api-organizations-organization-id-projects-id-activity` — Projects for the current organization.
- `/patch-api-organizations-organization-id-projects-id-add-product-in` — Projects for the current organization.
- `/post-api-organizations-organization-id-projects-id-change-organiz` — Projects for the current organization.
- `/patch-api-organizations-organization-id-projects-id-complete-produ` — Projects for the current organization.
- `/patch-api-organizations-organization-id-projects-id-delete-secret-` — Projects for the current organization.
- `/post-api-organizations-organization-id-projects-id-generate-conve` — Projects for the current organization.
- `/get-api-organizations-organization-id-projects-id-is-generating-` — Projects for the current organization.
- `/patch-api-organizations-organization-id-projects-id-reset-token` — Projects for the current organization.
- `/patch-api-organizations-organization-id-projects-id-rotate-secret-` — Projects for the current organization.
- `/get-api-organizations-organization-id-proxy-records` — List all reverse proxies configured for the organization. Returns pr...
- `/post-api-organizations-organization-id-proxy-records` — Create a new managed reverse proxy. Provide the domain you want to ...
- `/get-api-organizations-organization-id-proxy-records-id` — Get details of a specific reverse proxy by ID. Returns the full c...
- `/delete-api-organizations-organization-id-proxy-records-id` — Delete a reverse proxy. For proxies in 'waiting', 'erroring', ...
- `/post-api-organizations-organization-id-proxy-records-id-diagnose` — Run a deep diagnostic on a reverse proxy. Inspects DNS ...
- `/post-api-organizations-organization-id-proxy-records-id-retry` — Retry provisioning a failed reverse proxy. Only available ...
- `/get-api-organizations-organization-id-role-external-references` — GET /api/organizations/{organization_id}/role_external_re...
- `/post-api-organizations-organization-id-role-external-references` — POST /api/organizations/{organization_id}/role_external_...
- `/delete-api-organizations-organization-id-role-external-references-i` — DELETE /api/organizations/{organization_id}/role_ext...
- `/get-api-organizations-organization-id-role-external-references-l` — GET /api/organizations/{organization_id}/role_external_...
- `/get-api-organizations-organization-id-roles` — GET /api/organizations/{organization_id}/roles/
- `/post-api-organizations-organization-id-roles` — POST /api/organizations/{organization_id}/roles/
- `/get-api-organizations-organization-id-roles-id` — GET /api/organizations/{organization_id}/roles/{id}/
- `/put-api-organizations-organization-id-roles-id` — PUT /api/organizations/{organization_id}/roles/{id}/
- `/patch-api-organizations-organization-id-roles-id` — PATCH /api/organizations/{organization_id}/roles/{id}/
- `/delete-api-organizations-organization-id-roles-id` — DELETE /api/organizations/{organization_id}/roles/{id}/
- `/get-api-organizations-organization-id-roles-role-id-role-members` — GET /api/organizations/{organization_id}/roles/{role_id...
- `/post-api-organizations-organization-id-roles-role-id-role-members` — POST /api/organizations/{organization_id}/roles/{role_...
- `/get-api-organizations-organization-id-roles-role-id-role-members` — GET /api/organizations/{organization_id}/roles/{role_id...
- `/delete-api-organizations-organization-id-roles-role-id-role-members` — DELETE /api/organizations/{organization_id}/roles/{r...
- `/get-api-organizations-organization-id-welcome-current` — Aggregated payload for the invited-user welcome screen.
- `/get-api-projects-project-id-actions` — GET /api/projects/{project_id}/actions/
- `/post-api-projects-project-id-actions` — POST /api/projects/{project_id}/actions/
- `/get-api-projects-project-id-actions-id` — GET /api/projects/{project_id}/actions/{id}/
- `/put-api-projects-project-id-actions-id` — PUT /api/projects/{project_id}/actions/{id}/
- `/patch-api-projects-project-id-actions-id` — PATCH /api/projects/{project_id}/actions/{id}/
- `/delete-api-projects-project-id-actions-id` — Hard delete of this model is not allowed. Use a patch API call to set "deleted...
- `/get-api-projects-project-id-actions-id-references` — GET /api/projects/{project_id}/actions/{id}/references/
- `/post-api-projects-project-id-actions-bulk-update-tags` — Bulk update tags on multiple objects.

PAT access: this action has no ``required_scopes=`` on the decorator —
inheriting viewsets must add ``"bulk_update_tags"`` to their
``scope_object_write_actions`` list to accept personal API keys.
Without that opt-in, ``APIScopePermission`` rejects PAT requests with
"This action does not support personal API key access". Done per-viewset
so granting ``<scope>:write`` for one resource doesn't leak access to
sibling resources that share this mixin.

Accepts:
- {"ids": [...], "action": "add"|"remove"|"set", "tags": ["tag1", "tag2"]}

Actions:
- "add": Add tags to existing tags on each object
- "remove": Remove specific tags from each object
- "set": Replace all tags on each object with the provided list
- `/get-api-projects-project-id-activity-log` — GET /api/projects/{project_id}/activity_log/
- `/get-api-projects-project-id-advanced-activity-logs` — GET /api/projects/{project_id}/advanced_activity_logs/
- `/get-api-projects-project-id-advanced-activity-logs-available-fil` — GET /api/projects/{project_id}/advanced_activity_logs/a...
- `/post-api-projects-project-id-advanced-activity-logs-export` — POST /api/projects/{project_id}/advanced_activity_logs/export/
- `/get-api-projects-project-id-alerts` — GET /api/projects/{project_id}/alerts/
- `/post-api-projects-project-id-alerts` — POST /api/projects/{project_id}/alerts/
- `/get-api-projects-project-id-alerts-id` — GET /api/projects/{project_id}/alerts/{id}/
- `/put-api-projects-project-id-alerts-id` — PUT /api/projects/{project_id}/alerts/{id}/
- `/patch-api-projects-project-id-alerts-id` — PATCH /api/projects/{project_id}/alerts/{id}/
- `/delete-api-projects-project-id-alerts-id` — DELETE /api/projects/{project_id}/alerts/{id}/
- `/post-api-projects-project-id-alerts-simulate` — Simulate a detector on an insight's historical data. Read-only — no AlertCh...
- `/get-api-projects-project-id-annotations` — Create, Read, Update and Delete annotations. [See docs](https://posthog.com/docs...
- `/post-api-projects-project-id-annotations` — Create, Read, Update and Delete annotations. [See docs](https://posthog.com/doc...
- `/get-api-projects-project-id-annotations-id` — Create, Read, Update and Delete annotations. [See docs](https://posthog.com/d...
- `/put-api-projects-project-id-annotations-id` — Create, Read, Update and Delete annotations. [See docs](https://posthog.com/d...
- `/patch-api-projects-project-id-annotations-id` — Create, Read, Update and Delete annotations. [See docs](https://posthog.com...
- `/delete-api-projects-project-id-annotations-id` — Hard delete of this model is not allowed. Use a patch API call to set "del...
- `/get-api-projects-project-id-batch-exports` — GET /api/projects/{project_id}/batch_exports/
- `/post-api-projects-project-id-batch-exports` — POST /api/projects/{project_id}/batch_exports/
- `/get-api-projects-project-id-batch-exports-batch-export-id-backfi` — ViewSet for BatchExportBackfill models.

Allows creating and reading backfills, but not updating or deleting them.
- `/post-api-projects-project-id-batch-exports-batch-export-id-backfi` — Create a new backfill for a BatchExport.
- `/get-api-projects-project-id-batch-exports-batch-export-id-backfi` — ViewSet for BatchExportBackfill models.

Allows creating and reading backfills, but not updating or deleting them.
- `/post-api-projects-project-id-batch-exports-batch-export-id-backfi` — Cancel a batch export backfill.
- `/get-api-projects-project-id-batch-exports-batch-export-id-runs` — GET /api/projects/{project_id}/batch_exports/{batch_expor...
- `/get-api-projects-project-id-batch-exports-batch-export-id-runs-i` — GET /api/projects/{project_id}/batch_exports/{batch_exp...
- `/post-api-projects-project-id-batch-exports-batch-export-id-runs-i` — Cancel a batch export run.
- `/get-api-projects-project-id-batch-exports-batch-export-id-runs-i` — GET /api/projects/{project_id}/batch_exports/{batch_exp...
- `/post-api-projects-project-id-batch-exports-batch-export-id-runs-i` — Retry a batch export run.

We use the same underlying mechanism as when backfilling a batch export, as retrying
a run is the same as backfilling one run.
- `/get-api-projects-project-id-batch-exports-id` — GET /api/projects/{project_id}/batch_exports/{id}/
- `/put-api-projects-project-id-batch-exports-id` — PUT /api/projects/{project_id}/batch_exports/{id}/
- `/patch-api-projects-project-id-batch-exports-id` — PATCH /api/projects/{project_id}/batch_exports/{id}/
- `/delete-api-projects-project-id-batch-exports-id` — DELETE /api/projects/{project_id}/batch_exports/{id}/
- `/get-api-projects-project-id-batch-exports-id-logs` — GET /api/projects/{project_id}/batch_exports/{id}/logs/
- `/post-api-projects-project-id-batch-exports-id-pause` — Pause a BatchExport.
- `/post-api-projects-project-id-batch-exports-id-run-test-step` — POST /api/projects/{project_id}/batch_exports/{id}/run_test_...
- `/post-api-projects-project-id-batch-exports-id-unpause` — Unpause a BatchExport.
- `/post-api-projects-project-id-batch-exports-run-test-step-new` — POST /api/projects/{project_id}/batch_exports/run_test_step...
- `/get-api-projects-project-id-batch-exports-test` — GET /api/projects/{project_id}/batch_exports/test/
- `/get-api-projects-project-id-business-knowledge-sources` — GET /api/projects/{project_id}/business_knowledge/sources/
- `/post-api-projects-project-id-business-knowledge-sources` — POST /api/projects/{project_id}/business_knowledge/sources/
- `/get-api-projects-project-id-business-knowledge-sources-id` — GET /api/projects/{project_id}/business_knowledge/sources/{id}/
- `/patch-api-projects-project-id-business-knowledge-sources-id` — PATCH /api/projects/{project_id}/business_knowledge/sources/...
- `/delete-api-projects-project-id-business-knowledge-sources-id` — DELETE /api/projects/{project_id}/business_knowledge/source...
- `/post-api-projects-project-id-business-knowledge-sources-id-refres` — POST /api/projects/{project_id}/business_knowledge/sou...
- `/get-api-projects-project-id-business-knowledge-sources-id-text` — GET /api/projects/{project_id}/business_knowledge/sources...
- `/get-api-projects-project-id-cohorts` — GET /api/projects/{project_id}/cohorts/
- `/post-api-projects-project-id-cohorts` — POST /api/projects/{project_id}/cohorts/
- `/get-api-projects-project-id-cohorts-id` — GET /api/projects/{project_id}/cohorts/{id}/
- `/put-api-projects-project-id-cohorts-id` — PUT /api/projects/{project_id}/cohorts/{id}/
- `/patch-api-projects-project-id-cohorts-id` — PATCH /api/projects/{project_id}/cohorts/{id}/
- `/delete-api-projects-project-id-cohorts-id` — Hard delete of this model is not allowed. Use a patch API call to set "deleted...
- `/get-api-projects-project-id-cohorts-id-activity` — GET /api/projects/{project_id}/cohorts/{id}/activity/
- `/patch-api-projects-project-id-cohorts-id-add-persons-to-static-coh` — PATCH /api/projects/{project_id}/cohorts/{id}/add_per...
- `/get-api-projects-project-id-cohorts-id-calculation-history` — GET /api/projects/{project_id}/cohorts/{id}/calculation_history/
- `/get-api-projects-project-id-cohorts-id-persons` — GET /api/projects/{project_id}/cohorts/{id}/persons/
- `/patch-api-projects-project-id-cohorts-id-remove-person-from-static` — PATCH /api/projects/{project_id}/cohorts/{id}/remove_...
- `/get-api-projects-project-id-cohorts-activity` — GET /api/projects/{project_id}/cohorts/activity/
- `/get-api-projects-project-id-comments` — GET /api/projects/{project_id}/comments/
- `/post-api-projects-project-id-comments` — POST /api/projects/{project_id}/comments/
- `/get-api-projects-project-id-comments-id` — GET /api/projects/{project_id}/comments/{id}/
- `/put-api-projects-project-id-comments-id` — PUT /api/projects/{project_id}/comments/{id}/
- `/patch-api-projects-project-id-comments-id` — PATCH /api/projects/{project_id}/comments/{id}/
- `/delete-api-projects-project-id-comments-id` — Hard delete of this model is not allowed. Use a patch API call to set "delete...
- `/post-api-projects-project-id-comments-id-complete` — Mark a task-comment as complete. Sets completed_at and completed_by. 4...
- `/post-api-projects-project-id-comments-id-reopen` — Reopen a completed task-comment. Clears completed_at and completed_by. 4...
- `/get-api-projects-project-id-comments-id-thread` — GET /api/projects/{project_id}/comments/{id}/thread/
- `/get-api-projects-project-id-comments-count` — GET /api/projects/{project_id}/comments/count/
- `/get-api-projects-project-id-conversations-tickets` — List tickets with person data attached.
- `/post-api-projects-project-id-conversations-tickets` — POST /api/projects/{project_id}/conversations/tickets/
- `/get-api-projects-project-id-conversations-tickets-id` — Get single ticket and mark as read by team.
- `/put-api-projects-project-id-conversations-tickets-id` — Handle ticket updates including assignee changes.
- `/patch-api-projects-project-id-conversations-tickets-id` — PATCH /api/projects/{project_id}/conversations/tickets/{id}/
- `/delete-api-projects-project-id-conversations-tickets-id` — DELETE /api/projects/{project_id}/conversations/tickets/{id}/
- `/post-api-projects-project-id-conversations-tickets-id-suggest-rep` — POST /api/projects/{project_id}/conversations/tickets/...
- `/post-api-projects-project-id-conversations-tickets-bulk-update-ta` — Bulk update tags on multiple objects.

PAT access: this action has no ``required_scopes=`` on the decorator —
inheriting viewsets must add ``"bulk_update_tags"`` to their
``scope_object_write_actions`` list to accept personal API keys.
Without that opt-in, ``APIScopePermission`` rejects PAT requests with
"This action does not support personal API key access". Done per-viewset
so granting ``<scope>:write`` for one resource doesn't leak access to
sibling resources that share this mixin.

Accepts:
- {"ids": [...], "action": "add"|"remove"|"set", "tags": ["tag1", "tag2"]}

Actions:
- "add": Add tags to existing tags on each object
- "remove": Remove specific tags from each object
- "set": Replace all tags on each object with the provided list
- `/post-api-projects-project-id-conversations-tickets-compose` — Create a new outbound ticket and send the first message to th...
- `/get-api-projects-project-id-conversations-tickets-unread-count` — Get total unread ticket count for the team.

Returns the sum of unread_team_count for all non-resolved tickets.
Cached in Redis for 30 seconds, invalidated on changes.
- `/get-api-projects-project-id-dashboard-templates` — GET /api/projects/{project_id}/dashboard_templates/
- `/post-api-projects-project-id-dashboard-templates` — POST /api/projects/{project_id}/dashboard_templates/
- `/get-api-projects-project-id-dashboard-templates-id` — GET /api/projects/{project_id}/dashboard_templates/{id}/
- `/put-api-projects-project-id-dashboard-templates-id` — PUT /api/projects/{project_id}/dashboard_templates/{id}/
- `/patch-api-projects-project-id-dashboard-templates-id` — PATCH /api/projects/{project_id}/dashboard_templates/{id}/
- `/delete-api-projects-project-id-dashboard-templates-id` — Hard delete of this model is not allowed. Use a patch API call to ...
- `/post-api-projects-project-id-dashboard-templates-copy-between-pro` — Copy a team template to this project
- `/get-api-projects-project-id-dashboard-templates-json-schema` — GET /api/projects/{project_id}/dashboard_templates/json_schema/
- `/get-api-projects-project-id-dashboards` — GET /api/projects/{project_id}/dashboards/
- `/post-api-projects-project-id-dashboards` — POST /api/projects/{project_id}/dashboards/
- `/get-api-projects-project-id-dashboards-dashboard-id-collaborator` — GET /api/projects/{project_id}/dashboards/{dashboard_id...
- `/post-api-projects-project-id-dashboards-dashboard-id-collaborator` — POST /api/projects/{project_id}/dashboards/{dashboard_...
- `/delete-api-projects-project-id-dashboards-dashboard-id-collaborator` — DELETE /api/projects/{project_id}/dashboards/{dashbo...
- `/get-api-projects-project-id-dashboards-dashboard-id-sharing` — GET /api/projects/{project_id}/dashboards/{dashboard_id}/sha...
- `/post-api-projects-project-id-dashboards-dashboard-id-sharing-pass` — Create a new password for the sharing configuration.
- `/delete-api-projects-project-id-dashboards-dashboard-id-sharing-pass` — Delete a password from the sharing configuration.
- `/post-api-projects-project-id-dashboards-dashboard-id-sharing-refr` — POST /api/projects/{project_id}/dashboards/{dashboard_...
- `/get-api-projects-project-id-dashboards-id` — GET /api/projects/{project_id}/dashboards/{id}/
- `/put-api-projects-project-id-dashboards-id` — PUT /api/projects/{project_id}/dashboards/{id}/
- `/patch-api-projects-project-id-dashboards-id` — PATCH /api/projects/{project_id}/dashboards/{id}/
- `/delete-api-projects-project-id-dashboards-id` — Hard delete of this model is not allowed. Use a patch API call to set "dele...
- `/post-api-projects-project-id-dashboards-id-analyze-refresh-result` — Generate AI analysis comparing before/after dashboard ...
Expects cache_key in request body pointing to the stored 'before' state.
- `/post-api-projects-project-id-dashboards-id-copy-tile` — Copy an existing dashboard tile to another dashboard (insight or te...
- `/post-api-projects-project-id-dashboards-id-create-text-tile` — Add a markdown text tile to a dashboard.

Text tiles render as markdown blocks on the dashboard — useful as section headings, dividers,
or annotations between insight tiles to give the dashboard structure.
- `/patch-api-projects-project-id-dashboards-id-move-tile` — PATCH /api/projects/{project_id}/dashboards/{id}/move_tile/
- `/post-api-projects-project-id-dashboards-id-reorder-tiles` — POST /api/projects/{project_id}/dashboards/{id}/reorder_tiles/
- `/get-api-projects-project-id-dashboards-id-run-insights` — Run all insights on a dashboard and return their results.
- `/post-api-projects-project-id-dashboards-id-snapshot` — Snapshot the current dashboard state (from cache) for AI analysis.
Returns a cache_key representing the 'before' state, to be used with analyze_refresh_result.
- `/get-api-projects-project-id-dashboards-id-stream-tiles` — Stream dashboard metadata and tiles via Server-Sent Events. Sends...
- `/post-api-projects-project-id-dashboards-id-update-text-tile` — Update the markdown body, layout, or color of an existing te...
- `/post-api-projects-project-id-dashboards-bulk-update-tags` — Bulk update tags on multiple objects.

PAT access: this action has no ``required_scopes=`` on the decorator —
inheriting viewsets must add ``"bulk_update_tags"`` to their
``scope_object_write_actions`` list to accept personal API keys.
Without that opt-in, ``APIScopePermission`` rejects PAT requests with
"This action does not support personal API key access". Done per-viewset
so granting ``<scope>:write`` for one resource doesn't leak access to
sibling resources that share this mixin.

Accepts:
- {"ids": [...], "action": "add"|"remove"|"set", "tags": ["tag1", "tag2"]}

Actions:
- "add": Add tags to existing tags on each object
- "remove": Remove specific tags from each object
- "set": Replace all tags on each object with the provided list
- `/post-api-projects-project-id-dashboards-create-from-template-json` — POST /api/projects/{project_id}/dashboards/create_from...
- `/post-api-projects-project-id-dashboards-create-unlisted-dashboard` — Creates an unlisted dashboard from template by tag.
Enforces uniqueness (one per tag per team).
Returns 409 if unlisted dashboard with this tag already exists.
- `/get-api-projects-project-id-data-color-themes` — GET /api/projects/{project_id}/data_color_themes/
- `/post-api-projects-project-id-data-color-themes` — POST /api/projects/{project_id}/data_color_themes/
- `/get-api-projects-project-id-data-color-themes-id` — GET /api/projects/{project_id}/data_color_themes/{id}/
- `/put-api-projects-project-id-data-color-themes-id` — PUT /api/projects/{project_id}/data_color_themes/{id}/
- `/patch-api-projects-project-id-data-color-themes-id` — PATCH /api/projects/{project_id}/data_color_themes/{id}/
- `/delete-api-projects-project-id-data-color-themes-id` — DELETE /api/projects/{project_id}/data_color_themes/{id}/
- `/get-api-projects-project-id-data-modeling-jobs` — List data modeling jobs which are "runs" for our saved queries.
- `/get-api-projects-project-id-data-modeling-jobs-id` — List data modeling jobs which are "runs" for our saved queries.
- `/get-api-projects-project-id-data-modeling-jobs-recent` — Get the most recent non-running job for each saved query from the ...
- `/get-api-projects-project-id-data-modeling-jobs-running` — Get all currently running jobs from the v2 backend.
- `/get-api-projects-project-id-data-warehouse-check-database-name` — Check if a database name is available.
- `/get-api-projects-project-id-data-warehouse-completed-activity` — Returns completed/non-running activities (jobs with status...
Supports pagination and cutoff time filtering.
- `/get-api-projects-project-id-data-warehouse-data-health-issues` — Returns failed/disabled data pipeline items for the Pipeli...
Includes: materializations, syncs, sources, destinations, and transformations.
- `/get-api-projects-project-id-data-warehouse-data-ops-dashboard` — Returns the data ops overview dashboard ID for this team, ...
- `/post-api-projects-project-id-data-warehouse-deprovision` — Start deprovisioning the managed warehouse for this team.
- `/get-api-projects-project-id-data-warehouse-job-stats` — Returns success and failed job statistics for the last 1, 7, or 30 ...
Query parameter 'days' can be 1, 7, or 30 (default: 7).
- `/get-api-projects-project-id-data-warehouse-property-values` — API endpoints for data warehouse aggregate statistics and ope...
- `/post-api-projects-project-id-data-warehouse-provision` — Start provisioning a managed warehouse for this team.
- `/post-api-projects-project-id-data-warehouse-reset-password` — Reset the root password for the managed warehouse.
- `/get-api-projects-project-id-data-warehouse-running-activity` — Returns currently running activities (jobs with status 'Runn...
Supports pagination and cutoff time filtering.
- `/get-api-projects-project-id-data-warehouse-total-rows-stats` — Returns aggregated statistics for the data warehouse total r...
Used by the frontend data warehouse scene to display usage information.
- `/get-api-projects-project-id-data-warehouse-warehouse-status` — Get the current provisioning status of the managed warehouse.
- `/get-api-projects-project-id-dataset-items` — GET /api/projects/{project_id}/dataset_items/
- `/post-api-projects-project-id-dataset-items` — POST /api/projects/{project_id}/dataset_items/
- `/get-api-projects-project-id-dataset-items-id` — GET /api/projects/{project_id}/dataset_items/{id}/
- `/put-api-projects-project-id-dataset-items-id` — PUT /api/projects/{project_id}/dataset_items/{id}/
- `/patch-api-projects-project-id-dataset-items-id` — PATCH /api/projects/{project_id}/dataset_items/{id}/
- `/delete-api-projects-project-id-dataset-items-id` — Hard delete of this model is not allowed. Use a patch API call to set "d...
- `/get-api-projects-project-id-datasets` — GET /api/projects/{project_id}/datasets/
- `/post-api-projects-project-id-datasets` — POST /api/projects/{project_id}/datasets/
- `/get-api-projects-project-id-datasets-id` — GET /api/projects/{project_id}/datasets/{id}/
- `/put-api-projects-project-id-datasets-id` — PUT /api/projects/{project_id}/datasets/{id}/
- `/patch-api-projects-project-id-datasets-id` — PATCH /api/projects/{project_id}/datasets/{id}/
- `/delete-api-projects-project-id-datasets-id` — Hard delete of this model is not allowed. Use a patch API call to set "delete...
- `/get-api-projects-project-id-deployment-projects` — CRUD for DeploymentProject (the connected-repo + hosting-target entity).

Create-time provisioning calls Cloudflare BEFORE writing the DB row
(see services/provision_project.py for the rationale). Delete is a
soft-delete; Cloudflare-side cleanup is deferred to a periodic Celery
task.
- `/post-api-projects-project-id-deployment-projects` — CRUD for DeploymentProject (the connected-repo + hosting-target entity).

Create-time provisioning calls Cloudflare BEFORE writing the DB row
(see services/provision_project.py for the rationale). Delete is a
soft-delete; Cloudflare-side cleanup is deferred to a periodic Celery
task.
- `/get-api-projects-project-id-deployment-projects-deployment-proje` — Full lifecycle viewset for Deployments.

All deployments are scoped to a parent DeploymentProject via the URL
parent lookup `deployment_project_id`. The viewset enforces that
scoping in `safely_get_queryset` so a user can never see / mutate a
deployment that doesn't belong to the project in the URL.
- `/post-api-projects-project-id-deployment-projects-deployment-proje` — Full lifecycle viewset for Deployments.

All deployments are scoped to a parent DeploymentProject via the URL
parent lookup `deployment_project_id`. The viewset enforces that
scoping in `safely_get_queryset` so a user can never see / mutate a
deployment that doesn't belong to the project in the URL.
- `/get-api-projects-project-id-deployment-projects-deployment-proje` — Full lifecycle viewset for Deployments.

All deployments are scoped to a parent DeploymentProject via the URL
parent lookup `deployment_project_id`. The viewset enforces that
scoping in `safely_get_queryset` so a user can never see / mutate a
deployment that doesn't belong to the project in the URL.
- `/post-api-projects-project-id-deployment-projects-deployment-proje` — Full lifecycle viewset for Deployments.

All deployments are scoped to a parent DeploymentProject via the URL
parent lookup `deployment_project_id`. The viewset enforces that
scoping in `safely_get_queryset` so a user can never see / mutate a
deployment that doesn't belong to the project in the URL.
- `/get-api-projects-project-id-deployment-projects-deployment-proje` — Full lifecycle viewset for Deployments.

All deployments are scoped to a parent DeploymentProject via the URL
parent lookup `deployment_project_id`. The viewset enforces that
scoping in `safely_get_queryset` so a user can never see / mutate a
deployment that doesn't belong to the project in the URL.
- `/get-api-projects-project-id-deployment-projects-deployment-proje` — Full lifecycle viewset for Deployments.

All deployments are scoped to a parent DeploymentProject via the URL
parent lookup `deployment_project_id`. The viewset enforces that
scoping in `safely_get_queryset` so a user can never see / mutate a
deployment that doesn't belong to the project in the URL.
- `/post-api-projects-project-id-deployment-projects-deployment-proje` — Full lifecycle viewset for Deployments.

All deployments are scoped to a parent DeploymentProject via the URL
parent lookup `deployment_project_id`. The viewset enforces that
scoping in `safely_get_queryset` so a user can never see / mutate a
deployment that doesn't belong to the project in the URL.
- `/post-api-projects-project-id-deployment-projects-deployment-proje` — Full lifecycle viewset for Deployments.

All deployments are scoped to a parent DeploymentProject via the URL
parent lookup `deployment_project_id`. The viewset enforces that
scoping in `safely_get_queryset` so a user can never see / mutate a
deployment that doesn't belong to the project in the URL.
- `/post-api-projects-project-id-deployment-projects-deployment-proje` — Full lifecycle viewset for Deployments.

All deployments are scoped to a parent DeploymentProject via the URL
parent lookup `deployment_project_id`. The viewset enforces that
scoping in `safely_get_queryset` so a user can never see / mutate a
deployment that doesn't belong to the project in the URL.
- `/get-api-projects-project-id-deployment-projects-id` — CRUD for DeploymentProject (the connected-repo + hosting-target entity).

Create-time provisioning calls Cloudflare BEFORE writing the DB row
(see services/provision_project.py for the rationale). Delete is a
soft-delete; Cloudflare-side cleanup is deferred to a periodic Celery
task.
- `/put-api-projects-project-id-deployment-projects-id` — CRUD for DeploymentProject (the connected-repo + hosting-target entity).

Create-time provisioning calls Cloudflare BEFORE writing the DB row
(see services/provision_project.py for the rationale). Delete is a
soft-delete; Cloudflare-side cleanup is deferred to a periodic Celery
task.
- `/patch-api-projects-project-id-deployment-projects-id` — CRUD for DeploymentProject (the connected-repo + hosting-target ent...

Create-time provisioning calls Cloudflare BEFORE writing the DB row
(see services/provision_project.py for the rationale). Delete is a
soft-delete; Cloudflare-side cleanup is deferred to a periodic Celery
task.
- `/delete-api-projects-project-id-deployment-projects-id` — CRUD for DeploymentProject (the connected-repo + hosting-target en...

Create-time provisioning calls Cloudflare BEFORE writing the DB row
(see services/provision_project.py for the rationale). Delete is a
soft-delete; Cloudflare-side cleanup is deferred to a periodic Celery
task.
- `/post-api-projects-project-id-deployment-projects-id-refresh` — Refresh a deployment project's GitHub branch
- `/post-api-projects-project-id-deployment-projects-detect` — Suggest project config from a repo's package.json and lockfiles
- `/get-api-projects-project-id-early-access-feature` — GET /api/projects/{project_id}/early_access_feature/
- `/post-api-projects-project-id-early-access-feature` — POST /api/projects/{project_id}/early_access_feature/
- `/get-api-projects-project-id-early-access-feature-id` — GET /api/projects/{project_id}/early_access_feature/{id}/
- `/put-api-projects-project-id-early-access-feature-id` — PUT /api/projects/{project_id}/early_access_feature/{id}/
- `/patch-api-projects-project-id-early-access-feature-id` — PATCH /api/projects/{project_id}/early_access_feature/{id}/
- `/delete-api-projects-project-id-early-access-feature-id` — DELETE /api/projects/{project_id}/early_access_feature/{id}/
- `/get-api-projects-project-id-elements` — GET /api/projects/{project_id}/elements/
- `/post-api-projects-project-id-elements` — POST /api/projects/{project_id}/elements/
- `/get-api-projects-project-id-elements-id` — GET /api/projects/{project_id}/elements/{id}/
- `/put-api-projects-project-id-elements-id` — PUT /api/projects/{project_id}/elements/{id}/
- `/patch-api-projects-project-id-elements-id` — PATCH /api/projects/{project_id}/elements/{id}/
- `/delete-api-projects-project-id-elements-id` — DELETE /api/projects/{project_id}/elements/{id}/
- `/get-api-projects-project-id-elements-stats` — The original version of this API always and only returned $autocapture elements
If no include query parameter is sent this remains true.
Now, you can pass a combination of include query parameters to get different types of elements
Currently only $autocapture and $rageclick and $dead_click are supported
- `/get-api-projects-project-id-elements-values` — GET /api/projects/{project_id}/elements/values/
- `/get-api-projects-project-id-endpoints` — List all endpoints for the team.
- `/post-api-projects-project-id-endpoints` — Create a new endpoint.
- `/get-api-projects-project-id-endpoints-name` — Retrieve an endpoint, or a specific version via ?version=N.
- `/put-api-projects-project-id-endpoints-name` — Update an existing endpoint. Parameters are optional. Pass version in body or...
- `/patch-api-projects-project-id-endpoints-name` — Update an existing endpoint.
- `/delete-api-projects-project-id-endpoints-name` — Delete an endpoint and clean up materialized query.
- `/post-api-projects-project-id-endpoints-name-materialization-previ` — Preview the materialization transform for an endpoint....
- `/get-api-projects-project-id-endpoints-name-materialization-statu` — Get materialization status for an endpoint. Supports ?v...
- `/get-api-projects-project-id-endpoints-name-openapi-json` — Get OpenAPI 3.0 specification for this endpoint. Use this to gen...
- `/get-api-projects-project-id-endpoints-name-run` — Execute endpoint with optional materialization. Supports version paramete...
- `/post-api-projects-project-id-endpoints-name-run` — Execute endpoint with optional materialization. Supports version paramet...
- `/get-api-projects-project-id-endpoints-name-versions` — List all versions for an endpoint.
- `/post-api-projects-project-id-endpoints-last-execution-times` — Get the last execution times in the past 6 months for multip...
- `/get-api-projects-project-id-environments` — Deprecated: use /api/environments/{id}/ instead.
- `/post-api-projects-project-id-environments` — Deprecated: use /api/environments/{id}/ instead.
- `/get-api-projects-project-id-environments-id` — Deprecated: use /api/environments/{id}/ instead.
- `/put-api-projects-project-id-environments-id` — Deprecated: use /api/environments/{id}/ instead.
- `/patch-api-projects-project-id-environments-id` — Deprecated: use /api/environments/{id}/ instead.
- `/delete-api-projects-project-id-environments-id` — Deprecated: use /api/environments/{id}/ instead.
- `/get-api-projects-project-id-environments-id-activity` — Deprecated: use /api/environments/{id}/ instead.
- `/patch-api-projects-project-id-environments-id-add-product-intent` — Deprecated: use /api/environments/{id}/ instead.
- `/patch-api-projects-project-id-environments-id-complete-product-onb` — Deprecated: use /api/environments/{id}/ instead.
- `/get-api-projects-project-id-environments-id-default-evaluation-c` — Manage default evaluation contexts for a team.
- `/post-api-projects-project-id-environments-id-default-evaluation-c` — Manage default evaluation contexts for a team.
- `/delete-api-projects-project-id-environments-id-default-evaluation-c` — Manage default evaluation contexts for a team.
- `/get-api-projects-project-id-environments-id-default-release-cond` — Manage default release conditions for new feature flags...
- `/put-api-projects-project-id-environments-id-default-release-cond` — Manage default release conditions for new feature flags...
- `/patch-api-projects-project-id-environments-id-delete-secret-token-` — Deprecated: use /api/environments/{id}/ instead.
- `/get-api-projects-project-id-environments-id-event-ingestion-rest` — Deprecated: use /api/environments/{id}/ instead.
- `/get-api-projects-project-id-environments-id-experiments-config` — Manage experiment configuration for this environment.
- `/patch-api-projects-project-id-environments-id-experiments-config` — Manage experiment configuration for this environment.
- `/post-api-projects-project-id-environments-id-generate-conversatio` — Deprecated: use /api/environments/{id}/ instead.
- `/get-api-projects-project-id-environments-id-is-generating-demo-d` — Deprecated: use /api/environments/{id}/ instead.
- `/get-api-projects-project-id-environments-id-logs-config` — Manage logs product configuration for this environment.
- `/patch-api-projects-project-id-environments-id-logs-config` — Manage logs product configuration for this environment.
- `/patch-api-projects-project-id-environments-id-reset-token` — Deprecated: use /api/environments/{id}/ instead.
- `/patch-api-projects-project-id-environments-id-rotate-secret-token` — Deprecated: use /api/environments/{id}/ instead.
- `/get-api-projects-project-id-environments-id-settings-as-of` — Return the team settings as of the provided timestamp.
Query params:
- at: ISO8601 datetime (required)
- scope: optional, one or multiple keys to filter the returned settings
- `/get-api-projects-project-id-error-tracking-releases` — GET /api/projects/{project_id}/error_tracking/releases/
- `/post-api-projects-project-id-error-tracking-releases` — POST /api/projects/{project_id}/error_tracking/releases/
- `/get-api-projects-project-id-error-tracking-releases-id` — GET /api/projects/{project_id}/error_tracking/releases/{id}/
- `/put-api-projects-project-id-error-tracking-releases-id` — PUT /api/projects/{project_id}/error_tracking/releases/{id}/
- `/patch-api-projects-project-id-error-tracking-releases-id` — PATCH /api/projects/{project_id}/error_tracking/releases/{id}/
- `/delete-api-projects-project-id-error-tracking-releases-id` — DELETE /api/projects/{project_id}/error_tracking/releases/{id}/
- `/get-api-projects-project-id-error-tracking-releases-hash-hash-id` — GET /api/projects/{project_id}/error_tracking/releases/...
- `/get-api-projects-project-id-error-tracking-symbol-sets` — GET /api/projects/{project_id}/error_tracking/symbol_sets/
- `/get-api-projects-project-id-error-tracking-symbol-sets-id` — GET /api/projects/{project_id}/error_tracking/symbol_sets/{id}/
- `/delete-api-projects-project-id-error-tracking-symbol-sets-id` — DELETE /api/projects/{project_id}/error_tracking/symbol_set...
- `/get-api-projects-project-id-error-tracking-symbol-sets-id-downlo` — Return a presigned URL for downloading the symbol set's...
- `/put-api-projects-project-id-error-tracking-symbol-sets-id-finish` — PUT /api/projects/{project_id}/error_tracking/symbol_se...
- `/post-api-projects-project-id-error-tracking-symbol-sets-bulk-dele` — POST /api/projects/{project_id}/error_tracking/symbol_...
- `/post-api-projects-project-id-error-tracking-symbol-sets-bulk-fini` — POST /api/projects/{project_id}/error_tracking/symbol_...
- `/post-api-projects-project-id-error-tracking-symbol-sets-bulk-star` — POST /api/projects/{project_id}/error_tracking/symbol_...
- `/get-api-projects-project-id-event-definitions` — GET /api/projects/{project_id}/event_definitions/
- `/post-api-projects-project-id-event-definitions` — POST /api/projects/{project_id}/event_definitions/
- `/get-api-projects-project-id-event-definitions-id` — GET /api/projects/{project_id}/event_definitions/{id}/
- `/put-api-projects-project-id-event-definitions-id` — PUT /api/projects/{project_id}/event_definitions/{id}/
- `/patch-api-projects-project-id-event-definitions-id` — PATCH /api/projects/{project_id}/event_definitions/{id}/
- `/delete-api-projects-project-id-event-definitions-id` — DELETE /api/projects/{project_id}/event_definitions/{id}/
- `/get-api-projects-project-id-event-definitions-id-metrics` — GET /api/projects/{project_id}/event_definitions/{id}/metrics/
- `/post-api-projects-project-id-event-definitions-bulk-update-tags` — Bulk update tags on multiple objects.

PAT access: this action has no ``required_scopes=`` on the decorator —
inheriting viewsets must add ``"bulk_update_tags"`` to their
``scope_object_write_actions`` list to accept personal API keys.
Without that opt-in, ``APIScopePermission`` rejects PAT requests with
"This action does not support personal API key access". Done per-viewset
so granting ``<scope>:write`` for one resource doesn't leak access to
sibling resources that share this mixin.

Accepts:
- {"ids": [...], "action": "add"|"remove"|"set", "tags": ["tag1", "tag2"]}

Actions:
- "add": Add tags to existing tags on each object
- "remove": Remove specific tags from each object
- "set": Replace all tags on each object with the provided list
- `/get-api-projects-project-id-event-definitions-by-name` — Get event definition by exact name
- `/get-api-projects-project-id-event-definitions-golang` — GET /api/projects/{project_id}/event_definitions/golang/
- `/get-api-projects-project-id-event-definitions-primary-properties` — Resolve team-configured primary properties for event de...

The response only contains entries where a non-null primary_property is set on the
EventDefinition. Callers should fall back to the core taxonomy defaults client-side
for names not present in the response.
- `/get-api-projects-project-id-event-definitions-python` — GET /api/projects/{project_id}/event_definitions/python/
- `/get-api-projects-project-id-event-definitions-typescript` — GET /api/projects/{project_id}/event_definitions/typescript/
- `/get-api-projects-project-id-event-schemas` — GET /api/projects/{project_id}/event_schemas/
- `/post-api-projects-project-id-event-schemas` — POST /api/projects/{project_id}/event_schemas/
- `/put-api-projects-project-id-event-schemas-id` — PUT /api/projects/{project_id}/event_schemas/{id}/
- `/patch-api-projects-project-id-event-schemas-id` — PATCH /api/projects/{project_id}/event_schemas/{id}/
- `/delete-api-projects-project-id-event-schemas-id` — DELETE /api/projects/{project_id}/event_schemas/{id}/
- `/get-api-projects-project-id-events` — 
        This endpoint allows you to list and filter events.
        It is effectively deprecated and is kept only for backwards compatibility.
        If you ever ask about it you will be advised to not use it...
        If you want to ad-hoc list or aggregate events, use the Query endpoint instead.
        If you want to export all events or many pages of events you should use our CDP/Batch Exports products instead.
        
- `/get-api-projects-project-id-events-id` — GET /api/projects/{project_id}/events/{id}/
- `/get-api-projects-project-id-events-values` — GET /api/projects/{project_id}/events/values/
- `/get-api-projects-project-id-experiment-holdouts` — GET /api/projects/{project_id}/experiment_holdouts/
- `/post-api-projects-project-id-experiment-holdouts` — POST /api/projects/{project_id}/experiment_holdouts/
- `/get-api-projects-project-id-experiment-holdouts-id` — GET /api/projects/{project_id}/experiment_holdouts/{id}/
- `/put-api-projects-project-id-experiment-holdouts-id` — PUT /api/projects/{project_id}/experiment_holdouts/{id}/
- `/patch-api-projects-project-id-experiment-holdouts-id` — PATCH /api/projects/{project_id}/experiment_holdouts/{id}/
- `/delete-api-projects-project-id-experiment-holdouts-id` — DELETE /api/projects/{project_id}/experiment_holdouts/{id}/
- `/get-api-projects-project-id-experiment-saved-metrics` — GET /api/projects/{project_id}/experiment_saved_metrics/
- `/post-api-projects-project-id-experiment-saved-metrics` — POST /api/projects/{project_id}/experiment_saved_metrics/
- `/get-api-projects-project-id-experiment-saved-metrics-id` — GET /api/projects/{project_id}/experiment_saved_metrics/{id}/
- `/put-api-projects-project-id-experiment-saved-metrics-id` — PUT /api/projects/{project_id}/experiment_saved_metrics/{id}/
- `/patch-api-projects-project-id-experiment-saved-metrics-id` — PATCH /api/projects/{project_id}/experiment_saved_metrics/{id}/
- `/delete-api-projects-project-id-experiment-saved-metrics-id` — DELETE /api/projects/{project_id}/experiment_saved_metrics/{id}/
- `/get-api-projects-project-id-experiments` — List experiments for the current project. Supports filtering by status and archi...
- `/post-api-projects-project-id-experiments` — Create a new experiment in draft status with optional metrics.
- `/get-api-projects-project-id-experiments-id` — Retrieve a single experiment by ID, including its current status, metrics, fe...
- `/put-api-projects-project-id-experiments-id` — Mixin for ViewSets to handle ApprovalRequired exceptions from decorated seria...

This mixin intercepts ApprovalRequired exceptions raised by the @approval_gate decorator
on serializer methods and converts them into proper HTTP 409 Conflict responses with
change request details.
- `/patch-api-projects-project-id-experiments-id` — Update an experiment. Use this to modify experiment properties such as name...
- `/delete-api-projects-project-id-experiments-id` — Hard delete of this model is not allowed. Use a patch API call to set "del...
- `/post-api-projects-project-id-experiments-id-archive` — Archive an ended experiment.

Hides the experiment from the default list view. The experiment can be
restored at any time by updating archived=false. Returns 400 if the
experiment is already archived or has not ended yet.
- `/post-api-projects-project-id-experiments-id-copy-to-project` — Mixin for ViewSets to handle ApprovalRequired exceptions fro...

This mixin intercepts ApprovalRequired exceptions raised by the @approval_gate decorator
on serializer methods and converts them into proper HTTP 409 Conflict responses with
change request details.
- `/post-api-projects-project-id-experiments-id-create-exposure-cohor` — Mixin for ViewSets to handle ApprovalRequired exceptio...

This mixin intercepts ApprovalRequired exceptions raised by the @approval_gate decorator
on serializer methods and converts them into proper HTTP 409 Conflict responses with
change request details.
- `/post-api-projects-project-id-experiments-id-duplicate` — Mixin for ViewSets to handle ApprovalRequired exceptions from deco...

This mixin intercepts ApprovalRequired exceptions raised by the @approval_gate decorator
on serializer methods and converts them into proper HTTP 409 Conflict responses with
change request details.
- `/post-api-projects-project-id-experiments-id-end` — End a running experiment without shipping a variant.

Sets end_date to now and marks the experiment as stopped. The feature
flag is NOT modified — users continue to see their assigned variants
and exposure events ($feature_flag_called) continue to be recorded.
However, only data up to end_date is included in experiment results.

Use this when:

- You want to freeze the results window without changing which variant
  users see.
- A variant was already shipped manually via the feature flag UI and
  the experiment just needs to be marked complete.

The end_date can be adjusted after ending via PATCH if it needs to be
backdated (e.g. to match when the flag was actually paused).

Other options:
- Use ship_variant to end the experiment AND roll out a single variant to 100%% of users.
- Use pause to deactivate the flag without ending the experiment (stops variant assignment but does not freeze results).

Returns 400 if the experiment is not running.
- `/post-api-projects-project-id-experiments-id-launch` — Launch a draft experiment.

Validates the experiment is in draft state, activates its linked feature flag,
sets start_date to the current server time, and transitions the experiment to running.
Returns 400 if the experiment has already been launched or if the feature flag
configuration is invalid (e.g. missing "control" variant or fewer than 2 variants).
- `/post-api-projects-project-id-experiments-id-pause` — Pause a running experiment.

Deactivates the linked feature flag so it is no longer returned by the
/decide endpoint. Users fall back to the application default (typically
the control experience), and no new exposure events are recorded (i.e.
$feature_flag_called is not fired).
Returns 400 if the experiment is not running or is already paused.
- `/post-api-projects-project-id-experiments-id-recalculate-timeserie` — Mixin for ViewSets to handle ApprovalRequired exceptio...

This mixin intercepts ApprovalRequired exceptions raised by the @approval_gate decorator
on serializer methods and converts them into proper HTTP 409 Conflict responses with
change request details.
- `/post-api-projects-project-id-experiments-id-reset` — Reset an experiment back to draft state.

Clears start/end dates, conclusion, and archived flag. The feature
flag is left unchanged — users continue to see their assigned variants.

Previously collected events still exist but won't be included in
results unless the start date is manually adjusted after re-launch.

Returns 400 if the experiment is already in draft state.
- `/post-api-projects-project-id-experiments-id-resume` — Resume a paused experiment.

Reactivates the linked feature flag so it is returned by /decide again.
Users are re-bucketed deterministically into the same variants they had
before the pause, and exposure tracking resumes.
Returns 400 if the experiment is not running or is not paused.
- `/post-api-projects-project-id-experiments-id-ship-variant` — Ship a variant and (optionally) end the experiment.

Updates the feature flag so the selected variant gets 100% of the variant
distribution. By default, existing release conditions on the flag are preserved
untouched — the variant is served only to users who already match them. Pass
``release_to_everyone: true`` to also prepend a catch-all release condition
that rolls the variant out to 100% of users (overrides any existing release
conditions on the flag).

Can be called on both running and stopped experiments. If the experiment is
still running, it will also be ended (end_date set and status marked as stopped).
If the experiment has already ended, only the flag is rewritten - this supports
the "end first, ship later" workflow.

If an approval policy requires review before changes on the flag take effect,
the API returns 409 with a change_request_id. The experiment is NOT ended until
the change request is approved and the user retries.

Returns 400 if the experiment is in draft state, the variant_key is not found
on the flag, or the experiment has no linked feature flag.
- `/get-api-projects-project-id-experiments-id-timeseries-results` — Mixin for ViewSets to handle ApprovalRequired exceptions f...

This mixin intercepts ApprovalRequired exceptions raised by the @approval_gate decorator
on serializer methods and converts them into proper HTTP 409 Conflict responses with
change request details.
- `/post-api-projects-project-id-experiments-id-unarchive` — Unarchive an archived experiment.

Restores the experiment to the default list view. Returns 400 if the
experiment is not currently archived.
- `/post-api-projects-project-id-experiments-create-from-prompt` — Create an experiment that compares N versions of an LLM prom...

The user picks 2+ versions of an existing LLMPrompt and 1+ metric templates
(cost / latency / eval_pass_rate). The endpoint builds the matching variants
(control + test-N, each named after its prompt version) and attaches one
metric per selected template, each scoped to the prompt's $ai_prompt_name.
Resulting experiment is in draft state.
- `/get-api-projects-project-id-experiments-eligible-feature-flags` — Returns a paginated list of feature flags eligible for us...

Eligible flags must:
- Be multivariate with at least 2 variants
- Have "control" as the first variant key

Query parameters:
- search: Filter by flag key or name (case insensitive)
- limit: Number of results per page (default: 20)
- offset: Pagination offset (default: 0)
- active: Filter by active status ("true" or "false")
- created_by_id: Filter by creator user ID
- order: Sort order field
- evaluation_runtime: Filter by evaluation runtime
- has_evaluation_contexts: Filter by presence of evaluation contexts ("true" or "false")
- `/get-api-projects-project-id-experiments-prompt-templates` — List the LLM metric templates that can be passed to `create_fro...
- `/get-api-projects-project-id-experiments-requires-flag-implementa` — Mixin for ViewSets to handle ApprovalRequired exception...

This mixin intercepts ApprovalRequired exceptions raised by the @approval_gate decorator
on serializer methods and converts them into proper HTTP 409 Conflict responses with
change request details.
- `/get-api-projects-project-id-experiments-stats` — Mixin for ViewSets to handle ApprovalRequired exceptions from decorated se...

This mixin intercepts ApprovalRequired exceptions raised by the @approval_gate decorator
on serializer methods and converts them into proper HTTP 409 Conflict responses with
change request details.
- `/get-api-projects-project-id-exports` — GET /api/projects/{project_id}/exports/
- `/post-api-projects-project-id-exports` — POST /api/projects/{project_id}/exports/
- `/get-api-projects-project-id-exports-id` — GET /api/projects/{project_id}/exports/{id}/
- `/get-api-projects-project-id-exports-id-content` — GET /api/projects/{project_id}/exports/{id}/content/
- `/get-api-projects-project-id-external-data-schemas` — GET /api/projects/{project_id}/external_data_schemas/
- `/post-api-projects-project-id-external-data-schemas` — POST /api/projects/{project_id}/external_data_schemas/
- `/get-api-projects-project-id-external-data-schemas-id` — GET /api/projects/{project_id}/external_data_schemas/{id}/
- `/put-api-projects-project-id-external-data-schemas-id` — PUT /api/projects/{project_id}/external_data_schemas/{id}/
- `/patch-api-projects-project-id-external-data-schemas-id` — PATCH /api/projects/{project_id}/external_data_schemas/{id}/
- `/delete-api-projects-project-id-external-data-schemas-id` — DELETE /api/projects/{project_id}/external_data_schemas/{id}/
- `/post-api-projects-project-id-external-data-schemas-id-cancel` — POST /api/projects/{project_id}/external_data_schemas/{id}/...
- `/delete-api-projects-project-id-external-data-schemas-id-delete-data` — DELETE /api/projects/{project_id}/external_data_sche...
- `/post-api-projects-project-id-external-data-schemas-id-incremental` — POST /api/projects/{project_id}/external_data_schemas/...
- `/post-api-projects-project-id-external-data-schemas-id-reload` — POST /api/projects/{project_id}/external_data_schemas/{id}/...
- `/post-api-projects-project-id-external-data-schemas-id-resync` — POST /api/projects/{project_id}/external_data_schemas/{id}/...
- `/get-api-projects-project-id-external-data-sources` — Create, Read, Update and Delete External data Sources.
- `/post-api-projects-project-id-external-data-sources` — Create, Read, Update and Delete External data Sources.
- `/get-api-projects-project-id-external-data-sources-id` — Create, Read, Update and Delete External data Sources.
- `/put-api-projects-project-id-external-data-sources-id` — Create, Read, Update and Delete External data Sources.
- `/patch-api-projects-project-id-external-data-sources-id` — Create, Read, Update and Delete External data Sources.
- `/delete-api-projects-project-id-external-data-sources-id` — Create, Read, Update and Delete External data Sources.
- `/patch-api-projects-project-id-external-data-sources-id-bulk-update` — Create, Read, Update and Delete External data Sources.
- `/post-api-projects-project-id-external-data-sources-id-create-webh` — Create, Read, Update and Delete External data Sources.
- `/post-api-projects-project-id-external-data-sources-id-delete-webh` — Create, Read, Update and Delete External data Sources.
- `/get-api-projects-project-id-external-data-sources-id-jobs` — Create, Read, Update and Delete External data Sources.
- `/post-api-projects-project-id-external-data-sources-id-refresh-sch` — Fetch current schema/table list from the source and cr...
- `/post-api-projects-project-id-external-data-sources-id-reload` — Create, Read, Update and Delete External data Sources.
- `/patch-api-projects-project-id-external-data-sources-id-revenue-ana` — Update the revenue analytics configuration and return...
- `/post-api-projects-project-id-external-data-sources-id-update-webh` — Create, Read, Update and Delete External data Sources.
- `/get-api-projects-project-id-external-data-sources-id-webhook-inf` — Create, Read, Update and Delete External data Sources.
- `/post-api-projects-project-id-external-data-sources-check-cdc-prer` — Validate CDC prerequisites against a live Postgres con...

Used by the source wizard to surface ✅/❌ checks before source creation,
and by the self-managed setup popup to verify user-created publications.
- `/get-api-projects-project-id-external-data-sources-connections` — Create, Read, Update and Delete External data Sources.
- `/post-api-projects-project-id-external-data-sources-database-schem` — Create, Read, Update and Delete External data Sources.
- `/post-api-projects-project-id-external-data-sources-source-prefix` — Create, Read, Update and Delete External data Sources.
- `/get-api-projects-project-id-external-data-sources-wizard` — Create, Read, Update and Delete External data Sources.
- `/get-api-projects-project-id-feature-flags` — Create, read, update and delete feature flags. [See docs](https://posthog.com/...

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint...
- `/post-api-projects-project-id-feature-flags` — Create, read, update and delete feature flags. [See docs](https://posthog.com...

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint...
- `/get-api-projects-project-id-feature-flags-id` — Create, read, update and delete feature flags. [See docs](https://posthog.c...

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint...
- `/put-api-projects-project-id-feature-flags-id` — Create, read, update and delete feature flags. [See docs](https://posthog.c...

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint...
- `/patch-api-projects-project-id-feature-flags-id` — Create, read, update and delete feature flags. [See docs](https://posthog...

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint...
- `/delete-api-projects-project-id-feature-flags-id` — Hard delete of this model is not allowed. Use a patch API call to set "d...
- `/get-api-projects-project-id-feature-flags-id-activity` — Create, read, update and delete feature flags. [See docs](https://...

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint...
- `/post-api-projects-project-id-feature-flags-id-create-static-cohor` — Create, read, update and delete feature flags. [See do...

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint...
- `/post-api-projects-project-id-feature-flags-id-dashboard` — Create, read, update and delete feature flags. [See docs](https:...

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint...
- `/get-api-projects-project-id-feature-flags-id-dependent-flags` — Get other active flags that depend on this flag.
- `/post-api-projects-project-id-feature-flags-id-enrich-usage-dashbo` — Create, read, update and delete feature flags. [See do...

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint...
- `/get-api-projects-project-id-feature-flags-id-remote-config` — Create, read, update and delete feature flags. [See docs](htt...

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint...
- `/get-api-projects-project-id-feature-flags-id-status` — Create, read, update and delete feature flags. [See docs](https://po...

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint...
- `/post-api-projects-project-id-feature-flags-id-test-evaluation` — Test feature flag evaluation against a specific user at an...

This endpoint allows testing how a feature flag would evaluate for a specific user,
optionally at a historical timestamp. When a timestamp is provided, both the flag
conditions and person properties are evaluated as they existed at that time.
- `/get-api-projects-project-id-feature-flags-id-versions-version-nu` — Create, read, update and delete feature flags. [See doc...

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint...
- `/get-api-projects-project-id-feature-flags-activity` — Create, read, update and delete feature flags. [See docs](https://pos...

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint...
- `/post-api-projects-project-id-feature-flags-bulk-delete` — Bulk delete feature flags by filter criteria or explicit IDs.

Accepts either:
- {"filters": {...}} - Same filter params as list endpoint (search, active, type, etc.)
- {"ids": [...]} - Explicit list of flag IDs (no limit)

Returns same format as bulk_delete for UI compatibility.

Uses bulk operations for efficiency: database updates are batched and cache
invalidation happens once at the end rather than per-flag.
- `/post-api-projects-project-id-feature-flags-bulk-keys` — Get feature flag keys by IDs.
Accepts a list of feature flag IDs and returns a mapping of ID to key.
- `/post-api-projects-project-id-feature-flags-bulk-update-tags` — Bulk update tags on multiple objects.

PAT access: this action has no ``required_scopes=`` on the decorator —
inheriting viewsets must add ``"bulk_update_tags"`` to their
``scope_object_write_actions`` list to accept personal API keys.
Without that opt-in, ``APIScopePermission`` rejects PAT requests with
"This action does not support personal API key access". Done per-viewset
so granting ``<scope>:write`` for one resource doesn't leak access to
sibling resources that share this mixin.

Accepts:
- {"ids": [...], "action": "add"|"remove"|"set", "tags": ["tag1", "tag2"]}

Actions:
- "add": Add tags to existing tags on each object
- "remove": Remove specific tags from each object
- "set": Replace all tags on each object with the provided list
- `/get-api-projects-project-id-feature-flags-evaluation-reasons` — Create, read, update and delete feature flags. [See docs](h...

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint...
- `/get-api-projects-project-id-feature-flags-local-evaluation` — Create, read, update and delete feature flags. [See docs](htt...

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint...
- `/get-api-projects-project-id-feature-flags-matching-ids` — Get IDs of all feature flags matching the current filters.
Uses the same filtering logic as the list endpoint.
Returns only IDs that the user has permission to edit.
- `/get-api-projects-project-id-feature-flags-my-flags` — Create, read, update and delete feature flags. [See docs](https://pos...

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint...
- `/post-api-projects-project-id-feature-flags-user-blast-radius` — Create, read, update and delete feature flags. [See docs](h...

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint...
- `/get-api-projects-project-id-file-download-batch-exports` — GET /api/projects/{project_id}/file_download_batch_exports/
- `/post-api-projects-project-id-file-download-batch-exports` — Create and start a batch export on demand run to download a file.
- `/get-api-projects-project-id-file-download-batch-exports-id` — Get a batch export on demand run.

If the underlying batch export run has completed, we return keys to the
generated file downloads so that users may download them by making a request
to /download.
- `/post-api-projects-project-id-file-download-batch-exports-id-cance` — Cancel an ongoing file-download batch export.
- `/get-api-projects-project-id-file-download-batch-exports-id-downl` — Download a file (or a part) from this batch export run.

Users can provide a part component with an id or index, or no part component at
all:
* If part id is included: The file download matching the id is downloaded.
* If part index is included: The file download matching the index (as ordered
    by key) is downloaded.
* If no part component is present: If there is only one file downloaded, that
    is downloaded. Otherwise the first one as sorted by key is downloaded.
- `/get-api-projects-project-id-file-download-batch-exports-id-logs` — GET /api/projects/{project_id}/file_download_batch_expor...
- `/get-api-projects-project-id-file-system` — GET /api/projects/{project_id}/file_system/
- `/post-api-projects-project-id-file-system` — POST /api/projects/{project_id}/file_system/
- `/get-api-projects-project-id-file-system-id` — GET /api/projects/{project_id}/file_system/{id}/
- `/put-api-projects-project-id-file-system-id` — PUT /api/projects/{project_id}/file_system/{id}/
- `/patch-api-projects-project-id-file-system-id` — PATCH /api/projects/{project_id}/file_system/{id}/
- `/delete-api-projects-project-id-file-system-id` — DELETE /api/projects/{project_id}/file_system/{id}/
- `/post-api-projects-project-id-file-system-id-count` — Get count of all files in a folder.
- `/post-api-projects-project-id-file-system-id-link` — POST /api/projects/{project_id}/file_system/{id}/link/
- `/post-api-projects-project-id-file-system-id-move` — POST /api/projects/{project_id}/file_system/{id}/move/
- `/post-api-projects-project-id-file-system-count-by-path` — Get count of all files in a folder.
- `/get-api-projects-project-id-file-system-log-view` — GET /api/projects/{project_id}/file_system/log_view/
- `/post-api-projects-project-id-file-system-log-view` — POST /api/projects/{project_id}/file_system/log_view/
- `/post-api-projects-project-id-file-system-undo-delete` — POST /api/projects/{project_id}/file_system/undo_delete/
- `/get-api-projects-project-id-file-system-unfiled` — GET /api/projects/{project_id}/file_system/unfiled/
- `/get-api-projects-project-id-file-system-shortcut` — GET /api/projects/{project_id}/file_system_shortcut/
- `/post-api-projects-project-id-file-system-shortcut` — POST /api/projects/{project_id}/file_system_shortcut/
- `/get-api-projects-project-id-file-system-shortcut-id` — GET /api/projects/{project_id}/file_system_shortcut/{id}/
- `/put-api-projects-project-id-file-system-shortcut-id` — PUT /api/projects/{project_id}/file_system_shortcut/{id}/
- `/patch-api-projects-project-id-file-system-shortcut-id` — PATCH /api/projects/{project_id}/file_system_shortcut/{id}/
- `/delete-api-projects-project-id-file-system-shortcut-id` — DELETE /api/projects/{project_id}/file_system_shortcut/{id}/
- `/post-api-projects-project-id-file-system-shortcut-reorder` — Set the display order of the current user's shortcuts. `ordere...
- `/get-api-projects-project-id-flag-value-values` — Get possible values for a feature flag.

Query parameters:
- key: The flag ID (required)
Returns:

- Array of objects with 'name' field containing possible values
- `/get-api-projects-project-id-groups` — List all groups of a specific group type. You must pass ?group_type_index= in the URL.
To get a list of valid group types, call /api/:project_id/groups_types/.

Uses forward-only keyset pagination via the `cursor` parameter.
The `previous` field in the response envelope is always null.
- `/post-api-projects-project-id-groups` — POST /api/projects/{project_id}/groups/
- `/get-api-projects-project-id-groups-activity` — GET /api/projects/{project_id}/groups/activity/
- `/post-api-projects-project-id-groups-delete-property` — POST /api/projects/{project_id}/groups/delete_property/
- `/get-api-projects-project-id-groups-find` — GET /api/projects/{project_id}/groups/find/
- `/get-api-projects-project-id-groups-property-definitions` — GET /api/projects/{project_id}/groups/property_definitions/
- `/get-api-projects-project-id-groups-property-values` — GET /api/projects/{project_id}/groups/property_values/
- `/get-api-projects-project-id-groups-related` — GET /api/projects/{project_id}/groups/related/
- `/post-api-projects-project-id-groups-update-property` — POST /api/projects/{project_id}/groups/update_property/
- `/get-api-projects-project-id-groups-types` — GET /api/projects/{project_id}/groups_types/
- `/delete-api-projects-project-id-groups-types-group-type-index` — DELETE /api/projects/{project_id}/groups_types/{group_type_...
- `/get-api-projects-project-id-groups-types-group-type-index-metric` — GET /api/projects/{project_id}/groups_types/{group_type...
- `/post-api-projects-project-id-groups-types-group-type-index-metric` — POST /api/projects/{project_id}/groups_types/{group_ty...
- `/get-api-projects-project-id-groups-types-group-type-index-metric` — GET /api/projects/{project_id}/groups_types/{group_type...
- `/put-api-projects-project-id-groups-types-group-type-index-metric` — PUT /api/projects/{project_id}/groups_types/{group_type...
- `/patch-api-projects-project-id-groups-types-group-type-index-metric` — PATCH /api/projects/{project_id}/groups_types/{group_...
- `/delete-api-projects-project-id-groups-types-group-type-index-metric` — DELETE /api/projects/{project_id}/groups_types/{grou...
- `/put-api-projects-project-id-groups-types-create-detail-dashboard` — PUT /api/projects/{project_id}/groups_types/create_deta...
- `/put-api-projects-project-id-groups-types-set-default-columns` — PUT /api/projects/{project_id}/groups_types/set_default_col...
- `/patch-api-projects-project-id-groups-types-update-metadata` — PATCH /api/projects/{project_id}/groups_types/update_metadata/
- `/get-api-projects-project-id-heatmap-screenshots-id-content` — GET /api/projects/{project_id}/heatmap_screenshots/{id}/content/
- `/get-api-projects-project-id-heatmaps` — GET /api/projects/{project_id}/heatmaps/
- `/get-api-projects-project-id-heatmaps-events` — GET /api/projects/{project_id}/heatmaps/events/
- `/get-api-projects-project-id-hog-flows` — GET /api/projects/{project_id}/hog_flows/
- `/post-api-projects-project-id-hog-flows` — POST /api/projects/{project_id}/hog_flows/
- `/get-api-projects-project-id-hog-flows-id` — GET /api/projects/{project_id}/hog_flows/{id}/
- `/put-api-projects-project-id-hog-flows-id` — PUT /api/projects/{project_id}/hog_flows/{id}/
- `/patch-api-projects-project-id-hog-flows-id` — PATCH /api/projects/{project_id}/hog_flows/{id}/
- `/delete-api-projects-project-id-hog-flows-id` — DELETE /api/projects/{project_id}/hog_flows/{id}/
- `/get-api-projects-project-id-hog-flows-id-batch-jobs` — GET /api/projects/{project_id}/hog_flows/{id}/batch_jobs/
- `/post-api-projects-project-id-hog-flows-id-batch-jobs` — POST /api/projects/{project_id}/hog_flows/{id}/batch_jobs/
- `/post-api-projects-project-id-hog-flows-id-invocations` — POST /api/projects/{project_id}/hog_flows/{id}/invocations/
- `/get-api-projects-project-id-hog-flows-id-logs` — GET /api/projects/{project_id}/hog_flows/{id}/logs/
- `/get-api-projects-project-id-hog-flows-id-metrics` — GET /api/projects/{project_id}/hog_flows/{id}/metrics/
- `/get-api-projects-project-id-hog-flows-id-metrics-totals` — GET /api/projects/{project_id}/hog_flows/{id}/metrics/totals/
- `/get-api-projects-project-id-hog-flows-id-schedules` — GET /api/projects/{project_id}/hog_flows/{id}/schedules/
- `/post-api-projects-project-id-hog-flows-id-schedules` — POST /api/projects/{project_id}/hog_flows/{id}/schedules/
- `/patch-api-projects-project-id-hog-flows-id-schedules-schedule-id` — PATCH /api/projects/{project_id}/hog_flows/{id}/schedul...
- `/delete-api-projects-project-id-hog-flows-id-schedules-schedule-id` — DELETE /api/projects/{project_id}/hog_flows/{id}/sched...
- `/post-api-projects-project-id-hog-flows-bulk-delete` — POST /api/projects/{project_id}/hog_flows/bulk_delete/
- `/post-api-projects-project-id-hog-flows-user-blast-radius` — POST /api/projects/{project_id}/hog_flows/user_blast_radius/
- `/get-api-projects-project-id-hog-function-templates` — GET /api/projects/{project_id}/hog_function_templates/
- `/get-api-projects-project-id-hog-function-templates-template-id` — GET /api/projects/{project_id}/hog_function_templates/{te...
- `/get-api-projects-project-id-hog-functions` — GET /api/projects/{project_id}/hog_functions/
- `/post-api-projects-project-id-hog-functions` — POST /api/projects/{project_id}/hog_functions/
- `/get-api-projects-project-id-hog-functions-id` — GET /api/projects/{project_id}/hog_functions/{id}/
- `/put-api-projects-project-id-hog-functions-id` — PUT /api/projects/{project_id}/hog_functions/{id}/
- `/patch-api-projects-project-id-hog-functions-id` — PATCH /api/projects/{project_id}/hog_functions/{id}/
- `/delete-api-projects-project-id-hog-functions-id` — Hard delete of this model is not allowed. Use a patch API call to set "d...
- `/post-api-projects-project-id-hog-functions-id-enable-backfills` — POST /api/projects/{project_id}/hog_functions/{id}/enable...
- `/post-api-projects-project-id-hog-functions-id-invocations` — POST /api/projects/{project_id}/hog_functions/{id}/invocations/
- `/get-api-projects-project-id-hog-functions-id-logs` — GET /api/projects/{project_id}/hog_functions/{id}/logs/
- `/get-api-projects-project-id-hog-functions-id-metrics` — GET /api/projects/{project_id}/hog_functions/{id}/metrics/
- `/get-api-projects-project-id-hog-functions-id-metrics-totals` — GET /api/projects/{project_id}/hog_functions/{id}/metrics/to...
- `/get-api-projects-project-id-hog-functions-icon` — GET /api/projects/{project_id}/hog_functions/icon/
- `/get-api-projects-project-id-hog-functions-icons` — GET /api/projects/{project_id}/hog_functions/icons/
- `/patch-api-projects-project-id-hog-functions-rearrange` — Update the execution order of multiple HogFunctions.
- `/get-api-projects-project-id-insight-variables` — GET /api/projects/{project_id}/insight_variables/
- `/post-api-projects-project-id-insight-variables` — POST /api/projects/{project_id}/insight_variables/
- `/get-api-projects-project-id-insight-variables-id` — GET /api/projects/{project_id}/insight_variables/{id}/
- `/put-api-projects-project-id-insight-variables-id` — PUT /api/projects/{project_id}/insight_variables/{id}/
- `/patch-api-projects-project-id-insight-variables-id` — PATCH /api/projects/{project_id}/insight_variables/{id}/
- `/delete-api-projects-project-id-insight-variables-id` — DELETE /api/projects/{project_id}/insight_variables/{id}/
- `/get-api-projects-project-id-insights` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/post-api-projects-project-id-insights` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/get-api-projects-project-id-insights-insight-id-sharing` — GET /api/projects/{project_id}/insights/{insight_id}/sharing/
- `/post-api-projects-project-id-insights-insight-id-sharing-password` — Create a new password for the sharing configuration.
- `/delete-api-projects-project-id-insights-insight-id-sharing-password` — Delete a password from the sharing configuration.
- `/post-api-projects-project-id-insights-insight-id-sharing-refresh` — POST /api/projects/{project_id}/insights/{insight_id}/s...
- `/get-api-projects-project-id-insights-insight-id-thresholds` — GET /api/projects/{project_id}/insights/{insight_id}/thresholds/
- `/get-api-projects-project-id-insights-insight-id-thresholds-id` — GET /api/projects/{project_id}/insights/{insight_id}/thres...
- `/get-api-projects-project-id-insights-id` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/put-api-projects-project-id-insights-id` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/patch-api-projects-project-id-insights-id` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/delete-api-projects-project-id-insights-id` — Hard delete of this model is not allowed. Use a patch API call to set "delete...
- `/get-api-projects-project-id-insights-id-activity` — Audit trail for a single insight — every change made to it, by whom, an...
- `/get-api-projects-project-id-insights-id-analyze` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/get-api-projects-project-id-insights-id-suggestions` — DRF ViewSet mixin that gates coalesced responses behind permission c...

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/post-api-projects-project-id-insights-id-suggestions` — DRF ViewSet mixin that gates coalesced responses behind permission ...

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/get-api-projects-project-id-insights-activity` — Project-wide audit trail across all insights — who created, edited, delete...
- `/post-api-projects-project-id-insights-bulk-update-tags` — Bulk update tags on multiple objects.

PAT access: this action has no ``required_scopes=`` on the decorator —
inheriting viewsets must add ``"bulk_update_tags"`` to their
``scope_object_write_actions`` list to accept personal API keys.
Without that opt-in, ``APIScopePermission`` rejects PAT requests with
"This action does not support personal API key access". Done per-viewset
so granting ``<scope>:write`` for one resource doesn't leak access to
sibling resources that share this mixin.

Accepts:
- {"ids": [...], "action": "add"|"remove"|"set", "tags": ["tag1", "tag2"]}

Actions:
- "add": Add tags to existing tags on each object
- "remove": Remove specific tags from each object
- "set": Replace all tags on each object with the provided list
- `/post-api-projects-project-id-insights-cancel` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/post-api-projects-project-id-insights-generate-metadata` — Generate an AI-suggested name and description for an insight bas...
- `/get-api-projects-project-id-insights-my-last-viewed` — Returns basic details about the last 5 insights viewed by this user....
- `/get-api-projects-project-id-insights-trending` — Returns insights ranked by view count over the last N days (default 7), hi...
- `/post-api-projects-project-id-insights-viewed` — Record that the current user has just viewed one or more insights. Submitte...
- `/get-api-projects-project-id-integrations` — GET /api/projects/{project_id}/integrations/
- `/post-api-projects-project-id-integrations` — POST /api/projects/{project_id}/integrations/
- `/get-api-projects-project-id-integrations-id` — GET /api/projects/{project_id}/integrations/{id}/
- `/delete-api-projects-project-id-integrations-id` — DELETE /api/projects/{project_id}/integrations/{id}/
- `/get-api-projects-project-id-integrations-id-anthropic-managed-ag` — GET /api/projects/{project_id}/integrations/{id}/anthro...
- `/get-api-projects-project-id-integrations-id-anthropic-managed-ag` — GET /api/projects/{project_id}/integrations/{id}/anthro...
- `/get-api-projects-project-id-integrations-id-anthropic-managed-ag` — GET /api/projects/{project_id}/integrations/{id}/anthro...
- `/get-api-projects-project-id-integrations-id-channels` — GET /api/projects/{project_id}/integrations/{id}/channels/
- `/get-api-projects-project-id-integrations-id-clickup-lists` — GET /api/projects/{project_id}/integrations/{id}/clickup_lists/
- `/get-api-projects-project-id-integrations-id-clickup-spaces` — GET /api/projects/{project_id}/integrations/{id}/clickup_spaces/
- `/get-api-projects-project-id-integrations-id-clickup-workspaces` — GET /api/projects/{project_id}/integrations/{id}/clickup_...
- `/patch-api-projects-project-id-integrations-id-email` — PATCH /api/projects/{project_id}/integrations/{id}/email/
- `/post-api-projects-project-id-integrations-id-email-verify` — POST /api/projects/{project_id}/integrations/{id}/email/verify/
- `/get-api-projects-project-id-integrations-id-github-branches` — GET /api/projects/{project_id}/integrations/{id}/github_bran...
- `/get-api-projects-project-id-integrations-id-github-repos` — GET /api/projects/{project_id}/integrations/{id}/github_repos/
- `/post-api-projects-project-id-integrations-id-github-repos-refresh` — POST /api/projects/{project_id}/integrations/{id}/gith...
- `/get-api-projects-project-id-integrations-id-github-teams` — GET /api/projects/{project_id}/integrations/{id}/github_teams/
- `/get-api-projects-project-id-integrations-id-google-accessible-ac` — GET /api/projects/{project_id}/integrations/{id}/google...
- `/get-api-projects-project-id-integrations-id-google-conversion-ac` — GET /api/projects/{project_id}/integrations/{id}/google...
- `/get-api-projects-project-id-integrations-id-jira-projects` — GET /api/projects/{project_id}/integrations/{id}/jira_projects/
- `/get-api-projects-project-id-integrations-id-linear-teams` — GET /api/projects/{project_id}/integrations/{id}/linear_teams/
- `/get-api-projects-project-id-integrations-id-linkedin-ads-account` — GET /api/projects/{project_id}/integrations/{id}/linked...
- `/get-api-projects-project-id-integrations-id-linkedin-ads-convers` — GET /api/projects/{project_id}/integrations/{id}/linked...
- `/get-api-projects-project-id-integrations-id-twilio-phone-numbers` — GET /api/projects/{project_id}/integrations/{id}/twilio...
- `/get-api-projects-project-id-integrations-authorize` — GET /api/projects/{project_id}/integrations/authorize/
- `/post-api-projects-project-id-integrations-domain-connect-apply-ur` — Unified endpoint for generating Domain Connect apply U...

Accepts a context ("email" or "proxy") and the relevant resource ID.
The backend resolves the domain, template variables, and service ID
based on context, then builds the signed apply URL.
- `/get-api-projects-project-id-integrations-domain-connect-check` — GET /api/projects/{project_id}/integrations/domain-connect...
- `/post-api-projects-project-id-integrations-github-link-existing` — Reuse a GitHub installation already linked to a sibling t...
- `/post-api-projects-project-id-integrations-github-oauth-authorize` — Mint a User OAuth URL to bootstrap a fresh `code` when ...
- `/get-api-projects-project-id-js-snippet-resolve` — Preview what a given pin would resolve to, without saving it.
- `/get-api-projects-project-id-js-snippet-version` — Return the team's current version pin and resolved version.
- `/patch-api-projects-project-id-js-snippet-version` — Update the team's version pin.
- `/get-api-projects-project-id-live-debugger-breakpoints` — Create, Read, Update and Delete breakpoints for live debugging.
- `/post-api-projects-project-id-live-debugger-breakpoints` — Create, Read, Update and Delete breakpoints for live debugging.
- `/get-api-projects-project-id-live-debugger-breakpoints-id` — Create, Read, Update and Delete breakpoints for live debugging.
- `/put-api-projects-project-id-live-debugger-breakpoints-id` — Create, Read, Update and Delete breakpoints for live debugging.
- `/patch-api-projects-project-id-live-debugger-breakpoints-id` — Create, Read, Update and Delete breakpoints for live debugging.
- `/delete-api-projects-project-id-live-debugger-breakpoints-id` — Create, Read, Update and Delete breakpoints for live debugging.
- `/get-api-projects-project-id-live-debugger-breakpoints-active` — Get active breakpoints (External API)
- `/get-api-projects-project-id-live-debugger-breakpoints-breakpoint` — Get breakpoint hits
- `/get-api-projects-project-id-logs-alerts` — GET /api/projects/{project_id}/logs/alerts/
- `/post-api-projects-project-id-logs-alerts` — POST /api/projects/{project_id}/logs/alerts/
- `/get-api-projects-project-id-logs-alerts-id` — GET /api/projects/{project_id}/logs/alerts/{id}/
- `/put-api-projects-project-id-logs-alerts-id` — PUT /api/projects/{project_id}/logs/alerts/{id}/
- `/patch-api-projects-project-id-logs-alerts-id` — PATCH /api/projects/{project_id}/logs/alerts/{id}/
- `/delete-api-projects-project-id-logs-alerts-id` — DELETE /api/projects/{project_id}/logs/alerts/{id}/
- `/post-api-projects-project-id-logs-alerts-id-destinations` — Create a notification destination for this alert. One HogFuncti...
- `/post-api-projects-project-id-logs-alerts-id-destinations-delete` — Delete a notification destination by deleting its HogFun...
- `/get-api-projects-project-id-logs-alerts-id-events` — Paginated event history for this alert, newest first. Returns state tr...
- `/post-api-projects-project-id-logs-alerts-id-reset` — Reset a broken alert. Clears the consecutive-failure counter and sched...
- `/post-api-projects-project-id-logs-alerts-simulate` — Simulate a logs alert on historical data using the full state machine....
- `/get-api-projects-project-id-logs-attributes` — GET /api/projects/{project_id}/logs/attributes/
- `/post-api-projects-project-id-logs-count` — POST /api/projects/{project_id}/logs/count/
- `/post-api-projects-project-id-logs-count-ranges` — POST /api/projects/{project_id}/logs/count-ranges/
- `/post-api-projects-project-id-logs-export` — POST /api/projects/{project_id}/logs/export/
- `/get-api-projects-project-id-logs-has-logs` — GET /api/projects/{project_id}/logs/has_logs/
- `/post-api-projects-project-id-logs-query` — POST /api/projects/{project_id}/logs/query/
- `/get-api-projects-project-id-logs-sampling-rules` — GET /api/projects/{project_id}/logs/sampling_rules/
- `/post-api-projects-project-id-logs-sampling-rules` — POST /api/projects/{project_id}/logs/sampling_rules/
- `/get-api-projects-project-id-logs-sampling-rules-id` — GET /api/projects/{project_id}/logs/sampling_rules/{id}/
- `/put-api-projects-project-id-logs-sampling-rules-id` — PUT /api/projects/{project_id}/logs/sampling_rules/{id}/
- `/patch-api-projects-project-id-logs-sampling-rules-id` — PATCH /api/projects/{project_id}/logs/sampling_rules/{id}/
- `/delete-api-projects-project-id-logs-sampling-rules-id` — DELETE /api/projects/{project_id}/logs/sampling_rules/{id}/
- `/post-api-projects-project-id-logs-sampling-rules-id-simulate` — Dry-run estimate for how much volume this rule would remove...
- `/post-api-projects-project-id-logs-sampling-rules-reorder` — Atomically reassign priorities so the given ID order maps to as...
- `/post-api-projects-project-id-logs-services` — POST /api/projects/{project_id}/logs/services/
- `/post-api-projects-project-id-logs-sparkline` — POST /api/projects/{project_id}/logs/sparkline/
- `/get-api-projects-project-id-logs-values` — GET /api/projects/{project_id}/logs/values/
- `/get-api-projects-project-id-metrics-has-metrics` — GET /api/projects/{project_id}/metrics/has_metrics/
- `/post-api-projects-project-id-metrics-query` — POST /api/projects/{project_id}/metrics/query/
- `/get-api-projects-project-id-metrics-values` — Distinct metric names for the team. Backs the picker UI.
- `/get-api-projects-project-id-notebooks` — The API for interacting with Notebooks. This feature is in early access and the AP...
- `/post-api-projects-project-id-notebooks` — The API for interacting with Notebooks. This feature is in early access and the A...
- `/get-api-projects-project-id-notebooks-notebook-id-sharing` — GET /api/projects/{project_id}/notebooks/{notebook_id}/sharing/
- `/post-api-projects-project-id-notebooks-notebook-id-sharing-passwo` — Create a new password for the sharing configuration.
- `/delete-api-projects-project-id-notebooks-notebook-id-sharing-passwo` — Delete a password from the sharing configuration.
- `/post-api-projects-project-id-notebooks-notebook-id-sharing-refres` — POST /api/projects/{project_id}/notebooks/{notebook_id...
- `/get-api-projects-project-id-notebooks-short-id` — The API for interacting with Notebooks. This feature is in early access a...
- `/put-api-projects-project-id-notebooks-short-id` — The API for interacting with Notebooks. This feature is in early access a...
- `/patch-api-projects-project-id-notebooks-short-id` — The API for interacting with Notebooks. This feature is in early access...
- `/delete-api-projects-project-id-notebooks-short-id` — Hard delete of this model is not allowed. Use a patch API call to set ...
- `/get-api-projects-project-id-notebooks-short-id-activity` — The API for interacting with Notebooks. This feature is in early...
- `/post-api-projects-project-id-notebooks-short-id-collab-save` — The API for interacting with Notebooks. This feature is in e...
- `/get-api-projects-project-id-notebooks-short-id-collab-stream` — The API for interacting with Notebooks. This feature is in ...
- `/post-api-projects-project-id-notebooks-short-id-hogql-execute` — The API for interacting with Notebooks. This feature is in...
- `/post-api-projects-project-id-notebooks-short-id-kernel-config` — The API for interacting with Notebooks. This feature is in...
- `/get-api-projects-project-id-notebooks-short-id-kernel-dataframe` — The API for interacting with Notebooks. This feature is ...
- `/post-api-projects-project-id-notebooks-short-id-kernel-execute` — The API for interacting with Notebooks. This feature is i...
- `/post-api-projects-project-id-notebooks-short-id-kernel-execute-st` — The API for interacting with Notebooks. This feature i...
- `/post-api-projects-project-id-notebooks-short-id-kernel-restart` — The API for interacting with Notebooks. This feature is i...
- `/post-api-projects-project-id-notebooks-short-id-kernel-start` — The API for interacting with Notebooks. This feature is in ...
- `/get-api-projects-project-id-notebooks-short-id-kernel-status` — The API for interacting with Notebooks. This feature is in ...
- `/post-api-projects-project-id-notebooks-short-id-kernel-stop` — The API for interacting with Notebooks. This feature is in e...
- `/get-api-projects-project-id-notebooks-activity` — The API for interacting with Notebooks. This feature is in early access a...
- `/get-api-projects-project-id-notebooks-recording-comments` — The API for interacting with Notebooks. This feature is in earl...
- `/get-api-projects-project-id-object-media-previews` — GET /api/projects/{project_id}/object_media_previews/
- `/post-api-projects-project-id-object-media-previews` — POST /api/projects/{project_id}/object_media_previews/
- `/get-api-projects-project-id-object-media-previews-id` — GET /api/projects/{project_id}/object_media_previews/{id}/
- `/put-api-projects-project-id-object-media-previews-id` — PUT /api/projects/{project_id}/object_media_previews/{id}/
- `/patch-api-projects-project-id-object-media-previews-id` — PATCH /api/projects/{project_id}/object_media_previews/{id}/
- `/delete-api-projects-project-id-object-media-previews-id` — DELETE /api/projects/{project_id}/object_media_previews/{id}/
- `/get-api-projects-project-id-object-media-previews-preferred-for-` — Get the preferred media preview for an event definition.
Most recent user-uploaded, then most recent exported asset.
Requires event_definition (query param).
- `/get-api-projects-project-id-persisted-folder` — GET /api/projects/{project_id}/persisted_folder/
- `/post-api-projects-project-id-persisted-folder` — POST /api/projects/{project_id}/persisted_folder/
- `/get-api-projects-project-id-persisted-folder-id` — GET /api/projects/{project_id}/persisted_folder/{id}/
- `/put-api-projects-project-id-persisted-folder-id` — PUT /api/projects/{project_id}/persisted_folder/{id}/
- `/patch-api-projects-project-id-persisted-folder-id` — PATCH /api/projects/{project_id}/persisted_folder/{id}/
- `/delete-api-projects-project-id-persisted-folder-id` — DELETE /api/projects/{project_id}/persisted_folder/{id}/
- `/get-api-projects-project-id-persons` — This endpoint is meant for reading and deleting persons. To create or update persons...
- `/get-api-projects-project-id-persons-id` — This endpoint is meant for reading and deleting persons. To create or update pers...
- `/put-api-projects-project-id-persons-id` — Only for setting properties on the person. "properties" from the request data wil...
This means that only the properties listed will be updated, but other properties won't be removed nor updated.
If you would like to remove a property use the `delete_property` endpoint.
- `/patch-api-projects-project-id-persons-id` — This endpoint is meant for reading and deleting persons. To create or update pe...
- `/get-api-projects-project-id-persons-id-activity` — This endpoint is meant for reading and deleting persons. To create or up...
- `/post-api-projects-project-id-persons-id-delete-property` — This endpoint is meant for reading and deleting persons. To crea...
- `/get-api-projects-project-id-persons-id-properties-timeline` — This endpoint is meant for reading and deleting persons. To c...
- `/post-api-projects-project-id-persons-id-split` — This endpoint is meant for reading and deleting persons. To create or upda...
- `/post-api-projects-project-id-persons-id-update-property` — This endpoint is meant for reading and deleting persons. To crea...
- `/get-api-projects-project-id-persons-activity` — This endpoint is meant for reading and deleting persons. To create or updat...
- `/post-api-projects-project-id-persons-batch-by-distinct-ids` — This endpoint is meant for reading and deleting persons. To c...
- `/post-api-projects-project-id-persons-batch-by-uuids` — This endpoint is meant for reading and deleting persons. To create o...
- `/post-api-projects-project-id-persons-bulk-delete` — This endpoint allows you to bulk delete persons, either by the PostHog ...
- `/get-api-projects-project-id-persons-cohorts` — This endpoint is meant for reading and deleting persons. To create or update...
- `/get-api-projects-project-id-persons-deletion-status` — List the status of queued event deletions for persons. When you dele...
- `/get-api-projects-project-id-persons-funnel` — This endpoint is meant for reading and deleting persons. To create or update ...
- `/post-api-projects-project-id-persons-funnel` — This endpoint is meant for reading and deleting persons. To create or update...
- `/get-api-projects-project-id-persons-funnel-correlation` — This endpoint is meant for reading and deleting persons. To creat...
- `/post-api-projects-project-id-persons-funnel-correlation` — This endpoint is meant for reading and deleting persons. To crea...
- `/get-api-projects-project-id-persons-lifecycle` — This endpoint is meant for reading and deleting persons. To create or upda...
- `/get-api-projects-project-id-persons-properties-at-time` — Get person properties as they existed at a specific point in time.

This endpoint reconstructs person properties by querying ClickHouse events
for $set and $set_once operations up to the specified timestamp.

Query parameters:
- distinct_id: The distinct_id of the person
- timestamp: ISO datetime string for the point in time (e.g., "2023-06-15T14:30:00Z")
- include_set_once: Whether to handle $set_once operations (default: false)
- `/post-api-projects-project-id-persons-reset-person-distinct-id` — Reset a distinct_id for a deleted person. This allows the ...
- `/get-api-projects-project-id-persons-trends` — This endpoint is meant for reading and deleting persons. To create or update ...
- `/get-api-projects-project-id-persons-values` — This endpoint is meant for reading and deleting persons. To create or update ...
- `/get-api-projects-project-id-plugin-configs-plugin-config-id-logs` — GET /api/projects/{project_id}/plugin_configs/{plugin_c...
- `/get-api-projects-project-id-product-tours` — GET /api/projects/{project_id}/product_tours/
- `/post-api-projects-project-id-product-tours` — POST /api/projects/{project_id}/product_tours/
- `/get-api-projects-project-id-product-tours-id` — GET /api/projects/{project_id}/product_tours/{id}/
- `/put-api-projects-project-id-product-tours-id` — PUT /api/projects/{project_id}/product_tours/{id}/
- `/patch-api-projects-project-id-product-tours-id` — PATCH /api/projects/{project_id}/product_tours/{id}/
- `/delete-api-projects-project-id-product-tours-id` — DELETE /api/projects/{project_id}/product_tours/{id}/
- `/delete-api-projects-project-id-product-tours-id-discard-draft` — Discard draft content.
- `/patch-api-projects-project-id-product-tours-id-draft` — Save draft content (server-side merge). No side effects triggered.
- `/get-api-projects-project-id-product-tours-id-draft-status` — Lightweight polling endpoint for draft change detection.
- `/post-api-projects-project-id-product-tours-id-generate` — Generate tour step content using AI.
- `/post-api-projects-project-id-product-tours-id-publish-draft` — Commit draft to live tour. Runs full validation and triggers...

Accepts an optional body payload. If provided, merges it into the draft
before publishing so the caller can save + publish in a single request.
- `/get-api-projects-project-id-project-secret-api-keys` — GET /api/projects/{project_id}/project_secret_api_keys/
- `/post-api-projects-project-id-project-secret-api-keys` — POST /api/projects/{project_id}/project_secret_api_keys/
- `/get-api-projects-project-id-project-secret-api-keys-id` — GET /api/projects/{project_id}/project_secret_api_keys/{id}/
- `/put-api-projects-project-id-project-secret-api-keys-id` — PUT /api/projects/{project_id}/project_secret_api_keys/{id}/
- `/patch-api-projects-project-id-project-secret-api-keys-id` — PATCH /api/projects/{project_id}/project_secret_api_keys/{id}/
- `/delete-api-projects-project-id-project-secret-api-keys-id` — DELETE /api/projects/{project_id}/project_secret_api_keys/{id}/
- `/post-api-projects-project-id-project-secret-api-keys-id-roll` — Roll a project secret API key
- `/get-api-projects-project-id-property-definitions` — GET /api/projects/{project_id}/property_definitions/
- `/get-api-projects-project-id-property-definitions-id` — GET /api/projects/{project_id}/property_definitions/{id}/
- `/put-api-projects-project-id-property-definitions-id` — PUT /api/projects/{project_id}/property_definitions/{id}/
- `/patch-api-projects-project-id-property-definitions-id` — PATCH /api/projects/{project_id}/property_definitions/{id}/
- `/delete-api-projects-project-id-property-definitions-id` — DELETE /api/projects/{project_id}/property_definitions/{id}/
- `/post-api-projects-project-id-property-definitions-bulk-update-tag` — Bulk update tags on multiple objects.

PAT access: this action has no ``required_scopes=`` on the decorator —
inheriting viewsets must add ``"bulk_update_tags"`` to their
``scope_object_write_actions`` list to accept personal API keys.
Without that opt-in, ``APIScopePermission`` rejects PAT requests with
"This action does not support personal API key access". Done per-viewset
so granting ``<scope>:write`` for one resource doesn't leak access to
sibling resources that share this mixin.

Accepts:
- {"ids": [...], "action": "add"|"remove"|"set", "tags": ["tag1", "tag2"]}

Actions:
- "add": Add tags to existing tags on each object
- "remove": Remove specific tags from each object
- "set": Replace all tags on each object with the provided list
- `/get-api-projects-project-id-property-definitions-seen-together` — Allows a caller to provide a list of event names and a si...
Returns a map of the event names to a boolean representing whether that property has ever been seen with that event_name
- `/post-api-projects-project-id-query` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/get-api-projects-project-id-query-id` — (Experimental)
- `/delete-api-projects-project-id-query-id` — (Experimental)
- `/get-api-projects-project-id-query-id-log` — Get query log details from query_log_archive table for a specific query_id, the...
- `/post-api-projects-project-id-query-query-kind` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/post-api-projects-project-id-query-check-auth-for-async` — DRF ViewSet mixin that gates coalesced responses behind permissi...

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/get-api-projects-project-id-query-draft-sql` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `/post-api-projects-project-id-query-upgrade` — Upgrades a query without executing it. Returns a query with all nodes migrate...
- `/get-api-projects-project-id-quota-limits` — Get a team's quota-limit state
- `/get-api-projects-project-id-sandbox-environments` — API for managing sandbox environments that control network access for t...
- `/post-api-projects-project-id-sandbox-environments` — API for managing sandbox environments that control network access for ...
- `/get-api-projects-project-id-sandbox-environments-id` — API for managing sandbox environments that control network access fo...
- `/patch-api-projects-project-id-sandbox-environments-id` — API for managing sandbox environments that control network access ...
- `/delete-api-projects-project-id-sandbox-environments-id` — API for managing sandbox environments that control network access...
- `/get-api-projects-project-id-saved` — GET /api/projects/{project_id}/saved/
- `/post-api-projects-project-id-saved` — POST /api/projects/{project_id}/saved/
- `/get-api-projects-project-id-saved-short-id` — GET /api/projects/{project_id}/saved/{short_id}/
- `/patch-api-projects-project-id-saved-short-id` — PATCH /api/projects/{project_id}/saved/{short_id}/
- `/delete-api-projects-project-id-saved-short-id` — Hard delete of this model is not allowed. Use a patch API call to set "del...
- `/post-api-projects-project-id-saved-short-id-regenerate` — POST /api/projects/{project_id}/saved/{short_id}/regenerate/
- `/get-api-projects-project-id-schema-property-groups` — GET /api/projects/{project_id}/schema_property_groups/
- `/post-api-projects-project-id-schema-property-groups` — POST /api/projects/{project_id}/schema_property_groups/
- `/get-api-projects-project-id-schema-property-groups-id` — GET /api/projects/{project_id}/schema_property_groups/{id}/
- `/put-api-projects-project-id-schema-property-groups-id` — PUT /api/projects/{project_id}/schema_property_groups/{id}/
- `/patch-api-projects-project-id-schema-property-groups-id` — PATCH /api/projects/{project_id}/schema_property_groups/{id}/
- `/delete-api-projects-project-id-schema-property-groups-id` — DELETE /api/projects/{project_id}/schema_property_groups/{id}/
- `/get-api-projects-project-id-sdk-doctor-report` — Get SDK health report for a project
- `/get-api-projects-project-id-session-group-summaries` — API for retrieving and managing stored group session summaries.
- `/post-api-projects-project-id-session-group-summaries` — API for retrieving and managing stored group session summaries.
- `/get-api-projects-project-id-session-group-summaries-id` — API for retrieving and managing stored group session summaries.
- `/put-api-projects-project-id-session-group-summaries-id` — API for retrieving and managing stored group session summaries.
- `/patch-api-projects-project-id-session-group-summaries-id` — API for retrieving and managing stored group session summaries.
- `/delete-api-projects-project-id-session-group-summaries-id` — API for retrieving and managing stored group session summaries.
- `/get-api-projects-project-id-session-recording-playlists` — Override list to include synthetic playlists
- `/post-api-projects-project-id-session-recording-playlists` — POST /api/projects/{project_id}/session_recording_playlists/
- `/get-api-projects-project-id-session-recording-playlists-short-id` — GET /api/projects/{project_id}/session_recording_playli...
- `/put-api-projects-project-id-session-recording-playlists-short-id` — PUT /api/projects/{project_id}/session_recording_playli...
- `/patch-api-projects-project-id-session-recording-playlists-short-id` — PATCH /api/projects/{project_id}/session_recording_pl...
- `/delete-api-projects-project-id-session-recording-playlists-short-id` — Hard delete of this model is not allowed. Use a patc...
- `/get-api-projects-project-id-session-recording-playlists-short-id` — GET /api/projects/{project_id}/session_recording_playli...
- `/post-api-projects-project-id-session-recording-playlists-short-id` — POST /api/projects/{project_id}/session_recording_play...
- `/delete-api-projects-project-id-session-recording-playlists-short-id` — DELETE /api/projects/{project_id}/session_recording_...
- `/get-api-projects-project-id-session-recordings` — GET /api/projects/{project_id}/session_recordings/
- `/get-api-projects-project-id-session-recordings-id` — GET /api/projects/{project_id}/session_recordings/{id}/
- `/put-api-projects-project-id-session-recordings-id` — PUT /api/projects/{project_id}/session_recordings/{id}/
- `/patch-api-projects-project-id-session-recordings-id` — PATCH /api/projects/{project_id}/session_recordings/{id}/
- `/delete-api-projects-project-id-session-recordings-id` — DELETE /api/projects/{project_id}/session_recordings/{id}/
- `/get-api-projects-project-id-session-recordings-recording-id-shar` — GET /api/projects/{project_id}/session_recordings/{reco...
- `/post-api-projects-project-id-session-recordings-recording-id-shar` — Create a new password for the sharing configuration.
- `/delete-api-projects-project-id-session-recordings-recording-id-shar` — Delete a password from the sharing configuration.
- `/post-api-projects-project-id-session-recordings-recording-id-shar` — POST /api/projects/{project_id}/session_recordings/{re...
- `/get-api-projects-project-id-sessions-property-definitions` — GET /api/projects/{project_id}/sessions/property_definitions/
- `/get-api-projects-project-id-sessions-values` — GET /api/projects/{project_id}/sessions/values/
- `/get-api-projects-project-id-signals-processing` — Return current processing state including pause status.
- `/put-api-projects-project-id-signals-processing-pause` — View and control signal processing pipeline state for a team.
- `/delete-api-projects-project-id-signals-processing-pause` — View and control signal processing pipeline state for a team.
- `/get-api-projects-project-id-signals-reports` — GET /api/projects/{project_id}/signals/reports/
- `/get-api-projects-project-id-signals-reports-id` — GET /api/projects/{project_id}/signals/reports/{id}/
- `/get-api-projects-project-id-signals-scout-project-profile-curren` — Get the current project profile
- `/get-api-projects-project-id-signals-scout-runs` — Search recent agent runs
- `/get-api-projects-project-id-signals-scout-runs-id` — Get a run by ID
- `/post-api-projects-project-id-signals-scout-runs-id-emit-signal` — Emit a finding for a run
- `/get-api-projects-project-id-signals-scout-scratchpad` — Search the scout scratchpad
- `/post-api-projects-project-id-signals-scout-scratchpad` — Remember a scratchpad entry
- `/post-api-projects-project-id-signals-scout-scratchpad-forget` — Forget a scratchpad entry by key
- `/get-api-projects-project-id-signals-source-configs` — GET /api/projects/{project_id}/signals/source_configs/
- `/post-api-projects-project-id-signals-source-configs` — POST /api/projects/{project_id}/signals/source_configs/
- `/get-api-projects-project-id-signals-source-configs-id` — GET /api/projects/{project_id}/signals/source_configs/{id}/
- `/put-api-projects-project-id-signals-source-configs-id` — PUT /api/projects/{project_id}/signals/source_configs/{id}/
- `/patch-api-projects-project-id-signals-source-configs-id` — PATCH /api/projects/{project_id}/signals/source_configs/{id}/
- `/delete-api-projects-project-id-signals-source-configs-id` — DELETE /api/projects/{project_id}/signals/source_configs/{id}/
- `/get-api-projects-project-id-subscriptions` — GET /api/projects/{project_id}/subscriptions/
- `/post-api-projects-project-id-subscriptions` — POST /api/projects/{project_id}/subscriptions/
- `/get-api-projects-project-id-subscriptions-id` — GET /api/projects/{project_id}/subscriptions/{id}/
- `/put-api-projects-project-id-subscriptions-id` — PUT /api/projects/{project_id}/subscriptions/{id}/
- `/patch-api-projects-project-id-subscriptions-id` — PATCH /api/projects/{project_id}/subscriptions/{id}/
- `/delete-api-projects-project-id-subscriptions-id` — Hard delete of this model is not allowed. Use a patch API call to set "d...
- `/post-api-projects-project-id-subscriptions-id-test-delivery` — POST /api/projects/{project_id}/subscriptions/{id}/test-deli...
- `/get-api-projects-project-id-subscriptions-summary-quota` — GET /api/projects/{project_id}/subscriptions/summary_quota/
- `/get-api-projects-project-id-surveys` — GET /api/projects/{project_id}/surveys/
- `/post-api-projects-project-id-surveys` — POST /api/projects/{project_id}/surveys/
- `/get-api-projects-project-id-surveys-id` — GET /api/projects/{project_id}/surveys/{id}/
- `/put-api-projects-project-id-surveys-id` — PUT /api/projects/{project_id}/surveys/{id}/
- `/patch-api-projects-project-id-surveys-id` — PATCH /api/projects/{project_id}/surveys/{id}/
- `/delete-api-projects-project-id-surveys-id` — DELETE /api/projects/{project_id}/surveys/{id}/
- `/get-api-projects-project-id-surveys-id-activity` — GET /api/projects/{project_id}/surveys/{id}/activity/
- `/get-api-projects-project-id-surveys-id-archived-response-uuids` — Get list of archived response UUIDs for HogQL filtering.

Returns list of UUIDs that the frontend can use to filter out archived responses
in HogQL queries.
- `/post-api-projects-project-id-surveys-id-duplicate-to-projects` — Duplicate a survey to multiple projects in a single transa...

Accepts a list of target team IDs and creates a copy of the survey in each project.
Uses an all-or-nothing approach - if any duplication fails, all changes are rolled back.
- `/post-api-projects-project-id-surveys-id-generate-translations` — POST /api/projects/{project_id}/surveys/{id}/generate_tran...
- `/post-api-projects-project-id-surveys-id-responses-response-uuid-a` — Archive a single survey response.
- `/post-api-projects-project-id-surveys-id-responses-response-uuid-u` — Unarchive a single survey response.
- `/get-api-projects-project-id-surveys-id-stats` — Get survey response statistics for a specific survey.

Args:
    date_from: Optional ISO timestamp for start date (e.g. 2024-01-01T00:00:00Z)
    date_to: Optional ISO timestamp for end date (e.g. 2024-01-31T23:59:59Z)
    exclude_archived: Optional boolean to exclude archived responses (default: false, includes archived)

Returns:
    Survey statistics including event counts, unique respondents, and conversion rates
- `/post-api-projects-project-id-surveys-id-summarize-responses` — POST /api/projects/{project_id}/surveys/{id}/summarize_respo...
- `/post-api-projects-project-id-surveys-id-summary-headline` — POST /api/projects/{project_id}/surveys/{id}/summary_headline/
- `/get-api-projects-project-id-surveys-activity` — GET /api/projects/{project_id}/surveys/activity/
- `/get-api-projects-project-id-surveys-question-labels` — Return a slim list of question labels for the team's surveys. Used b...
- `/get-api-projects-project-id-surveys-responses-count` — Get response counts for all surveys.

Args:
    exclude_archived: Optional boolean to exclude archived responses (default: false, includes archived)
    survey_ids: Optional comma-separated list of survey IDs to filter by

Returns:
    Dictionary mapping survey IDs to response counts
- `/get-api-projects-project-id-surveys-stats` — Get aggregated response statistics across all surveys.

Args:
    date_from: Optional ISO timestamp for start date (e.g. 2024-01-01T00:00:00Z)
    date_to: Optional ISO timestamp for end date (e.g. 2024-01-31T23:59:59Z)

Returns:
    Aggregated statistics across all surveys including total counts and rates
- `/get-api-projects-project-id-task-automations` — GET /api/projects/{project_id}/task_automations/
- `/post-api-projects-project-id-task-automations` — POST /api/projects/{project_id}/task_automations/
- `/get-api-projects-project-id-task-automations-id` — GET /api/projects/{project_id}/task_automations/{id}/
- `/put-api-projects-project-id-task-automations-id` — PUT /api/projects/{project_id}/task_automations/{id}/
- `/patch-api-projects-project-id-task-automations-id` — PATCH /api/projects/{project_id}/task_automations/{id}/
- `/delete-api-projects-project-id-task-automations-id` — DELETE /api/projects/{project_id}/task_automations/{id}/
- `/post-api-projects-project-id-task-automations-id-run` — POST /api/projects/{project_id}/task_automations/{id}/run/
- `/get-api-projects-project-id-tasks` — List tasks
- `/post-api-projects-project-id-tasks` — API for managing tasks within a project. Tasks represent units of work to be performe...
- `/get-api-projects-project-id-tasks-id` — API for managing tasks within a project. Tasks represent units of work to be perfor...
- `/put-api-projects-project-id-tasks-id` — API for managing tasks within a project. Tasks represent units of work to be perfor...
- `/patch-api-projects-project-id-tasks-id` — API for managing tasks within a project. Tasks represent units of work to be perf...
- `/delete-api-projects-project-id-tasks-id` — API for managing tasks within a project. Tasks represent units of work to be per...
- `/post-api-projects-project-id-tasks-id-presence` — Beacon presence for a device watching this task
- `/delete-api-projects-project-id-tasks-id-presence` — Beacon presence for a device watching this task
- `/post-api-projects-project-id-tasks-id-run` — Run task
- `/post-api-projects-project-id-tasks-id-staged-artifacts-finalize-u` — Finalize staged direct uploads for task attachments
- `/post-api-projects-project-id-tasks-id-staged-artifacts-prepare-up` — Prepare staged direct uploads for task attachments
- `/get-api-projects-project-id-tasks-task-id-runs` — List task runs
- `/post-api-projects-project-id-tasks-task-id-runs` — Create task run
- `/get-api-projects-project-id-tasks-task-id-runs-id` — API for managing task runs. Each run represents an execution of a task.
- `/patch-api-projects-project-id-tasks-task-id-runs-id` — Update task run
- `/post-api-projects-project-id-tasks-task-id-runs-id-append-log` — Append log entries
- `/post-api-projects-project-id-tasks-task-id-runs-id-artifacts` — Upload artifacts for a task run
- `/post-api-projects-project-id-tasks-task-id-runs-id-artifacts-down` — Download an artifact through the backend
- `/post-api-projects-project-id-tasks-task-id-runs-id-artifacts-fina` — Finalize direct uploads for task run artifacts
- `/post-api-projects-project-id-tasks-task-id-runs-id-artifacts-prep` — Prepare direct uploads for task run artifacts
- `/post-api-projects-project-id-tasks-task-id-runs-id-artifacts-pres` — Generate presigned URL for an artifact
- `/post-api-projects-project-id-tasks-task-id-runs-id-command` — Send command to task run
- `/get-api-projects-project-id-tasks-task-id-runs-id-connection-tok` — Get sandbox connection token
- `/get-api-projects-project-id-tasks-task-id-runs-id-logs` — Get task run logs
- `/post-api-projects-project-id-tasks-task-id-runs-id-relay-message` — Relay run message to Slack
- `/post-api-projects-project-id-tasks-task-id-runs-id-resume-in-clou` — Resume task run in cloud
- `/get-api-projects-project-id-tasks-task-id-runs-id-session-logs` — Get filtered task run session logs
- `/patch-api-projects-project-id-tasks-task-id-runs-id-set-output` — Set run output
- `/post-api-projects-project-id-tasks-task-id-runs-id-start` — Start task run
- `/get-api-projects-project-id-tasks-task-id-runs-id-stream` — API for managing task runs. Each run represents an execution of...
- `/get-api-projects-project-id-tasks-repositories` — List distinct task repositories
- `/get-api-projects-project-id-tasks-repository-readiness` — Get repository readiness
- `/get-api-projects-project-id-tasks-slack-thread-context` — Resolve a Slack thread to its task, runs, and Temporal workflows
- `/post-api-projects-project-id-tasks-summaries` — Fetch task summaries by ID
- `/post-api-projects-project-id-uploaded-media` — 
    When object storage is available this API allows upload of media which can be used, for example, in text cards on dashboards.

    Uploaded media must have a content type beginning with 'image/' and be less than 4MB.
    
- `/get-api-projects-project-id-visual-review-repos` — List all projects for the team.
- `/post-api-projects-project-id-visual-review-repos` — Create a new repo.
- `/get-api-projects-project-id-visual-review-repos-id` — Get a repo by ID.
- `/patch-api-projects-project-id-visual-review-repos-id` — Update a repo's settings.
- `/get-api-projects-project-id-visual-review-repos-id-baselines` — Snapshots overview for a repo: every identifier with a curr...
- `/get-api-projects-project-id-visual-review-repos-id-quarantine` — List quarantined identifiers. Without filter: active only....
- `/post-api-projects-project-id-visual-review-repos-id-quarantine-ru` — Quarantine a snapshot identifier for a specific run type.
- `/post-api-projects-project-id-visual-review-repos-id-quarantine-ru` — Expire all active quarantine entries for an identifier.
- `/get-api-projects-project-id-visual-review-repos-id-thumbnails-id` — Serve a snapshot thumbnail by identifier. Returns WebP ...
- `/get-api-projects-project-id-visual-review-repos-repo-id-runs` — List runs in this repo, optionally filtered by review state.
- `/get-api-projects-project-id-visual-review-repos-repo-id-runs-cou` — Review state counts for runs in this repo.
- `/get-api-projects-project-id-visual-review-repos-repo-id-snapshot` — Deduped baseline timeline for a snapshot identity. Newe...
- `/get-api-projects-project-id-visual-review-runs` — List runs for the team, optionally filtered by review state, PR number, c...
- `/post-api-projects-project-id-visual-review-runs` — Create a new run from a CI manifest.
- `/get-api-projects-project-id-visual-review-runs-id` — Get run status and summary.
- `/post-api-projects-project-id-visual-review-runs-id-add-snapshots` — Add a batch of snapshots to a pending run (shard-based ...
- `/post-api-projects-project-id-visual-review-runs-id-approve` — Approve visual changes for snapshots in this run.

With approve_all=true, approves all changed+new snapshots and returns
signed baseline YAML. With specific snapshots, approves only those.
- `/post-api-projects-project-id-visual-review-runs-id-auto-approve` — CLI auto-approve: approve all and return baseline YAML f...
- `/post-api-projects-project-id-visual-review-runs-id-complete` — Complete a run: detect removals, verify uploads, trigger dif...
- `/post-api-projects-project-id-visual-review-runs-id-recompute` — Re-evaluate quarantine and counts, update commit status, an...
- `/get-api-projects-project-id-visual-review-runs-id-snapshot-histo` — Recent change history for a snapshot identifier across ...
- `/get-api-projects-project-id-visual-review-runs-id-snapshots` — Get all snapshots for a run with diff results.
- `/post-api-projects-project-id-visual-review-runs-id-tolerate` — Mark a changed snapshot as a known tolerated alternate.
- `/get-api-projects-project-id-visual-review-runs-id-tolerated-hash` — List known tolerated hashes for a snapshot identifier.
- `/get-api-projects-project-id-visual-review-runs-counts` — Review state counts for the runs list.
- `/get-api-projects-project-id-warehouse-dag` — Return this team's DAG as a set of edges and nodes
- `/get-api-projects-project-id-warehouse-model-paths` — GET /api/projects/{project_id}/warehouse_model_paths/
- `/get-api-projects-project-id-warehouse-model-paths-id` — GET /api/projects/{project_id}/warehouse_model_paths/{id}/
- `/get-api-projects-project-id-warehouse-saved-queries` — Create, Read, Update and Delete Warehouse Tables.
- `/post-api-projects-project-id-warehouse-saved-queries` — Create, Read, Update and Delete Warehouse Tables.
- `/get-api-projects-project-id-warehouse-saved-queries-id` — Create, Read, Update and Delete Warehouse Tables.
- `/put-api-projects-project-id-warehouse-saved-queries-id` — Create, Read, Update and Delete Warehouse Tables.
- `/patch-api-projects-project-id-warehouse-saved-queries-id` — Create, Read, Update and Delete Warehouse Tables.
- `/delete-api-projects-project-id-warehouse-saved-queries-id` — Create, Read, Update and Delete Warehouse Tables.
- `/get-api-projects-project-id-warehouse-saved-queries-id-activity` — Create, Read, Update and Delete Warehouse Tables.
- `/post-api-projects-project-id-warehouse-saved-queries-id-ancestors` — Return the ancestors of this saved query.

By default, we return the immediate parents. The `level` parameter can be used to
look further back into the ancestor tree. If `level` overshoots (i.e. points to only
ancestors beyond the root), we return an empty list.
- `/post-api-projects-project-id-warehouse-saved-queries-id-cancel` — Cancel a running saved query workflow.
- `/get-api-projects-project-id-warehouse-saved-queries-id-dependenc` — Return the count of immediate upstream and downstream d...
- `/post-api-projects-project-id-warehouse-saved-queries-id-descendan` — Return the descendants of this saved query.

By default, we return the immediate children. The `level` parameter can be used to
look further ahead into the descendants tree. If `level` overshoots (i.e. points to only
descendants further than a leaf), we return an empty list.
- `/post-api-projects-project-id-warehouse-saved-queries-id-materiali` — Enable materialization for this saved query with a 24-...
- `/post-api-projects-project-id-warehouse-saved-queries-id-revert-ma` — Undo materialization, revert back to the original view.
(i.e. delete the materialized table and the schedule)
- `/post-api-projects-project-id-warehouse-saved-queries-id-run` — Run this saved query.
- `/get-api-projects-project-id-warehouse-saved-queries-id-run-histo` — Return the recent run history (up to 5 most recent) for...
- `/post-api-projects-project-id-warehouse-saved-queries-resume-sched` — Resume paused materialization schedules for multiple m...

Accepts a list of view IDs in the request body: {"view_ids": ["id1", "id2", ...]}
This endpoint is idempotent - calling it on already running or non-existent schedules is safe.
- `/get-api-projects-project-id-warehouse-saved-query-folders` — GET /api/projects/{project_id}/warehouse_saved_query_folders/
- `/post-api-projects-project-id-warehouse-saved-query-folders` — POST /api/projects/{project_id}/warehouse_saved_query_folders/
- `/get-api-projects-project-id-warehouse-saved-query-folders-id` — GET /api/projects/{project_id}/warehouse_saved_query_folder...
- `/patch-api-projects-project-id-warehouse-saved-query-folders-id` — PATCH /api/projects/{project_id}/warehouse_saved_query_fo...
- `/delete-api-projects-project-id-warehouse-saved-query-folders-id` — DELETE /api/projects/{project_id}/warehouse_saved_query_...
- `/get-api-projects-project-id-warehouse-tables` — Create, Read, Update and Delete Warehouse Tables.
- `/post-api-projects-project-id-warehouse-tables` — Create, Read, Update and Delete Warehouse Tables.
- `/get-api-projects-project-id-warehouse-tables-id` — Create, Read, Update and Delete Warehouse Tables.
- `/put-api-projects-project-id-warehouse-tables-id` — Create, Read, Update and Delete Warehouse Tables.
- `/patch-api-projects-project-id-warehouse-tables-id` — Create, Read, Update and Delete Warehouse Tables.
- `/delete-api-projects-project-id-warehouse-tables-id` — Create, Read, Update and Delete Warehouse Tables.
- `/post-api-projects-project-id-warehouse-tables-id-refresh-schema` — Create, Read, Update and Delete Warehouse Tables.
- `/post-api-projects-project-id-warehouse-tables-id-update-schema` — Create, Read, Update and Delete Warehouse Tables.
- `/post-api-projects-project-id-warehouse-tables-file` — Create, Read, Update and Delete Warehouse Tables.
- `/get-api-projects-project-id-warehouse-view-link` — Create, Read, Update and Delete View Columns.
- `/post-api-projects-project-id-warehouse-view-link` — Create, Read, Update and Delete View Columns.
- `/get-api-projects-project-id-warehouse-view-link-id` — Create, Read, Update and Delete View Columns.
- `/put-api-projects-project-id-warehouse-view-link-id` — Create, Read, Update and Delete View Columns.
- `/patch-api-projects-project-id-warehouse-view-link-id` — Create, Read, Update and Delete View Columns.
- `/delete-api-projects-project-id-warehouse-view-link-id` — Create, Read, Update and Delete View Columns.
- `/post-api-projects-project-id-warehouse-view-link-validate` — Create, Read, Update and Delete View Columns.
- `/get-api-projects-project-id-warehouse-view-links` — Create, Read, Update and Delete View Columns.
- `/post-api-projects-project-id-warehouse-view-links` — Create, Read, Update and Delete View Columns.
- `/get-api-projects-project-id-warehouse-view-links-id` — Create, Read, Update and Delete View Columns.
- `/put-api-projects-project-id-warehouse-view-links-id` — Create, Read, Update and Delete View Columns.
- `/patch-api-projects-project-id-warehouse-view-links-id` — Create, Read, Update and Delete View Columns.
- `/delete-api-projects-project-id-warehouse-view-links-id` — Create, Read, Update and Delete View Columns.
- `/post-api-projects-project-id-warehouse-view-links-validate` — Create, Read, Update and Delete View Columns.
- `/get-api-projects-project-id-web-experiments` — GET /api/projects/{project_id}/web_experiments/
- `/post-api-projects-project-id-web-experiments` — POST /api/projects/{project_id}/web_experiments/
- `/get-api-projects-project-id-web-experiments-id` — GET /api/projects/{project_id}/web_experiments/{id}/
- `/put-api-projects-project-id-web-experiments-id` — PUT /api/projects/{project_id}/web_experiments/{id}/
- `/patch-api-projects-project-id-web-experiments-id` — PATCH /api/projects/{project_id}/web_experiments/{id}/
- `/delete-api-projects-project-id-web-experiments-id` — DELETE /api/projects/{project_id}/web_experiments/{id}/
- `/get-api-projects-project-id-wizard-sessions` — List wizard sessions for the project, ordered by started_at desc. This shoul...
- `/post-api-projects-project-id-wizard-sessions` — Upsert a wizard session. The `session_id` key is the idempotency anchor — r...
- `/get-api-projects-project-id-wizard-sessions-session-id` — Retrieve a single wizard session by its session_id.
- `/get-api-projects-project-id-wizard-sessions-stream` — Server-Sent Events stream of wizard session updates for a (workflow_i...

**SDK consumers**: do not call the generated fetch wrapper for this path — it will buffer the entire infinite stream. Use the U...
- `/get-api-public-hog-function-templates` — GET /api/public_hog_function_templates/
- `/get-api-user-home-settings-uuid` — Get the authenticated user's pinned sidebar tabs and configured homepage for the current...
- `/patch-api-user-home-settings-uuid` — Update the authenticated user's pinned sidebar tabs and/or homepage for the current te...
- `/get-api-users` — GET /api/users/
- `/get-api-users-user-id-signal-autonomy` — Per-user signal autonomy config (singleton keyed by user).

GET    /api/users/<id>/signal_autonomy/ → current config (or 404)
POST   /api/users/<id>/signal_autonomy/ → create or update
DELETE /api/users/<id>/signal_autonomy/ → remove (opt out)
- `/post-api-users-user-id-signal-autonomy` — Per-user signal autonomy config (singleton keyed by user).

GET    /api/users/<id>/signal_autonomy/ → current config (or 404)
POST   /api/users/<id>/signal_autonomy/ → create or update
DELETE /api/users/<id>/signal_autonomy/ → remove (opt out)
- `/delete-api-users-user-id-signal-autonomy` — Per-user signal autonomy config (singleton keyed by user).

GET    /api/users/<id>/signal_autonomy/ → current config (or 404)
POST   /api/users/<id>/signal_autonomy/ → create or update
DELETE /api/users/<id>/signal_autonomy/ → remove (opt out)
- `/get-api-users-uuid` — Retrieve a user's profile and settings. Pass `@me` as the UUID to fetch the authenticated user; non-s...
- `/put-api-users-uuid` — Replace the authenticated user's profile and settings. Pass `@me` as the UUID to update the authentic...
- `/patch-api-users-uuid` — Update one or more of the authenticated user's profile fields or settings.
- `/delete-api-users-uuid` — DELETE /api/users/{uuid}/
- `/post-api-users-uuid-credentials-review-complete` — Mark the user as having reviewed their existing credentials. Idempotent....
- `/get-api-users-uuid-github-login` — GET /api/users/{uuid}/github_login/
- `/get-api-users-uuid-hedgehog-config` — GET /api/users/{uuid}/hedgehog_config/
- `/patch-api-users-uuid-hedgehog-config` — PATCH /api/users/{uuid}/hedgehog_config/
- `/get-api-users-uuid-integrations` — List personal GitHub integrations
- `/delete-api-users-uuid-integrations-github-installation-id` — Disconnect a personal GitHub integration
- `/get-api-users-uuid-integrations-github-installation-id-branches` — List branches for a personal GitHub installation repository
- `/get-api-users-uuid-integrations-github-installation-id-repos` — List repositories for a personal GitHub installation
- `/post-api-users-uuid-integrations-github-installation-id-repos-ref` — Refresh repositories for a personal GitHub installation
- `/post-api-users-uuid-integrations-github-start` — Start GitHub personal integration linking
- `/post-api-users-uuid-onboarding-skip` — Mark the current user as having exited onboarding with a non-delegated reason.
Idempotent: the skip timestamp is only set on the first successful call.

Callers wanting to delegate setup to a teammate must use the dedicated
/organizations/{id}/invites/delegate/ endpoint, which atomically creates the
invite and sets reason="delegated". This endpoint rejects that reason so state
can't be faked without a real invite.
- `/post-api-users-uuid-push-tokens` — Register a push notification token
- `/post-api-users-uuid-push-tokens-unregister` — Unregister a push notification token
- `/post-api-users-uuid-scene-personalisation` — POST /api/users/{uuid}/scene_personalisation/
- `/get-api-users-uuid-start-2fa-setup` — GET /api/users/{uuid}/start_2fa_setup/
- `/post-api-users-uuid-two-factor-backup-codes` — Generate new backup codes, invalidating any existing ones
- `/post-api-users-uuid-two-factor-disable` — Disable 2FA and remove all related devices
- `/get-api-users-uuid-two-factor-start-setup` — GET /api/users/{uuid}/two_factor_start_setup/
- `/get-api-users-uuid-two-factor-status` — Get current 2FA status including backup codes if enabled
- `/post-api-users-uuid-two-factor-validate` — POST /api/users/{uuid}/two_factor_validate/
- `/post-api-users-uuid-validate-2fa` — POST /api/users/{uuid}/validate_2fa/
- `/patch-api-users-cancel-email-change-request` — PATCH /api/users/cancel_email_change_request/
- `/post-api-users-request-email-verification` — POST /api/users/request_email_verification/
- `/post-api-users-verify-email` — POST /api/users/verify_email/

## Usage

```ts
import { PosthogClient } from './posthog/client.js';

const client = new PosthogClient(process.env.POSTHOG_API_TOKEN!);
```

## Auth pattern

Set `API_TOKEN` (or the env var specific to this API) before running any command.
All generated curl examples use `-H "Authorization: Bearer $API_TOKEN"`.

## Maintenance

- **Re-forge**: `node ~/.agentskills/bin/forge-skill-from-openapi.mjs <spec-url> skills/posthog --name posthog`
- **Hand-edit**: add examples, tweak descriptions, add business-context to commands.
- **Spec drift**: re-running forge overwrites generated files; custom edits in `commands/*.md` survive if you rename the file.

## Source

Generated 2026-06-18 by forge-skill-from-openapi.
Spec: unknown
