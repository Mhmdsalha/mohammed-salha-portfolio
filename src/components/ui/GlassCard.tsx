import { clsx } from "clsx";

type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  as?: "article" | "div" | "section";
};

export function GlassCard({
  children,
  className,
  hover = true,
  as: Component = "div"
}: GlassCardProps) {
  return (
    <Component className={clsx("glass", hover && "glass-hover", className)}>
      {children}
    </Component>
  );
}
