import React, { FC, useContext } from 'react';
import { Controls, MusicPreview, SeekBar } from '~/apps/MP3Player/components';
import { AudioContext } from '~/apps/MP3Player/components/AudioProvider';
import styles from './Footer.module.scss';
import { MusicInfo } from './MusicInfo';

export const Footer: FC<Props> = ({ onClickTogglePlaylist }) => {
  const { audioState } = useContext(AudioContext);

  if (audioState === undefined) {
    return null;
  }

  const { currentMusic } = audioState;

  return (
    <footer className={styles.footer}>
      <MusicPreview music={currentMusic} size={50} />
      <MusicInfo music={currentMusic} />
      <div className={styles.grow}>
        <Controls size={40} />
        <SeekBar onClickTogglePlaylist={onClickTogglePlaylist} />
      </div>
    </footer>
  );
};

interface Props {
  onClickTogglePlaylist(): void;
}
