interface DiscordComponentEmbedOptions {
  previewImageUrl: string;
  siteUrl: string;
  themeColor: string;
}

export const getDiscordComponentEmbed = ({
  previewImageUrl,
  siteUrl,
  themeColor,
}: DiscordComponentEmbedOptions) => {
  const buttons = [
    {
      type: 2,
      style: 5,
      url: siteUrl,
      label: "Come look at my site!",
    },
  ];

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
        {
          type: 1,
          components: buttons,
        },
      ],
    },
  };
};
