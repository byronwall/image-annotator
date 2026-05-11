export type CreditPackConfig = {
  credits: number;
  amountCents: number;
  currency: string;
};

export const getCreditPackConfig = (): CreditPackConfig => {
  const credits = Number(process.env.CREDIT_PACK_CREDITS ?? 10);
  const amountCents = Number(process.env.CREDIT_PACK_AMOUNT_CENTS ?? 1000);
  return {
    credits: Number.isFinite(credits) && credits > 0 ? Math.floor(credits) : 10,
    amountCents: Number.isFinite(amountCents) && amountCents > 0 ? Math.floor(amountCents) : 1000,
    currency: process.env.CREDIT_PACK_CURRENCY || "usd",
  };
};
