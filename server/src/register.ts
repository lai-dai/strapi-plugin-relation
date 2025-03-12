import type { Core } from '@strapi/strapi';
import { PLUGIN_ID } from '../../admin/src/pluginId';

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  // register phase
  strapi.customFields.register({
    name: 'relation',
    plugin: PLUGIN_ID,
    type: 'json', // The data type stored in the database
    inputSize: {
      default: 6,
      isResizable: false,
    },
  });
};

export default register;
