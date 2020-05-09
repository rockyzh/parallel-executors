import TaskSource from './task_source';

export type Executor<T = any> = (item: T) => Promise<boolean | void>;

export default class Worker<T> {
  source: TaskSource<T>;
  executor: Executor<T>;

  constructor(source: TaskSource<T>, executor: Executor) {
    this.source = source;
    this.executor = executor;
  }

  async start() {
    return await this.exec();
  }

  private async exec() {
    const item = await this.source.next();
    if (item.done) {
      return;
    } else {
      await new Promise<void>((resolve, reject) => {
        this.executor(item.value).then(stopping => {
          if (stopping) {
            this.source.stop();

            resolve();
            return;
          }

          this.exec().then(resolve).catch(reject);
        }).catch(err => {
          this.source.stop();

          reject(err);
        });
      });
    }
  }
}

