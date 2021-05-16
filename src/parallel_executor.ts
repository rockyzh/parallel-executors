import TaskSource from './task_source';
import { sleep } from './utils';
import Worker, { Executor } from './worker';

export interface ParallelExecutorOptions<T> {
  workers: number
  executor: Executor
}

export default class ParallelExecutor<T> {
  source: Iterator<T>;
  options: ParallelExecutorOptions<T>;
  workers: Array<Worker<T>> = [];

  constructor(source: AsyncIterable<T> | Iterable<T>, options?: Partial<ParallelExecutorOptions<T>>) {
    if (Symbol.asyncIterator in source) {
      // @ts-ignore
      this.source = source[ Symbol.asyncIterator ]();
    } else if (Symbol.iterator in source) {
      // @ts-ignore
      this.source = source[ Symbol.iterator ]();
    } else {
      throw new Error('invalid source of a parallel executor');
    }

    this.options = Object.assign({ workers: 1, executor: async (item: (() => Promise<void>) | Promise<void>) => { typeof item === 'function' ? (await item()) : (await item); return false; } }, options || {});
  }

  async execute() {
    const taskSource = new TaskSource(this.source);

    this.workers = [];
    const workers: Array<Promise<void>> = [];
    for (let i = 0; i < this.options.workers; i++) {
      const worker = new Worker(taskSource, this.options.executor);
      this.workers.push(worker);
      workers.push(worker.start());
    }

    return await new Promise<number>((resolve, reject) => {
      Promise.all(workers).then(() => {
        resolve(taskSource.index);
      }).catch(err => {
        reject(err);
      });
    });
  }

  async waitFinished(msTimeout = 3000) {
    await Promise.race([ sleep(msTimeout, true), Promise.all(this.workers.map(worker => worker.waitFinished(msTimeout)))]);
  }
}
