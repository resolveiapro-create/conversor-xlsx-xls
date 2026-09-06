FROM node:20-bookworm-slim

# LibreOffice headless (motor real da conversão) + fontes básicas para
# renderizar corretamente textos acentuados (pt-BR) nos arquivos .xls
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-calc \
    libreoffice-core \
    fonts-dejavu \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/server.cjs"]
