import { Router } from "express";
import bcrypt from "bcryptjs";
import { createUser, findUserByEmail } from "../services/dataStore";
import { signToken } from "../middleware/auth";

export const authRouter = Router();

function validateCredentials(email: unknown, password: unknown) {
  if (typeof email !== "string" || !email.includes("@")) {
    return "A valid email is required";
  }

  if (typeof password !== "string" || password.length < 6) {
    return "Password must be at least 6 characters";
  }

  return null;
}

authRouter.post("/auth/register", async (request, response, next) => {
  try {
    const { email, password } = request.body as {
      email?: string;
      password?: string;
    };
    const validationError = validateCredentials(email, password);

    if (validationError) {
      response.status(400).json({ message: validationError });
      return;
    }

    const safeEmail = email as string;
    const safePassword = password as string;
    const existing = await findUserByEmail(safeEmail);

    if (existing) {
      response.status(409).json({ message: "Account already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(safePassword, 12);
    const user = await createUser(safeEmail, passwordHash);
    const token = signToken({ id: user.id, email: user.email });

    response.status(201).json({ token, email: user.email });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/auth/login", async (request, response, next) => {
  try {
    const { email, password } = request.body as {
      email?: string;
      password?: string;
    };
    const validationError = validateCredentials(email, password);

    if (validationError) {
      response.status(400).json({ message: validationError });
      return;
    }

    const safeEmail = email as string;
    const safePassword = password as string;
    const user = await findUserByEmail(safeEmail);

    if (!user) {
      response.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const passwordMatches = await bcrypt.compare(safePassword, user.passwordHash);

    if (!passwordMatches) {
      response.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = signToken({ id: user.id, email: user.email });
    response.json({ token, email: user.email });
  } catch (error) {
    next(error);
  }
});
