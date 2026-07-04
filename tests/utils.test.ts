import * as assert from 'assert';
import { sleep } from '../src/utils';

describe('utils', function () {
  describe('sleep()', function () {
    it('resolves after the given delay', async function () {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;
      assert.ok(elapsed >= 40, `expected >=40ms, got ${elapsed}ms`);
    });

    it('resolves with no error when throwTimeout is false', async function () {
      await sleep(10, false);
    });

    it('rejects with Timeout error when throwTimeout is true', async function () {
      await assert.rejects(
        sleep(10, true),
        (err: Error) => {
          assert.strictEqual(err.message, 'Timeout');
          return true;
        }
      );
    });
  });
});
