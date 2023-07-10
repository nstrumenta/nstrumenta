import {
  ActivityInput,
  Next,
  WorkflowOutboundCallsInterceptor,
  workflowInfo,
} from '@temporalio/workflow';

export class ActivityLogInterceptor implements WorkflowOutboundCallsInterceptor {
  constructor(public readonly workflowType: string) {}

  async scheduleActivity(
    input: ActivityInput,
    next: Next<WorkflowOutboundCallsInterceptor, 'scheduleActivity'>
  ): Promise<unknown> {
    console.log('Starting activity', { activityType: input.activityType });
    try {
      return await next(input);
    } finally {
      console.log('Completed activity', {
        workflow: this.workflowType,
        activityType: input.activityType,
      });
    }
  }
}

export const interceptors = () => ({
  outbound: [new ActivityLogInterceptor(workflowInfo().workflowType)],
  inbound: [],
});
