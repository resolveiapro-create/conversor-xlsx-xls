# R2 PRO Mobile

Aplicativo React Native/Expo para preencher o Relatório de Aceite de Ativação de Dados, registrar fotos em campo e gerar o XLSX oficial diretamente no celular.

## O que já está implementado

- Sete etapas equivalentes ao R1 PRO original, em um aplicativo independente chamado R2 PRO.
- Captura pela câmera ou seleção da galeria.
- Nove fotos gerais, seis equipamentos e uma imagem de RVO.
- Rascunho automático e funcionamento offline.
- Materiais e testes de voz conforme a planilha fornecida.
- Geração local do XLSX com fotos incorporadas.
- Leitura local da OS em PDF e preenchimento automático dos principais campos.
- Login com usuário (e-mail) e senha, com cadastro aberto para a equipe (Firebase Authentication, gratuito).
- Compartilhamento pelo WhatsApp, Outlook, Drive ou outro aplicativo instalado.
- APK de teste e AAB de produção configurados no `eas.json`.

## Requisitos

- Node.js 22.13 ou superior.
- Uma conta gratuita no Expo para usar o EAS Build.
- Android Studio é opcional; não é necessário para compilar na nuvem.

## Instalação no Windows

Abra o terminal na pasta do projeto e execute:

```powershell
npm install
npx expo install --fix
npm run typecheck
npm run verify:xlsx
```

O comando `expo install --fix` alinha todas as dependências à versão instalada do Expo SDK.

## Executar durante o desenvolvimento

```powershell
npm start
```

Para SDK 57, prefira um development build ou emulador Android. A versão do Expo Go disponível na loja pode estar em um SDK anterior.

## Gerar APK instalável

```powershell
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

O perfil `preview` gera um APK para instalação direta. O perfil `production` gera o AAB da Google Play:

```powershell
npx eas-cli@latest build --platform android --profile production
```

## Identificador Android

O R2 PRO usa o identificador exclusivo `app.lovable.r2pro.mobile`. Por isso, pode ser instalado ao lado do R1 PRO no mesmo aparelho, sem desinstalar nem substituir o aplicativo original.

## Login (usuário e senha)

O app pede login antes de liberar o formulário. É preciso configurar um projeto
gratuito no Firebase uma única vez para isso funcionar — o passo a passo completo
está em `docs/AUTENTICACAO.md`. Depois de configurado, qualquer técnico pode criar
a própria conta pelo próprio app, tocando em "Criar conta".

## Importação da OS em PDF

O aplicativo reconhece no próprio aparelho o modelo de Relatório de Agendamento fornecido e preenche cliente, item, endereço, circuito, cidade, velocidade, contato, telefone, designação, tecnologia, atividade, data e validador. O PDF não é enviado para terceiros. Em alguns aparelhos Android, o componente de reconhecimento pode precisar de internet na primeira utilização para preparar o modelo de leitura.

Opcionalmente, pode ser configurado um serviço alternativo em:

```env
EXPO_PUBLIC_OS_PARSER_URL=https://seu-endpoint.example.com/parse-os
```

Sem essa variável, a leitura local e o preenchimento manual continuam disponíveis. Nenhum PDF é enviado para terceiros por padrão.

## Estrutura principal

```text
App.tsx
assets/templates/relatorio_aceite.xlsx
src/components/
src/context/ReportContext.tsx
src/screens/
src/services/xlsxExporter.ts
src/services/reportFileService.ts
```

O detalhamento das células e posições utilizadas está em `docs/EXPORT_MAPPING.md`.
