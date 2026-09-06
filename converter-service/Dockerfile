FROM node:20-slim

# Instala o LibreOffice (Calc) e dependências mínimas para rodar headless
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-calc \
    libreoffice-core \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Aponta o servidor para o binário instalado via apt
ENV SOFFICE_BIN=soffice

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
