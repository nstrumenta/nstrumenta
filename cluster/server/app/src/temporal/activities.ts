import { Context } from '@temporalio/activity'

export async function createRunModuleTask(
  moduleName: string,
  version: string,
  args: string[],
): Promise<string> {
  const taskToken = Context.current().info.taskToken

  const taskTokenB64 = Buffer.from(taskToken).toString('base64')

  console.log({ taskToken, taskTokenB64, moduleName })

  return taskTokenB64
}
