> ## Documentation Index
> Fetch the complete documentation index at: https://docs.hydradb.com/llms.txt
> Use this file to discover all available pages before exploring further.

# User Memory

> Add memories to HydraDB that can be used by your agents for learning about your users. This API allows you to ingest memories in various formats including text, markdown, and user-assistant pairs.

### Sample Requests

<Tabs>
  <Tab title="API Request">
    ```bash expandable theme={null}
    # Simple text memory (no inference)
    curl --request POST \
      --url https://api.hydradb.com/memories/add_memory \
      --header 'Authorization: Bearer <token>' \
      --header 'Content-Type: application/json' \
      --data '{
      "memories": [
        {
          "text": "Company policy document v2.0 - All employees must...",
          "infer": false,
          "title": "Company Policy"
        }
      ],
      "tenant_id": "tenant-01",
      "sub_tenant_id": ""
    }'

    # Text with inference enabled
    curl --request POST \
      --url https://api.hydradb.com/memories/add_memory \
      --header 'Authorization: Bearer <token>' \
      --header 'Content-Type: application/json' \
      --data '{
      "memories": [
        {
          "text": "User wakes up early and enjoys jogging before work",
          "infer": true,
          "user_name": "John",
          "custom_instructions": "Extract user preferences and habits"
        }
      ],
      "tenant_id": "tenant-01"
    }'

    # Markdown content
    curl --request POST \
      --url https://api.hydradb.com/memories/add_memory \
      --header 'Authorization: Bearer <token>' \
      --header 'Content-Type: application/json' \
      --data '{
      "memories": [
        {
          "text": "# Meeting Notes\n\n## Attendees\n- John\n- Jane\n\n## Action Items\n1. Review Q3 budget\n2. Prepare presentation",
          "is_markdown": true,
          "infer": false,
          "title": "Q3 Planning Meeting"
        }
      ],
      "tenant_id": "tenant-01"
    }'

    # User-assistant conversation pairs
    curl --request POST \
      --url https://api.hydradb.com/memories/add_memory \
      --header 'Authorization: Bearer <token>' \
      --header 'Content-Type: application/json' \
      --data '{
      "memories": [
        {
          "user_assistant_pairs": [
            {"user": "What is my favorite color?", "assistant": "Based on our previous conversations, you prefer blue."},
            {"user": "Remember that I like dark mode", "assistant": "Noted! I will remember that you prefer dark mode interfaces."}
          ],
          "infer": true,
          "user_name": "John"
        }
      ],
      "tenant_id": "tenant-01"
    }'

    # Batch upload - multiple items with mixed settings
    curl --request POST \
      --url https://api.hydradb.com/memories/add_memory \
      --header 'Authorization: Bearer <token>' \
      --header 'Content-Type: application/json' \
      --data '{
      "memories": [
        {
          "text": "User prefers detailed explanations",
          "infer": true,
          "user_name": "John"
        },
        {
          "text": "Company policy document - version 2.0",
          "infer": false,
          "title": "Policy Doc"
        },
        {
          "user_assistant_pairs": [
            {"user": "What are my settings?", "assistant": "You have dark mode enabled."}
          ],
          "infer": true,
          "user_name": "John"
        }
      ],
      "tenant_id": "tenant-01"
    }'
    ```
  </Tab>

  <Tab title="TypeScript">
    ```ts expandable theme={null}
    // Simple text memory
    const result = await client.userMemory.add({
      memories: [
        {
          text: "User prefers detailed explanations and dark mode",
          infer: true,
          user_name: "John"
        }
      ],
      tenant_id: "tenant-01",
      sub_tenant_id: "",
      upsert: true
    });

    // Markdown content
    const markdownResult = await client.userMemory.add({
      memories: [
        {
          text: "# Meeting Notes\n\n## Key Points\n- Budget approved\n- Launch date: Q2",
          is_markdown: true,
          infer: false,
          title: "Meeting Notes"
        }
      ],
      tenant_id: "tenant-01",
      sub_tenant_id: "",
      upsert: true
    });

    // User-assistant pairs with inference
    const conversationResult = await client.userMemory.add({
      memories: [
        {
          user_assistant_pairs: [
            { user: "What are my preferences?", assistant: "You prefer dark mode and detailed explanations." },
            { user: "How do I like my reports?", assistant: "You prefer weekly summary reports with charts." }
          ],
          infer: true,
          user_name: "John",
          custom_instructions: "Extract user preferences"
        }
      ],
      tenant_id: "tenant-01",
      sub_tenant_id: "",
      upsert: true
    });
    ```
  </Tab>

  <Tab title="Python (Sync)">
    ```python expandable theme={null}
    from hydra_db_python import HydraDBClient

    client = HydraDBClient(api_key="your_api_key")

    # Simple text memory
    result = client.user_memory.add(
        memories=[
            {
                "text": "User prefers detailed explanations and dark mode",
                "infer": True,
                "user_name": "John"
            }
        ],
        tenant_id="tenant-01",
        sub_tenant_id="",
        upsert=True
    )

    # Markdown content
    markdown_result = client.user_memory.add(
        memories=[
            {
                "text": "# Meeting Notes\n\n## Key Points\n- Budget approved",
                "is_markdown": True,
                "infer": False,
                "title": "Meeting Notes"
            }
        ],
        tenant_id="tenant-01",
        sub_tenant_id="",
        upsert=True
    )

    # User-assistant pairs with inference
    conversation_result = client.user_memory.add(
        memories=[
            {
                "user_assistant_pairs": [
                    {"user": "What are my preferences?", "assistant": "You prefer dark mode."},
                    {"user": "How do I like reports?", "assistant": "Weekly summaries with charts."}
                ],
                "infer": True,
                "user_name": "John",
                "custom_instructions": "Extract user preferences"
            }
        ],
        tenant_id="tenant-01",
        sub_tenant_id="",
        upsert=True
    )
    ```
  </Tab>
</Tabs>

## Content Types

The API supports three types of content input:

### Text

```json  theme={null}
{
  "text": "Your text content here",
  "infer": false
}
```

### Markdown

```json  theme={null}
{
  "text": "# Title\n\n## Section\nContent here...",
  "is_markdown": true,
  "infer": false
}
```

### User-Assistant Pairs

```json  theme={null}
{
  "user_assistant_pairs": [
    {"user": "Question", "assistant": "Answer"}
  ],
  "infer": true
}
```

## Key Parameters

### `infer` (boolean)

Controls whether HydraDB extracts insights, likes, dislikes, preferences, and outcomes from the content. If it nothing is specified, default behaviour is `true`

| Value   | Behavior                                                              |
| ------- | --------------------------------------------------------------------- |
| `false` | Content is ingested as-is (faster processing)                         |
| `true`  | Content is analyzed to extract information, preferences, and insights |

<Info>
  **`When to use infer=true:`**

  * Storing user conversations to extract preferences
  * Processing feedback or reviews
  * Extracting insights from unstructured text

  **`When to use infer=false:`**

  * Uploading factual statements
  * Storing deterministic data that doesn't need interpretation
</Info>

### `Upsert` parameter (optional)

For any form of memories, the identifier is `id`. When that identifier already exists, `upsert` (boolean, default `true`) controls the behavior:

| Value   | Behavior                   |
| ------- | -------------------------- |
| `true`  | Replace existing (default) |
| `false` | Fail; do not overwrite     |

Overwriting permanently removes and replaces existing memory for that identifier.

### `id` (optional)

Provide your own unique identifier, or let HydraDB auto-generate one.

### `expiry_time` (optional)

Time-to-live in seconds. Memories will be automatically forgotten after this duration.

## Memory Item Fields

Each item in the `memories` array can have the following fields:

| Field                  | Type    | Required | Description                                  |
| ---------------------- | ------- | -------- | -------------------------------------------- |
| `text`                 | string  | \*       | Raw text or markdown content                 |
| `user_assistant_pairs` | array   | \*       | Array of conversation pairs                  |
| `is_markdown`          | boolean | No       | Whether text is markdown formatted           |
| `infer`                | boolean | No       | Enable inference processing (default: false) |
| `custom_instructions`  | string  | No       | Guide inference processing                   |
| `user_name`            | string  | No       | User's name for personalization              |
| `id`                   | string  | No       | Custom unique identifier                     |
| `title`                | string  | No       | Display title for the memory                 |
| `tenant_metadata`      | string  | No       | JSON string of tenant-level metadata         |
| `document_metadata`    | string  | No       | JSON string of document-level metadata       |

## Response Format

```json  theme={null}
{
  "success": true,
  "message": "Memories queued for ingestion successfully",
  "results": [
    {
      "id": "abc123-def456",
      "title": "My Document",
      "status": "queued",
      "infer": false,
      "error": null
    }
  ],
  "success_count": 1,
  "failed_count": 0
}
```

## Processing Status

```bash  theme={null}
# Check status via verify_processing
curl -X POST \
  'https://api.hydradb.com/ingestion/verify_processing?file_ids=<file_id>&tenant_id=<tenant_id>' \
  -H 'Authorization: Bearer <token>'
```

### Status Values

| Status           | Description                             |
| ---------------- | --------------------------------------- |
| `queued`         | Content is waiting to be processed      |
| `processing`     | Content is being chunked and embedded   |
| `graph_creation` | Knowledge graph is being built          |
| `completed`      | Content is fully indexed and searchable |
| `errored`        | Processing failed (check error\_code)   |

<Note>
  **Batch Uploads**: You can include multiple items in a single request for efficient bulk ingestion. Each item can have different `infer` settings.

  **Processing Time**:

  * `infer=false`: Typically 1-3 minutes. We update all nodes in your graph with new information
  * `infer=true`: May take slightly longer due to LLM inference processing
</Note>

## Migration from Previous APIs

This endpoint replaces and unifies:

* `/memories/add_memories` (deprecated)
* `/ingestion/upload_content` (deprecated)

### Key Changes

| Old API                   | New API                       |
| ------------------------- | ----------------------------- |
| `raw_text`                | `text`                        |
| `content` in body wrapper | `memories` array at top level |
| Separate endpoints        | Single unified endpoint       |


## OpenAPI

````yaml POST /memories/add_memory
openapi: 3.1.0
info:
  title: HydraDB API
  description: REST APIs for the HydraDB retrieval engine
  version: 0.0.1
servers:
  - url: https://api.hydradb.com
    description: Production
    x-fern-server-name: hydradb-prod
security: []
paths:
  /memories/add_memory:
    post:
      tags:
        - Memories
      summary: Add memory
      operationId: add_memory_memories_add_memory_post
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Body_add_memory_memories_add_memory_post'
        required: true
      responses:
        '200':
          description: Successful Response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AddMemoryResponse'
        '400':
          description: Bad Request - Invalid input parameters
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ActualErrorResponse'
        '401':
          description: Unauthorized - Authentication required
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ActualErrorResponse'
        '403':
          description: Forbidden - Access denied
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ActualErrorResponse'
        '404':
          description: Not Found - Resource does not exist
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ActualErrorResponse'
        '422':
          description: Unprocessable Entity - Validation failed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ActualErrorResponse'
        '500':
          description: Internal Server Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ActualErrorResponse'
        '503':
          description: Service Unavailable
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ActualErrorResponse'
      security:
        - HTTPBearer: []
components:
  schemas:
    Body_add_memory_memories_add_memory_post:
      properties:
        memories:
          items:
            $ref: '#/components/schemas/MemoryItem'
          type: array
          minItems: 1
          title: Memories
          description: List of memory items to ingest
          example: []
        tenant_id:
          type: string
          title: Tenant Id
          description: Unique identifier for the tenant/organization
          example: tenant_1234
        sub_tenant_id:
          type: string
          title: Sub Tenant Id
          description: >-
            Optional sub-tenant identifier used to organize data within a
            tenant. If omitted, the default sub-tenant created during tenant
            setup will be used.
          default: ''
          example: sub_tenant_4567
        upsert:
          type: boolean
          title: Upsert
          description: If true, update existing sources with the same source_id.
          default: true
          example: true
      type: object
      required:
        - memories
        - tenant_id
      title: Body_add_memory_memories_add_memory_post
    AddMemoryResponse:
      properties:
        success:
          type: boolean
          title: Success
          default: true
          example: true
        message:
          type: string
          title: Message
          default: Memories queued for ingestion successfully
        results:
          items:
            $ref: '#/components/schemas/MemoryResultItem'
          type: array
          title: Results
          description: List of results for each ingested memory item.
          example: []
        success_count:
          type: integer
          title: Success Count
          description: Number of items successfully queued for ingestion.
          default: 0
          example: 1
        failed_count:
          type: integer
          title: Failed Count
          description: Number of items that failed to queue.
          default: 0
          example: 1
      type: object
      title: AddMemoryResponse
      description: Response model for add_memory endpoint.
    ActualErrorResponse:
      properties:
        detail:
          $ref: '#/components/schemas/ErrorResponse'
      type: object
      required:
        - detail
      title: ActualErrorResponse
    MemoryItem:
      properties:
        source_id:
          anyOf:
            - type: string
            - type: 'null'
          title: Source Id
          description: Optional unique identifier. Auto-generated if not provided.
        title:
          anyOf:
            - type: string
            - type: 'null'
          title: Title
          description: Display title for this memory item.
        text:
          anyOf:
            - type: string
            - type: 'null'
          title: Text
          description: Raw text or markdown content to be indexed.
          examples:
            - |-
              # Introduction

              This is the document content.
        user_assistant_pairs:
          anyOf:
            - items:
                $ref: '#/components/schemas/UserAssistantPair'
              type: array
            - type: 'null'
          title: User Assistant Pairs
          description: Array of user/assistant conversation pairs to store as memory.
        is_markdown:
          type: boolean
          title: Is Markdown
          description: Whether the text is markdown formatted.
          default: false
          example: true
        infer:
          type: boolean
          title: Infer
          description: >-
            If true, process and extract additional insights/inferences from the
            contentbefore indexingUseful for extracting implicit information
            from conversations
          default: false
          example: true
        custom_instructions:
          anyOf:
            - type: string
            - type: 'null'
          title: Custom Instructions
          description: Custom instructions to guide inference processing.
        user_name:
          type: string
          title: User Name
          description: User's name for personalization in conversation pairs.
          default: User
          example: John Doe
        expiry_time:
          anyOf:
            - type: integer
            - type: 'null'
          title: Expiry Time
          description: Optional TTL in seconds for this memory.
        tenant_metadata:
          anyOf:
            - type: string
            - type: 'null'
          title: Tenant Metadata
          description: >+
            JSON string containing tenant-level document metadata (e.g.,
            department, compliance_tag)


            Example: > "{"department":"Finance","compliance_tag":"GDPR"}"

          default: ''
        document_metadata:
          anyOf:
            - type: string
            - type: 'null'
          title: Document Metadata
          description: >+
            JSON string containing document-specific metadata (e.g., title,
            author, file_id). If file_id is not provided, the system will
            generate an ID automatically.


            Example: > "{"title":"Q1 Report.pdf","author":"Alice
            Smith","file_id":"custom_file_123"}"


          default: ''
        relations:
          anyOf:
            - $ref: '#/components/schemas/ForcefulRelationsPayload'
            - type: 'null'
          description: >-
            Forcefully connect 2 sources based on HydraDB source IDs or common
            properties.
      type: object
      title: MemoryItem
      description: |-
        Represents a single memory item for ingestion.
        Supports raw text, markdown, and user/assistant conversation pairs.
    MemoryResultItem:
      properties:
        source_id:
          type: string
          title: Source Id
          description: Unique identifier for the ingested source.
          example: <source_id>
        title:
          anyOf:
            - type: string
            - type: 'null'
          title: Title
          description: Title of the memory if provided.
        status:
          $ref: '#/components/schemas/SourceStatus'
          description: Initial processing status.
          default: queued
        infer:
          type: boolean
          title: Infer
          description: Whether inference was requested for this memory.
          default: false
          example: true
        error:
          anyOf:
            - type: string
            - type: 'null'
          title: Error
          description: Error message if ingestion failed.
      type: object
      required:
        - source_id
      title: MemoryResultItem
      description: Result for a single ingested memory item.
    ErrorResponse:
      properties:
        success:
          type: boolean
          title: Success
          default: false
        message:
          type: string
          minLength: 1
          title: Message
          default: Error occurred
        error_code:
          anyOf:
            - type: string
            - type: 'null'
          title: Error Code
      type: object
      title: ErrorResponse
    UserAssistantPair:
      properties:
        user:
          type: string
          title: User
          description: User's message in the conversation
          example: <user>
        assistant:
          type: string
          title: Assistant
          description: Assistant's response to the user message
          example: <assistant>
      type: object
      required:
        - user
        - assistant
      title: UserAssistantPair
      description: Represents a user-assistant conversation pair.
    ForcefulRelationsPayload:
      properties:
        hydradb_source_ids:
          anyOf:
            - items:
                type: string
              type: array
            - type: 'null'
          title: HydraDB Source Ids
          description: HydraDB source IDs to forcefully relate to the uploaded source.
        properties:
          anyOf:
            - additionalProperties: true
              type: object
            - type: 'null'
          title: Properties
          description: Optional properties to attach to the forceful relation.
      type: object
      title: ForcefulRelationsPayload
    SourceStatus:
      type: string
      enum:
        - queued
        - processing
        - completed
        - failed
      title: SourceStatus
  securitySchemes:
    HTTPBearer:
      type: http
      scheme: bearer

````

Built with [Mintlify](https://mintlify.com).