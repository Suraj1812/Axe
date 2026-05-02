import "dotenv/config";
import { randomUUID } from "node:crypto";
import cors from "cors";
import express from "express";
import { ZodError } from "zod";
import { authRouter } from "./routes/auth";
import { projectRouter } from "./routes/project";

const app = express();
const port = Number(process.env.API_PORT ?? 4200);

app.disable("x-powered-by");
app.use(
  cors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json({ limit: "25mb" }));
app.use((request, response, next) => {
  const requestId = randomUUID();
  response.setHeader("x-request-id", requestId);
  response.setHeader("x-content-type-options", "nosniff");
  response.setHeader("referrer-policy", "no-referrer");
  response.setHeader("x-frame-options", "DENY");
  request.headers["x-request-id"] = requestId;
  next();
});

app.get("/health", (_request, response) => {
  response.json({
    ok: true,
    persistence: process.env.MONGODB_URI ? "mongodb" : "local",
  });
});

app.use(authRouter);
app.use(projectRouter);

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    void _next;
    const message =
      error instanceof ZodError
        ? "Invalid project payload"
        : error instanceof Error
          ? error.message
          : "Unexpected server error";
    const status = error instanceof ZodError ? 400 : 500;
    response.status(status).json({ message });
  },
);

app.listen(port, () => {
  console.log(`Axe API listening on http://localhost:${port}`);
});
