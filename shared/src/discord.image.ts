enum FORMAT {
  webp = "webp",
  png = "png",
  jpg = "jpg",
  jpeg = "jpeg",
  gif = "gif",
}

enum IMAGE_TYPE {
  avatar = "avatars",
  icon = "icons",
  banner = "banners",
}

class DiscordImage {
  protected static baseFormat: FORMAT = FORMAT.webp;
  protected static baseUrl: string = "https://cdn.discordapp.com";

  protected static getImageUrl(
    imageType: IMAGE_TYPE,
    actorId: string | null | undefined,
    imageId: string | null | undefined,
    size?: number,
    format?: FORMAT,
  ): string {
    const sizeParam = size ? `?size=${size}` : "";
    const formatParam = format ?? this.baseFormat;
    console.log(
      `[DiscordImage] Generating URL for ${imageType} with actorId: ${actorId}, imageId: ${imageId}, size: ${sizeParam}, format: ${formatParam}`,
    );

    if (!actorId || !imageId) {
      return "";
    }

    return `${this.baseUrl}/${imageType}/${actorId}/${imageId}.${formatParam}${sizeParam}`;
  }
}

class DiscordAvatar extends DiscordImage {
  public static getUrl(
    userId: string | null | undefined,
    avatarId: string | null | undefined,
    size?: number,
    format?: FORMAT,
  ): string {
    return super.getImageUrl(IMAGE_TYPE.avatar, userId, avatarId, size, format);
  }
}

class DiscordIcon extends DiscordImage {
  public static getUrl(
    guildId: string | null | undefined,
    iconId: string | null | undefined,
    size?: number,
    format?: FORMAT,
  ): string {
    return super.getImageUrl(IMAGE_TYPE.icon, guildId, iconId, size, format);
  }
}

class DiscordBanner extends DiscordImage {
  public static getUrl(
    guildId: string | null | undefined,
    bannerId: string | null | undefined,
    size?: number,
    format?: FORMAT,
  ): string {
    return super.getImageUrl(IMAGE_TYPE.banner, guildId, bannerId, size, format);
  }
}

class DiscordUserAvatar extends DiscordAvatar {}
class DiscordGuildIcon extends DiscordIcon {}

export { DiscordAvatar, DiscordIcon, DiscordBanner, DiscordUserAvatar, DiscordGuildIcon };
