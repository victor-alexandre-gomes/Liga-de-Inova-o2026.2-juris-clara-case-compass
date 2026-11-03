# Juris Clara — Case Compass

Plataforma web de informação jurídica e organização de casos, pensada para cidadãos e
advogados. O objetivo é facilitar a pesquisa de leis e termos jurídicos, apresentar ferramentas
de apoio e ajudar cada pessoa a acompanhar informações do próprio caso. O conteúdo é informativo
e não substitui orientação de um advogado ou da Defensoria Pública.

## Como o site funciona

- **Área pública:** apresenta a plataforma e permite explorar a Wiki jurídica.
- **Conta e perfil:** após entrar, a pessoa acessa um painel de acordo com seu tipo de conta
  (cidadão ou advogado). As áreas privadas usam autenticação do Supabase.
- **Wiki jurídica:** permite pesquisar normas, artigos e termos, com filtros por categoria e tipo
  de fonte. O banco contém metadados das normas; o texto dos artigos não é criado automaticamente
  e só aparece depois de importação administrativa. Textos importados ficam identificados como
  não verificados até serem conferidos.
- **Organização de casos:** oferece recursos para registrar e acompanhar casos e informações
  relacionadas à conta.
- **Calculadoras e favoritos:** reúne ferramentas de estimativa e itens salvos para consulta.
- **Assistente jurídico:** pode responder com base em trechos de artigos de normas marcadas como
  verificadas. A chave da IA é opcional e deve permanecer no servidor.
- **Diretório de advogados:** permite pesquisar perfis profissionais que autorizaram a publicação.
  O diretório depende da configuração correspondente no Supabase; quando não está configurado, o
  site informa que os perfis reais não foram carregados.
- **Administração:** a rota `/admin` exige uma conta com papel de administrador. Administradores
  podem gerenciar o acervo jurídico e importar textos para revisão.

## Tecnologias

- **Interface:** React 19, TypeScript, Tailwind CSS 4 e componentes Radix UI.
- **Aplicação web:** TanStack Start e TanStack Router, com Vite no desenvolvimento e no build.
- **Dados e autenticação:** Supabase (Postgres, autenticação e políticas de acesso).
- **Assistente opcional:** Google Gemini, chamado pelo servidor e condicionado à existência de
  fontes jurídicas verificadas.
- **Build e hospedagem:** Nitro está configurado para gerar uma aplicação compatível com
  Cloudflare. O build local, por si só, não cria nem configura uma conta ou um deploy.
- **Testes e qualidade:** Vitest, Testing Library, ESLint e Prettier.

## Executar localmente no Windows

Estes passos iniciam o site no próprio computador. A pasta do projeto não inclui o banco Supabase;
o endereço local também não fica acessível para outras pessoas.

1. Instale o [Node.js LTS](https://nodejs.org/), que inclui o npm.
2. Abra o PowerShell dentro da pasta do projeto. No Explorador de Arquivos, abra a pasta, clique na
   barra de endereço, digite `powershell` e pressione Enter.
3. Instale as dependências:

   ```powershell
   npm install
   ```

4. Configure as variáveis de ambiente em um arquivo `.env` local, conforme a seção abaixo.
5. Inicie o servidor:

   ```powershell
   npm run dev -- --host 127.0.0.1 --port 8080
   ```

6. Abra [http://127.0.0.1:8080](http://127.0.0.1:8080). Para acessar a administração, entre com
   uma conta administradora e abra [http://127.0.0.1:8080/admin](http://127.0.0.1:8080/admin).
7. Para encerrar, volte ao PowerShell e pressione `Ctrl+C`.

Se o PowerShell bloquear a execução do comando `npm`, use `npm.cmd` (por exemplo,
`npm.cmd run dev -- --host 127.0.0.1 --port 8080`).

## Configuração do Supabase

É necessário um projeto Supabase ativo com o esquema, as migrações e as políticas de acesso do
aplicativo. Copiar o código não copia o banco nem cria contas. Obtenha a URL e a chave publicável
em **Supabase → Project Settings → API** e configure o `.env` local:

```dotenv
VITE_SUPABASE_URL=https://SEU-PROJECT-REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICAVEL
SUPABASE_URL=https://SEU-PROJECT-REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICAVEL
```

Também é possível usar a chave `anon` legada, se for a opção disponível no painel. Nunca coloque
senhas ou chaves secretas no código, neste README, em variáveis `VITE_` ou em arquivos enviados
ao GitHub.

Operações administrativas no servidor podem exigir `SUPABASE_SERVICE_ROLE_KEY`. Essa chave
privilegiada deve ser configurada somente como segredo no servidor ou na hospedagem — nunca no
navegador ou em um arquivo compartilhado. A migração do diretório de advogados está em
`supabase/migrations/`; aplique as migrações necessárias ao projeto antes de usar esses recursos.

## Assistente com IA

Para habilitar as respostas do assistente, configure `GEMINI_API_KEY` somente no ambiente do
servidor (no `.env` local para desenvolvimento ou nos secrets da hospedagem). Nunca use o prefixo
`VITE_` para essa chave. O modelo opcional pode ser configurado com `GEMINI_MODEL`; o padrão é
`gemini-2.5-flash`.

O assistente usa trechos de artigos vinculados a normas marcadas como verificadas. O histórico de
conversa fica no navegador. Se não houver fontes verificadas suficientes, não são geradas
respostas. As respostas são informativas e não substituem orientação profissional.

## GitHub e publicação

O GitHub guarda o código-fonte, mas não hospeda sozinho esta aplicação full-stack. Para publicar
o site, faça o deploy em uma hospedagem compatível com o build Nitro/Cloudflare, configure as
variáveis de ambiente e os secrets exigidos no servidor e mantenha o projeto Supabase ativo.
Compartilhe o endereço HTTPS da hospedagem, não o endereço local `127.0.0.1`.

O `.gitignore` exclui arquivos `.env` e `.dev.vars`. Antes de enviar alterações, confirme que
nenhuma chave, senha ou credencial foi adicionada ao commit. Nunca compartilhe esses valores no
GitHub.

## Comandos úteis

```powershell
npm install
npm run dev
npm test
npm run lint
npm run build
```
