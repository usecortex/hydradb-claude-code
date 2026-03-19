> ## Documentation Index
> Fetch the complete documentation index at: https://docs.hydradb.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Full Recall

> Hybrid search over indexed sources (knowledge) only. Use this when you need context from your knowledge base or uploaded documents.

### When to use it

Use **full recall** when you want to search over **indexed knowledge** (documents, knowledge base, uploaded files). Same request body as [recall preferences](/api-reference/endpoint/recall-preferences) (memories); the endpoint you call determines the search target.

### Examples

<Tabs>
  <Tab title="API Request">
    ```bash  theme={null}
    curl -X 'POST' \
    'https://api.hydradb.com/recall/full_recall' \
    -H 'accept: application/json' \
    -H 'Content-Type: application/json' \
    -d '{
    "tenant_id": "string",
    "sub_tenant_id": "string",
    "query": "string",
    "mode": "fast",
    "max_results": 10,
    "additional_context": "string"
    }'
    ```
  </Tab>

  <Tab title="TypeScript">
    ```ts  theme={null}
    const results = await client.recall.fullRecall({
      query: "Which mode does user prefer",
      tenantId: "tenant_1234",
      subTenantId: "sub_tenant_4567",
      alpha: 0.8,
      recencyBias: 0
    });
    ```
  </Tab>

  <Tab title="Python (Sync)">
    ```python  theme={null}
    # Async usage is similar, just use async_client and await
    results = client.recall.full_recall(
        query="Which mode does user prefer",
        tenant_id="tenant_1234",
        sub_tenant_id="sub_tenant_4567",
        alpha=0.8,
        recency_bias=0
    )
    ```
  </Tab>
</Tabs>

<Info>
  **Default Sub-Tenant Behavior**: If you don't specify a `sub_tenant_id`, the search will be performed within the default sub-tenant created when your tenant was set up. This searches across organization-wide documents.
</Info>

## Retrieval modes

The `mode` parameter controls retrieval behavior:

* **`fast`** — Single-query retrieval. **Personalised recall is disabled**.
* **`thinking`** — Multi-query with reranking. **Personalised recall is enabled**.

Personalised recall(results are personalised using user and behavioral context) is automatically disabled in fast mode and enabled in thinking mode.

## Optional Parameters

### Alpha

Controls the balance between semantic and keyword search:

* `0.0` - Pure keyword search focus
  * Best for: Exact term matching, technical specifications
  * Use when: You need precise keyword matches
* `1.0` - Pure semantic search focus
  * Best for: Conceptual queries, finding related content
  * Use when: You want to discover related concepts
* `0.8` - Balanced approach (default, recommended)
  * Best for: Most general use cases
  * Provides optimal balance of precision and recall
* **`"auto"`** - Intelligent auto-selection
  * HydraDB analyzes your query and chooses the optimal alpha
  * Best for: When you're unsure which approach to use

### Recency Bias

Controls how much recent content is prioritized:

* **`0.1-0.5`** - Light to moderate recency preference
* `0.6` - Default behaviour to give more weightage to recent context
* **`0.6-1.0`** - Strong recency preference

### Max Results

Controls the number of results returned:

* **Range**: 1-1001
* **Default**: 10
* **Recommendation**: Start with 10-20 for most use cases

## Graph Context

Results are automatically enriched with knowledge graph context, providing entity relationships extracted from your content.

**What's included in responses:**

* **`graph_context.chunk_relations`** — Entities and relationships found within each chunk
* **`additional_context`** — Additional context provided by the user to guide retrieval

This helps your AI understand not just *what* is mentioned, but *how* things relate—like knowing that "Sarah Chen" leads "Project Phoenix" which depends on the "Authentication Service".


## OpenAPI

````yaml POST /recall/full_recall
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
  /recall/full_recall:
    post:
      tags:
        - Search
      summary: Full recall for knowledge base
      operationId: full_recall_recall_full_recall_post
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RecallSearchRequest'
        required: true
      responses:
        '200':
          description: Successful Response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RetrievalResult'
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
        '429':
          description: Too Many Requests - Rate limit exceeded
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
    RecallSearchRequest:
      properties:
        tenant_id:
          type: string
          title: Tenant Id
          description: Unique identifier for the tenant/organization
          example: tenant_1234
        sub_tenant_id:
          anyOf:
            - type: string
            - type: 'null'
          title: Sub Tenant Id
          description: >-
            Optional sub-tenant identifier used to organize data within a
            tenant. If omitted, the default sub-tenant created during tenant
            setup will be used.
          example: sub_tenant_4567
        query:
          type: string
          title: Query
          description: Search terms to find relevant content
          example: Which mode does user prefer
        max_results:
          anyOf:
            - type: integer
            - type: 'null'
          title: Max Results
          description: Maximum number of results to return
        mode:
          $ref: '#/components/schemas/RetrieveMode'
          description: Retrieval mode to use ('fast' or 'thinking')
          default: fast
        alpha:
          anyOf:
            - type: string
            - type: number
          title: Alpha
          description: Search ranking algorithm parameter (0.0-1.0 or 'auto')
          default: 0.8
        recency_bias:
          type: number
          title: Recency Bias
          description: >-
            Preference for newer content (0.0 = no bias, 1.0 =            
            strong recency preference)
          default: 0
          example: 1
        graph_context:
          type: boolean
          title: Graph Context
          description: Enable graph context for search results
          default: false
          example: true
        search_forceful_relations:
          type: boolean
          title: Search Forceful Relations
          description: >-
            Whether to search for forceful relations in thinking mode to augment
            context
          default: true
          example: true
        additional_context:
          anyOf:
            - type: string
            - type: 'null'
          title: Additional Context
          description: Additional context provided by the user to guide retrieval
        metadata_filters:
          anyOf:
            - additionalProperties: true
              type: object
            - type: 'null'
          title: Metadata Filters
          description: >-
            Optional key-value pairs to filter search results by tenant metadata
            fields. Keys must match fields defined in tenant_metadata_schema
            during tenant creation. Supports exact match filtering on indexed
            metadata fields. Example: {'category': 'engineering', 'priority':
            'high'}
          examples:
            - category: engineering
              department: R&D
      type: object
      required:
        - tenant_id
        - query
      title: RecallSearchRequest
      description: >-
        Request body for full recall (sources) and recall preferences
        (memories).
    RetrievalResult:
      properties:
        chunks:
          items:
            $ref: '#/components/schemas/VectorStoreChunk'
          type: array
          title: Chunks
          example: []
        sources:
          items:
            $ref: '#/components/schemas/SourceInfo'
          type: array
          title: Sources
          description: Deduplicated source documents corresponding to the returned chunks
        graph_context:
          $ref: '#/components/schemas/GraphContext'
        additional_context:
          additionalProperties:
            $ref: '#/components/schemas/VectorStoreChunk'
          type: object
          title: Additional Context
          description: >-
            Map of chunk_uuid to VectorStoreChunk for extra context from
            forcefully related sources. Use chunk.extra_context_ids to look up
            chunks: extra_context[id] for id in chunk.extra_context_ids.
      type: object
      title: RetrievalResult
      description: Result of a hybrid search retrieval operation.
    ActualErrorResponse:
      properties:
        detail:
          $ref: '#/components/schemas/ErrorResponse'
      type: object
      required:
        - detail
      title: ActualErrorResponse
    RetrieveMode:
      type: string
      enum:
        - fast
        - thinking
      title: RetrieveMode
    VectorStoreChunk:
      properties:
        chunk_uuid:
          type: string
          title: Chunk Uuid
          description: Unique identifier for this content chunk
          examples:
            - a1b2c3d4-e5f6-7890-1234-567890abcdef
          example: <chunk_uuid>
        source_id:
          type: string
          title: Source Id
          description: Unique identifier for the source document
          examples:
            - doc_12345
          example: <source_id>
        chunk_content:
          type: string
          title: Chunk Content
          description: The actual text content of this chunk
          examples:
            - This is a chunk of text from the source document.
          example: <chunk_content>
        source_type:
          type: string
          title: Source Type
          description: Type of the source document (file, webpage, etc.)
          default: ''
          examples:
            - file
          example: <source_type>
        source_upload_time:
          type: string
          title: Source Upload Time
          description: When the source document was originally uploaded
          default: ''
          examples:
            - '2023-10-27T10:00:00Z'
          example: <source_upload_time>
        source_title:
          type: string
          title: Source Title
          description: Title or name of the source document
          default: ''
          examples:
            - Project Phoenix Overview
          example: <source_title>
        source_last_updated_time:
          type: string
          title: Source Last Updated Time
          description: When the source document was last modified
          default: ''
          examples:
            - '2023-10-27T12:30:00Z'
          example: <source_last_updated_time>
        layout:
          anyOf:
            - type: string
            - type: 'null'
          title: Layout
          description: >-
            Layout of the chunk in original document. You will generally
            receive        a stringified dict with 2 keys, `offsets` and
            `page`(optional). Offsets will have       
            `document_level_start_index` and `page_level_start_index`(optional)
          examples:
            - '{"offsets": {"document_level_start_index": 1024}, "page": 2}'
        relevancy_score:
          anyOf:
            - type: number
            - type: 'null'
          title: Relevancy Score
          description: >-
            Score indicating how relevant this chunk is to your search
            query,         with higher values indicating better matches
        document_metadata:
          anyOf:
            - additionalProperties: true
              type: object
            - type: 'null'
          title: Document Metadata
          description: Metadata extracted from the source document
          examples:
            - author: John Doe
              category: Internal
        tenant_metadata:
          anyOf:
            - additionalProperties: true
              type: object
            - type: 'null'
          title: Tenant Metadata
          description: Custom metadata associated with your tenant
          examples:
            - department: R&D
        extra_context_ids:
          anyOf:
            - items:
                type: string
              type: array
            - type: 'null'
          title: Extra Context Ids
          description: >-
            IDs of related chunks providing extra context (from forceful
            relations). Only present in thinking mode when sources have forceful
            relations.
      type: object
      required:
        - chunk_uuid
        - source_id
        - chunk_content
      title: VectorStoreChunk
    SourceInfo:
      properties:
        id:
          type: string
          title: Id
          description: Unique identifier for the source
          example: HydraDoc1234
        title:
          type: string
          title: Title
          description: Short human-readable title for the source
          default: ''
          example: <title>
        type:
          type: string
          title: Type
          description: Category of the source (e.g., document, email, ticket)
          default: ''
          example: <type>
        description:
          type: string
          title: Description
          description: Long-form description providing additional context
          default: ''
          example: <description>
        url:
          type: string
          title: Url
          description: Canonical URL or reference link associated with the source
          default: ''
          example: <url>
        timestamp:
          type: string
          title: Timestamp
          description: Creation or last-updated timestamp in ISO-8601 format
          default: ''
          example: <timestamp>
        tenant_metadata:
          additionalProperties: true
          type: object
          title: Tenant Metadata
          description: Custom metadata associated with your tenant
        document_metadata:
          additionalProperties: true
          type: object
          title: Document Metadata
          description: Metadata extracted from the source document
      type: object
      required:
        - id
      title: SourceInfo
    GraphContext:
      properties:
        query_paths:
          items:
            $ref: '#/components/schemas/ScoredPathResponse'
          type: array
          title: Query Paths
          example: []
        chunk_relations:
          items:
            $ref: '#/components/schemas/ScoredPathResponse'
          type: array
          title: Chunk Relations
          example: []
        chunk_id_to_group_ids:
          additionalProperties:
            items:
              type: string
            type: array
          type: object
          title: Chunk Id To Group Ids
      type: object
      title: GraphContext
      description: >-
        Graph context containing query-based paths and chunk-based relation
        paths.
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
    ScoredPathResponse:
      properties:
        triplets:
          items:
            $ref: '#/components/schemas/PathTriplet'
          type: array
          title: Triplets
          example: []
        relevancy_score:
          type: number
          title: Relevancy Score
          example: 1
        combined_context:
          anyOf:
            - type: string
            - type: 'null'
          title: Combined Context
        group_id:
          anyOf:
            - type: string
            - type: 'null'
          title: Group Id
          description: Path group identifier (e.g., 'p_0') for chunk mapping
        source_chunk_ids:
          anyOf:
            - items:
                type: string
              type: array
              uniqueItems: true
            - type: 'null'
          title: Source Chunk Ids
          description: Input chunk IDs whose graph traversal produced this path
      type: object
      required:
        - triplets
        - relevancy_score
      title: ScoredPathResponse
    PathTriplet:
      properties:
        source:
          $ref: '#/components/schemas/Entity'
        relation:
          $ref: '#/components/schemas/RelationEvidence'
        target:
          $ref: '#/components/schemas/Entity'
      type: object
      required:
        - source
        - relation
        - target
      title: PathTriplet
    Entity:
      properties:
        name:
          type: string
          title: Name
          description: Normalized entity name
          example: <name>
        type:
          type: string
          title: Type
          description: PERSON, ORGANIZATION, PROJECT, PRODUCT, ERROR_CODE, etc.
          example: <type>
        namespace:
          type: string
          title: Namespace
          description: Context category like 'employees', 'projects'
          default: default
          example: <namespace>
        entity_id:
          type: string
          title: Entity Id
          description: Internal unique entity ID from graph database
          example: <entity_id>
        identifier:
          anyOf:
            - type: string
            - type: 'null'
          title: Identifier
          description: Unique ID like email, employee_id, URL
      type: object
      required:
        - name
        - type
        - entity_id
      title: Entity
    RelationEvidence:
      properties:
        canonical_predicate:
          type: string
          title: Canonical Predicate
          description: Relationship phrase like 'works for', 'reports to'
          example: <canonical_predicate>
        raw_predicate:
          type: string
          title: Raw Predicate
          description: Original predicate from text
          example: <raw_predicate>
        context:
          type: string
          title: Context
          description: >-
            Rich contextual description of the relationship with surrounding
            information, details about how/why/when, and any relevant
            background. Should be comprehensive enough to understand the
            relationship without referring back to source.
          example: <context>
        confidence:
          type: number
          maximum: 1
          minimum: 0
          title: Confidence
          description: Confidence score
          default: 0.8
          example: 1
        temporal_details:
          anyOf:
            - type: string
            - type: 'null'
          title: Temporal Details
          description: >-
            Temporal timing information extracted from text (e.g., 'last week',
            'in 2023', 'yesterday')
        timestamp:
          type: string
          format: date-time
          title: Timestamp
          description: Timestamp when this relation was introduced
          example: <timestamp>
        relationship_id:
          type: string
          title: Relationship Id
          description: Unique ID for this relationship from graph database
          example: <relationship_id>
        chunk_id:
          anyOf:
            - type: string
            - type: 'null'
          title: Chunk Id
          description: ID of the chunk this relation was extracted from
        source_entity_id:
          anyOf:
            - type: string
            - type: 'null'
          title: Source Entity Id
          description: The entity ID of source node
        target_entity_id:
          anyOf:
            - type: string
            - type: 'null'
          title: Target Entity Id
          description: The entity ID of target node
      type: object
      required:
        - canonical_predicate
        - raw_predicate
        - context
        - relationship_id
      title: RelationEvidence
      description: Single piece of evidence for a relationship between two entities
  securitySchemes:
    HTTPBearer:
      type: http
      scheme: bearer

````

Built with [Mintlify](https://mintlify.com).