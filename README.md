# ParallelExecutors

[![npm version](https://badge.fury.io/js/parallel-executors.svg)](https://badge.fury.io/js/parallel-executors)
[![TypeScript](https://badgen.net/badge/icon/TypeScript?icon=typescript&label)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

ParallelExecutors can run a series of tasks/promises with a concurrency limit.

## Table of Contents
- [ParallelExecutors](#parallelexecutors)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Examples with Typescript](#examples-with-typescript)
  - [Notice](#notice)
  - [License](#license)

## Installation

Install it on your project
```Shell
npm install --save parallel-executors
```

## Examples with Typescript
**run all promises or async functions in an array**

```typescript
import ParallelExecutor from 'parallel-executors';

...

await new ParallelExecutor([...], {
  workers: 3
}).execute();

```

**run executors for all tasks in an iterable object**
```

function* sources(count: number) {
  for (let i = 0; i < count; i++) {
    yield i;
  }
}

await new ParallelExecutor(sources(100), {
  workers: 10,
  executor: async (item: number) => {
    console.log(item);
    await sleep(10);
  }
}).execute();

```

## Notice

* Any task executor rejects may cause ParallelExecutor terminate.
* Task executor returns true value can break the ParallelExecutor process.

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details