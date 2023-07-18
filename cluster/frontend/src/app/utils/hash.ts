import { Md5 } from 'ts-md5';

export function hash(message: string) {
  const md5 = new Md5();
  md5.appendAsciiStr(message);
  return md5.end() as string;
}
