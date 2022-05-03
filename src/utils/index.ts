import { leftPad } from "web3-utils";

export const createAddress = (suffix: string): string => {
  return leftPad(suffix, 40);
};
