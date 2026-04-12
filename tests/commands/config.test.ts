import { describe, expect, it } from "vitest";
import { data } from "../../src/bot/commands/config.js";

describe("/config command definition", () => {
  it("has the correct name", () => {
    expect(data.name).toBe("config");
  });

  it("requires ManageGuild permission", () => {
    const json = data.toJSON();
    // ManageGuild permission flag is 0x20 = 32
    expect(json.default_member_permissions).toBe("32");
  });

  it("has view and set subcommands", () => {
    const json = data.toJSON();
    const subcommands = json.options?.map((o: { name: string }) => o.name);
    expect(subcommands).toContain("view");
    expect(subcommands).toContain("set");
  });
});
