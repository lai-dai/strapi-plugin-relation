import { Status, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';

const capitalise = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);

type StatusSize = 'XS' | 'S' | 'M';

interface DocumentStatusProps {
  /**
   * The status of the document (draft, published, etc.)
   * @default 'draft'
   */
  status?: string;
  size?: StatusSize;
}

/**
 * @public
 * @description Displays the status of a document (draft, published, etc.)
 * and automatically calculates the appropriate variant for the status.
 */
const DocumentStatus = ({ status = 'draft', size = 'S' }: DocumentStatusProps) => {
  const statusVariant =
    status === 'draft' ? 'secondary' : status === 'published' ? 'success' : 'alternative';

  const { formatMessage } = useIntl();

  return (
    <Status size={size} variant={statusVariant} role="status" aria-labelledby="document-status">
      <Typography tag="span" variant="omega" fontWeight="bold" id="document-status">
        {formatMessage({
          id: `content-manager.containers.List.${status}`,
          defaultMessage: capitalise(status),
        })}
      </Typography>
    </Status>
  );
};

export { DocumentStatus };
export type { DocumentStatusProps };
