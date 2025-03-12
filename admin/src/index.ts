import { getTranslation } from './utils/getTranslation';
import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';
import { PluginIcon } from './components/PluginIcon';

export default {
  register(app: any) {
    // app.addMenuLink({
    //   to: `plugins/${PLUGIN_ID}`,
    //   icon: PluginIcon,
    //   intlLabel: {
    //     id: `${PLUGIN_ID}.plugin.name`,
    //     defaultMessage: PLUGIN_ID,
    //   },
    //   Component: async () => {
    //     const { App } = await import('./pages/App');

    //     return App;
    //   },
    // });

    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });

    app.customFields.register({
      name: 'relation',
      pluginId: PLUGIN_ID,
      type: 'json',
      intlLabel: {
        id: getTranslation('settings.title'),
        defaultMessage: 'Target',
      },
      intlDescription: {
        id: getTranslation('settings.description'),
        defaultMessage: 'Target Relation',
      },
      icon: PluginIcon,
      components: {
        Input: async () =>
          import('./components/relation-field').then((module) => ({
            default: module.MyInputField,
          })),
      },
      options: {
        advanced: [
          {
            intlLabel: {
              id: getTranslation('settings.title'),
              defaultMessage: 'Target Relation',
            },
            intlDescription: {
              id: getTranslation('settings.description'),
              defaultMessage: 'Your Relation',
            },
            name: 'options.target_name',
            type: 'text',
          },
          {
            intlLabel: {
              id: getTranslation('settings.title'),
              defaultMessage: 'Relation Parent',
            },
            intlDescription: {
              id: getTranslation('settings.description'),
              defaultMessage: 'Your Relation',
            },
            name: 'options.parent_name',
            type: 'text',
          },
        ],
      },
    });
  },

  async registerTrads({ locales }: { locales: string[] }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await import(`./translations/${locale}.json`);

          return { data, locale };
        } catch {
          return { data: {}, locale };
        }
      })
    );
  },
};
