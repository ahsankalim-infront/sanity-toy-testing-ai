import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "../../../../lib/format";
import { SeoJsonLd, seoMetadata } from "../../../../lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  let fallback = {};
  try {
    const { post } = await api(`/api/blog/${params.slug}`);
    fallback = { title: `${post.title} | Kidlo Blog`, description: post.excerpt, image: post.image_url };
  } catch { /* SEO helper supplies the store default */ }
  return seoMetadata(`/blog/${params.slug}`, fallback);
}

export default async function ArticlePage({ params }) {
  let post;
  try {
    post = (await api(`/api/blog/${params.slug}`)).post;
  } catch {
    notFound();
  }
  return (
    <>
      <SeoJsonLd
        path={`/blog/${post.slug}`}
        fallback={{ type: "Article", title: post.title, description: post.excerpt, extra: { author: { "@type": "Person", name: post.author }, datePublished: post.published_at } }}
      />
      <div className="page-hero">
        <div className="crumb"><Link href="/blog">Blog</Link> / {post.category}</div>
        {post.image_url ? <img className="article-cover" src={post.image_url} alt={post.image_alt || post.title} /> : null}
        <h1>{post.image_url ? post.title : `${post.emoji} ${post.title}`}</h1>
        <p className="sec-sub">{post.author} · {post.read_time}</p>
      </div>
      <div className="page-body">
        <article className="prose form-card" dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>
    </>
  );
}
