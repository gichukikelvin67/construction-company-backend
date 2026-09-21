import rateLimit from "express-rate-limit";

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes

  limit: 10, // maximum 10 requests IP

  standardHeaders: "draft-8",

  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many login attempts. Please try again later.",
  },
});

export const registerRateLimiter=rateLimit({
  windowMs: 15 * 60 * 1000,
  limit:5,
  standardHeaders:"draft-8",
  legacyHeaders:false,
  message:{
    success:false,
    message:"Too many registration attempts.Please try again later.",
  },
})

export const passwordResetRateLimiter=rateLimit({
  windowMs:15 * 60 * 1000,
  limit:10,
  standardHeaders:"draft-8",
  legacyHeaders:false,
  message:{
    success:false,
    message:"Too many password reset requests.Please try again later.",
  },
})
