// =====================================================
// LEARNOVA AI
// STAT CARD COMPONENT
// =====================================================

function StatCard({
  icon,
  title,
  value,
  subtitle,
}) {
  return (
    <div
      className="stat-card"
      role="article"
      aria-label={`${title}: ${value}`}
    >
      {/* =================================================
          ICON
          ================================================= */}

      <div className="stat-icon">
        {icon}
      </div>


      {/* =================================================
          STAT CONTENT
          ================================================= */}

      <div className="stat-content">

        <p className="stat-title">
          {title}
        </p>

        <h2>
          {value}
        </h2>

        <span>
          {subtitle}
        </span>

      </div>

    </div>
  );
}


// =====================================================
// EXPORT
// =====================================================

export default StatCard;