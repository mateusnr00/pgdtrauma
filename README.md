# Princípios Gerais da Traumatologia — landing page

Next.js 16 (App Router) + TypeScript + CSS Modules. No UI or animation libraries: motion is CSS
(transform/opacity) driven by one small scroll hook (`lib/motion.ts`) and IntersectionObserver.

## Rodar

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Painel de edição (`/admin`)

Todo o conteúdo do site (textos, imagens, vídeo, sumário, autores, SEO, link de compra) é editável em
`/admin`. Ao clicar em **Publicar**, o conteúdo é salvo no Vercel Blob e o site é atualizado na hora.
Cada publicação fica no **Histórico** e pode ser recarregada; "Carregar conteúdo original" volta ao
conteúdo de lançamento.

- Conteúdo: `content/schema.ts` (formato), `content/defaults.ts` (conteúdo original),
  `lib/content-store.ts` (leitura/gravação, validação de tipos e links).
- Formulário: `app/admin/_editor/spec.ts` descreve cada campo do painel.
- Imagens e vídeos são enviados direto do navegador para o Blob (`app/api/admin/upload`).

## Configuração

| Variável | Uso |
| --- | --- |
| `ADMIN_EMAIL` | E-mail de login do painel. |
| `ADMIN_PASSWORD` | Senha do painel. |
| `ADMIN_SECRET` | Chave que assina a sessão (string aleatória longa). Trocar desconecta todos. |
| `BLOB_READ_WRITE_TOKEN` | Criada automaticamente ao conectar o Blob store ao projeto. |
| `CLOUDFLARE_ACCOUNT_ID` | Conta da Cloudflare onde fica o banco D1 das métricas. |
| `CLOUDFLARE_D1_DATABASE_ID` | ID do banco D1 `pgdtrauma-metricas`. |
| `CLOUDFLARE_D1_TOKEN` | Token da Cloudflare só com **D1: Edit**. Sem as três, as métricas ficam desligadas. |
| `NEXT_PUBLIC_SITE_URL` | URL pública: canonical, Open Graph, JSON-LD, sitemap. |
| `NEXT_PUBLIC_PURCHASE_URL` | Link de compra reserva, se o painel não tiver um. |

Para trocar a senha: `vercel env rm ADMIN_PASSWORD production`, depois `vercel env add ADMIN_PASSWORD production`
e um novo deploy.

## Imagens e vídeo

Os originais ficam em `_source/`. `npm run assets` regenera `public/media/`:
recorte das fotos com fundo xadrez falso, extração da imagem transparente do .docx, contracapa,
imagem de compartilhamento e o vídeo (sem áudio, MP4 + WebM + poster).

## Movimento e acessibilidade

Com `prefers-reduced-motion: reduce` a página exibe uma composição estática (sem pin/scroll
narrativo). Para revisar a versão animada nessas máquinas, use `?motion=full` na URL.

## Métricas (aba "Métricas" do painel)

O painel abre na aba **Métricas**: visitantes, visualizações, cliques em "Adquirir livro", conversão,
gráfico por dia, jornada do visitante (até onde as pessoas rolam), botão de compra que mais converte,
origem das visitas (use os links com `utm_source` gerados no painel), dispositivos, países, cliques e
horários de pico. Nessa aba também se troca o **link do botão de compra**.

- Coleta: `components/Analytics.tsx` (visitas, seções, cliques) → `app/api/t`.
- Compra: todos os botões apontam para `/pgdtrauma/comprar?de=<posição>`, que conta o clique e
  redireciona para o link de compra salvo no painel (`app/comprar/route.ts`).
- Armazenamento: Cloudflare D1 (banco `pgdtrauma-metricas`), acessado pela API da Cloudflare. A
  tabela `events` é criada sozinha no primeiro uso.
- Anônimo: id aleatório em cookie próprio, sem IP. Robôs e o admin logado não contam.

## Integrações (aba "Integrações" do painel)

Meta Pixel + API de Conversões. O ID do Pixel e o token ficam no D1 (tabela `settings`), nunca no
Blob público; o token só é lido no servidor e não volta para o navegador. Eventos: `PageView` (toda
visita), `ViewContent` (chegou ao sumário) e `AddToCart` (clique em comprar), cada um enviado
pelo Pixel e pela API com o mesmo `event_id` para a Meta deduplicar (`lib/meta.ts`, `lib/settings.ts`).

## Botão de compra flutuante

`components/StickyBuy.tsx`: aparece depois da abertura e some ao chegar na seção final. Barra inferior
no celular, cartão no canto no computador. Texto e liga/desliga em Conteúdo → Menu.

## Aviso de cookies (LGPD)

`components/CookieConsent.tsx`: aparece na primeira visita. O Pixel e a API de Conversões da Meta só
funcionam com o cookie `pgt_consent=all` ("Aceitar"); a contagem própria do painel é anônima e segue
sempre. A escolha vale 6 meses e pode ser mudada pelo link no rodapé. Textos em Conteúdo → Aviso de cookies.
