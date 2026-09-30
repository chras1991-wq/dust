export type Dust20Deploy = {
  p: "dust-20";
  op: "deploy";
  tick: string;
  supply: string;
  unit_sats: string;
  max_sats: string;
  lim_sats: string;
};

export type Dust20Mint = {
  p: "dust-20";
  op: "mint";
  tick: string;
  amt: string;
  sats: string;
};

export type ValidationIssue = {
  code: string;
  message: string;
  expected?: string;
  actual?: string;
};

export type ValidationResult = {
  valid: boolean;
  issues: ValidationIssue[];
};

export type MintCarrierCheck = {
  carrierOutputSats: number;
  inscriptionOffset: number;
  declaredSats: number;
};
