export const money = (amount: number) =>
  `GH₵ ${amount.toLocaleString("en-GH", { maximumFractionDigits: 0 })}`;
