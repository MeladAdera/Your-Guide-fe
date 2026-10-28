import type { ReactNode } from "react";

/** The page heading and its intro, in the sizes of the sign-in screen (docs/DESIGN.md §3). */
export function PageHeader({ title, intro }: { title: ReactNode; intro?: ReactNode }) {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-balance lg:text-5xl lg:leading-tight">{title}</h1>
      {intro && <p className="mt-2 max-w-[60ch] text-muted-foreground lg:mt-3 lg:text-lg">{intro}</p>}
    </div>
  );
}
