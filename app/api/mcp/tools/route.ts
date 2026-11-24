import { z } from 'zod';
import { api, localMutation } from '@/lib/http';
import { runTool, toolNames } from '@/mcp/workload-server/tools';
export async function POST(request: Request) {
  return api(async () => {
    localMutation(request);
    const input = z
      .object({ tool: z.enum(toolNames), arguments: z.unknown() })
      .strict()
      .parse(await request.json());
    return runTool(input.tool, input.arguments);
  });
}
