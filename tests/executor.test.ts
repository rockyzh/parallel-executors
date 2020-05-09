import * as assert from 'assert';

import ParallelExecutor from '../src/parallel_executor';


function sleep(timeout: number) {
  return new Promise(resolve => {
    setTimeout(resolve, timeout);
  });
}

describe('parallel executors test', function () {
  describe('generator', function () {
    function* sources(count: number) {
      for (let i = 0; i < count; i++) {
        yield i;
      }
    }

    it('should run for generator', async function () {
      assert(await new ParallelExecutor(sources(100), {
        workers: 3,
        executor: async () => {
          await sleep(10);
        }
      }).execute() === 100, 'should run all tasks');

      assert(await new ParallelExecutor(sources(1000), {
        workers: 100,
        executor: async () => {
          await sleep(10);
        }
      }).execute() === 1000, 'should run all tasks');
    });
  });

  describe('iterable', function () {
    const obj = {
      *[ Symbol.iterator ]() {
        for (let i = 0; i < 100; i++) {
          yield i;
        }
      }
    }

    it('should run for iterable', async function () {
      assert(await new ParallelExecutor(obj, {
        workers: 3,
        executor: async () => {
          await sleep(10);
        }
      }).execute() === 100, 'should run all tasks');
    });
  });

  describe('async iterable', function () {
    const obj = {
      async *[ Symbol.asyncIterator ]() {
        for (let i = 0; i < 10; i++) {
          yield (async (index: number) => {
            console.info('async iterable', index);
            await sleep(100);
          })(i);
        }
      }
    }

    it('should run for iterable', async function () {
      assert(await new ParallelExecutor(obj, {
        workers: 2
      }).execute() === 10, 'should run all tasks');
    });
  });


  describe('array', function () {
    const cases = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];

    it('should run for array', async function () {
      assert(await new ParallelExecutor(cases, {
        workers: 3,
        executor: async (item: number) => {
          // console.info(item);
          await sleep(10);
        }
      }).execute() === cases.length, 'should run all tasks');

      assert(await new ParallelExecutor(cases, {
        workers: 1,
        executor: async (item: number) => {
          // console.info(item);
          await sleep(10);
        }
      }).execute() === cases.length, 'should run all tasks');
    });
  });

  describe('run async functions', function () {
    const cases = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ].map(value => (async () => { console.info('async function', value); await sleep(10); }));

    it('should run all async functions', async function () {
      assert(await new ParallelExecutor(cases).execute() === cases.length, 'should run all tasks');
    });
  });

  describe('run promises', function () {
    const cases = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ].map(value => (async () => { console.info('promise', value); await sleep(10); })());

    it('should run all promises', async function () {
      assert(await new ParallelExecutor(cases).execute() === cases.length, 'should run all tasks');
    });
  });

  describe('run exception', function () {
    const cases = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];

    it('should run for generator', async function () {
      const error = new Error('run error');
      const executor = new ParallelExecutor(cases, {
        workers: 3,
        executor: async (item: number) => {
          throw error;
        }
      });

      await assert.rejects(executor.execute(), error);
    });
  });
});
