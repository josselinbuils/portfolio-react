import React, { MutableRefObject, useEffect, useState } from 'react';
import { useList } from '~/platform/hooks';
import { AsyncExecutor } from '../AsyncExecutor';
import { BMError, BuildManagerClient, MessageType } from './BuildManagerClient';
import { Log } from './Log';
import { formatLogs, hasOption } from './utils';

import styles from './BuildManager.module.scss';

const CODE_UNAUTHORIZED = 401;
const DEFAULT_ERROR_MESSAGE = 'An error occurred';

enum Command {
  Build = 'build',
  Login = 'login',
  Logs = 'logs',
}

const authTokenRef = { current: undefined } as MutableRefObject<
  string | undefined
>;

export const BuildManager: AsyncExecutor = ({
  alive,
  args,
  onQueryUser,
  onRelease,
}) => {
  const [errorMessage, setErrorMessage] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const [showHelp, setShowHelp] = useState(false);
  const [bmClient, setBMClient] = useState<BuildManagerClient>();
  const [logs, logManager] = useList<Log>();
  const command = args[0];

  useEffect(() => {
    const errorHandler = (error?: BMError) => {
      if (error?.code === CODE_UNAUTHORIZED) {
        authTokenRef.current = undefined;
      }

      setErrorMessage(error?.message || DEFAULT_ERROR_MESSAGE);
      onRelease();
    };

    switch (command) {
      case Command.Build: {
        const client = new BuildManagerClient();

        client
          .onError(errorHandler)
          .onClose(onRelease)
          .onMessage(({ type, value }) => {
            if (type === MessageType.Logs) {
              logManager.push(...formatLogs(value, styles.stepNumber));
            }
          })
          .waitUntilReady()
          .then(() =>
            client.send(MessageType.Command, {
              authToken: authTokenRef.current,
              args: args.slice(1),
              command: Command.Build,
            })
          );

        setBMClient(client);
        break;
      }

      case Command.Login: {
        onQueryUser(
          'password:',
          (password) => {
            const client = new BuildManagerClient();

            client
              .onError(errorHandler)
              .onClose(onRelease)
              .onMessage(({ type, value }) => {
                if (type === MessageType.AuthToken) {
                  authTokenRef.current = value;
                } else if (type === MessageType.Success) {
                  setSuccessMessage(value);
                  onRelease();
                }
              })
              .waitUntilReady()
              .then(() =>
                client.send(MessageType.Command, {
                  command: Command.Login,
                  args: [password],
                })
              );

            setBMClient(client);
          },
          true
        );
        break;
      }

      case Command.Logs: {
        const client = new BuildManagerClient();

        client
          .onError(errorHandler)
          .onClose(onRelease)
          .onMessage(({ value: lastLogs }) => {
            const follow = hasOption(args, 'follow');

            logManager.push(...formatLogs(lastLogs, styles.stepNumber));

            if (!follow) {
              onRelease();
            }
          })
          .waitUntilReady()
          .then(() =>
            client.send(MessageType.Command, { command: Command.Logs })
          );

        setBMClient(client);
        break;
      }

      default:
        setShowHelp(true);
        onRelease();
    }
  }, [args, command, logManager, onQueryUser, onRelease]);

  useEffect(() => {
    if (!alive) {
      bmClient?.stop();
    }
  }, [alive, bmClient]);

  if (errorMessage) {
    return <p className={styles.error}>✘ {errorMessage}</p>;
  }

  if (successMessage) {
    return <p className={styles.success}>✔ {successMessage}</p>;
  }

  if (showHelp) {
    return (
      <div className={styles.help}>
        <p>Usage: bm command [args]</p>
        <p>Commands:</p>
        <p className={styles.command}>- build repository</p>
        <p className={styles.command}>- login</p>
        <p className={styles.command}>- logs [-f, --follow]</p>
      </div>
    );
  }

  if (logs.length > 0) {
    return (
      <>
        {logs.map(({ data, id }) => (
          <p dangerouslySetInnerHTML={{ __html: data }} key={id} />
        ))}
      </>
    );
  } else if (command === Command.Logs && !alive) {
    return <p>No log to display</p>;
  }

  return null;
};

BuildManager.async = true;
