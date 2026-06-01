
import { useState, useCallback, useMemo } from 'react';

export interface FSItem {
  id: string;
  name: string;
  type: 'file' | 'directory';
  content?: string;
  children?: string[]; // IDs of children
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

const INITIAL_FS: Record<string, FSItem> = {
  'root': {
    id: 'root',
    name: '/',
    type: 'directory',
    children: ['home', 'bin', 'etc', 'var'],
    parentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'home': {
    id: 'home',
    name: 'home',
    type: 'directory',
    children: ['welltegra'],
    parentId: 'root',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'welltegra': {
    id: 'welltegra',
    name: 'welltegra',
    type: 'directory',
    children: ['manifest.txt', 'audits'],
    parentId: 'home',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'manifest.txt': {
    id: 'manifest.txt',
    name: 'manifest.txt',
    type: 'file',
    content: 'WellTegra Sovereign Audit System v2.5\nStatus: Operational\nForensic Rules: Active',
    parentId: 'welltegra',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'audits': {
    id: 'audits',
    name: 'audits',
    type: 'directory',
    children: [],
    parentId: 'welltegra',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'bin': {
    id: 'bin',
    name: 'bin',
    type: 'directory',
    children: [],
    parentId: 'root',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'etc': {
    id: 'etc',
    name: 'etc',
    type: 'directory',
    children: [],
    parentId: 'root',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'var': {
    id: 'var',
    name: 'var',
    type: 'directory',
    children: [],
    parentId: 'root',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
};

export const useFileSystem = () => {
  const [items, setItems] = useState<Record<string, FSItem>>(INITIAL_FS);
  const [currentDirId, setCurrentDirId] = useState<string>('welltegra');

  const currentDir = useMemo(() => items[currentDirId], [items, currentDirId]);

  const getPath = useCallback((dirId: string): string => {
    const path: string[] = [];
    let current = items[dirId];
    while (current) {
      if (current.id === 'root') {
        path.unshift('');
      } else {
        path.unshift(current.name);
      }
      current = current.parentId ? items[current.parentId] : null as any;
    }
    return path.join('/') || '/';
  }, [items]);

  const pwd = useCallback(() => {
    return getPath(currentDirId);
  }, [currentDirId, getPath]);

  const ls = useCallback(() => {
    if (!currentDir.children) return [];
    return currentDir.children.map(id => items[id]);
  }, [currentDir, items]);

  const cd = useCallback((target: string) => {
    if (target === '..') {
      if (currentDir.parentId) {
        setCurrentDirId(currentDir.parentId);
        return null;
      }
      return 'Already at root';
    }
    if (target === '/') {
      setCurrentDirId('root');
      return null;
    }

    const child = currentDir.children?.find(id => items[id].name === target && items[id].type === 'directory');
    if (child) {
      setCurrentDirId(child);
      return null;
    }
    return `Directory not found: ${target}`;
  }, [currentDir, items]);

  const mkdir = useCallback((name: string) => {
    if (currentDir.children?.some(id => items[id].name === name)) {
      return `Item already exists: ${name}`;
    }
    const id = `${currentDirId}/${name}`;
    const newItem: FSItem = {
      id,
      name,
      type: 'directory',
      children: [],
      parentId: currentDirId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setItems(prev => ({
      ...prev,
      [id]: newItem,
      [currentDirId]: {
        ...prev[currentDirId],
        children: [...(prev[currentDirId].children || []), id]
      }
    }));
    return null;
  }, [currentDir, currentDirId, items]);

  const touch = useCallback((name: string, content: string = '') => {
    if (currentDir.children?.some(id => items[id].name === name)) {
      return `Item already exists: ${name}`;
    }
    const id = `${currentDirId}/${name}`;
    const newItem: FSItem = {
      id,
      name,
      type: 'file',
      content,
      parentId: currentDirId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setItems(prev => ({
      ...prev,
      [id]: newItem,
      [currentDirId]: {
        ...prev[currentDirId],
        children: [...(prev[currentDirId].children || []), id]
      }
    }));
    return null;
  }, [currentDir, currentDirId, items]);

  const rm = useCallback((name: string) => {
    const childId = currentDir.children?.find(id => items[id].name === name);
    if (!childId) return `No such file or directory: ${name}`;

    setItems(prev => {
      const newItems = { ...prev };
      delete newItems[childId];
      newItems[currentDirId] = {
        ...prev[currentDirId],
        children: prev[currentDirId].children?.filter(id => id !== childId)
      };
      return newItems;
    });
    return null;
  }, [currentDir, currentDirId, items]);

  const mv = useCallback((oldName: string, newName: string) => {
    const childId = currentDir.children?.find(id => items[id].name === oldName);
    if (!childId) return `No such file or directory: ${oldName}`;

    setItems(prev => ({
      ...prev,
      [childId]: {
        ...prev[childId],
        name: newName,
        updatedAt: new Date().toISOString()
      }
    }));
    return null;
  }, [currentDir, items]);

  const cat = useCallback((name: string) => {
    const childId = currentDir.children?.find(id => items[id].name === name);
    if (!childId) return `ERROR: Artifact not found: ${name}`;
    
    const item = items[childId];
    if (item.type === 'directory') return `ERROR: Cannot read directory node as telemetry: ${name}/`;
    
    // Simulate non-text (binary) check
    const isBinary = name.endsWith('.bin') || name.endsWith('.exe') || name.endsWith('.dat');
    if (isBinary) {
      return `[SYSTEM_VETO] File type is classified as NON-TEXT telemetry. Access denied via terminal protocol. Use specialist scavenging tools.`;
    }

    return item.content || '(Artifact is empty)';
  }, [currentDir, items]);

  const write = useCallback((name: string, content: string) => {
    const childId = currentDir.children?.find(id => items[id].name === name && items[id].type === 'file');
    if (!childId) {
      return touch(name, content);
    }
    setItems(prev => ({
      ...prev,
      [childId]: {
        ...prev[childId],
        content,
        updatedAt: new Date().toISOString()
      }
    }));
    return null;
  }, [currentDir, items, touch]);

  const cp = useCallback((sourceName: string, destName: string) => {
    const sourceId = currentDir.children?.find(id => items[id].name === sourceName);
    if (!sourceId) return `No such file or directory: ${sourceName}`;

    const sourceItem = items[sourceId];
    if (sourceItem.type === 'directory') {
      return `ERROR: Copying directory nodes is not supported.`;
    }

    if (currentDir.children?.some(id => items[id].name === destName)) {
      return `Item already exists: ${destName}`;
    }

    const id = `${currentDirId}/${destName}`;
    const newItem: FSItem = {
      id,
      name: destName,
      type: 'file',
      content: sourceItem.content,
      parentId: currentDirId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setItems(prev => ({
      ...prev,
      [id]: newItem,
      [currentDirId]: {
        ...prev[currentDirId],
        children: [...(prev[currentDirId].children || []), id]
      }
    }));
    return null;
  }, [currentDir, currentDirId, items]);

  return {
    pwd,
    ls,
    cd,
    mkdir,
    touch,
    rm,
    mv,
    cp,
    cat,
    write,
    currentPath: pwd()
  };
};
