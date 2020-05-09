export default class TaskSource<T> {
  source: Iterator<T>;
  index: number;
  stopping: boolean = false;

  constructor(source: Iterator<T>) {
    this.source = source;

    this.index = 0;
  }

  async next(): Promise<IteratorResult<T> & { index: number }> {
    if (this.stopping) {
      return Object.assign({
        done: true,
        value: undefined,
      } as any,
        { index: this.index - 1 })
    }

    let result = this.source.next();
    if (result instanceof Promise) {
      result = await result;
    }

    if (result.done) {
      this.stopping = true;
    } else {
      this.index++;
    }

    return Object.assign(result, { index: this.index - 1 });
  }

  stop() {
    this.stopping = true;
  }
}
