import { FC, RefObject } from 'react';
import { AppDescriptor } from '~/platform/interfaces/AppDescriptor';
import { Size } from '~/platform/interfaces/Size';
import { Window, WindowProps } from './Window';

export interface WindowComponent extends FC<InjectedWindowProps> {
  appDescriptor: AppDescriptor;
}

export interface InjectedWindowProps extends Partial<WindowProps> {
  active: boolean;
  id: number;
  visibleAreaSize: Size | undefined;
  windowRef: RefObject<Window>;
  zIndex: number;
  onClose(id: number): void;
  onMinimise(id: number): void;
  onSelect(id: number): void;
}
