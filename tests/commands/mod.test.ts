import { describe, expect, it } from "vitest";
import { data } from "../../src/bot/commands/mod.js";
import { ApplicationCommandOptionType } from "discord.js";

describe("/mod command definition", () => {
  it("has the correct name", () => {
    expect(data.name).toBe("mod");
  });

  it("requires ModerateMembers permission", () => {
    const json = data.toJSON();
    // ModerateMembers permission flag is 0x10000000000 = 1099511627776
    expect(json.default_member_permissions).toBe("1099511627776");
  });

  it("has rule subcommand group with add, list, remove", () => {
    const json = data.toJSON();
    const ruleGroup = json.options?.find(
      (o) => o.name === "rule" && o.type === ApplicationCommandOptionType.SubcommandGroup,
    );
    expect(ruleGroup).toBeDefined();

    const subs = ruleGroup && "options" in ruleGroup
      ? ruleGroup.options?.map((o) => o.name)
      : [];
    expect(subs).toContain("add");
    expect(subs).toContain("list");
    expect(subs).toContain("remove");
  });

  it("has warn and history subcommands", () => {
    const json = data.toJSON();
    const names = json.options?.map((o) => o.name);
    expect(names).toContain("warn");
    expect(names).toContain("history");
  });
});
