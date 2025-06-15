import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, ArrowLeft, Clock } from 'lucide-react';

export async function generateStaticParams() {
  const files = fs.readdirSync('content/blog');
  return files.map(file => ({
    slug: file.replace(/\.md$/, ''),
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const filePath = path.join('content/blog', `${params.slug}.md`);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data } = matter(fileContent);

  return {
    title: data.title,
    description: data.excerpt,
  };
}

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function Page({ params }: PageProps) {
  const filePath = path.join('content/blog', `${params.slug}.md`);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContent);
  const processed = await remark().use(html).process(content);
  const htmlContent = processed.toString();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const estimateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return readTime;
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link href="/blog">
            <Button variant="ghost" className="gap-2 pl-0">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Button>
          </Link>
        </div>

        {/* Article Header */}
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Badge variant="secondary" className="px-3 py-1">
              Article
            </Badge>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6 leading-tight">
            {data.title}
          </h1>
          
          {data.excerpt && (
            <p className="text-xl opacity-70 leading-relaxed mb-8 max-w-3xl">
              {data.excerpt}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-6 text-sm opacity-60">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <time dateTime={data.date}>
                {formatDate(data.date)}
              </time>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{estimateReadingTime(content)} min read</span>
            </div>
          </div>
        </header>

        <Separator className="mb-12" />

        {/* Article Content */}
        <article className="prose prose-lg max-w-none">
          <div 
            className="prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h3:text-2xl prose-h3:mt-10 prose-h3:mb-4 prose-h4:text-xl prose-h4:mt-8 prose-h4:mb-3 prose-p:text-base prose-p:leading-relaxed prose-p:mb-6 prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-ul:space-y-2 prose-ol:space-y-2 prose-li:text-base prose-blockquote:border-l-4 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:opacity-80 prose-code:text-sm prose-code:px-2 prose-code:py-1 prose-code:rounded prose-pre:p-6 prose-pre:rounded-lg prose-img:rounded-lg prose-img:shadow-lg"
            dangerouslySetInnerHTML={{ __html: htmlContent }} 
          />
        </article>

        {/* Article Footer */}
        <footer className="mt-16 pt-8 border-t">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm opacity-60">
              Published on {formatDate(data.date)}
            </div>
            <Link href="/blog">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                More Articles
              </Button>
            </Link>
          </div>
        </footer>

        {/* Bottom Spacing */}
        <div className="h-16" />
      </div>
    </div>
  );
}