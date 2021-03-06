import { faJsSquare } from '@fortawesome/free-brands-svg-icons/faJsSquare';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import cn from 'classnames';
import { ButtonHTMLAttributes, FC } from 'react';

import styles from './Tab.module.scss';

export const Tab: FC<Props> = ({
  children,
  className,
  selected,
  ...forwardedProps
}) => (
  <button
    aria-selected={selected}
    className={cn(styles.tab, className)}
    role="tab"
    type="button"
    {...forwardedProps}
  >
    <FontAwesomeIcon className={styles.icon} icon={faJsSquare} />
    {children}
  </button>
);

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean;
}
