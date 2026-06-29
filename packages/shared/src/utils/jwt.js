import jwt from "jsonwebtoken";

export function createJwtUtils({ jwtSecret, jwtExpiresIn = "7d" }) {
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is required for JWT utilities");
  }

  return {
    signJwt(user) {
      return jwt.sign(
        {
          sub: user._id?.toString?.() || user.id,
          email: user.email,
          role: user.role
        },
        jwtSecret,
        { expiresIn: jwtExpiresIn }
      );
    },
    verifyJwt(token) {
      return jwt.verify(token, jwtSecret);
    }
  };
}
