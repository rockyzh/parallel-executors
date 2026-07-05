import * as assert from 'assert';
import TaskSource from '../src/task_source';

describe('TaskSource', function () {
  function makeIterator(items: number[]): Iterator<number> {
    let index = 0;
    return {
      next(): IteratorResult<number> {
        if (index < items.length) {
          return { done: false, value: items[index++] };
        }
        return { done: true, value: undefined as any };
      }
    };
  }

  describe('index progression', function () {
    it('increments index for each non-done item', async function () {
      const source = new TaskSource(makeIterator([10, 20, 30]));
      assert.strictEqual(source.index, 0);

      const r1 = await source.next();
      assert.strictEqual(r1.value, 10);
      assert.strictEqual(r1.done, false);
      assert.strictEqual(source.index, 1);

      const r2 = await source.next();
      assert.strictEqual(r2.value, 20);
      assert.strictEqual(source.index, 2);

      const r3 = await source.next();
      assert.strictEqual(r3.value, 30);
      assert.strictEqual(source.index, 3);

      const r4 = await source.next();
      assert.strictEqual(r4.done, true);
      assert.strictEqual(source.index, 3);
    });
  });

  describe('stop()', function () {
    it('prevents further items from being returned', async function () {
      const source = new TaskSource(makeIterator([1, 2, 3, 4, 5]));
      await source.next();
      await source.next();
      source.stop();

      const result = await source.next();
      assert.strictEqual(result.done, true);
      assert.strictEqual(source.stopping, true);
    });

    it('is idempotent', async function () {
      const source = new TaskSource(makeIterator([1, 2]));
      source.stop();
      source.stop();
      source.stop();

      const result = await source.next();
      assert.strictEqual(result.done, true);
      assert.strictEqual(source.stopping, true);
    });
  });

  describe('empty source', function () {
    it('returns done immediately for an empty iterator', async function () {
      const source = new TaskSource(makeIterator([]));
      const result = await source.next();
      assert.strictEqual(result.done, true);
      assert.strictEqual(source.index, 0);
    });
  });

  describe('async iterator support', function () {
    it('handles iterators that return promises from next()', async function () {
      let index = 0;
      const items = [100, 200];
      const asyncIter: Iterator<number> = {
        next(): any {
          if (index < items.length) {
            return Promise.resolve({ done: false, value: items[index++] });
          }
          return Promise.resolve({ done: true, value: undefined });
        }
      };

      const source = new TaskSource(asyncIter);
      const r1 = await source.next();
      assert.strictEqual(r1.value, 100);
      assert.strictEqual(r1.done, false);

      const r2 = await source.next();
      assert.strictEqual(r2.value, 200);
      assert.strictEqual(r2.done, false);

      const r3 = await source.next();
      assert.strictEqual(r3.done, true);
    });
  });
});
