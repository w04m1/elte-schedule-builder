import helmet from "helmet";

export function createSecurityHeaders({
  enableHsts = process.env.NODE_ENV === "production",
} = {}) {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "data:"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        imgSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        upgradeInsecureRequests: enableHsts ? [] : null,
      },
    },
    referrerPolicy: { policy: "no-referrer" },
    strictTransportSecurity: enableHsts
      ? { maxAge: 31536000, includeSubDomains: false }
      : false,
    xFrameOptions: { action: "deny" },
  });
}
