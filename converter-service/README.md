# Conversor .xlsx → .xls (R2 PRO)

O `xlsxExporter.ts` continua gerando o `.xlsx` normalmente, com fotos e layout
intactos. O serviço abaixo pega esse `.xlsx` e devolve um `.xls` (formato
binário antigo, exigido pela empresa), preservando as imagens inseridas.

O LibreOffice não roda dentro do app React Native/Expo (não existe binário
para Android/iOS), então a conversão acontece em um pequeno servidor Node
separado (`converter-service/`), chamado pelo app via HTTP.

## 1. Instalar o LibreOffice

**Windows**
1. Baixe em https://www.libreoffice.org/download/download/ e instale normalmente.
2. Anote o caminho do executável, algo como:
   `C:\Program Files\LibreOffice\program\soffice.exe`

**macOS**
```bash
brew install --cask libreoffice
```

**Linux (Ubuntu/Debian)**
```bash
sudo apt update && sudo apt install -y libreoffice
```

## 2. Rodar o conversor localmente (VSCode)

```bash
cd converter-service
npm install
```

No Windows, defina o caminho do binário antes de subir o servidor
(no PowerShell do terminal integrado do VSCode):
```powershell
$env:SOFFICE_BIN="C:\Program Files\LibreOffice\program\soffice.exe"
npm start
```

No Linux/Mac, se `soffice` já estiver no PATH, basta:
```bash
npm start
```

Você deve ver:
```
Conversor .xlsx -> .xls rodando em http://0.0.0.0:3001
```

### Testar rapidamente com curl
```bash
curl -X POST http://localhost:3001/convert \
  -H "Content-Type: application/json" \
  -d "{\"base64\": \"$(base64 -w0 caminho/para/teste.xlsx)\"}" \
  | jq -r .base64 | base64 -d > teste_convertido.xls
```
Abra `teste_convertido.xls` no Excel e confira se as fotos aparecem certinho.

## 3. Apontar o app para o conversor

Em `app/services/reportFileService.ts`, ajuste:
```ts
const CONVERTER_URL = 'http://SEU_HOST:3001/convert';
```

- **Testando no emulador Android**: use `http://10.0.2.2:3001/convert`.
- **Testando em celular físico na mesma rede Wi-Fi**: use o IP local da sua
  máquina, ex. `http://192.168.0.15:3001/convert` (rode `ipconfig`/`ifconfig`
  para descobrir).
- **Testando fora da rede local**: exponha o servidor com o ngrok
  (`ngrok http 3001`) e use a URL https gerada.

## 4. Deploy em produção — Render (Docker)

O `converter-service` já vem com `Dockerfile` pronto (Node 20 + LibreOffice
Calc instalado via `apt-get`). Passo a passo:

### 4.1. Subir o código pro GitHub
1. Se `converter-service/` ainda não estiver em um repositório Git, crie um
   (pode ser um repo próprio só para ele, ou uma pasta dentro do
   monorepo do R2 PRO — o Render permite apontar para um subdiretório).
2. Dê `git add`, `commit`, `push` para o GitHub.

### 4.2. Criar o Web Service no Render
1. Acesse https://dashboard.render.com e faça login.
2. Clique em **New +** → **Web Service**.
3. Conecte sua conta do GitHub e selecione o repositório.
4. Preencha:
   - **Name**: `r2pro-xls-converter` (ou o nome que preferir).
   - **Root Directory**: `converter-service` (se o `Dockerfile` estiver
     dentro dessa pasta do repo; deixe em branco se o repo for só o
     conversor).
   - **Runtime**: **Docker** (o Render detecta o `Dockerfile`
     automaticamente).
   - **Instance Type**: escolha pelo menos **Starter** (512 MB). O plano
     **Free** costuma não ter RAM suficiente para o LibreOffice abrir sem
     travar/reiniciar.
5. Em **Health Check Path**, informe `/health` (já existe essa rota no
   `server.js`).
6. Não é necessário configurar nenhuma variável de ambiente obrigatória —
   o Render já injeta `PORT` automaticamente e o `server.js` respeita isso.
7. Clique em **Create Web Service**. O Render vai buildar a imagem Docker
   (a instalação do LibreOffice deixa o build um pouco mais lento, é
   normal levar alguns minutos na primeira vez) e subir o container.

> Alternativa: se preferir infraestrutura como código, use o
> `converter-service/render.yaml` incluso — no dashboard do Render, escolha
> **New +** → **Blueprint** e aponte para o repositório; ele lê o
> `render.yaml` e cria o serviço com as mesmas configurações acima.

### 4.3. Pegar a URL e testar
1. Quando o deploy terminar, o Render mostra uma URL do tipo
   `https://r2pro-xls-converter.onrender.com`.
2. Teste com curl:
   ```bash
   curl -X POST https://r2pro-xls-converter.onrender.com/convert \
     -H "Content-Type: application/json" \
     -d "{\"base64\": \"$(base64 -w0 caminho/para/teste.xlsx)\"}" \
     | jq -r .base64 | base64 -d > teste_convertido.xls
   ```
3. Abra o `.xls` gerado e confirme que as fotos aparecem certinho.

### 4.4. Apontar o app pra URL do Render
Em `app/services/reportFileService.ts`, troque:
```ts
const CONVERTER_URL = 'https://r2pro-xls-converter.onrender.com/convert';
```

### 4.5. Atenção ao "cold start"
No plano **Starter** (e principalmente no Free), o Render "dorme" o serviço
depois de um período sem requisições. A primeira chamada depois disso pode
levar 30–60s para responder enquanto o container acorda. Duas formas de
lidar com isso:
- Aumentar o timeout do `fetch` no app (e mostrar um loading claro pro
  técnico: "gerando planilha, pode levar até 1 minuto").
- Contratar um plano que mantenha a instância sempre ativa, ou configurar
  um "ping" periódico (ex. um cron externo batendo em `/health` a cada
  alguns minutos) para evitar o serviço dormir.

## Arquivos alterados neste pacote

- `converter-service/server.js` — servidor novo, roda a conversão.
- `converter-service/package.json` — dependências do servidor.
- `converter-service/Dockerfile` — imagem Docker (Node + LibreOffice) para
  deploy no Render.
- `converter-service/.dockerignore` — evita copiar `node_modules`/`.git`
  no build da imagem.
- `converter-service/render.yaml` — blueprint opcional para deploy
  automático no Render (infra as code).
- `app/services/reportFileService.ts` — chama o conversor antes de gravar
  e compartilhar o arquivo; MIME/UTI trocados para `.xls`.
- `app/utils/filename.ts` — extensão do arquivo gerado trocada para `.xls`.
- `xlsxExporter.ts` — **sem alterações**, continua gerando o `.xlsx` como
  hoje (fotos, layout, lógica de mapeamento de células).
