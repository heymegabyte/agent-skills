---
name: openai
description: "OpenAI API API skill — auto-forged from OpenAPI 2.3.0. The OpenAI REST API. Please see https://platform.openai.com/docs/api-reference for more details."
triggers: ["openai API", "working with OpenAI API"]
version: 1.0.0
forged-from: openapi
api-title: OpenAI API
api-version: 2.3.0
---

# OpenAI API API Skill

<!-- commands-collapsed -->
> **Per-endpoint pages collapsed.** The 242 `commands/*.md` files (one per endpoint) were removed to cut file count — they were forge-generated, unrouted, and reproduce what Context7 (live API docs) and the typed `client.ts` already provide (some integrations also expose a live MCP server). The **Slash Commands** inventory below is retained.
> Restore full offline curl/param detail any time: `node bin/forge-skill-from-openapi.mjs <spec-url> skills/openai --name openai`.


Auto-forged from the OpenAI API OpenAPI spec (v2.3.0).

## What this skill provides

- **242 slash commands** — one per API endpoint, with curl examples and typed guidance
- **`types.ts`** — TypeScript types auto-generated from OpenAPI schemas
- **`client.ts`** — Typed fetch-based API client (zero deps, Workers-compatible)

## Slash Commands

- `/get-assistants` — Returns a list of assistants.
- `/post-assistants` — Create an assistant with a model and instructions.
- `/get-assistants-assistant-id` — Retrieves an assistant.
- `/post-assistants-assistant-id` — Modifies an assistant.
- `/delete-assistants-assistant-id` — Delete an assistant.
- `/post-audio-speech` — Generates audio from the input text.

Returns the audio file content, or a stream of audio events.

- `/post-audio-transcriptions` — Transcribes audio into the input language.

Returns a transcription object in `json`, `diarized_json`, or `verbose_json`
format, or a stream of transcript events.

- `/post-audio-translations` — Translates audio into English.
- `/get-audio-voice-consents` — Returns a list of voice consent recordings.
- `/post-audio-voice-consents` — Upload a voice consent recording.
- `/get-audio-voice-consents-consent-id` — Retrieves a voice consent recording.
- `/post-audio-voice-consents-consent-id` — Updates a voice consent recording (metadata only).
- `/delete-audio-voice-consents-consent-id` — Deletes a voice consent recording.
- `/post-audio-voices` — Creates a custom voice.
- `/get-batches` — List your organization's batches.
- `/post-batches` — Creates and executes a batch from an uploaded file of requests
- `/get-batches-batch-id` — Retrieves a batch.
- `/post-batches-batch-id-cancel` — Cancels an in-progress batch. The batch will be in status `cancelling` for up to 10 minutes, before changing to `cancelled`, where it will have partial results (if any) available in the output file.
- `/get-chat-completions` — List stored Chat Completions. Only Chat Completions that have been stored
with the `store` parameter set to `true` will be returned.

- `/post-chat-completions` — **Starting a new project?** We recommend trying [Responses](/docs/api-reference/responses)
to take advantage of the latest OpenAI platform features. Compare
[Chat Completions with Responses](/docs/guides/responses-vs-chat-completions?api-mode=responses).

---

Creates a model response for the given chat conversation. Learn more in the
[text generation](/docs/guides/text-generation), [vision](/docs/guides/vision),
and [audio](/docs/guides/audio) guides.

Parameter support can differ depending on the model used to generate the
response, particularly for newer reasoning models. Parameters that are only
supported for reasoning models are noted below. For the current state of
unsupported parameters in reasoning models,
[refer to the reasoning guide](/docs/guides/reasoning).

Returns a chat completion object, or a streamed sequence of chat completion
chunk objects if the request is streamed.

- `/get-chat-completions-completion-id` — Get a stored chat completion. Only Chat Completions that have been created
with the `store` parameter set to `true` will be returned.

- `/post-chat-completions-completion-id` — Modify a stored chat completion. Only Chat Completions that have been
created with the `store` parameter set to `true` can be modified. Currently,
the only supported modification is to update the `metadata` field.

- `/delete-chat-completions-completion-id` — Delete a stored chat completion. Only Chat Completions that have been
created with the `store` parameter set to `true` can be deleted.

- `/get-chat-completions-completion-id-messages` — Get the messages in a stored chat completion. Only Chat Completions that
have been created with the `store` parameter set to `true` will be
returned.

- `/post-completions` — Creates a completion for the provided prompt and parameters.

Returns a completion object, or a sequence of completion objects if the request is streamed.

- `/get-containers` — List Containers
- `/post-containers` — Create Container
- `/get-containers-container-id` — Retrieve Container
- `/delete-containers-container-id` — Delete Container
- `/get-containers-container-id-files` — List Container files
- `/post-containers-container-id-files` — Create a Container File

You can send either a multipart/form-data request with the raw file content, or a JSON request with a file ID.

- `/get-containers-container-id-files-file-id` — Retrieve Container File
- `/delete-containers-container-id-files-file-id` — Delete Container File
- `/get-containers-container-id-files-file-id-content` — Retrieve Container File Content
- `/get-conversations-conversation-id-items` — List all items for a conversation with the given ID.
- `/post-conversations-conversation-id-items` — Create items in a conversation with the given ID.
- `/get-conversations-conversation-id-items-item-id` — Get a single item from a conversation with the given IDs.
- `/delete-conversations-conversation-id-items-item-id` — Delete an item from a conversation with the given IDs.
- `/post-embeddings` — Creates an embedding vector representing the input text.
- `/get-evals` — List evaluations for a project.

- `/post-evals` — Create the structure of an evaluation that can be used to test a model's performance.
An evaluation is a set of testing criteria and the config for a data source, which dictates the schema of the data used in the evaluation. After creating an evaluation, you can run it on different models and model parameters. We support several types of graders and datasources.
For more information, see the [Evals guide](/docs/guides/evals).

- `/get-evals-eval-id` — Get an evaluation by ID.

- `/post-evals-eval-id` — Update certain properties of an evaluation.

- `/delete-evals-eval-id` — Delete an evaluation.

- `/get-evals-eval-id-runs` — Get a list of runs for an evaluation.

- `/post-evals-eval-id-runs` — Kicks off a new run for a given evaluation, specifying the data source, and what model configuration to use to test. The datasource will be validated against the schema specified in the config of the evaluation.

- `/get-evals-eval-id-runs-run-id` — Get an evaluation run by ID.

- `/post-evals-eval-id-runs-run-id` — Cancel an ongoing evaluation run.

- `/delete-evals-eval-id-runs-run-id` — Delete an eval run.

- `/get-evals-eval-id-runs-run-id-output-items` — Get a list of output items for an evaluation run.

- `/get-evals-eval-id-runs-run-id-output-items-output-item-id` — Get an evaluation run output item by ID.

- `/get-files` — Returns a list of files.
- `/post-files` — Upload a file that can be used across various endpoints. Individual files
can be up to 512 MB, and each project can store up to 2.5 TB of files in
total. There is no organization-wide storage limit. Uploads to this
endpoint are rate-limited to 1,000 requests per minute per authenticated
user.

- The Assistants API supports files up to 2 million tokens and of specific
  file types. See the [Assistants Tools guide](/docs/assistants/tools) for
  details.
- The Fine-tuning API only supports `.jsonl` files. The input also has
  certain required formats for fine-tuning
  [chat](/docs/api-reference/fine-tuning/chat-input) or
  [completions](/docs/api-reference/fine-tuning/completions-input) models.
- The Batch API only supports `.jsonl` files up to 200 MB in size. The input
  also has a specific required
  [format](/docs/api-reference/batch/request-input).
- For Retrieval or `file_search` ingestion, upload files here first. If
  you need to attach multiple uploaded files to the same vector store, use
  [`/vector_stores/{vector_store_id}/file_batches`](/docs/api-reference/vector-stores-file-batches/createBatch)
  instead of attaching them one by one. Vector store attachment has separate
  limits from file upload, including 2,000 attached files per minute per
  organization.

Please [contact us](https://help.openai.com/) if you need to increase these
storage limits.

- `/get-files-file-id` — Returns information about a specific file.
- `/delete-files-file-id` — Delete a file and remove it from all vector stores.
- `/get-files-file-id-content` — Returns the contents of the specified file.
- `/post-fine-tuning-alpha-graders-run` — Run a grader.

- `/post-fine-tuning-alpha-graders-validate` — Validate a grader.

- `/get-fine-tuning-checkpoints-fine-tuned-model-checkpoint-permissi` — **NOTE:** This endpoint requires an [admin API key](https://platform.openai.com/settings/organization/admin-keys).

Organization owners can use this endpoint to view all permissions for a fine-tuned model checkpoint.

- `/post-fine-tuning-checkpoints-fine-tuned-model-checkpoint-permissi` — **NOTE:** Calling this endpoint requires an [admin API key](https://platform.openai.com/settings/organization/admin-keys).

This enables organization owners to share fine-tuned models with other projects in their organization.

- `/delete-fine-tuning-checkpoints-fine-tuned-model-checkpoint-permissi` — **NOTE:** This endpoint requires an [admin API key](https://platform.openai.com/settings/organization/admin-keys).

Organization owners can use this endpoint to delete a permission for a fine-tuned model checkpoint.

- `/get-fine-tuning-jobs` — List your organization's fine-tuning jobs

- `/post-fine-tuning-jobs` — Creates a fine-tuning job which begins the process of creating a new model from a given dataset.

Response includes details of the enqueued job including job status and the name of the fine-tuned models once complete.

[Learn more about fine-tuning](/docs/guides/model-optimization)

- `/get-fine-tuning-jobs-fine-tuning-job-id` — Get info about a fine-tuning job.

[Learn more about fine-tuning](/docs/guides/model-optimization)

- `/post-fine-tuning-jobs-fine-tuning-job-id-cancel` — Immediately cancel a fine-tune job.

- `/get-fine-tuning-jobs-fine-tuning-job-id-checkpoints` — List checkpoints for a fine-tuning job.

- `/get-fine-tuning-jobs-fine-tuning-job-id-events` — Get status updates for a fine-tuning job.

- `/post-fine-tuning-jobs-fine-tuning-job-id-pause` — Pause a fine-tune job.

- `/post-fine-tuning-jobs-fine-tuning-job-id-resume` — Resume a fine-tune job.

- `/post-images-edits` — Creates an edited or extended image given one or more source images and a prompt. This endpoint supports GPT Image models (`gpt-image-1.5`, `gpt-image-1`, `gpt-image-1-mini`, and `chatgpt-image-latest`) and `dall-e-2`.
- `/post-images-generations` — Creates an image given a prompt. [Learn more](/docs/guides/images).

- `/post-images-variations` — Creates a variation of a given image. This endpoint only supports `dall-e-2`.
- `/get-models` — Lists the currently available models, and provides basic information about each one such as the owner and availability.
- `/get-models-model` — Retrieves a model instance, providing basic information about the model such as the owner and permissioning.
- `/delete-models-model` — Delete a fine-tuned model. You must have the Owner role in your organization to delete a model.
- `/post-moderations` — Classifies if text and/or image inputs are potentially harmful. Learn
more in the [moderation guide](/docs/guides/moderation).

- `/get-organization-admin-api-keys` — List organization API keys
- `/post-organization-admin-api-keys` — Create an organization admin API key
- `/get-organization-admin-api-keys-key-id` — Retrieve a single organization API key
- `/delete-organization-admin-api-keys-key-id` — Delete an organization admin API key
- `/get-organization-audit-logs` — List user actions and configuration changes within this organization.
- `/get-organization-certificates` — List uploaded certificates for this organization.
- `/post-organization-certificates` — Upload a certificate to the organization. This does **not** automatically activate the certificate.

Organizations can upload up to 50 certificates.

- `/post-organization-certificates-activate` — Activate certificates at the organization level.

You can atomically and idempotently activate up to 10 certificates at a time.

- `/post-organization-certificates-deactivate` — Deactivate certificates at the organization level.

You can atomically and idempotently deactivate up to 10 certificates at a time.

- `/get-organization-certificates-certificate-id` — Get a certificate that has been uploaded to the organization.

You can get a certificate regardless of whether it is active or not.

- `/post-organization-certificates-certificate-id` — Modify a certificate. Note that only the name can be modified.

- `/delete-organization-certificates-certificate-id` — Delete a certificate from the organization.

The certificate must be inactive for the organization and all projects.

- `/get-organization-costs` — Get costs details for the organization.
- `/get-organization-groups` — Lists all groups in the organization.
- `/post-organization-groups` — Creates a new group in the organization.
- `/post-organization-groups-group-id` — Updates a group's information.
- `/delete-organization-groups-group-id` — Deletes a group from the organization.
- `/get-organization-groups-group-id-roles` — Lists the organization roles assigned to a group within the organization.
- `/post-organization-groups-group-id-roles` — Assigns an organization role to a group within the organization.
- `/delete-organization-groups-group-id-roles-role-id` — Unassigns an organization role from a group within the organization.
- `/get-organization-groups-group-id-users` — Lists the users assigned to a group.
- `/post-organization-groups-group-id-users` — Adds a user to a group.
- `/delete-organization-groups-group-id-users-user-id` — Removes a user from a group.
- `/get-organization-invites` — Returns a list of invites in the organization.
- `/post-organization-invites` — Create an invite for a user to the organization. The invite must be accepted by the user before they have access to the organization.
- `/get-organization-invites-invite-id` — Retrieves an invite.
- `/delete-organization-invites-invite-id` — Delete an invite. If the invite has already been accepted, it cannot be deleted.
- `/get-organization-projects` — Returns a list of projects.
- `/post-organization-projects` — Create a new project in the organization. Projects can be created and archived, but cannot be deleted.
- `/get-organization-projects-project-id` — Retrieves a project.
- `/post-organization-projects-project-id` — Modifies a project in the organization.
- `/get-organization-projects-project-id-api-keys` — Returns a list of API keys in the project.
- `/get-organization-projects-project-id-api-keys-api-key-id` — Retrieves an API key in the project.
- `/delete-organization-projects-project-id-api-keys-api-key-id` — Deletes an API key from the project.

Returns confirmation of the key deletion, or an error if the key belonged to
a service account.

- `/post-organization-projects-project-id-archive` — Archives a project in the organization. Archived projects cannot be used or updated.
- `/get-organization-projects-project-id-certificates` — List certificates for this project.
- `/post-organization-projects-project-id-certificates-activate` — Activate certificates at the project level.

You can atomically and idempotently activate up to 10 certificates at a time.

- `/post-organization-projects-project-id-certificates-deactivate` — Deactivate certificates at the project level. You can atomically and 
idempotently deactivate up to 10 certificates at a time.

- `/get-organization-projects-project-id-groups` — Lists the groups that have access to a project.
- `/post-organization-projects-project-id-groups` — Grants a group access to a project.
- `/delete-organization-projects-project-id-groups-group-id` — Revokes a group's access to a project.
- `/get-organization-projects-project-id-rate-limits` — Returns the rate limits per model for a project.
- `/post-organization-projects-project-id-rate-limits-rate-limit-id` — Updates a project rate limit.
- `/get-organization-projects-project-id-service-accounts` — Returns a list of service accounts in the project.
- `/post-organization-projects-project-id-service-accounts` — Creates a new service account in the project. This also returns an unredacted API key for the service account.
- `/get-organization-projects-project-id-service-accounts-service-ac` — Retrieves a service account in the project.
- `/delete-organization-projects-project-id-service-accounts-service-ac` — Deletes a service account from the project.

Returns confirmation of service account deletion, or an error if the project
is archived (archived projects have no service accounts).

- `/get-organization-projects-project-id-users` — Returns a list of users in the project.
- `/post-organization-projects-project-id-users` — Adds a user to the project. Users must already be members of the organization to be added to a project.
- `/get-organization-projects-project-id-users-user-id` — Retrieves a user in the project.
- `/post-organization-projects-project-id-users-user-id` — Modifies a user's role in the project.
- `/delete-organization-projects-project-id-users-user-id` — Deletes a user from the project.

Returns confirmation of project user deletion, or an error if the project is
archived (archived projects have no users).

- `/get-organization-roles` — Lists the roles configured for the organization.
- `/post-organization-roles` — Creates a custom role for the organization.
- `/post-organization-roles-role-id` — Updates an existing organization role.
- `/delete-organization-roles-role-id` — Deletes a custom role from the organization.
- `/get-organization-usage-audio-speeches` — Get audio speeches usage details for the organization.
- `/get-organization-usage-audio-transcriptions` — Get audio transcriptions usage details for the organization.
- `/get-organization-usage-code-interpreter-sessions` — Get code interpreter sessions usage details for the organization.
- `/get-organization-usage-completions` — Get completions usage details for the organization.
- `/get-organization-usage-embeddings` — Get embeddings usage details for the organization.
- `/get-organization-usage-images` — Get images usage details for the organization.
- `/get-organization-usage-moderations` — Get moderations usage details for the organization.
- `/get-organization-usage-vector-stores` — Get vector stores usage details for the organization.
- `/get-organization-users` — Lists all of the users in the organization.
- `/get-organization-users-user-id` — Retrieves a user by their identifier.
- `/post-organization-users-user-id` — Modifies a user's role in the organization.
- `/delete-organization-users-user-id` — Deletes a user from the organization.
- `/get-organization-users-user-id-roles` — Lists the organization roles assigned to a user within the organization.
- `/post-organization-users-user-id-roles` — Assigns an organization role to a user within the organization.
- `/delete-organization-users-user-id-roles-role-id` — Unassigns an organization role from a user within the organization.
- `/get-projects-project-id-groups-group-id-roles` — Lists the project roles assigned to a group within a project.
- `/post-projects-project-id-groups-group-id-roles` — Assigns a project role to a group within a project.
- `/delete-projects-project-id-groups-group-id-roles-role-id` — Unassigns a project role from a group within a project.
- `/get-projects-project-id-roles` — Lists the roles configured for a project.
- `/post-projects-project-id-roles` — Creates a custom role for a project.
- `/post-projects-project-id-roles-role-id` — Updates an existing project role.
- `/delete-projects-project-id-roles-role-id` — Deletes a custom role from a project.
- `/get-projects-project-id-users-user-id-roles` — Lists the project roles assigned to a user within a project.
- `/post-projects-project-id-users-user-id-roles` — Assigns a project role to a user within a project.
- `/delete-projects-project-id-users-user-id-roles-role-id` — Unassigns a project role from a user within a project.
- `/post-realtime-calls` — Create a new Realtime API call over WebRTC and receive the SDP answer needed
to complete the peer connection.
- `/post-realtime-calls-call-id-accept` — Accept an incoming SIP call and configure the realtime session that will
handle it.
- `/post-realtime-calls-call-id-hangup` — End an active Realtime API call, whether it was initiated over SIP or
WebRTC.
- `/post-realtime-calls-call-id-refer` — Transfer an active SIP call to a new destination using the SIP REFER verb.
- `/post-realtime-calls-call-id-reject` — Decline an incoming SIP call by returning a SIP status code to the caller.
- `/post-realtime-client-secrets` — Create a Realtime client secret with an associated session configuration.

Client secrets are short-lived tokens that can be passed to a client app,
such as a web frontend or mobile client, which grants access to the Realtime API without
leaking your main API key. You can configure a custom TTL for each client secret.

You can also attach session configuration options to the client secret, which will be
applied to any sessions created using that client secret, but these can also be overridden
by the client connection.

[Learn more about authentication with client secrets over WebRTC](/docs/guides/realtime-webrtc).

Returns the created client secret and the effective session object. The client secret is a string that looks like `ek_1234`.

- `/post-realtime-sessions` — Create an ephemeral API token for use in client-side applications with the
Realtime API. Can be configured with the same session parameters as the
`session.update` client event.

It responds with a session object, plus a `client_secret` key which contains
a usable ephemeral API token that can be used to authenticate browser clients
for the Realtime API.

Returns the created Realtime session object, plus an ephemeral key.

- `/post-realtime-transcription-sessions` — Create an ephemeral API token for use in client-side applications with the
Realtime API specifically for realtime transcriptions. 
Can be configured with the same session parameters as the `transcription_session.update` client event.

It responds with a session object, plus a `client_secret` key which contains
a usable ephemeral API token that can be used to authenticate browser clients
for the Realtime API.

Returns the created Realtime transcription session object, plus an ephemeral key.

- `/post-realtime-translations-client-secrets` — Create a Realtime translation client secret with an associated translation session configuration.

Client secrets are short-lived tokens that can be passed to a client app,
such as a web frontend or mobile client, which grants access to the Realtime
Translation API without leaking your main API key. You can configure a custom
TTL for each client secret.

Returns the created client secret and the effective translation session object.
The client secret is a string that looks like `ek_1234`.

- `/post-responses` — Creates a model response. Provide [text](/docs/guides/text) or
[image](/docs/guides/images) inputs to generate [text](/docs/guides/text)
or [JSON](/docs/guides/structured-outputs) outputs. Have the model call
your own [custom code](/docs/guides/function-calling) or use built-in
[tools](/docs/guides/tools) like [web search](/docs/guides/tools-web-search)
or [file search](/docs/guides/tools-file-search) to use your own data
as input for the model's response.

- `/get-responses-response-id` — Retrieves a model response with the given ID.

- `/delete-responses-response-id` — Deletes a model response with the given ID.

- `/post-responses-response-id-cancel` — Cancels a model response with the given ID. Only responses created with
the `background` parameter set to `true` can be cancelled. 
[Learn more](/docs/guides/background).

- `/get-responses-response-id-input-items` — Returns a list of input items for a given response.
- `/post-threads` — Create a thread.
- `/post-threads-runs` — Create a thread and run it in one request.
- `/get-threads-thread-id` — Retrieves a thread.
- `/post-threads-thread-id` — Modifies a thread.
- `/delete-threads-thread-id` — Delete a thread.
- `/get-threads-thread-id-messages` — Returns a list of messages for a given thread.
- `/post-threads-thread-id-messages` — Create a message.
- `/get-threads-thread-id-messages-message-id` — Retrieve a message.
- `/post-threads-thread-id-messages-message-id` — Modifies a message.
- `/delete-threads-thread-id-messages-message-id` — Deletes a message.
- `/get-threads-thread-id-runs` — Returns a list of runs belonging to a thread.
- `/post-threads-thread-id-runs` — Create a run.
- `/get-threads-thread-id-runs-run-id` — Retrieves a run.
- `/post-threads-thread-id-runs-run-id` — Modifies a run.
- `/post-threads-thread-id-runs-run-id-cancel` — Cancels a run that is `in_progress`.
- `/get-threads-thread-id-runs-run-id-steps` — Returns a list of run steps belonging to a run.
- `/get-threads-thread-id-runs-run-id-steps-step-id` — Retrieves a run step.
- `/post-threads-thread-id-runs-run-id-submit-tool-outputs` — When a run has the `status: "requires_action"` and `required_action.type` is `submit_tool_outputs`, this endpoint can be used to submit the outputs from the tool calls once they're all completed. All outputs must be submitted in a single request.

- `/post-uploads` — Creates an intermediate [Upload](/docs/api-reference/uploads/object) object
that you can add [Parts](/docs/api-reference/uploads/part-object) to.
Currently, an Upload can accept at most 8 GB in total and expires after an
hour after you create it.

Once you complete the Upload, we will create a
[File](/docs/api-reference/files/object) object that contains all the parts
you uploaded. This File is usable in the rest of our platform as a regular
File object.

For certain `purpose` values, the correct `mime_type` must be specified. 
Please refer to documentation for the 
[supported MIME types for your use case](/docs/assistants/tools/file-search#supported-files).

For guidance on the proper filename extensions for each purpose, please
follow the documentation on [creating a
File](/docs/api-reference/files/create).

Returns the Upload object with status `pending`.

- `/post-uploads-upload-id-cancel` — Cancels the Upload. No Parts may be added after an Upload is cancelled.

Returns the Upload object with status `cancelled`.

- `/post-uploads-upload-id-complete` — Completes the [Upload](/docs/api-reference/uploads/object). 

Within the returned Upload object, there is a nested [File](/docs/api-reference/files/object) object that is ready to use in the rest of the platform.

You can specify the order of the Parts by passing in an ordered list of the Part IDs.

The number of bytes uploaded upon completion must match the number of bytes initially specified when creating the Upload object. No Parts may be added after an Upload is completed.
Returns the Upload object with status `completed`, including an additional `file` property containing the created usable File object.

- `/post-uploads-upload-id-parts` — Adds a [Part](/docs/api-reference/uploads/part-object) to an [Upload](/docs/api-reference/uploads/object) object. A Part represents a chunk of bytes from the file you are trying to upload. 

Each Part can be at most 64 MB, and you can add Parts until you hit the Upload maximum of 8 GB.

It is possible to add multiple Parts in parallel. You can decide the intended order of the Parts when you [complete the Upload](/docs/api-reference/uploads/complete).

- `/get-vector-stores` — Returns a list of vector stores.
- `/post-vector-stores` — Create a vector store.
- `/get-vector-stores-vector-store-id` — Retrieves a vector store.
- `/post-vector-stores-vector-store-id` — Modifies a vector store.
- `/delete-vector-stores-vector-store-id` — Delete a vector store.
- `/post-vector-stores-vector-store-id-file-batches` — Create a vector store file batch.
- `/get-vector-stores-vector-store-id-file-batches-batch-id` — Retrieves a vector store file batch.
- `/post-vector-stores-vector-store-id-file-batches-batch-id-cancel` — Cancel a vector store file batch. This attempts to cancel the processing of files in this batch as soon as possible.
- `/get-vector-stores-vector-store-id-file-batches-batch-id-files` — Returns a list of vector store files in a batch.
- `/get-vector-stores-vector-store-id-files` — Returns a list of vector store files.
- `/post-vector-stores-vector-store-id-files` — Create a vector store file by attaching a [File](/docs/api-reference/files) to a [vector store](/docs/api-reference/vector-stores/object).
- `/get-vector-stores-vector-store-id-files-file-id` — Retrieves a vector store file.
- `/post-vector-stores-vector-store-id-files-file-id` — Update attributes on a vector store file.
- `/delete-vector-stores-vector-store-id-files-file-id` — Delete a vector store file. This will remove the file from the vector store but the file itself will not be deleted. To delete the file, use the [delete file](/docs/api-reference/files/delete) endpoint.
- `/get-vector-stores-vector-store-id-files-file-id-content` — Retrieve the parsed contents of a vector store file.
- `/post-vector-stores-vector-store-id-search` — Search a vector store for relevant chunks based on a query and file attributes filter.
- `/post-conversations` — Create a conversation.
- `/get-conversations-conversation-id` — Get a conversation
- `/post-conversations-conversation-id` — Update a conversation
- `/delete-conversations-conversation-id` — Delete a conversation. Items in the conversation will not be deleted.
- `/get-videos` — List recently generated videos for the current project.
- `/post-videos` — Create a new video generation job from a prompt and optional reference assets.
- `/post-videos-characters` — Create a character from an uploaded video.
- `/get-videos-characters-character-id` — Fetch a character.
- `/post-videos-edits` — Create a new video generation job by editing a source video or existing generated video.
- `/post-videos-extensions` — Create an extension of a completed video.
- `/get-videos-video-id` — Fetch the latest metadata for a generated video.
- `/delete-videos-video-id` — Permanently delete a completed or failed video and its stored assets.
- `/get-videos-video-id-content` — Download the generated video bytes or a derived preview asset.

Streams the rendered video content for the specified video job.
- `/post-videos-video-id-remix` — Create a remix of a completed video using a refreshed prompt.
- `/post-responses-input-tokens` — Returns input token counts of the request.

Returns an object with `object` set to `response.input_tokens` and an `input_tokens` count.
- `/post-responses-compact` — Compact a conversation. Returns a compacted response object.

Learn when and how to compact long-running conversations in the [conversation state guide](/docs/guides/conversation-state#managing-the-context-window). For ZDR-compatible compaction details, see [Compaction (advanced)](/docs/guides/conversation-state#compaction-advanced).
- `/get-skills` — List all skills for the current project.
- `/post-skills` — Create a new skill.
- `/get-skills-skill-id` — Get a skill by its ID.
- `/post-skills-skill-id` — Update the default version pointer for a skill.
- `/delete-skills-skill-id` — Delete a skill by its ID.
- `/get-skills-skill-id-content` — Download a skill zip bundle by its ID.
- `/get-skills-skill-id-versions` — List skill versions for a skill.
- `/post-skills-skill-id-versions` — Create a new immutable skill version.
- `/get-skills-skill-id-versions-version` — Get a specific skill version.
- `/delete-skills-skill-id-versions-version` — Delete a skill version.
- `/get-skills-skill-id-versions-version-content` — Download a skill version zip bundle.
- `/post-chatkit-sessions-session-id-cancel` — Cancel an active ChatKit session and return its most recent metadata.

Cancelling prevents new requests from using the issued client secret.
- `/post-chatkit-sessions` — Create a ChatKit session.
- `/get-chatkit-threads-thread-id-items` — List items that belong to a ChatKit thread.
- `/get-chatkit-threads-thread-id` — Retrieve a ChatKit thread by its identifier.
- `/delete-chatkit-threads-thread-id` — Delete a ChatKit thread along with its items and stored attachments.
- `/get-chatkit-threads` — List ChatKit threads with optional pagination and user filters.

## Usage

```ts
import { OpenaiClient } from './openai/client.js';

const client = new OpenaiClient(process.env.OPENAI_API_TOKEN!);
```

## Auth pattern

Set `API_TOKEN` (or the env var specific to this API) before running any command.
All generated curl examples use `-H "Authorization: Bearer $API_TOKEN"`.

## Maintenance

- **Re-forge**: `node ~/.agentskills/bin/forge-skill-from-openapi.mjs <spec-url> skills/openai --name openai`
- **Hand-edit**: add examples, tweak descriptions, add business-context to commands.
- **Spec drift**: re-running forge overwrites generated files; custom edits in `commands/*.md` survive if you rename the file.

## Source

Generated 2026-06-18 by forge-skill-from-openapi.
Spec: https://api.openai.com/v1
