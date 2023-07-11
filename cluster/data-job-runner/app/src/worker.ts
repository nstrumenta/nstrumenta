import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  // Step 1: Register Workflows and Activities with the Worker and connect to
  // the Temporal server.
  const connection = await NativeConnection.connect({
    address: process.env.NSTRUMENTA_TEMPORAL_ADDRESS,
    tls: false,
  });

  const worker = await Worker.create({
    connection,
    workflowsPath: require.resolve('./workflows'),
    interceptors: { workflowModules: [require.resolve('./interceptors')] },
    activities,
    taskQueue: process.env.TASK_QUEUE!,
  });
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
