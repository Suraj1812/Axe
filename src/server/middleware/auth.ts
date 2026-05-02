import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string;
  };
};

export function getJwtSecret() {
  return process.env.JWT_SECRET ?? "axe-local-development-secret";
}

export function signToken(user: { id: string; email: string }) {
  return jwt.sign({ sub: user.id, email: user.email }, getJwtSecret(), {
    expiresIn: "7d",
  });
}

export function optionalAuth(
  request: AuthenticatedRequest,
  _response: Response,
  next: NextFunction,
) {
  const token = request.header("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as {
      sub: string;
      email: string;
    };
    request.user = {
      id: payload.sub,
      email: payload.email,
    };
  } catch {
    request.user = undefined;
  }

  next();
}
