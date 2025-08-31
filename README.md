BACK SEARCH 

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Objektify – Visual shopping from any image

Upload a photo (even AI-generated), draw a box around the object you want, and get product results from the web to buy the item or similar ones.

### Getting started

1. Install dependencies:

```
npm install
```

2. Set environment variables (create a `.env.local`):

```
SERPAPI_KEY=your_serpapi_key
```

You can get a key from Azure Cognitive Services (Bing Visual Search) in the Azure Portal.

3. Run the dev server:

```
npm run dev
```

4. Open http://localhost:3000 and upload an image. Drag to select the object and click "Search products".

### Notes

- The API route `src/app/api/visual-search/route.ts` posts the image bytes to Bing Visual Search and simplifies results to a small item list.
- Remote images from major CDNs are allowed via `next.config.ts`.
- If Bing returns no shopping sources, the UI falls back to visually similar items.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
