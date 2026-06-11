/** Debug/diagnostic routes — disabled in production unless explicitly allowed. */
export function isDebugRouteAllowed(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEBUG_ROUTES === 'true'
}

/** Public self-registration — off in production by default. */
export function isPublicRegistrationAllowed(): boolean {
  if (process.env.ALLOW_PUBLIC_REGISTRATION === 'true') return true
  if (process.env.ALLOW_PUBLIC_REGISTRATION === 'false') return false
  return process.env.NODE_ENV !== 'production'
}
