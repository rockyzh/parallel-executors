export function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

export function barrier(n: number) {
  const gate = deferred<void>();
  let arrived = 0;
  return {
    promise: gate.promise,
    async arrive() {
      arrived++;
      if (arrived >= n) gate.resolve();
      return gate.promise;
    },
    arrivedCount: () => arrived,
  };
}

export function countingExecutor<T>(behavior: (item: T) => Promise<boolean | void>) {
  let inFlight = 0;
  let maxInFlight = 0;
  const startOrder: T[] = [];
  const finishOrder: T[] = [];
  const wrapped = async (item: T) => {
    inFlight++; maxInFlight = Math.max(maxInFlight, inFlight);
    startOrder.push(item);
    try {
      return await behavior(item);
    } finally {
      inFlight--;
      finishOrder.push(item);
    }
  };
  return { wrapped, get inFlight() { return inFlight; }, get maxInFlight() { return maxInFlight; }, startOrder, finishOrder };
}
