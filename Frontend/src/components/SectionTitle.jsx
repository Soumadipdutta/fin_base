import { ArrowUpRight } from "lucide-react";

function SectionTitle({ title, subtitle, action, onAction }) {
  return (
    <div className="section-heading">
      <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
      {action && <button className="text-action" onClick={onAction}>{action} <ArrowUpRight size={15} /></button>}
    </div>
  );
}

export default SectionTitle;
