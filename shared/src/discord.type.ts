/**
 * Represents relevant user's data returned from Discord after a successful OAuth2 authentication.
 * @property {string} id - The unique identifier of the authenticated user.
 * @property {string} username - The username of the authenticated user.
 * @property {string | null} avatar - The avatar hash of the authenticated user, or null if not available.
 * @property {string} discriminator - The discriminator of the authenticated user (the 4-digit number after the username).
 * @property {Object} guild - The guild information associated with the authenticated user.
 * @property {string} guild.id - The unique identifier of the guild.
 * @property {string} guild.name - The name of the guild.
 * @property {string | null} guild.icon - The icon hash of the guild, or null if not available.
 * @property {string | null} guild.banner - The banner hash of the guild, or null if not available.
 */
export interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
  discriminator: string;
  guild: {
    id: string;
    name: string;
    icon: string | null;
    banner: string | null;
  };
}

// NOTE: If you want to add more properties,
//  look into the DiscordProfile interface from discord-strategy package
