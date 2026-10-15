# The mock API for demos and compose. It uses the zero-dependency implementation, so the image
# needs no npm install; server/parity.test.ts keeps it in line with the TypeScript mock.
FROM node:22-alpine
WORKDIR /app
COPY mock/server.mjs mock/fixtures.mjs ./mock/
ENV PORT=4010 \
    MOCK_LATENCY_MS=150
EXPOSE 4010
USER node
CMD ["node", "mock/server.mjs"]
