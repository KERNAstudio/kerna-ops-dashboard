// Env vars read at module-load time by src/lib/crypto.ts and src/lib/auth/client-session.ts —
// set before any test file (and therefore those modules) are imported.
process.env.CREDENTIAL_ENCRYPTION_KEY ??= "test-only-credential-key-not-for-production-use";
process.env.CLIENT_SESSION_SECRET ??= "test-only-session-secret-not-for-production-use";
