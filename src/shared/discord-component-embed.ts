import type { ActivityPresentation } from "./activity-presentation";

interface DiscordComponentEmbedOptions {
  presentation: ActivityPresentation;
  previewImageUrl: string;
  siteUrl: string;
  themeColor: string;
}

const discordMarkdownSpecialCharacters = new Set([
  "\\",
  String.fromCharCode(96),
  "*",
  "_",
  "{",
  "}",
  "[",
  "]",
  "(",
  ")",
  "#",
  "+",
  "-",
  ".",
  "!",
  "|",
  ">",
  "~",
]);

const escapeDiscordMarkdown = (value: string): string =>
  [...value]
    .map((character) =>
      discordMarkdownSpecialCharacters.has(character)
        ? `\\${character}`
        : character,
    )
    .join("");

export const getDiscordComponentEmbed = ({
  presentation,
  previewImageUrl,
  siteUrl,
  themeColor,
}: DiscordComponentEmbedOptions) => {
  const activityDetails =
    presentation.details === undefined
      ? ""
      : `\n${escapeDiscordMarkdown(presentation.details)}`;
  const activityDuration = `${presentation.elapsed}${
    presentation.total === undefined ? "" : ` / ${presentation.total}`
  } ${presentation.timeSuffix}`;
  const activityText = presentation.active
    ? `## Now playing\n**${escapeDiscordMarkdown(presentation.name)}**${activityDetails}\n${escapeDiscordMarkdown(presentation.label)} ${activityDuration}`
    : "## Now playing\n**Taking a breather**\nNot doing anything right now :p";
  const activityComponent =
    presentation.active && presentation.imageUrl !== undefined
      ? {
          type: 9,
          components: [{ type: 10, content: activityText }],
          accessory: {
            type: 11,
            media: { url: presentation.imageUrl },
            description: "Current activity artwork",
          },
        }
      : { type: 10, content: activityText };
  const buttons = [
    {
      type: 2,
      style: 5,
      url: siteUrl,
      label: "Come look at my site!",
    },
  ];

  if (presentation.active && presentation.href !== undefined) {
    buttons.push({
      type: 2,
      style: 5,
      url: presentation.href,
      label: "Open activity",
    });
  }

  return {
    component: {
      type: 17,
      accent_color: Number.parseInt(themeColor.slice(1), 16),
      components: [
        {
          type: 9,
          components: [
            {
              type: 10,
              content:
                "# logix.wtf\nCertified professional keyboard user",
            },
          ],
          accessory: {
            type: 11,
            media: { url: previewImageUrl },
            description: "logix's profile picture",
          },
        },
        activityComponent,
        {
          type: 1,
          components: buttons,
        },
      ],
    },
  };
};
