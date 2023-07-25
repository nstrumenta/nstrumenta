import { asyncSpawn } from './AsyncSpawn';

export const pollNstrumenta = async ({
  matchString,
  interval = 1000,
  timeout = 10000,
  command = 'data list',
}): Promise<string> => {
  const start = Date.now();
  let lastPollTime = start;
  console.log('starting polling for data...', { matchString });

  const response = await new Promise<string>(async function poll(resolve, reject) {
    await process.nextTick(() => {});
    const result = await asyncSpawn('nst', command.split(' '), { quiet: true });
    if (result.match(matchString)) {
      resolve(result);
      return;
    } else {
      if (Date.now() - start < timeout) {
        await new Promise((resolve) =>
          // wait enough time to fill the interval
          setTimeout(resolve, Math.max(0, interval - (Date.now() - lastPollTime)))
        );
        lastPollTime = Date.now();
        poll(resolve, reject);
      } else {
        console.error('exceeded timeout ', timeout);
        reject();
        return;
      }
    }
  });

  console.log('polling done', {
    requiredString: matchString,
    elapsed: Date.now() - start,
  });
  return response;
};
