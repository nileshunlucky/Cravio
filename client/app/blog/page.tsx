import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, ChevronRight } from 'lucide-react';

interface BlogPost {
  title: string;
  date: string;
  slug: string;
  excerpt: string;
}

export default function Blog() {
  const blogDir = path.join(process.cwd(), 'content/blog');
  if (!fs.existsSync(blogDir)) {
    throw new Error('Blog directory not found');
  }
  const files = fs.readdirSync(blogDir);
  console.log('Reading blog posts from:', blogDir);

  const posts: BlogPost[] = files.map(filename => {
    const filePath = path.join(blogDir, filename);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContent);

    return {
      title: data.title,
      date: data.date,
      slug: data.slug,
      excerpt: data.excerpt,
    };
  });

  // Sort posts by date (newest first)
  const sortedPosts = posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="px-3 py-1">
              Blog
            </Badge>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            Mellvitta AI Blog
          </h1>
          <p className="text-lg opacity-70 max-w-2xl">
            Insights, updates, and stories from the world of artificial intelligence
          </p>
        </div>

        <Separator className="mb-12" />

        {/* Blog Posts Grid */}
        <div className="space-y-8">
          {sortedPosts.map((post, index) => (
            <article key={post.slug} className="group">
              <Card className="border-0 shadow-none hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarDays className="h-4 w-4 opacity-50" />
                    <time className="text-sm opacity-60">
                      {formatDate(post.date)}
                    </time>
                  </div>
                  <CardTitle className="text-2xl font-bold leading-tight group-hover:opacity-80 transition-opacity">
                    <Link 
                      href={`/blog/${post.slug}`}
                      className="flex items-start justify-between group/link"
                    >
                      <span>{post.title}</span>
                      <ChevronRight className="h-5 w-5 opacity-0 group-hover/link:opacity-50 transition-opacity ml-2 mt-1 flex-shrink-0" />
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-base leading-relaxed">
                    {post.excerpt}
                  </CardDescription>
                  <div className="mt-6">
                    <Link 
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-2 font-medium hover:gap-3 transition-all duration-200"
                    >
                      Read article
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
              
              {index < sortedPosts.length - 1 && (
                <Separator className="mt-8 opacity-30" />
              )}
            </article>
          ))}
        </div>

        {/* Empty State */}
        {sortedPosts.length === 0 && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
              <p className="opacity-60">
                Check back soon for the latest insights and updates.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}