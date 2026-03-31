import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled error");

  let message = "Internal server error";
  if (process.env.NODE_ENV === "development") {
    const cause = (err as { cause?: unknown }).cause;
    const causeMsg = cause instanceof Error ? ` — caused by: ${cause.message}` : "";
    message = err.message + causeMsg;

    const pgCode = (cause as { code?: string } | undefined)?.code;
    if (pgCode === "42P01") {
      message =
        "Database tables are missing. Run `pnpm run push` in the project root to create them, then restart the API server.";
    }
  }

  res.status(500).json({ error: message });
});

export default app;
