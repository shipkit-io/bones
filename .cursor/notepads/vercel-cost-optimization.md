# 💸 Vercel Cost Optimization Rule

## Why

Vercel usage costs can scale quickly due to overuse of serverless functions, frequent builds, and large asset sizes. This rule ensures projects are optimized to minimize cost while maintaining performance and developer experience.

---

## ✅ Best Practices

### ⚡ Use Static Generation (SSG) When Possible

- Prefer `getStaticProps` + `getStaticPaths` over `getServerSideProps`
- Leverage ISR (Incremental Static Regeneration) for dynamic content with low update frequency

### 🔁 Avoid Excessive Serverless Function Usage

- Cache results client-side or use ISR
- Offload background jobs to external services (e.g., Supabase Edge Functions, Cloudflare Workers)

### 📦 Optimize Assets

- Use `next/image` for image optimization
- Tree-shake unused code
- Split and lazy-load large components

### 🌐 Reduce Bandwidth Usage

- Compress assets (gzip, Brotli)
- Minimize large third-party libraries
- Serve static files via CDN (or external storage if needed)

### 🧱 Optimize Monorepos

- Use Vercel's build filters to skip unaffected apps
- Deploy only changed workspaces when using Turborepo

### 🔄 Limit Build Frequency

- Disable auto-deploy on non-essential branches
- Use `vercel.json` to control which routes/functions are built
- Use manual deploys for heavy builds or staging environments

### 📊 Monitor Usage Regularly

- Watch for spikes in:
  - Serverless invocations
  - Bandwidth
  - Build minutes
- Use Vercel Analytics or a logging proxy

### 🧪 Use Middleware Selectively

- Edge Middleware runs on every request — limit its use to essentials (e.g., auth, redirects)

---

## 🔍 Code/Config Review Prompts

- Are any pages using `getServerSideProps` unnecessarily?
- Are large packages being imported in client code?
- Is ISR being used where appropriate?
- Are image assets optimized?
- Are builds being triggered too frequently (e.g., per commit)?
- Is middleware being used sparingly?

---

## 🧰 Tools & References

- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Image Optimization in Next.js](https://nextjs.org/docs/pages/api-reference/components/image)
- [Incremental Static Regeneration](https://nextjs.org/docs/pages/building-your-application/data-fetching/incremental-static-regeneration)
- [Vercel Monorepos](https://vercel.com/docs/projects/monorepos)
- [vercel.json Reference](https://vercel.com/docs/project-configuration)

---

## 🏁 Rule Outcome

Projects following this rule should:

- Minimize serverless costs
- Reduce build/deploy times
- Stay within free tier where possible
- Maximize CDN efficiency
