# Static SvelteKit build (produced by the CI workflow) served by nginx.
# No RUN steps, so the multi-arch (amd64 + arm64) build needs no emulation.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY build/ /usr/share/nginx/html/
EXPOSE 80
