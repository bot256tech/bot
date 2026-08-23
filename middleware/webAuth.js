/**
 * AGRICHAIN 360 — Web (session) authentication middleware
 * Guards server-rendered pages. API routes use JWT (authMiddleware).
 */

/**
 * Require a logged-in web session.
 * Optionally restrict to specific roles.
 * Usage: router.get('/farmer-dashboard', requireWebAuth('FARMER'), handler)
 */
function requireWebAuth(roles = []) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      const redirect = encodeURIComponent(req.originalUrl || '/');
      return res.redirect(`/login?redirect=${redirect}`);
    }

    if (roles && roles.length > 0) {
      const userRole = (req.session.user.role || '').toUpperCase();
      const allowed = roles.map((r) => String(r).toUpperCase());
      if (!allowed.includes(userRole)) {
        return res.status(403).render('layout', {
          title: 'Access Denied — AGRICHAIN 360',
          page: 'error',
          data: {
            error: 'Your account does not have access to this page.',
            detail: `This area requires role: ${allowed.join(' or ')}. You are signed in as ${userRole}.`
          },
          body: 'errorPage'
        });
      }
    }

    next();
  };
}

/** Attach res.locals.user for views (does not block) */
function attachUser(req, res, next) {
  res.locals.user = req.session && req.session.user ? req.session.user : null;
  next();
}

module.exports = { requireWebAuth, attachUser };
