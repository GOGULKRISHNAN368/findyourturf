export function SkeletonCard() {
  return (
    <div className="card skeleton-card">
      <div className="skeleton" style={{ width: "40%", height: "20px", marginBottom: "14px" }} />
      <div className="skeleton" style={{ width: "70%", height: "30px", marginBottom: "10px" }} />
      <div className="skeleton" style={{ width: "50%", height: "16px" }} />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="table-responsive">
      <table className="data-table">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td style={{ width: "50px" }}>
                <div className="skeleton" style={{ width: "36px", height: "36px", borderRadius: "8px" }} />
              </td>
              <td>
                <div className="skeleton" style={{ width: "60%", height: "18px", marginBottom: "6px" }} />
                <div className="skeleton" style={{ width: "40%", height: "12px" }} />
              </td>
              <td><div className="skeleton" style={{ width: "70px", height: "24px", borderRadius: "99px" }} /></td>
              <td><div className="skeleton" style={{ width: "90px", height: "16px" }} /></td>
              <td><div className="skeleton" style={{ width: "120px", height: "32px", borderRadius: "6px" }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
