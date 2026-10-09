import Link from "next/link";
import { api } from "../../../lib/format";
import { SeoJsonLd, seoMetadata } from "../../../lib/seo";

export const dynamic = "force-dynamic";
export const generateMetadata = () => seoMetadata("/blog");

export default async function BlogPage() {
  const data = await api("/api/blog");
  return (
    <>
      <SeoJsonLd path="/blog" fallback={{ title: "Blog & Tips", description: "Toy guidance and ideas for families." }} />
      <div className="page-hero cms-hero blog-landing-hero">
        <div className="crumb"><Link href="/">Home</Link> / Blog</div>
        <span className="cms-kicker">Ideas for growing minds</span>
        <h1>Blog & Tips</h1>
        <p>Practical guidance for choosing safer toys, finding better gifts, and making play more meaningful at every age.</p>
      </div>
      <div className="page-body blog-landing">
        <div className="blog-landing-head">
          <div><span>From the Kidlo team</span><h2>Helpful reads for parents</h2></div>
          <p>Clear, useful advice written for real family routines—not perfect playrooms.</p>
        </div>
        <div className="blog-grid">
          {data.posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="blog-card">
              <div className={`blog-thumb ${post.image_url ? "has-photo" : ""}`} style={{ background: post.gradient }}>{post.image_url ? <img src={post.image_url} alt={post.image_alt || post.title} /> : post.emoji}</div>
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
