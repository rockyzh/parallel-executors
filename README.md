# ParallelExecutors

[![npm version](https://badge.fury.io/js/parallel-executors.svg)](https://badge.fury.io/js/parallel-executors)
[![TypeScript](https://badgen.net/badge/icon/TypeScript?icon=typescript&label)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

ParallelExecutors is an NPM package implemented in Typescript for executing a set of Promises with a given concurrency limit.

This project is inspired by https://itnext.io/node-js-handling-asynchronous-operations-in-parallel-69679dfae3fc

## Table of Contents
- [ParallelExecutors](#parallelexecutors)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Usage](#usage)
  - [License](#license)

## Installation

Install it on your project
```Shell
npm install --save parallel-executors
```

## Usage
**Usage with Typescript**

```typescript
import ParallelExecutor from 'parallel-executors';

...

await new ParallelExecutor([...], {
  workers: 3,
  executor: async (item) => {
    ...
  }
}).execute();

```

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details