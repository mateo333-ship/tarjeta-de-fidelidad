export type Customer = {
  id: string;
  name: string;
  email: string;
  stamps: number;
  createdAt: number;
  updatedAt: number;
};

export type ProgramConfig = {
  stampsRequired: number;
  reward: string;
  businessName: string;
};

export type StampEvent = {
  type: "stamp" | "redeem" | "register";
  at: number;
  by: string;
};

export const DEFAULT_CONFIG: ProgramConfig = {
  stampsRequired: 10,
  reward: "un café gratis",
  businessName: "Tu Negocio",
};
