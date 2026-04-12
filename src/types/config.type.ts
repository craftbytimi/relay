export interface RelayConfig {
  relayId: string;
  welcomeMessage: string;
  welcomeChannelId: string;
  modLogChannelId: string;
}

export interface UpdateRelayConfigInput {
  welcomeMessage?: string;
  welcomeChannelId?: string;
  modLogChannelId?: string;
}
