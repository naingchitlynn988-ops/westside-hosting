/*
 * Safe boundary for connecting a real Minecraft orchestration system later.
 *
 * This starter intentionally DOES NOT run Docker commands, expose a daemon,
 * or start arbitrary processes from HTTP requests. Connect a properly secured
 * orchestration panel/API here after the infrastructure has been installed.
 */

export const provisioner = {
  async createServer(server) {
    // TODO: call your private orchestration service from the backend only.
    return { ...server, status: "stopped", runtime: "not-connected" };
  },

  async getStatus(server) {
    // TODO: fetch live status from the orchestration service.
    return { id: server.id, status: server.status, runtime: "not-connected" };
  },

  async setPower(server, action) {
    // TODO: send a validated start/stop action to the orchestration service.
    return { id: server.id, status: server.status, requestedAction: action, runtime: "not-connected" };
  }
};
