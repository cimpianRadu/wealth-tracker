export const OAUTH_STATE_COOKIE = 'wt_oauth_state';

export function appUrl(request: Request): string {
  return process.env.APP_URL?.replace(/\/$/, '') || new URL(request.url).origin;
}
