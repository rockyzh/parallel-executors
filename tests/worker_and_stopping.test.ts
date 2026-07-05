import * as assert from 'assert';
import ParallelExecutor from '../src/parallel_executor';
import { deferred, barrier, countingExecutor } from './helpers/async';

describe('Worker and stopping', function () {
  function* range(n: number) {
    for (let i = 0; i < n; i++) yield i;
  }

  describe('error propagation', function () {
    it('rejects with the thrown error when one item throws', async function () {
      const error = new Error('single item failure');
      const executor = new ParallelExecutor(range(10), {
        workers: 3,
        executor: async (item: number) => {
          if (item === 2) throw error;
          await deferred<void>().promise.then(() => {}); // hold others
        }
      });

      await assert.rejects(executor.execute(), (err: Error) => {
        assert.strictEqual(err, error);
        return true;
      });
    });

    it('preserves non-Error throwables (first error wins)', async function () {
      const executor = new ParallelExecutor(range(5), {
        workers: 2,
        executor: async (item: number) => {
          if (item === 1) throw 'boom';
          const d = deferred<void>();
          await d.promise;
        }
      });

      try {
        await executor.execute();
        assert.fail('should have rejected');
      } catch (err) {
        assert.strictEqual(err, 'boom');
      }
    });

    it('preserves object throwables', async function () {
      const thrown = { code: 42, msg: 'custom' };
      const executor = new ParallelExecutor([1, 2, 3], {
        workers: 1,
        executor: async (item: number) => {
          if (item === 1) throw thrown;
        }
      });

      try {
        await executor.execute();
        assert.fail('should have rejected');
      } catch (err) {
        assert.strictEqual(err, thrown);
      }
    });
  });

  describe('executor returns truthy (cooperative stop)', function () {
    it('stops processing and resolves (does not reject)', async function () {
      const workers = 3;
      const totalItems = 20;
      const stopAtItem = 5;

      const counter = countingExecutor<number>(async (item) => {
        if (item === stopAtItem) return true;
        return false;
      });

      const executor = new ParallelExecutor(range(totalItems), {
        workers,
        executor: counter.wrapped
      });

      const result = await executor.execute();
      assert.ok(result >= stopAtItem + 1, `expected at least ${stopAtItem + 1} processed, got ${result}`);
      assert.ok(result <= stopAtItem + 1 + (workers - 1), `expected at most ${stopAtItem + 1 + (workers - 1)} processed, got ${result}`);
    });

    it('remaining workers finish their in-flight item after stop', async function () {
      const workers = 2;
      const items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const processed: number[] = [];

      const executor = new ParallelExecutor(items, {
        workers,
        executor: async (item: number) => {
          processed.push(item);
          if (item === 3) return true;
        }
      });

      const result = await executor.execute();
      assert.ok(result < items.length, 'should have stopped early');
      assert.ok(processed.includes(3), 'the stopping item was processed');
    });
  });
});
