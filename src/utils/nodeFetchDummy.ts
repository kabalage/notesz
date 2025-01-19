// octokit/request always tries to import node-fetch, this is a dummy module to satisfy the bundler
// 'node-fetch' is aliased to this file in vite.config.ts
export default () => {};
