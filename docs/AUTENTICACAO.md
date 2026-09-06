# Login com usuário e senha (grátis)

O R2 PRO agora tem uma tela de **login e cadastro** antes de liberar o formulário.
Cada técnico cria a própria conta com e-mail e senha. Isso usa o **Firebase
Authentication**, que tem um plano gratuito (Spark) mais do que suficiente para uma
equipe de técnicos — sem custo, sem cartão de crédito.

Sem configurar o Firebase, o app mostra a tela de login com um aviso e não deixa
entrar. Depois de configurar (uma vez só), qualquer pessoa pode criar a própria
conta pelo próprio app.

## Passo a passo (uma vez só, leva uns 10 minutos)

1. **Crie o projeto Firebase**
   - Acesse https://console.firebase.google.com
   - Clique em "Adicionar projeto", dê um nome (ex: `r2-pro-mobile`) e conclua a criação.
   - Não é necessário ativar o Google Analytics.

2. **Ative o login por e-mail/senha**
   - No menu lateral, vá em **Build > Authentication**.
   - Clique em "Vamos começar" (Get started).
   - Na aba "Sign-in method", clique em **E-mail/senha**, ative e salve.

3. **Registre um app da Web dentro do projeto Firebase**
   - Ainda no console, clique no ícone de engrenagem > **Configurações do projeto**.
   - Em "Seus aplicativos", clique no ícone `</>` (Web) para registrar um novo app.
   - Dê um apelido (ex: `r2-pro-mobile-app`) e clique em registrar. Não precisa
     configurar o Firebase Hosting.
   - O Firebase vai mostrar um bloco `firebaseConfig` parecido com este:

     ```js
     const firebaseConfig = {
       apiKey: "AIza...",
       authDomain: "r2-pro-mobile.firebaseapp.com",
       projectId: "r2-pro-mobile",
       storageBucket: "r2-pro-mobile.appspot.com",
       messagingSenderId: "123456789",
       appId: "1:123456789:web:abcdef123456",
     };
     ```

4. **Cole esses valores no arquivo `.env`**
   - Copie `.env.example` para um novo arquivo chamado `.env` na raiz do projeto
     (se ainda não existir).
   - Preencha cada linha com o valor correspondente do `firebaseConfig`:

     ```env
     EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
     EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=r2-pro-mobile.firebaseapp.com
     EXPO_PUBLIC_FIREBASE_PROJECT_ID=r2-pro-mobile
     EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=r2-pro-mobile.appspot.com
     EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
     EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
     ```

5. **Gere um novo build (ou rode em desenvolvimento)**
   ```powershell
   npm install
   npx eas-cli@latest build --platform android --profile preview
   ```
   Como as variáveis `EXPO_PUBLIC_*` são lidas na hora de compilar, é preciso gerar
   um novo APK depois de criar o `.env`. Um APK antigo não vai ter a chave configurada.

## Como funciona no app

- Na primeira vez, o técnico toca em **"Criar conta"**, preenche nome, e-mail e
  senha (mínimo 6 caracteres) e já entra direto.
- Nas próximas vezes, ele usa **"Entrar"** com o mesmo e-mail e senha.
- Existe o link **"Esqueci minha senha"**, que envia um e-mail de redefinição
  pelo próprio Firebase.
- O botão **"Sair"** no topo do app encerra a sessão.
- O login fica salvo no aparelho: o técnico não precisa entrar de novo toda vez
  que abrir o app.

## Gerenciando os técnicos cadastrados

No console do Firebase, em **Authentication > Users**, você vê a lista de todos os
e-mails cadastrados, pode desativar ou excluir algum acesso manualmente, a
qualquer momento, sem precisar mexer no app.

## Sobre o custo

O plano gratuito do Firebase Authentication permite um número bem alto de
usuários cadastrados e de logins por mês, sem cobrança — mais do que suficiente
para uma equipe de técnicos de campo. Não é necessário informar cartão de
crédito para usar esse recurso.
