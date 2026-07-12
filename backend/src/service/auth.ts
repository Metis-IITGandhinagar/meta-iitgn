import JWT from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const key = process.env.JWT_SECRET;

type PrismaTokenUser = {
  user_id: number;
  name: string;
  email: string;
};

function isPrismaTokenUser(payload: unknown): payload is PrismaTokenUser {
  return (
    typeof payload === "object" && payload !== null && "user_id" in payload
  );
}

function createToken(user: PrismaTokenUser) {
  const payload = {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
  };

  if (!key) {
    throw new Error("JWT_SECRET is not defined");
  }

  const TOKEN = JWT.sign(payload, key, {
    expiresIn: "7d",
  });
  return TOKEN;
}

function validateToken(token: string) {
  try {
    if (!key) {
      return null;
    }

    const decoded = JWT.verify(token, key);
    return isPrismaTokenUser(decoded) ? decoded : null;
  } catch (err) {
    return null;
  }
}

export { createToken, validateToken };
