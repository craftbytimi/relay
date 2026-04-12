import { describe, expect, it } from "vitest";
import type { RelayConfig, UpdateRelayConfigInput } from "../src/types/config.type.js";
import type { ReminderEntry, CreateReminderInput } from "../src/types/reminders.type.js";
import type { ModerationInput, ModerationResult } from "../src/types/moderation.type.js";

describe("type definitions", () => {
  it("RelayConfig has expected shape", () => {
    const config: RelayConfig = {
      relayId: "123",
      welcomeMessage: "Hello!",
      welcomeChannelId: "456",
      modLogChannelId: "789",
    };
    expect(config.relayId).toBe("123");
  });

  it("UpdateRelayConfigInput allows partial updates", () => {
    const input: UpdateRelayConfigInput = { welcomeMessage: "Hi" };
    expect(input.welcomeMessage).toBe("Hi");
    expect(input.welcomeChannelId).toBeUndefined();
  });

  it("ReminderEntry has expected shape", () => {
    const entry: ReminderEntry = {
      id: "abc",
      message: "test",
      dueAt: new Date(),
      channelId: "ch1",
      status: "PENDING",
      userId: "u1",
      relayId: "r1",
      createdAt: new Date(),
    };
    expect(entry.status).toBe("PENDING");
  });

  it("CreateReminderInput has expected shape", () => {
    const input: CreateReminderInput = {
      message: "test",
      dueAt: new Date(),
      channelId: "ch1",
      userId: "u1",
      username: "user",
      relayId: "r1",
      relayName: "My Server",
    };
    expect(input.relayName).toBe("My Server");
  });

  it("ModerationInput has expected shape", () => {
    const input: ModerationInput = {
      userId: "u1",
      username: "user",
      relayId: "r1",
      relayName: "Server",
      reason: "spam",
      moderatorId: "m1",
      moderatorUsername: "mod",
    };
    expect(input.reason).toBe("spam");
  });

  it("ModerationResult has expected shape", () => {
    const result: ModerationResult = {
      id: "abc",
      action: "WARN",
      reason: "spam",
      userId: "u1",
      moderatorId: "m1",
      relayId: "r1",
      createdAt: new Date(),
    };
    expect(result.action).toBe("WARN");
    expect(result.duration).toBeUndefined();
  });
});
