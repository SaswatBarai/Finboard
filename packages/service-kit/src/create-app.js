import { createServiceApp } from "@finboard/shared";

export function createApp({ serviceName, clientOrigins, routes = [], staticDirs = [] }) {
  return createServiceApp({ serviceName, clientOrigins, routes, staticDirs });
}
