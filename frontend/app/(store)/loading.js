export default function Loading() {
  return (
    <>
      <div className="page-hero">
        <div className="skeleton" style={{ height: 14, width: 160, marginBottom: 14 }} />
        <div className="skeleton" style={{ height: 44, width: "min(420px, 80%)" }} />
      </div>
      <div className="page-body">
        <div className="product-grid">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="pcard">
              <div className="skeleton" style={{ height: 160, borderRadius: 0 }} />
              <div className="pcard-body">
                <div className="skeleton" style={{ height: 12, width: "50%", marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 16, marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 36, borderRadius: 50 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
