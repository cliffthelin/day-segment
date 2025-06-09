# Bundle Analysis for Vercel Applications

This document provides a simple guide on analyzing bundle sizes for your Vercel application.

## Running Bundle Analysis Locally

To analyze your bundle size locally:

\`\`\`bash
# For Mac/Linux
pnpm analyze

# For Windows
pnpm cross-env BUNDLE_ANALYZER=browser next build
\`\`\`

This will generate a visual report of your bundle sizes in your browser.

## Understanding the Report

The bundle analyzer generates an interactive treemap visualization:

- **Large Boxes**: Represent large dependencies that might need optimization
- **Colors**: Different colors represent different types of modules
- **Nesting**: Shows how modules are imported and bundled together

## Optimization Tips

1. **Use Dynamic Imports**: For large components that aren't needed immediately
   \`\`\`jsx
   import dynamic from 'next/dynamic';
   
   const HeavyComponent = dynamic(() => import('@/components/heavy-component'));
   \`\`\`

2. **Import Only What You Need**: Instead of importing entire libraries
   \`\`\`jsx
   // Bad
   import * as LucideIcons from 'lucide-react';
   
   // Good
   import { Clock, Calendar } from 'lucide-react';
   \`\`\`

3. **Optimize Images**: Use Next.js Image component with proper sizing
   \`\`\`jsx
   import Image from 'next/image';
   
   <Image 
     src="/image.jpg" 
     width={400} 
     height={300} 
     alt="Description" 
   />
   \`\`\`

4. **Use Code Splitting**: Next.js automatically splits code by pages, but you can further optimize with dynamic imports

## Vercel Deployment

When deploying to Vercel, the optimizations in `next.config.mjs` will automatically apply:

- Console logs removal in production
- CSS optimization
- Package import optimization
- Code splitting

No additional environment variables are needed for your Vercel deployment.
