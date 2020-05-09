import TaskSource from './task_source';
import Worker, { Executor } from './worker';

export interface ParallelExecutorOptions<T> {
  workers: number
  executor: Executor
}

export default class ParallelExecutor<T> {
  source: Iterator<T>;
  options: ParallelExecutorOptions<T>;

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

    const workers: Array<Promise<void>> = [];
    for (let i = 0; i < this.options.workers; i++) {
      workers.push(new Worker(taskSource, this.options.executor).start());
    }

    return await new Promise<number>((resolve, reject) => {
      Promise.all(workers).then(() => {
        resolve(taskSource.index);
      }).catch(err => {
        reject(err);
      });
    });
  }
}
