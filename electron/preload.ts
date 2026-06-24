import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // IPC channels will be added here as features are implemented
})
