import { chunk } from "es-toolkit";

export const verifyHexStr = (str: string) => {
  const bytes = chunk(str.split(""), 2);
  return (
    bytes.every((byte) => byte.length === 2) &&
    bytes.every((byte) => /[0-9a-fA-F]{2}/g.test(byte.join("")))
  );
};

export const verifyBinStr = (str: string) => {
  const bytes = chunk(str.split(""), 8);
  return bytes.every(
    (byte) => byte.length === 8 && /[01]{8}/g.test(byte.join(""))
  );
};

export const encodeBinToBuffer = (str: string) => {
  const bytes = chunk(str.split(""), 8);
  return bytes.reduce(
    (buf: number[], byte) => [...buf, parseInt(byte.join(""), 2)],
    []
  );
};

export const encodeHexToBuffer = (str: string) => {
  const bytes = chunk(str.split(""), 2);
  return bytes.reduce(
    (buf: number[], byte) => [...buf, parseInt(byte.join(""), 16)],
    []
  );
};

export const hexStrToVisible = (str: string) => {
  return chunk(str.replace(/ /g, "").replace(/0x/g, "").split(""), 2)
    .map((b) => b.join(""))
    .join(" ");
};

export const binStrToVisible = (str: string) => {
  return chunk(str.replace(/ /g, "").split(""), 8)
    .map((b) => b.join(""))
    .join(" ");
};
