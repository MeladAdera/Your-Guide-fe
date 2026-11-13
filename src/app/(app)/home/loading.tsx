import { Skeleton } from "@/components/ui/skeleton";

/** Home's shape while the server render runs: the next-step card, then three goal rows. */
export default function HomeLoading() {
  return (
    <div aria-hidden className="grid gap-6 lg:gap-8">
      <div className="rounded-[22px] bg-card p-6 ring-1 ring-border lg:p-8">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-4 h-9 w-3/4 lg:h-12" />
        <Skeleton className="mt-4 h-5 w-1/2" />
        <Skeleton className="mt-6 h-12 w-full rounded-[10px] sm:w-40" />
      </div>
      <div>
        <Skeleton className="h-6 w-32" />
        <div className="mt-3 grid gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[52px] rounded-[16px]" />
          ))}
        </div>
      </div>
    </div>
  );
}
