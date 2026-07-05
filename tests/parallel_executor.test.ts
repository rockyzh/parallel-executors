import * as assert from 'assert';
import ParallelExecutor from '../src/parallel_executor';
import { deferred, barrier, countingExecutor } from './helpers/async';

describe('ParallelExecutor', function () {
  function* range(n: number) {
    for (let i = 0; i < n; i++) yield i;
  }

  describe('constructor validation', function () {
    it('throws for invalid source (number)', function () {
      assert.throws(
        () => new ParallelExecutor(42 as any, { workers: 1, executor: async () => {} }),
        (err: Error) => {
          assert.ok(err instanceof TypeError || err instanceof Error);
          return true;
        }
      );
    });

    it('throws for invalid source (plain object)', function () {
      assert.throws(
        () => new ParallelExecutor({} as any, { workers: 1, executor: async () => {} }),
        (err: Error) => {
          assert.strictEqual(err.message, 'invalid source of a parallel executor');
          return true;
        }
      );
    });

    it('accepts a sync generator', function () {
      const exec = new ParallelExecutor(range(5), { workers: 1, executor: async () => {} });
      assert.ok(exec);
    });

    it('accepts an async iterable', function () {
      const asyncIterable = {
        async *[Symbol.asyncIterator]() { yield 1; yield 2; }
      };
      const exec = new ParallelExecutor(asyncIterable, { workers: 1, executor: async () => {} });
      assert.ok(exec);
    });
  });

  describe('execute() return value', function () {
    it('returns 0 for an empty source', async function () {
      const result = await new ParallelExecutor([], { workers: 3, executor: async () => {} }).execute();
      assert.strictEqual(result, 0);
    });

    it('returns count for a single item', async function () {
      const result = await new ParallelExecutor([1], { workers: 1, executor: async () => {} }).execute();
      assert.strictEqual(result, 1);
    });

    it('returns count for a generator source', async function () {
      const result = await new ParallelExecutor(range(50), {
        workers: 5,
        executor: async () => {}
      }).execute();
      assert.strictEqual(result, 50);
    });

    it('returns count for an array source', async function () {
      const items = [1, 2, 3, 4, 5];
      const result = await new ParallelExecutor(items, {
        workers: 2,
        executor: async () => {}
      }).execute();
      assert.strictEqual(result, 5);
    });
  });

  describe('default executor (no options.executor)', function () {
    it('executes async functions from source', async function () {
      let callCount = 0;
      const fns = [1, 2, 3].map(() => async () => { callCount++; });
      const result = await new ParallelExecutor(fns).execute();
      assert.strictEqual(result, 3);
      assert.strictEqual(callCount, 3);
    });

    it('awaits promises from source', async function () {
      let resolved = 0;
      const promises = [1, 2, 3].map(() => new Promise<void>(r => { resolved++; r(); }));
      const result = await new ParallelExecutor(promises).execute();
      assert.strictEqual(result, 3);
      assert.strictEqual(resolved, 3);
    });
  });

  describe('concurrency limit', function () {
    it('respects the workers concurrency limit', async function () {
      const workersCount = 3;
      const itemsCount = 10;
      const arrived = barrier(workersCount);
      const release = deferred<void>();

      const counter = countingExecutor<number>(async () => {
        await arrived.arrive();
        await release.promise;
      });

      const exec = new ParallelExecutor(range(itemsCount), {
        workers: workersCount,
        executor: counter.wrapped,
      });

      const runPromise = exec.execute();
      await arrived.promise;
      assert.strictEqual(counter.inFlight, workersCount);
      assert.strictEqual(counter.maxInFlight, workersCount);

      release.resolve();
      const processed = await runPromise;
      assert.strictEqual(processed, itemsCount);
      assert.strictEqual(counter.maxInFlight, workersCount);
    });

    it('works with workers=1 (sequential)', async function () {
      const counter = countingExecutor<number>(async () => {});
      const result = await new ParallelExecutor(range(5), {
        workers: 1,
        executor: counter.wrapped
      }).execute();
      assert.strictEqual(result, 5);
      assert.strictEqual(counter.maxInFlight, 1);
    });

    it('works with high worker count exceeding items', async function () {
      const counter = countingExecutor<number>(async () => {});
      const result = await new ParallelExecutor(range(3), {
        workers: 100,
        executor: counter.wrapped
      }).execute();
      assert.strictEqual(result, 3);
      assert.ok(counter.maxInFlight <= 3);
    });
  });

  describe('waitFinished', function () {
    it('resolves when execution completes before timeout', async function () {
      const exec = new ParallelExecutor(range(5), {
        workers: 5,
        executor: async () => {}
      });

      exec.execute();
      const start = Date.now();
      await exec.waitFinished(3000);
      const elapsed = Date.now() - start;
      assert.ok(elapsed < 500, `expected <500ms, got ${elapsed}ms`);
    });

    it('rejects with Timeout when execution exceeds timeout', async function () {
      const hold = deferred<void>();
      const exec = new ParallelExecutor([1], {
        workers: 1,
        executor: async () => { await hold.promise; }
      });

      exec.execute();
      await assert.rejects(
        exec.waitFinished(50),
        (err: Error) => {
          assert.strictEqual(err.message, 'Timeout');
          return true;
        }
      );
      hold.resolve();
    });
  });

  describe('boundary workers values', function () {
    it('handles workers=0 gracefully (resolves with 0 processed)', async function () {
      const result = await new ParallelExecutor(range(5), {
        workers: 0,
        executor: async () => {}
      }).execute();
      assert.strictEqual(result, 0);
    });
  });
});
