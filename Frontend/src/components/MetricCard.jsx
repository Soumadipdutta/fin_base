import { ArrowUpRight, ArrowDownRight } from "lucide-react";

function MetricCard({ title, value, change, direction, icon: Icon, tone, note, variant = "" }) {
  return (
    <article className={`metric-card ${variant ? `metric-card-${variant}` : ""}`}>
      <div className="metric-top">
        <span>{title}</span>
        <div className={`metric-icon ${tone}`}><Icon size={19} /></div>
      </div>
      <div className="metric-value" title={typeof value === "string" ? value : undefined}>{value}</div>
      <div className="metric-bottom">
        <span className={`metric-change ${direction}`}>
          {direction === "positive" ? <ArrowUpRight size={15} /> : direction === "negative" ? <ArrowDownRight size={15} /> : null}
          {change}
        </span>
        <span className="metric-note">{note}</span>
      </div>
    </article>
  );
}

export default MetricCard;
