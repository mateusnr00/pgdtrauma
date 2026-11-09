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
| `ADMIN_PASSWORD` | Senha do painel. |
| `ADMIN_SECRET` | Chave que assina a sessão (string aleatória longa). Trocar desconecta todos. |
| `BLOB_READ_WRITE_TOKEN` | Criada automaticamente ao conectar o Blob store ao projeto. |
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
