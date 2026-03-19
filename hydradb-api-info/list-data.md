> ## Documentation Index
> Fetch the complete documentation index at: https://docs.hydradb.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Boolean Recall

> Perform a deterministic / full text search for exact matches within your indexed sources or memories

### Examples

<Tabs>
  <Tab title="API Request">
    ```bash  theme={null}
    curl --request POST \
      --url https://api.hydradb.com/recall/boolean_recall \
      --header 'Authorization: Bearer <token>' \
      --header 'Content-Type: application/json' \
      --data '{
      "query": "John Quotas AND Smith Quotas",
      "tenant_id": "tenant_1234",
      "sub_tenant_id": "sub_tenant_4567",
      "max_results": 25,
      "operator": "and"
    }'
    ```
  </Tab>

  <Tab title="TypeScript">
    ```ts  theme={null}
    const results = await client.recall.booleanRecall({
      query: "John Smith Jake",
      tenantId: "tenant_1234",
      subTenantId: "sub_tenant_4567",
      maxResults: 25,
      operator: "and"
    });
    ```
  </Tab>

  <Tab title="Python (Sync)">
    ```python  theme={null}
    # Async usage is similar, just use async_client and await
    results = client.recall.boolean_recall(
        query="John Smith Jake",
        tenant_id="tenant_1234",
        sub_tenant_id="sub_tenant_4567",
        max_results=25,
        operator="and"
    )
    ```
  </Tab>
</Tabs>

### Boolean Operators

#### OR Operator

* **Usage**: `"operator": "or"`
* **Behavior**: At least one search term must be present in the chunk for it to match
* **Best for**: Broad searches to find documents containing any of the specified terms
* **Example**: Searching for "python javascript react" with OR will return chunks containing any of these programming languages

#### AND Operator

* **Usage**: `"operator": "and"`
* **Behavior**: All search terms must be present in the chunk for it to match
* **Best for**: Precise searches where you need all keywords to be present
* **Example**: Searching for "machine learning algorithms" with AND will only return chunks containing "machine" AND "learning" AND "algorithms"

#### PHRASE Operator

* **Usage**: `"operator": "phrase"`
* **Behavior**: The exact phrase must appear in the chunk in the given word order
* **Best for**: Finding specific terminology or multi-word expressions
* **Example**: Searching for "mechanical engineer" with PHRASE will only return chunks where "mechanical engineer" appears as a contiguous phrase

### Optimization Tips

#### For Better Precision

* Use the **AND operator** when you need all terms to be present
* Use the **PHRASE operator** when word order matters (e.g. "machine learning" vs "learning machine")
* Use **specific terminology** rather than generic terms

#### For Broader Results

* Use the **OR operator** to find documents with any of the search terms
* Try **synonyms and related terms** to expand your search

### Response

Returns an array of relevant context

### Operator Parameter

The `operator` parameter controls how the search terms are combined:

* **OR operator** (default): At least one token must be present in the document
* **AND operator**: All tokens must be present in the document
* **PHRASE operator**: The exact phrase must appear as-is in the document

### Max Results Parameter

The `max_results` parameter controls the maximum number of results returned:

* Must be between 1 and 1000
* Defaults to the system limit if not specified

### Use Cases

* **Precise keyword matching**: Use AND operator when you need all search terms to be present
* **Broad search**: Use OR operator to find documents containing any of the search terms
* **Exact phrase matching**: Use PHRASE operator for finding specific multi-word expressions in your documents


## OpenAPI

````yaml POST /recall/boolean_recall
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
  /recall/boolean_recall:
    post:
      tags:
        - Search
      summary: Full-text search
      operationId: full_text_search_recall_boolean_recall_post
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/FullTextSearchRequest'
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
    FullTextSearchRequest:
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
          description: Search terms to find in your content
          example: John Smith Jake
        operator:
          $ref: '#/components/schemas/BM25OperatorType'
          description: >-
            How to combine search terms: 'or' (any term matches), 'and' (all
            terms must match), 'phrase' (exact phrase must appear)
          default: or
          example: and
        max_results:
          type: integer
          title: Max Results
          description: Maximum number of results to return
          default: 10
          example: 1
        search_mode:
          $ref: '#/components/schemas/SearchMode'
          description: >-
            What to search: 'sources' for documents or 'memories' for user
            memories
          default: sources
      type: object
      required:
        - tenant_id
        - query
      title: FullTextSearchRequest
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
    BM25OperatorType:
      type: string
      enum:
        - or
        - and
        - phrase
      title: BM25OperatorType
    SearchMode:
      type: string
      enum:
        - sources
        - memories
      title: SearchMode
      description: Search mode to specify what type of content to search.
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