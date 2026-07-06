FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Keyless-by-default so a public demo needs no API keys and costs nothing per
# request. Override to openai / anthropic (with keys) for the real path.
ENV EMBED_PROVIDER=local
ENV LLM_PROVIDER=local
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
# Apply migrations, seed the reference corpus, then serve.
CMD ["npm", "run", "start:prod"]
