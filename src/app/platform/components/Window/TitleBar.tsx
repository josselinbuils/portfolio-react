import { faMinus, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import cn from 'classnames';
import React, { FC, MouseEvent } from 'react';
import styles from './TitleBar.module.scss';

export const TitleBar: FC<Props> = ({
  background,
  color,
  frozen,
  maximized,
  onClose,
  onMinimise,
  onMoveStart,
  onToggleMaximize,
  showMaximizeButton,
  title
}) => (
  <header
    className={cn(styles.titlebar, { [styles.maximized]: maximized })}
    style={{ background, color }}
  >
    <div className={cn(styles.buttons, { [styles.frozen]: frozen })}>
      <button
        className={cn(styles.button, styles.close)}
        onClick={onClose}
        style={{ color }}
      >
        <FontAwesomeIcon icon={faTimes} />
      </button>
      <button
        className={cn(styles.button, styles.minimize)}
        onClick={onMinimise}
        style={{ color }}
      >
        <FontAwesomeIcon icon={faMinus} />
      </button>
      {showMaximizeButton && (
        <button
          className={cn(styles.button, styles.maximize)}
          onClick={onToggleMaximize}
          style={{ color }}
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      )}
    </div>
    <div
      className={styles.movingArea}
      onMouseDown={onMoveStart}
      onDoubleClick={onToggleMaximize}
    >
      {title}
    </div>
  </header>
);

interface Props {
  background?: string;
  color: string;
  frozen: boolean;
  maximized: boolean;
  showMaximizeButton: boolean;
  title: string;
  onClose(): void;
  onMinimise(): void;
  onMoveStart(downEvent: MouseEvent): void;
  onToggleMaximize(): void;
}