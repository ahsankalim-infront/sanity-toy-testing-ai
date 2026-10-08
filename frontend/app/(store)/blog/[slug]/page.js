import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "../../../../lib/format";

export const dynamic = "force-dynamic";

export default async function ArticlePage({ params }) {
  let post;
  try {
    post = (await api(`/api/blog/${params.slug}`)).post;
  } catch {
    notFound();
  }
  return (
    <>
      <div className="page-hero">
        <div className="crumb"><Link href="/blog">Blog</Link> / {post.category}</div>
        <h1>{post.emoji} {post.title}</h1>
        <p className="sec-sub">{post.author} · {post.read_time}</p>
      </div>
      <div className="page-body">
        <article className="prose form-card" dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>
    </>
  );
}
