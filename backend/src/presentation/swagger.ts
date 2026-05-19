import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Express } from "express";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Dev Studio API Documentation",
      version: "1.0.0",
      description:
        "Comprehensive API documentation for Dev Studio backend and frontend integration.",
      contact: {
        name: "Dev Studio Team",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "ds_token",
          description: "Cookie-based session token for secure endpoints",
        },
      },
    },
  },
  // Paths to files containing OpenAPI annotations
  apis: [
    "./src/presentation/swagger-docs.js",
    "./src/presentation/swagger-docs.ts",
    "./src/presentation/routes/api/*.js",
    "./src/presentation/routes/api/*.ts",
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express) {
  // Serve Swagger UI documentation
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Redirect common alternative documentation endpoints for a smoother DX
  app.get("/swagger", (_req, res) => res.redirect("/api-docs"));
  app.get("/docs", (_req, res) => res.redirect("/api-docs"));

  // Provide raw swagger.json endpoint
  app.get("/swagger.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
}
