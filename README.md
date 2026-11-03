# Juris Clara — Case Compass

Aplicação web para consulta de informações jurídicas, organização de casos e ferramentas
auxiliares. O projeto foi criado com Lovable e usa TanStack Start, React, TypeScript e Supabase.

## Abrir o site no próprio computador (Windows)

Estes passos iniciam o site localmente. A pasta, sozinha, não inclui o banco Supabase, e o endereço
local só fica acessível no computador que está executando o servidor.

1. Instale o [Node.js LTS](https://nodejs.org/) (ele inclui o npm).
2. Copie ou extraia a pasta do projeto no computador. Não compartilhe o arquivo `.env`.
3. Abra o PowerShell dentro da pasta do projeto:
   - No Explorador de Arquivos, abra a pasta.
   - Clique na barra de endereço, digite `powershell` e pressione Enter.
4. Instale as dependências:

   ```powershell
   npm install
   ```

5. Configure as variáveis de ambiente em `.env` (veja a seção seguinte).
6. Inicie o servidor:

   ```powershell
   npm run dev -- --host 127.0.0.1 --port 8080
   ```

7. Abra [http://127.0.0.1:8080](http://127.0.0.1:8080) no navegador. Para a área administrativa,
   acesse [http://127.0.0.1:8080/admin](http://127.0.0.1:8080/admin) e entre com uma conta que
   já tenha o papel de administrador no Supabase.
8. Para encerrar, volte ao PowerShell e pressione `Ctrl+C`.

Se o PowerShell bloquear `npm`, use `npm.cmd` nos comandos acima (por exemplo,
`npm.cmd run dev -- --host 127.0.0.1 --port 8080`).

## Configurar a conexão com Supabase

O site precisa de um projeto Supabase ativo com o esquema e as políticas do app. Copiar os arquivos
não copia o banco nem cria contas. Para apontar uma instalação local ao projeto existente, obtenha
os dados em **Supabase → Project Settings → API** e configure o `.env` local:

```dotenv
VITE_SUPABASE_URL=https://SEU-PROJECT-REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICAVEL
SUPABASE_URL=https://SEU-PROJECT-REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICAVEL
```

Use a URL e a chave publicável (ou a chave `anon` legada, se o painel ainda a apresentar). Não
coloque senhas ou chaves secretas no código, neste README, em variáveis `VITE_` ou em arquivos que
serão enviados a outras pessoas.

Algumas tarefas administrativas do servidor podem precisar de `SUPABASE_SERVICE_ROLE_KEY`. Essa
chave tem acesso privilegiado: configure-a somente como segredo no servidor/hospedagem, nunca no
navegador ou em um arquivo compartilhado. O assistente de IA é opcional; para ativá-lo, configure
`GEMINI_API_KEY` como segredo somente no servidor. O modelo opcional pode ser definido com
`GEMINI_MODEL`.

## Compartilhar o site com outras pessoas

O endereço `127.0.0.1` é privado do computador e não funciona para outras pessoas. Para publicar o
site na internet, faça deploy da aplicação em uma hospedagem compatível com TanStack Start/Node.js,
configure nela as variáveis de ambiente necessárias e mantenha o projeto Supabase ativo. Depois,
compartilhe o endereço HTTPS público da hospedagem.

Para permitir que outra pessoa rode o projeto no próprio computador, compartilhe os arquivos-fonte
e este README, mas **não** compartilhe `.env`, chaves, senhas nem credenciais. A pessoa precisará
configurar sua própria conexão Supabase autorizada (ou receber acesso apropriado ao projeto) e
instalar as dependências com `npm install`.

## Assistente jurídico com IA

O assistente usa `GEMINI_API_KEY`, configurada apenas no servidor (no `.env` local para
desenvolvimento ou nos segredos da hospedagem). Nunca use o prefixo `VITE_` para essa chave.
O modelo padrão é `gemini-2.5-flash`.

O assistente usa trechos de artigos vinculados a normas marcadas como verificadas. O histórico fica
no navegador e não há respostas quando não existem fontes verificadas suficientes. As respostas
são informativas e não substituem orientação profissional.

## Comandos úteis

```powershell
npm install
npm run dev
npm test
npm run lint
npm run build
```
