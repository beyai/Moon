const egg = require('egg')
// process.env.NODE_ENV = 'production';
egg.startCluster({
    env: 'prod',
    baseDir: __dirname,
    startMode: 'worker_threads',
    workers: 2,
});