import React, { FC, useEffect, useRef, useState } from 'react';
import { startTool } from '~/apps/DICOMViewer/utils';
import { ViewportElement } from '../../components';
import { MouseTool, RendererType, ViewType } from '../../constants';
import { LUTComponent } from '../../interfaces';
import { Dataset, Viewport } from '../../models';
import { LUTPreview } from './components';
import styles from './LUTEditor.module.scss';

const lutComponents = [
  { start: 0, end: 65, color: [0, 0, 255] },
  { start: 45, end: 150, color: [0, 255, 0] },
  { start: 130, end: 255, color: [255, 0, 0] }
] as LUTComponent[];

export const LUTEditor: FC<Props> = ({ dataset, onError, rendererType }) => {
  const [viewport, setViewport] = useState<Viewport>();
  const viewportElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dataset !== undefined && rendererType !== undefined) {
      try {
        setViewport(Viewport.create(dataset, ViewType.Native));
      } catch (error) {
        onError('Unable to create viewport');
        console.error(error);
      }
    }
  }, [dataset, onError, rendererType]);

  if (!viewport) {
    return null;
  }

  return (
    <>
      <div className={styles.viewport}>
        <ViewportElement
          lutComponents={lutComponents}
          onCanvasMouseDown={downEvent =>
            startTool(
              downEvent,
              viewport as Viewport,
              viewportElementRef,
              MouseTool.Paging
            )
          }
          onError={onError}
          ref={viewportElementRef}
          rendererType={rendererType}
          viewport={viewport}
        />
      </div>
      <div className={styles.sidebar}>
        <LUTPreview className={styles.preview} lutComponents={lutComponents} />
      </div>
    </>
  );
};

interface Props {
  dataset: Dataset;
  rendererType: RendererType;
  onError(message: string): void;
}