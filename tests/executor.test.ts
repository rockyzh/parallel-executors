import * as assert from 'assert';

import ParallelExecutor from '../src/parallel_executor';

function *sources() {
  for (let i = 0; i < 100; i++) {
    yield i;
  }
}

function sleep(timeout: number) {
  return new Promise(resolve => {
    setTimeout(resolve, timeout);
  });
}

describe('parallel executors test', function () {
  describe('raw', function () {
    it('should return the same amount of tasks', async function () {
      const executor = new ParallelExecutor(sources(), {
        workers: 3,
        executor: async () => {
          await sleep(100);
        }
      });

      assert(await executor.execute() === 100);
    });
  });
});
