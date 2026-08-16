# dm2find.com -> dm2find.ai/travel
#
# Every path lands on /travel, not on the matching path. Deliberate: the old
# Grav URLs (/en/connect/whatsapp, /en/wellness, ...) have no equivalent on the
# new site, so appending {uri} would 301 straight into a 404 and throw the link
# equity away. One landing page that always resolves is worth more.
#
# Do NOT change this to "redir https://dm2find.ai/travel{uri} 301" -- that was
# the earlier bug: Caddy appends the source path, so /en/about became
# /travel/en/about, which does not exist.
#
# Self-contained, no line continuations: safe to paste with CRLF line endings.
# Base Directory must be "/" in Coolify's paste-a-Dockerfile mode.
# /health returns 200 because Coolify's healthcheck expects 200 on a GET and a
# bare redirect answers 301, which reads as "Exited".
# app.dm2find.com (white-label chatbotbuilder.ai) is NOT handled here and must
# keep its own DNS record pointing where it already does.
FROM caddy:2-alpine
RUN printf ':80 {\n\t@health path /health\n\trespond @health "ok" 200\n\tredir https://dm2find.ai/travel 301\n}\n' > /etc/caddy/Caddyfile && caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -qO- http://127.0.0.1:80/health || exit 1
EXPOSE 80
