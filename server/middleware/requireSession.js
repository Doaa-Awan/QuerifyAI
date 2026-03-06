// Middleware: require an active DB session before allowing access to protected endpoints.
// A session is considered active when req.session.connected === true,
// which is set by POST /db/connect or POST /db/connect-demo on success.

export function requireSession(req, res, next) {
  if (req.session?.connected === true) {
    return next();
  }
  res.status(401).json({ error: 'No active database connection. Please connect first.' });
}
