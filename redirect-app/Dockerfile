# dm2find.com -> dm2find.ai
#
# INTERIM TARGET: sends to the site root, not /travel.
# /travel does not exist yet (dm2find.ai is still the Grav site on GoDaddy),
# and a 301 pointing at a 404 loses the link equity entirely rather than
# passing it on. Change the target to https://dm2find.ai/travel on the day the
# Astro site goes live -- one string, then redeploy.
#
# Self-contained, no line continuations: safe to paste with CRLF line endings.
# Base Directory must be "/" in Coolify's paste-a-Dockerfile mode.
# app.dm2find.com (white-label chatbotbuilder.ai) is NOT handled here.
FROM caddy:2-alpine
RUN printf ':80 {\n\t@health path /health\n\trespond @health "ok" 200\n\tredir https://dm2find.ai/ 301\n}\n' > /etc/caddy/Caddyfile && caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -qO- http://127.0.0.1:80/health || exit 1
EXPOSE 80
