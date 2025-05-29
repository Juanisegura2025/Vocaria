```yaml
openapi: 3.1.0
info:
  title: Vocaria Public API
  version: 1.0.0
  description: API for Vocaria voice-first virtual showing assistant
  contact:
    email: dev@vocaria.app
servers:
  - url: https://api.vocaria.app/v1
    description: Production server
  - url: https://api-staging.vocaria.app/v1
    description: Staging server

security:
  - bearerAuth: []
  - widgetAuth: []

paths:
  /leads:
    post:
      summary: Create a lead
      description: Creates a new lead when a visitor provides contact information
      security:
        - widgetAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LeadInput'
      responses:
        '201':
          description: Lead created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Lead'
        '400':
          description: Invalid input data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '401':
          description: Unauthorized - invalid widget token
        '429':
          description: Rate limit exceeded

  /usage/{tourId}:
    get:
      summary: Get usage stats for a tour
      description: Retrieves TTS minutes and message count for a specific tour
      security:
        - bearerAuth: []
      parameters:
        - in: path
          name: tourId
          required: true
          schema:
            type: string
            format: uuid
          description: Unique identifier for the tour
        - in: query
          name: period
          schema:
            type: string
            enum: [daily, weekly, monthly]
            default: monthly
          description: Time period for usage stats
      responses:
        '200':
          description: Usage stats retrieved successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Usage'
        '401':
          description: Unauthorized
        '404':
          description: Tour not found

  /tours:
    get:
      summary: List user's tours
      security:
        - bearerAuth: []
      parameters:
        - in: query
          name: limit
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
        - in: query
          name: offset
          schema:
            type: integer
            minimum: 0
            default: 0
      responses:
        '200':
          description: Tours retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  tours:
                    type: array
                    items:
                      $ref: '#/components/schemas/Tour'
                  total:
                    type: integer
                  limit:
                    type: integer
                  offset:
                    type: integer

    post:
      summary: Create a new tour
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TourInput'
      responses:
        '201':
          description: Tour created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Tour'

  /tours/{tourId}/widget-token:
    post:
      summary: Generate widget authentication token
      description: Creates a JWT token for widget authentication
      security:
        - bearerAuth: []
      parameters:
        - in: path
          name: tourId
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Token generated successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  token:
                    type: string
                    description: JWT token for widget authentication
                  expiresAt:
                    type: string
                    format: date-time

  /health:
    get:
      summary: Health check endpoint
      security: []
      responses:
        '200':
          description: Service is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: "healthy"
                  timestamp:
                    type: string
                    format: date-time
                  version:
                    type: string

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: Admin panel authentication using JWT tokens
    widgetAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: Widget authentication using tour-specific JWT tokens

  schemas:
    LeadInput:
      type: object
      properties:
        email:
          type: string
          format: email
          description: Lead's email address
        phone:
          type: string
          pattern: '^[\+]?[1-9][\d]{0,15}$'
          description: Lead's phone number in international format
        tourId:
          type: string
          format: uuid
          description: UUID of the tour where lead was captured
        agentId:
          type: string
          description: ElevenLabs agent ID
        roomContext:
          type: object
          properties:
            roomName:
              type: string
            areaM2:
              type: number
          description: Context about the room where lead was captured
        metadata:
          type: object
          additionalProperties: true
          description: Additional lead metadata
      required: [email, tourId, agentId]

    Lead:
      allOf:
        - $ref: '#/components/schemas/LeadInput'
        - type: object
          properties:
            id:
              type: string
              format: uuid
            createdAt:
              type: string
              format: date-time
            updatedAt:
              type: string
              format: date-time

    TourInput:
      type: object
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 100
        matterportModelId:
          type: string
          description: Matterport model ID
        agentObjective:
          type: string
          description: Agent's conversation objective
          default: "Schedule a visit"
        isActive:
          type: boolean
          default: true
      required: [name, matterportModelId]

    Tour:
      allOf:
        - $ref: '#/components/schemas/TourInput'
        - type: object
          properties:
            id:
              type: string
              format: uuid
            ownerId:
              type: string
              format: uuid
            agentId:
              type: string
              description: ElevenLabs agent ID
            createdAt:
              type: string
              format: date-time
            updatedAt:
              type: string
              format: date-time

    Usage:
      type: object
      properties:
        tourId:
          type: string
          format: uuid
        period:
          type: string
          enum: [daily, weekly, monthly]
        minutesTTS:
          type: number
          minimum: 0
          description: Total TTS minutes consumed
        messages:
          type: integer
          minimum: 0
          description: Total messages processed
        leads:
          type: integer
          minimum: 0
          description: Total leads captured
        windowStart:
          type: string
          format: date-time
        windowEnd:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    Error:
      type: object
      properties:
        error:
          type: string
          description: Error code
        message:
          type: string
          description: Human-readable error message
        details:
          type: object
          additionalProperties: true
          description: Additional error details
      required: [error, message]
```