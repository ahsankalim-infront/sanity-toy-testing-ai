import Link from "next/link";
import { api } from "../../../lib/format";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const data = await api("/api/blog");
  return (
    <>
      <div className="page-hero">
        <div className="crumb"><Link href="/">Home</Link> / Blog</div>
        <h1>Tips for Parents</h1>
        <p className="sec-sub">Age guides, gift ideas, and how we choose toys.</p>
      </div>
      <div className="page-body">
        <div className="blog-grid">
          {data.posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="blog-card">
              <div className="blog-thumb" style={{ background: post.gradient }}>{post.emoji}</div>
              <div className="blog-body">
                <div className="blog-cat">{post.category}</div>
                <div className="blog-title">{post.title}</div>
                <div className="blog-excerpt">{post.excerpt}</div>
                <div className="blog-meta"><span>{post.author}</span><span>{post.read_time}</span></div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
