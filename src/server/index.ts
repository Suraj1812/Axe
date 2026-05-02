import "dotenv/config";
import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth";
import { projectRouter } from "./routes/project";

const app = express();
const port = Number(process.env.API_PORT ?? 4200);

app.use(
  cors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json({ limit: "25mb" }));

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
      error instanceof Error ? error.message : "Unexpected server error";
    response.status(500).json({ message });
  },
);

app.listen(port, () => {
  console.log(`Axe API listening on http://localhost:${port}`);
});
