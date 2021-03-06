import { faReddit } from '@fortawesome/free-brands-svg-icons/faReddit';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import cn from 'classnames';
import { FC, useEffect, useState } from 'react';
import { cancelable } from '~/platform/utils/cancelable';
import { getPreloadedIconSrc } from './utils/getPreloadedIconSrc';

import styles from './Icon.module.scss';

export const Icon: FC<Props> = ({ active = true, subreddit }) => {
  const [src, setSrc] = useState<string>();

  useEffect(() => {
    const [srcPromise, cancelSrcPromise] = cancelable(
      getPreloadedIconSrc(subreddit)
    );

    setSrc(undefined);
    srcPromise.then(setSrc);

    return cancelSrcPromise;
  }, [subreddit]);

  return (
    <figure className={styles.iconContainer}>
      {src ? (
        <img
          alt="icon"
          className={cn(styles.icon, { [styles.active]: active })}
          src={src}
        />
      ) : (
        <FontAwesomeIcon
          className={cn(styles.defaultIcon, {
            [styles.active]: active,
          })}
          icon={faReddit}
        />
      )}
    </figure>
  );
};

interface Props {
  active?: boolean;
  subreddit: string;
}
