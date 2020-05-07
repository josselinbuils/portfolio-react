import { faCamera } from '@fortawesome/free-solid-svg-icons/faCamera';
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons/faFolderOpen';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { faStream } from '@fortawesome/free-solid-svg-icons/faStream';
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import cn from 'classnames';
import React, {
  ChangeEvent,
  DragEvent,
  FC,
  SyntheticEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useKeyMap, useList, useMemState } from '~/platform/hooks';
import { Position } from '~/platform/interfaces';
import { Toolbar, ToolButton } from '../../components';
import { Cursor, LineNumbers, Tab, Tabs } from './components';
import { INDENT } from './constants';
import { useAutoCompletion, useHistory, useSharedFile } from './hooks';
import { Completion } from './hooks/useAutoCompletion';
import { ClientCursor, ClientState } from './hooks/useSharedFile';
import { EditableState, EditorFile } from './interfaces';
import {
  autoEditChange,
  exportAsImage,
  fileSaver,
  formatCode,
  getDiff,
  getLineBeforeCursor,
  getLineIndent,
  getLineNumber,
  highlightCode,
  isCodePortionEnd,
  openFile,
  spliceString,
} from './utils';
import { canFormat } from './utils/formatCode';

import styles from './Editor.module.scss';

export const Editor: FC<Props> = ({
  className,
  code,
  onChange,
  onCursorPositionUpdate,
}) => {
  const [active, setActive] = useState(false);
  const [autoCompleteActive, setAutoCompleteActive] = useState(false);
  const [cursorOffset, setCursorOffset] = useState(0);
  const [cursorColor, setCursorColor] = useState('#f0f0f0');
  const [cursors, setCursors] = useState<ClientCursor[]>([]);
  const [displayDragOverlay, setDisplayDragOverlay] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState('');
  const [files, fileManager] = useList<EditorFile>(fileSaver.loadFiles);
  const [
    activeFileName,
    previouslyActiveFileName,
    setActiveFileName,
  ] = useMemState<string>(files[0].name);
  const [lineCount, setLineCount] = useState(1);
  const [scrollTop, setScrollTop] = useState(0);
  const codeElementRef = useRef<HTMLDivElement>(null);
  const textAreaElementRef = useRef<HTMLTextAreaElement>(null);
  const { complete, hasCompletionItems } = useAutoCompletion({
    active: autoCompleteActive,
    code,
    cursorOffset,
    lineIndent: getLineIndent(code, cursorOffset),
    menuClassName: styles.autoCompletionMenu,
    onCompletion: applyAutoCompletion,
    textAreaElement: textAreaElementRef.current as HTMLTextAreaElement,
  });
  const applyState = useCallback(
    (state: EditableState): void => {
      onChange(state.code);
      setCursorOffset(state.cursorOffset);
    },
    [onChange]
  );
  const { pushState } = useHistory({ fileName: activeFileName, applyState });
  const isSharedFileActive = activeFileName === 'shared.js';
  const { updateClientState, updateCursorOffset } = useSharedFile({
    active: isSharedFileActive,
    applyClientState,
    code,
    cursorOffset,
  });
  const updateState = useCallback(
    (newState: EditableState): void => {
      if (isSharedFileActive) {
        updateClientState(newState);
      } else {
        applyState(newState);
        pushState(newState);
      }
    },
    [applyState, isSharedFileActive, pushState, updateClientState]
  );
  const activeFile = files.find(
    ({ name }) => name === activeFileName
  ) as EditorFile;

  useKeyMap(
    {
      'Control+N,Meta+N': createFile,
      'Control+O,Meta+O': () => open(undefined),
      'Control+S,Meta+S': format,
      Escape: () => {
        if (autoCompleteActive) {
          setAutoCompleteActive(false);
        }
      },
      'Shift+Tab': () => {
        const deleteCount = INDENT.length;

        if (code.slice(cursorOffset - deleteCount, cursorOffset) === INDENT) {
          updateState({
            code: spliceString(code, cursorOffset - deleteCount, deleteCount),
            cursorOffset: cursorOffset - deleteCount,
          });
        }
      },
      Tab: () => {
        if (hasCompletionItems) {
          complete();
        } else {
          insertText(INDENT);
        }
      },
    },
    active
  );

  useEffect(() => {
    if (!isSharedFileActive) {
      activeFile.content = code;
      fileSaver.saveFiles(files);
    }
  }, [activeFile, code, files, isSharedFileActive]);

  useLayoutEffect(() => {
    applyState({
      code: activeFile.content,
      cursorOffset: 0,
    });
    if (textAreaElementRef.current !== null) {
      textAreaElementRef.current.focus();
    }
  }, [activeFile, applyState]);

  useLayoutEffect(() => {
    highlightCode(code, activeFile.language).then((highlighted) => {
      setHighlightedCode(highlighted);
      ((textAreaElementRef.current as unknown) as HTMLTextAreaElement).scrollTop = 1e10;
    });
  }, [activeFile.language, code]);

  useEffect(() => {
    const x = getLineBeforeCursor(code, cursorOffset).length + 1;
    const y = getLineNumber(code, cursorOffset) + 1;
    onCursorPositionUpdate({ x, y });
  }, [code, cursorOffset, onCursorPositionUpdate]);

  useLayoutEffect(() => {
    const newLineCount = (code.match(/\n/g)?.length || 0) + 1;

    if (newLineCount !== lineCount) {
      setLineCount(newLineCount);
    }
  }, [code, lineCount]);

  useLayoutEffect(() => {
    const textAreaElement = textAreaElementRef.current;

    if (textAreaElement !== null) {
      const { selectionEnd, selectionStart } = textAreaElement;

      if (selectionEnd === selectionStart && selectionStart !== cursorOffset) {
        textAreaElement.selectionStart = cursorOffset;
        textAreaElement.selectionEnd = cursorOffset;
      }
    }
  }, [cursorOffset]);

  useLayoutEffect(() => {
    if (codeElementRef.current !== null) {
      codeElementRef.current.scrollTop = scrollTop;
    }
  }, [scrollTop]);

  function applyAutoCompletion({
    completion,
    newCursorOffset,
  }: Completion): void {
    insertText(completion, newCursorOffset);
  }

  function applyClientState(state: ClientState): void {
    if (code !== state.code) {
      onChange(state.code);
    }
    if (cursorColor !== state.cursorColor) {
      setCursorColor(state.cursorColor);
    }
    if (cursorOffset !== state.cursorOffset) {
      setCursorOffset(state.cursorOffset);
    }
    if (cursors !== state.cursors) {
      setCursors(state.cursors);
    }
  }

  function closeFile(name: string): void {
    const fileToClose = files.find((file) => file.name === name) as EditorFile;

    if (activeFileName === name) {
      const isPreviouslyActiveFileStillOpen = files.some(
        (file) => file.name === previouslyActiveFileName
      );
      const newActiveFileName = isPreviouslyActiveFileStillOpen
        ? (previouslyActiveFileName as string)
        : (files.find((file) => file !== fileToClose) as EditorFile).name;

      setActiveFileName(newActiveFileName);
    }

    const updatedFiles = [...files];
    updatedFiles.splice(files.indexOf(fileToClose), 1);
    fileManager.set(updatedFiles);
  }

  function createFile(): void {
    const maxIndex = Math.max(
      ...files.map((file) =>
        parseInt(
          (file.name.startsWith('local') && file.name.slice(5, -3)) || '0',
          10
        )
      )
    );
    const name = `local${maxIndex + 1}.js`;
    fileManager.push({ content: '', name, language: 'javascript' });
    setActiveFileName(name);
  }

  function disableAutoCompletion(): void {
    if (autoCompleteActive) {
      setAutoCompleteActive(false);
    }
  }

  async function format(): Promise<void> {
    if (isSharedFileActive) {
      return;
    }
    try {
      const { language } = activeFile;
      const formatted = await formatCode(code, cursorOffset, language);

      if (formatted.code !== code) {
        updateState(formatted);
      }
    } catch (error) {
      console.error(error);
    }
  }

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>): void {
    const newCode = event.target.value;

    if (newCode.length > code.length) {
      const allowAutoComplete = isCodePortionEnd(code, cursorOffset);

      if (allowAutoComplete && !autoCompleteActive) {
        setAutoCompleteActive(true);
      }
    } else {
      disableAutoCompletion();
    }

    const currentState = { code, cursorOffset };
    const newState = autoEditChange(currentState, {
      code: newCode,
      cursorOffset: getDiff(code, newCode).endOffset,
    });

    if (newState !== undefined) {
      updateState(newState);
    }
  }

  async function handleDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    setDisplayDragOverlay(false);

    const file = event.dataTransfer?.files?.[0];

    if (file !== undefined) {
      return open(file);
    }
  }

  function handleSelect({ target }: SyntheticEvent): void {
    const newCursorOffset = (target as HTMLTextAreaElement).selectionStart;

    if (!isCodePortionEnd(code, newCursorOffset)) {
      setAutoCompleteActive(false);
    }

    if (cursorOffset === newCursorOffset) {
      return;
    }
    if (isSharedFileActive) {
      updateCursorOffset(newCursorOffset);
      // TODO find a cleaner solution
      updateClientState({ code, cursorOffset: newCursorOffset });
    } else {
      setCursorOffset(newCursorOffset);
    }
  }

  function insertText(
    text: string,
    newCursorOffset: number = cursorOffset + text.length
  ): void {
    updateState({
      code: spliceString(code, cursorOffset, 0, text),
      cursorOffset: newCursorOffset,
    });
  }

  async function open(file?: File): Promise<void> {
    try {
      const editorFile = await openFile(file);

      if (editorFile !== undefined) {
        if (files.some(({ name }) => name === editorFile.name)) {
          closeFile(editorFile.name);
        }
        fileManager.push(editorFile);
        setActiveFileName(editorFile.name);
      }
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className={cn(styles.editor, className)}>
      <Tabs className={styles.tabs} label="Files">
        {files.map(({ name }, index) => (
          <Tab
            key={name}
            onClick={() => setActiveFileName(name)}
            selected={name === activeFileName}
          >
            {name}
            {index >= fileSaver.defaultFiles.length && (
              <FontAwesomeIcon
                className={styles.close}
                icon={faTimes}
                onClick={(event) => {
                  event.stopPropagation();
                  closeFile(name);
                }}
              />
            )}
          </Tab>
        ))}
      </Tabs>
      <LineNumbers
        className={styles.lineNumbers}
        lineCount={lineCount}
        scrollTop={scrollTop}
      />
      <div className={styles.code} ref={codeElementRef}>
        <div dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        {textAreaElementRef.current &&
          cursors.map(({ clientID, color, offset }) => (
            <Cursor
              color={color}
              key={clientID}
              offset={offset}
              parent={textAreaElementRef.current as HTMLTextAreaElement}
            />
          ))}
      </div>
      <textarea
        className={styles.textarea}
        onBlur={() => setActive(false)}
        onChange={handleChange}
        onDragEnd={() => setDisplayDragOverlay(false)}
        onDragEnter={() => {
          setDisplayDragOverlay(true);
          return false;
        }}
        onDragLeave={() => setDisplayDragOverlay(false)}
        onDragOver={() => false}
        onDrop={handleDrop as (event: DragEvent) => void}
        onMouseDown={disableAutoCompletion}
        onFocus={() => setActive(true)}
        onScroll={({ target }) =>
          setScrollTop((target as HTMLTextAreaElement).scrollTop)
        }
        onSelect={handleSelect}
        ref={textAreaElementRef}
        spellCheck={false}
        style={{ caretColor: cursorColor }}
        value={code}
      />
      {displayDragOverlay && (
        <div className={styles.dragAndDropOverlay}>Drop to open</div>
      )}
      <Toolbar className={styles.toolbar}>
        <ToolButton
          icon={faPlus}
          onClick={createFile}
          title={
            <>
              New<kbd>Ctrl</kbd>+<kbd>N</kbd>
            </>
          }
        />
        <ToolButton
          icon={faFolderOpen}
          onClick={() => open()}
          title={
            <>
              Open<kbd>Ctrl</kbd>+<kbd>O</kbd>
            </>
          }
        />
        <ToolButton
          disabled={
            code.length === 0 ||
            isSharedFileActive ||
            !canFormat(activeFile.language)
          }
          icon={faStream}
          onClick={format}
          title={
            <>
              Format<kbd>Ctrl</kbd>+<kbd>S</kbd>
            </>
          }
        />
        <ToolButton
          disabled={code.length === 0}
          icon={faCamera}
          onClick={() => exportAsImage(code, highlightedCode)}
          title="Export as image"
        />
      </Toolbar>
    </div>
  );
};

interface Props {
  className?: string;
  code: string;
  onChange(code: string): void;
  onCursorPositionUpdate(cursorPosition: Position<number>): void;
}
