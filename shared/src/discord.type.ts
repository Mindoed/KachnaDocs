import { DiscordProfile } from "discord-strategy";

/**
 * Represents the data returned from Discord after a successful OAuth2 authentication.
 * Uses the DiscordProfile interface from the discord-strategy package and extends it with additional guild information.
 * @property {Object} guild - The guild information associated with the authenticated user.
 * @property {string} guild.id - The unique identifier of the guild.
 * @property {string} guild.name - The name of the guild.
 * @property {string | null} guild.icon - The icon hash of the guild, or null if not available.
 * @property {string | null} guild.banner - The banner hash of the guild, or null if not available.
 */
export interface DiscordData extends DiscordProfile {
  guild: {
    id: string;
    name: string;
    icon: string | null;
    banner: string | null;
  };
}
