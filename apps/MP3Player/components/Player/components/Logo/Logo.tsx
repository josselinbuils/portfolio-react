import { faHeadphones } from '@fortawesome/free-solid-svg-icons/faHeadphones';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FC } from 'react';

import styles from './Logo.module.scss';

export const Logo: FC = () => (
  <figure className={styles.logo}>
    <FontAwesomeIcon icon={faHeadphones} />
  </figure>
);
