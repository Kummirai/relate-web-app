type RouteHandler<A extends unknown[]> = (...args: A) => Response | Promise<Response>;

export function withCpuTiming<A extends unknown[]>(
  route: string,
  handler: RouteHandler<A>,
): RouteHandler<A> {
  if (process.env.BACKEND_CPU_TIMING !== "1") return handler;

  return (async (...args: A) => {
    const startedAt = Date.now();
    const before = process.cpuUsage();
    let status = 0;

    try {
      const response = await handler(...args);
      status = response?.status ?? 0;
      return response;
    } catch (error) {
      status = -1;
      throw error;
    } finally {
      const used = process.cpuUsage(before);
      const cpuUserMs = Math.round(used.user / 10) / 100;
      const cpuSystemMs = Math.round(used.system / 10) / 100;
      console.info(
        JSON.stringify({
          event: "backend_cpu_timing",
          route,
          status,
          wallMs: Date.now() - startedAt,
          cpuUserMs,
          cpuSystemMs,
          cpuTotalMs: Math.round((cpuUserMs + cpuSystemMs) * 100) / 100,
        }),
      );
    }
  }) as RouteHandler<A>;
}
