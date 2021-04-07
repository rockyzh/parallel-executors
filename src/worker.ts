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
    const item = await this.source.next();
    if (item.done) {
      this.ch.close();
      return;
    } else {
      await new Promise<void>((resolve, reject) => {
        this.executor(item.value).then(stopping => {
          if (stopping) {
            this.source.stop();

            this.ch.close();

            resolve();
            return;
          }

          this.exec().then(resolve).catch(reject);
        }).catch(err => {
          this.source.stop();

          this.ch.close();

          reject(err);
        });
      });
    }
  }

  async waitFinished(msTimeout = 3000) {
    await Promise.race([ sleep(msTimeout), promisify(this.ch)() ]);
  }
}
