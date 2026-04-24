"use client";
import { type LucideIcon, Clock, Check } from "lucide-react";

interface LessonResourceCardProps {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  duration?: string;
  isCompleted: boolean;
  completedLabel?: string;
  href?: string;
  externalHref?: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: React.ReactNode;
}

export default function LessonResourceCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  description,
  duration,
  isCompleted,
  completedLabel,
  href,
  externalHref,
  onClick,
  disabled,
  badge,
}: LessonResourceCardProps) {
  const cardClass = [
    "relative flex flex-col gap-3 rounded-2xl border p-5 text-right",
    "transition-all duration-500",
    isCompleted
      ? "bg-emerald-50 border-emerald-200"
      : disabled
      ? "bg-slate-50 border-dashed border-slate-200 opacity-60 cursor-default"
      : "bg-white border-slate-200 hover:border-brand-300 hover:shadow-sm cursor-pointer",
  ].join(" ");

  const content = (
    <>
      {/* Top row: icon + completion circle */}
      <div className="flex items-start justify-between">
        <div
          className={[
            "rounded-xl p-2.5 transition-colors duration-500",
            isCompleted ? "bg-emerald-100" : iconBg,
          ].join(" ")}
        >
          <Icon
            className={[
              "w-5 h-5 transition-colors duration-500",
              isCompleted ? "text-emerald-600" : iconColor,
            ].join(" ")}
          />
        </div>

        {/* Completion circle */}
        <div
          className={[
            "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0",
            "transition-all duration-500",
            isCompleted
              ? "bg-emerald-500 border-emerald-500"
              : "border-slate-300 bg-white",
          ].join(" ")}
        >
          {isCompleted && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
        </div>
      </div>

      {/* Title + description */}
      <div className="flex-1">
        <h3
          className={[
            "font-semibold text-sm leading-snug transition-colors duration-500",
            isCompleted ? "text-slate-400" : "text-brand-900",
          ].join(" ")}
        >
          {title}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>

        {duration && (
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3 shrink-0" />
            {duration}
          </p>
        )}
      </div>

      {/* Completed label or badge */}
      {(completedLabel || badge) && (
        <div className="pt-1 border-t border-emerald-100">
          {completedLabel && (
            <span className="text-xs font-semibold text-emerald-600">{completedLabel}</span>
          )}
          {badge}
        </div>
      )}
    </>
  );

  if (disabled) {
    return <div className={cardClass}>{content}</div>;
  }

  if (externalHref) {
    return (
      <a
        href={externalHref}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClass}
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  if (href) {
    return (
      <a href={href} className={cardClass}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" className={`${cardClass} w-full`} onClick={onClick}>
      {content}
    </button>
  );
}
