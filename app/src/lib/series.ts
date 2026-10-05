// Cards are stamped with the series they were caught in. Founders Edition is everything caught before
// public launch, and it can never be earned again.

export const SERIES: Record<string, { name: string; founders: boolean }> = {
  founders: { name: "Founders Edition", founders: true },
};

export const CURRENT_SERIES = "founders";

export const seriesName = (id: string | undefined) => SERIES[id ?? "founders"]?.name ?? "Series";
export const isFounders = (id: string | undefined) => (id ?? "founders") === "founders";