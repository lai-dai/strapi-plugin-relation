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
      name: 'strapi-plugin-relation',
      pluginId: PLUGIN_ID,
      type: 'json',
      intlLabel: {
        id: getTranslation('settings.title'),
        defaultMessage: 'Choose Relation Field',
      },
      intlDescription: {
        id: getTranslation('settings.description'),
        defaultMessage: 'Choose Relation Field',
      },
      icon: PluginIcon,
      components: {
        Input: async () =>
          import('./components/relation-field').then((module) => ({
            default: module.ChooseRelationField,
          })),
      },
      options: {
        advanced: [
          {
            intlLabel: {
              id: getTranslation('settings.title'),
              defaultMessage: 'Relation Name',
            },
            name: 'options.relation_name',
            type: 'text',
          },
          {
            intlLabel: {
              id: getTranslation('settings.title'),
              defaultMessage: 'Relation Main Field',
            },
            name: 'options.relation_main_field',
            type: 'text',
          },
          {
            intlLabel: {
              id: getTranslation('settings.title'),
              defaultMessage: 'Hidden Relation Input',
            },
            name: 'options.relation_hidden',
            type: 'checkbox',
          },
          {
            intlLabel: {
              id: getTranslation('settings.title'),
              defaultMessage: 'Relation Type',
            },
            name: 'options.relation_type',
            type: 'select',
            value: 'single',
            options: [
              {
                key: 'single',
                defaultValue: 'single',
                value: 'single',
                metadatas: {
                  intlLabel: {
                    id: getTranslation('settings.title'),
                    defaultMessage: 'Single',
                  },
                },
              },
              {
                key: 'multiple',
                value: 'multiple',
                metadatas: {
                  intlLabel: {
                    id: getTranslation('settings.title'),
                    defaultMessage: 'multiple',
                  },
                },
              },
            ],
          },
          {
            intlLabel: {
              id: getTranslation('settings.title'),
              defaultMessage: 'Select Relation Path',
            },
            name: 'options.select_relation_path',
            type: 'text',
          },
          {
            intlLabel: {
              id: getTranslation('settings.title'),
              defaultMessage: 'Selected Relation Path',
            },
            intlDescription: {
              id: getTranslation('settings.description'),
              defaultMessage: 'Use Relation Single Type',
            },
            name: 'options.selected_relation_path',
            type: 'text',
          },
          {
            intlLabel: {
              id: getTranslation('settings.title'),
              defaultMessage: 'Parent Relation Name',
            },
            name: 'options.parent_relation_name',
            type: 'text',
          },
          {
            intlLabel: {
              id: getTranslation('settings.title'),
              defaultMessage: 'Selected Parent Relation Path',
            },
            name: 'options.selected_parent_relation_path',
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
