import { proxyActivities } from '@temporalio/workflow'
// Only import the activity types
import type * as activities from './activities'

const { createRunModuleTask } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
})

/** A workflow that simply calls an activity */
export async function createRunModule(
  moduleName: string,
  version: string,
  args: string[],
): Promise<string> {
  return await createRunModuleTask(moduleName, version, args)
}
