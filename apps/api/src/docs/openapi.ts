const PORT = Number(process.env.PORT ?? 3000);

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "IJWI API",
    version: "0.0.1",
    description:
      "Backend API for the IJWI citizen reporting platform. Citizens submit reports (posts) with photos, GPS location and metadata. Authorities track and resolve them via the dashboard.",
  },
  servers: [
    { url: `http://localhost:${PORT}`, description: "Direct to API server" },
    { url: "/api", description: "Via frontend Vite proxy" },
  ],
  tags: [
    { name: "Auth", description: "Registration, login and sessions" },
    { name: "Reports", description: "Citizen reports / posts" },
    { name: "Emergency Numbers", description: "Public emergency contacts" },
    { name: "Dashboard", description: "Authority dashboard statistics" },
    { name: "System", description: "Health & diagnostics" },
  ],
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Create an account (email + password)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Jane Doe" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8, example: "s3cretpass" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Account created; returns access token + user",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "400": { description: "Validation error" },
          "409": { description: "Email already registered" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in (email + password)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Access token + user",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/auth/google": {
      post: {
        tags: ["Auth"],
        summary: "Log in with Google",
        description:
          "Send the Google ID token obtained on the client. The server verifies it and finds/creates the matching account.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["idToken"],
                properties: { idToken: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Access token + user",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "401": { description: "Invalid Google token" },
          "503": { description: "Google sign-in not configured" },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get the current user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "The authenticated user",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          "401": { description: "Authentication required" },
        },
      },
    },
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    uptime: { type: "number", example: 12.34 },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/reports": {
      get: {
        tags: ["Reports"],
        summary: "List all reports",
        description: "Returns reports sorted by newest first.",
        responses: {
          "200": {
            description: "Array of reports",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Report" },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Reports"],
        summary: "Create a report (with media)",
        description:
          "Creates a post and uploads its media (images/videos) in a single multipart request. Field name for files is `media` (up to 10, 50MB each). Location can be sent as a `location` JSON string or as separate `lat`/`lng`/`address` fields. Authentication is optional — if a Bearer token is sent, the report is linked to that user.",
        security: [{ bearerAuth: [] }, {}],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["description", "category"],
                properties: {
                  title: { type: "string", example: "Pothole on KG 5 Ave" },
                  description: {
                    type: "string",
                    example: "Large pothole near the junction",
                  },
                  category: { type: "string", example: "roads" },
                  location: {
                    type: "string",
                    description: "JSON string: {\"lat\":-1.95,\"lng\":30.06,\"address\":\"...\"}",
                  },
                  lat: { type: "number", example: -1.9501 },
                  lng: { type: "number", example: 30.0589 },
                  address: { type: "string" },
                  reporterName: { type: "string" },
                  reporterContact: { type: "string" },
                  media: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                    description: "Image and/or video files",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Report created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Report" },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/reports/mine": {
      get: {
        tags: ["Reports"],
        summary: "List the current user's reports",
        description: "Requires authentication. Used for the user's dashboard.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "The authenticated user's reports",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Report" },
                },
              },
            },
          },
          "401": { description: "Authentication required" },
        },
      },
    },
    "/reports/{id}": {
      get: {
        tags: ["Reports"],
        summary: "Get a report by id",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "The report",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Report" },
              },
            },
          },
          "404": {
            description: "Report not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      patch: {
        tags: ["Reports"],
        summary: "Edit a report (author only)",
        description:
          "Updates the report's own fields. Only the report's author may edit it.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", nullable: true },
                  description: { type: "string" },
                  category: { type: "string", nullable: true },
                  location: { $ref: "#/components/schemas/Location" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated report",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Report" },
              },
            },
          },
          "401": { description: "Authentication required" },
          "403": { description: "Not the report's author" },
          "404": { description: "Report not found" },
        },
      },
      delete: {
        tags: ["Reports"],
        summary: "Delete a report (author only)",
        description:
          "Deletes the report and its media (also removed from Cloudinary). Only the report's author may delete it.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "204": { description: "Deleted" },
          "401": { description: "Authentication required" },
          "403": { description: "Not the report's author" },
          "404": { description: "Report not found" },
        },
      },
    },
    "/reports/{id}/status": {
      patch: {
        tags: ["Reports"],
        summary: "Update report status",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { $ref: "#/components/schemas/ReportStatus" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated report",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Report" },
              },
            },
          },
          "400": {
            description: "Invalid status",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "404": {
            description: "Report not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/emergency-numbers": {
      get: {
        tags: ["Emergency Numbers"],
        summary: "List emergency numbers",
        responses: {
          "200": {
            description: "Array of emergency numbers",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/EmergencyNumber" },
                },
              },
            },
          },
        },
      },
    },
    "/dashboard/summary": {
      get: {
        tags: ["Dashboard"],
        summary: "Report statistics summary",
        responses: {
          "200": {
            description: "Aggregated stats",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DashboardSummary" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      ReportStatus: {
        type: "string",
        enum: ["pending", "in_progress", "resolved", "rejected"],
      },
      Location: {
        type: "object",
        properties: {
          lat: { type: "number", example: -1.9501 },
          lng: { type: "number", example: 30.0589 },
          address: { type: "string", example: "KG 5 Ave, Kigali" },
        },
      },
      Media: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          type: { type: "string", enum: ["image", "video"] },
          url: {
            type: "string",
            example: "https://res.cloudinary.com/demo/image/upload/ijwi/abc.jpg",
          },
          latitude: { type: "number", nullable: true, example: -1.9501 },
          longitude: { type: "number", nullable: true, example: 30.0589 },
          capturedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      Author: {
        type: "object",
        nullable: true,
        properties: {
          id: { type: "string", format: "uuid" },
          displayName: { type: "string", nullable: true },
          username: { type: "string", nullable: true },
        },
      },
      Report: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string", nullable: true, example: "Pothole on KG 5 Ave" },
          description: { type: "string", example: "Large pothole near the junction" },
          category: { type: "string", nullable: true, example: "roads" },
          status: { $ref: "#/components/schemas/ReportStatus" },
          location: { $ref: "#/components/schemas/Location" },
          capturedAt: { type: "string", format: "date-time", nullable: true },
          media: {
            type: "array",
            items: { $ref: "#/components/schemas/Media" },
          },
          photos: {
            type: "array",
            description: "Flat list of media URLs (backwards compatible).",
            items: { type: "string" },
          },
          author: { $ref: "#/components/schemas/Author" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      EmergencyNumber: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Ambulance / SAMU" },
          number: { type: "string", example: "912" },
          category: { type: "string", example: "medical" },
        },
      },
      DashboardSummary: {
        type: "object",
        properties: {
          total: { type: "integer", example: 42 },
          byStatus: {
            type: "object",
            additionalProperties: { type: "integer" },
            example: { pending: 10, in_progress: 5, resolved: 27 },
          },
          byCategory: {
            type: "object",
            additionalProperties: { type: "integer" },
            example: { roads: 20, water: 12, security: 10 },
          },
          recent: {
            type: "array",
            items: { $ref: "#/components/schemas/Report" },
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", nullable: true, format: "email" },
          displayName: { type: "string", nullable: true, example: "Jane Doe" },
          avatarUrl: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          token: {
            type: "string",
            description: "JWT access token (expires in 1h by default).",
          },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string", example: "Report not found" },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
} as const;
