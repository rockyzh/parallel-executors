import * as chan from 'chan';
import { promisify } from 'util';

import TaskSource from './task_source';
import { sleep } from './utils';

export type Executor<T = any> = (item: T) => Promise<boolean | void>;

export default class Worker<T> {
  source: TaskSource<T>;
  executor: Executor<T>;
  ch: { (value: (() => void) | any): () => void, close(): void, done(): void };

  constructor(source: TaskSource<T>, executor: Executor) {
    this.source = source;
    this.executor = executor;

    this.ch = chan();
  }

  async start() {
    return await this.exec();
  }

  private async exec() {
    while (true) {
      const item = await this.source.next();
      if (item.done) {
        this.ch.close();
        return;
      } else {
        try {
          const stopping = await this.executor(item.value);
          if (stopping) {
            this.source.stop();
            this.ch.close();
          }
        } catch (err) {
          this.source.stop();

          this.ch.close();

          throw err;
        }
      }
    }
  }

  async waitFinished(msTimeout = 3000) {
    await Promise.race([ sleep(msTimeout, true), promisify(this.ch)() ]);
  }
}
