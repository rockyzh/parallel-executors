import { promisify } from "util";

export async function sleep(ms: number, throwTimeout = false) {
  // return new Promise<void>((resolve, reject) => setTimeout(() => { throwTimeout ? reject(new Error('Timeout')) : resolve(); }, ms));
  return promisify((callback: (err?: any) => void) => {
    setTimeout(() => {
      callback(throwTimeout ? new Error('Timeout') : null);
    }, ms);
  })();
}
