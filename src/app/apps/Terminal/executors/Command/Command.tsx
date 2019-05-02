import React from 'react';
import { Executor, ExecutorType } from '../executor';
import styles from './Command.module.scss';

export const Command: Executor = ({ args }) => (
  <p className={styles.command}>
    <span>{args[0]}</span>
    <span className={styles.separator}>$ </span>
    <span>{args[1]}</span>
  </p>
);

Command.type = ExecutorType.Sync;