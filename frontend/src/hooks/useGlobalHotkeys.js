import { useHotkeys } from 'react-hotkeys-hook';

/**
 * Hook que centraliza los atajos de teclado globales.
 * @param {Object} actions - callbacks {prev, next, toggle, save}
 */
export default function useGlobalHotkeys(actions) {
  useHotkeys('a,left', actions.prev, [actions.prev]);
  useHotkeys('d,right', actions.next, [actions.next]);
  useHotkeys('1', () => actions.toggle('Nombre_ok'), [actions.toggle]);
  useHotkeys('2', () => actions.toggle('Periodo_ok'), [actions.toggle]);
  useHotkeys('3', () => actions.toggle('Tarea_ok'), [actions.toggle]);
  useHotkeys('s', actions.save, [actions.save]);
} 