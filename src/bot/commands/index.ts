import * as ping from "./ping.js";
import * as config from "./config.js";
import * as remind from "./remind.js";
import * as mod from "./mod.js";

export const commands = new Map([
  [ping.data.name, ping],
  [config.data.name, config],
  [remind.data.name, remind],
  [mod.data.name, mod],
]);
